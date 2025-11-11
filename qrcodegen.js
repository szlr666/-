/*
 * QR Code generator library (TypeScript/JavaScript)
 * 简化版离线二维码生成器
 */

var qrcodegen = (function() {
    "use strict";
    
    // QR Code symbol class
    function QrCode(version, errorCorrectionLevel, dataCodewords, mask) {
        this.version = version;
        this.errorCorrectionLevel = errorCorrectionLevel;
        this.modules = [];
        this.isFunction = [];
        
        let size = version * 4 + 17;
        for (let i = 0; i < size; i++) {
            this.modules.push([]);
            this.isFunction.push([]);
            for (let j = 0; j < size; j++) {
                this.modules[i].push(false);
                this.isFunction[i].push(false);
            }
        }
        
        this.drawFunctionPatterns();
        let allCodewords = this.addEccAndInterleave(dataCodewords);
        this.drawCodewords(allCodewords);
        
        if (mask == -1) {
            let minPenalty = 1000000000;
            for (let i = 0; i < 8; i++) {
                this.applyMask(i);
                this.drawFormatBits(i);
                let penalty = this.getPenaltyScore();
                if (penalty < minPenalty) {
                    mask = i;
                    minPenalty = penalty;
                }
                this.applyMask(i);
            }
        }
        this.mask = mask;
        this.applyMask(mask);
        this.drawFormatBits(mask);
        
        this.isFunction = [];
    }
    
    QrCode.encodeText = function(text, ecl) {
        let segs = QrSegment.makeSegments(text);
        return QrCode.encodeSegments(segs, ecl);
    };
    
    QrCode.encodeSegments = function(segs, ecl, minVersion, maxVersion, mask, boostEcl) {
        if (minVersion == undefined) minVersion = 1;
        if (maxVersion == undefined) maxVersion = 40;
        if (mask == undefined) mask = -1;
        if (boostEcl == undefined) boostEcl = true;
        
        let version, dataUsedBits;
        for (version = minVersion; ; version++) {
            let dataCapacityBits = QrCode.getNumDataCodewords(version, ecl) * 8;
            let usedBits = QrSegment.getTotalBits(segs, version);
            if (usedBits <= dataCapacityBits) {
                dataUsedBits = usedBits;
                break;
            }
            if (version >= maxVersion)
                throw "Data too long";
        }
        
        for (let newEcl of [QrCode.Ecc.MEDIUM, QrCode.Ecc.QUARTILE, QrCode.Ecc.HIGH]) {
            if (boostEcl && dataUsedBits <= QrCode.getNumDataCodewords(version, newEcl) * 8)
                ecl = newEcl;
        }
        
        let bb = [];
        for (let seg of segs) {
            appendBits(seg.mode.modeBits, 4, bb);
            appendBits(seg.numChars, seg.mode.numCharCountBits(version), bb);
            for (let b of seg.getData())
                bb.push(b);
        }
        
        let dataCapacityBits = QrCode.getNumDataCodewords(version, ecl) * 8;
        appendBits(0, Math.min(4, dataCapacityBits - bb.length), bb);
        appendBits(0, (8 - bb.length % 8) % 8, bb);
        
        for (let padByte = 0xEC; bb.length < dataCapacityBits; padByte ^= 0xEC ^ 0x11)
            appendBits(padByte, 8, bb);
        
        let dataCodewords = [];
        while (dataCodewords.length * 8 < bb.length)
            dataCodewords.push(0);
        bb.forEach((b, i) => dataCodewords[i >>> 3] |= b << (7 - (i & 7)));
        
        return new QrCode(version, ecl, dataCodewords, mask);
    };
    
    QrCode.prototype.getModule = function(x, y) {
        return 0 <= x && x < this.size && 0 <= y && y < this.size && this.modules[y][x];
    };
    
    Object.defineProperty(QrCode.prototype, "size", {
        get: function() { return this.modules.length; }
    });
    
    QrCode.prototype.drawFunctionPatterns = function() {
        for (let i = 0; i < this.size; i++) {
            this.setFunctionModule(6, i, i % 2 == 0);
            this.setFunctionModule(i, 6, i % 2 == 0);
        }
        
        this.drawFinderPattern(3, 3);
        this.drawFinderPattern(this.size - 4, 3);
        this.drawFinderPattern(3, this.size - 4);
        
        let alignPatPos = this.getAlignmentPatternPositions();
        let numAlign = alignPatPos.length;
        for (let i = 0; i < numAlign; i++) {
            for (let j = 0; j < numAlign; j++) {
                if (!(i == 0 && j == 0 || i == 0 && j == numAlign - 1 || i == numAlign - 1 && j == 0))
                    this.drawAlignmentPattern(alignPatPos[i], alignPatPos[j]);
            }
        }
        
        this.drawFormatBits(0);
        this.drawVersion();
    };
    
    QrCode.prototype.drawFormatBits = function(mask) {
        let data = this.errorCorrectionLevel.formatBits << 3 | mask;
        let rem = data;
        for (let i = 0; i < 10; i++)
            rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
        let bits = (data << 10 | rem) ^ 0x5412;
        
        for (let i = 0; i <= 5; i++)
            this.setFunctionModule(8, i, getBit(bits, i));
        this.setFunctionModule(8, 7, getBit(bits, 6));
        this.setFunctionModule(8, 8, getBit(bits, 7));
        this.setFunctionModule(7, 8, getBit(bits, 8));
        for (let i = 9; i < 15; i++)
            this.setFunctionModule(14 - i, 8, getBit(bits, i));
        
        for (let i = 0; i < 8; i++)
            this.setFunctionModule(this.size - 1 - i, 8, getBit(bits, i));
        for (let i = 8; i < 15; i++)
            this.setFunctionModule(8, this.size - 15 + i, getBit(bits, i));
        this.setFunctionModule(8, this.size - 8, true);
    };
    
    QrCode.prototype.drawVersion = function() {
        if (this.version < 7)
            return;
        
        let rem = this.version;
        for (let i = 0; i < 12; i++)
            rem = (rem << 1) ^ ((rem >>> 11) * 0x1F25);
        let bits = this.version << 12 | rem;
        
        for (let i = 0; i < 18; i++) {
            let bit = getBit(bits, i);
            let a = this.size - 11 + i % 3;
            let b = Math.floor(i / 3);
            this.setFunctionModule(a, b, bit);
            this.setFunctionModule(b, a, bit);
        }
    };
    
    QrCode.prototype.drawFinderPattern = function(x, y) {
        for (let dy = -4; dy <= 4; dy++) {
            for (let dx = -4; dx <= 4; dx++) {
                let dist = Math.max(Math.abs(dx), Math.abs(dy));
                let xx = x + dx;
                let yy = y + dy;
                if (0 <= xx && xx < this.size && 0 <= yy && yy < this.size)
                    this.setFunctionModule(xx, yy, dist != 2 && dist != 4);
            }
        }
    };
    
    QrCode.prototype.drawAlignmentPattern = function(x, y) {
        for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++)
                this.setFunctionModule(x + dx, y + dy, Math.max(Math.abs(dx), Math.abs(dy)) != 1);
        }
    };
    
    QrCode.prototype.setFunctionModule = function(x, y, isBlack) {
        this.modules[y][x] = isBlack;
        this.isFunction[y][x] = true;
    };
    
    QrCode.prototype.addEccAndInterleave = function(data) {
        let version = this.version;
        let ecl = this.errorCorrectionLevel;
        if (data.length != QrCode.getNumDataCodewords(version, ecl))
            throw "Invalid argument";
        
        let numBlocks = NUM_ERROR_CORRECTION_BLOCKS[ecl.ordinal][version];
        let blockEccLen = ECC_CODEWORDS_PER_BLOCK[ecl.ordinal][version];
        let rawCodewords = Math.floor(QrCode.getNumRawDataModules(version) / 8);
        let numShortBlocks = numBlocks - rawCodewords % numBlocks;
        let shortBlockLen = Math.floor(rawCodewords / numBlocks);
        
        let blocks = [];
        let rsDiv = reedSolomonComputeDivisor(blockEccLen);
        for (let i = 0, k = 0; i < numBlocks; i++) {
            let dat = data.slice(k, k + shortBlockLen - blockEccLen + (i < numShortBlocks ? 0 : 1));
            k += dat.length;
            let ecc = reedSolomonComputeRemainder(dat, rsDiv);
            if (i < numShortBlocks)
                dat.push(0);
            blocks.push(dat.concat(ecc));
        }
        
        let result = [];
        for (let i = 0; i < blocks[0].length; i++) {
            blocks.forEach((block, j) => {
                if (i != shortBlockLen - blockEccLen || j >= numShortBlocks)
                    result.push(block[i]);
            });
        }
        return result;
    };
    
    QrCode.prototype.drawCodewords = function(data) {
        if (data.length != Math.floor(QrCode.getNumRawDataModules(this.version) / 8))
            throw "Invalid argument";
        let i = 0;
        for (let right = this.size - 1; right >= 1; right -= 2) {
            if (right == 6)
                right = 5;
            for (let vert = 0; vert < this.size; vert++) {
                for (let j = 0; j < 2; j++) {
                    let x = right - j;
                    let upward = ((right + 1) & 2) == 0;
                    let y = upward ? this.size - 1 - vert : vert;
                    if (!this.isFunction[y][x] && i < data.length * 8) {
                        this.modules[y][x] = getBit(data[i >>> 3], 7 - (i & 7));
                        i++;
                    }
                }
            }
        }
    };
    
    QrCode.prototype.applyMask = function(mask) {
        if (mask < 0 || mask > 7)
            throw "Mask value out of range";
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                let invert;
                switch (mask) {
                    case 0:  invert = (x + y) % 2 == 0;                    break;
                    case 1:  invert = y % 2 == 0;                          break;
                    case 2:  invert = x % 3 == 0;                          break;
                    case 3:  invert = (x + y) % 3 == 0;                    break;
                    case 4:  invert = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 == 0;  break;
                    case 5:  invert = x * y % 2 + x * y % 3 == 0;          break;
                    case 6:  invert = (x * y % 2 + x * y % 3) % 2 == 0;    break;
                    case 7:  invert = ((x + y) % 2 + x * y % 3) % 2 == 0;  break;
                    default:  throw "Unreachable";
                }
                if (!this.isFunction[y][x] && invert)
                    this.modules[y][x] = !this.modules[y][x];
            }
        }
    };
    
    QrCode.prototype.getPenaltyScore = function() {
        let result = 0;
        
        for (let y = 0; y < this.size; y++) {
            let runColor = false;
            let runX = 0;
            let runHistory = [0, 0, 0, 0, 0, 0, 0];
            for (let x = 0; x < this.size; x++) {
                if (this.modules[y][x] == runColor) {
                    runX++;
                    if (runX == 5)
                        result += PENALTY_N1;
                    else if (runX > 5)
                        result++;
                } else {
                    this.finderPenaltyAddHistory(runX, runHistory);
                    if (!runColor)
                        result += this.finderPenaltyCountPatterns(runHistory) * PENALTY_N3;
                    runColor = this.modules[y][x];
                    runX = 1;
                }
            }
            result += this.finderPenaltyTerminateAndCount(runColor, runX, runHistory) * PENALTY_N3;
        }
        
        for (let x = 0; x < this.size; x++) {
            let runColor = false;
            let runY = 0;
            let runHistory = [0, 0, 0, 0, 0, 0, 0];
            for (let y = 0; y < this.size; y++) {
                if (this.modules[y][x] == runColor) {
                    runY++;
                    if (runY == 5)
                        result += PENALTY_N1;
                    else if (runY > 5)
                        result++;
                } else {
                    this.finderPenaltyAddHistory(runY, runHistory);
                    if (!runColor)
                        result += this.finderPenaltyCountPatterns(runHistory) * PENALTY_N3;
                    runColor = this.modules[y][x];
                    runY = 1;
                }
            }
            result += this.finderPenaltyTerminateAndCount(runColor, runY, runHistory) * PENALTY_N3;
        }
        
        for (let y = 0; y < this.size - 1; y++) {
            for (let x = 0; x < this.size - 1; x++) {
                let color = this.modules[y][x];
                if (  color == this.modules[y][x + 1] &&
                      color == this.modules[y + 1][x] &&
                      color == this.modules[y + 1][x + 1])
                    result += PENALTY_N2;
            }
        }
        
        let black = 0;
        for (let y = 0; y < this.size; y++) {
            black = this.modules[y].reduce((sum, color) => sum + (color ? 1 : 0), black);
        }
        let total = this.size * this.size;
        let k = Math.ceil(Math.abs(black * 20 - total * 10) / total) - 1;
        result += k * PENALTY_N4;
        return result;
    };
    
    QrCode.prototype.getAlignmentPatternPositions = function() {
        if (this.version == 1)
            return [];
        else {
            let numAlign = Math.floor(this.version / 7) + 2;
            let step = (this.version == 32) ? 26 :
                Math.ceil((this.version * 4 + 4) / (numAlign * 2 - 2)) * 2;
            let result = [6];
            for (let pos = this.size - 7; result.length < numAlign; pos -= step)
                result.splice(1, 0, pos);
            return result;
        }
    };
    
    QrCode.getNumRawDataModules = function(ver) {
        let result = (16 * ver + 128) * ver + 64;
        if (ver >= 2) {
            let numAlign = Math.floor(ver / 7) + 2;
            result -= (25 * numAlign - 10) * numAlign - 55;
            if (ver >= 7)
                result -= 36;
        }
        return result;
    };
    
    QrCode.getNumDataCodewords = function(ver, ecl) {
        return Math.floor(QrCode.getNumRawDataModules(ver) / 8) -
            ECC_CODEWORDS_PER_BLOCK[ecl.ordinal][ver] *
            NUM_ERROR_CORRECTION_BLOCKS[ecl.ordinal][ver];
    };
    
    QrCode.prototype.finderPenaltyCountPatterns = function(runHistory) {
        let n = runHistory[1];
        let core = n > 0 && runHistory[2] == n && runHistory[3] == n * 3 && runHistory[4] == n && runHistory[5] == n;
        return (core && runHistory[0] >= n * 4 && runHistory[6] >= n ? 1 : 0)
             + (core && runHistory[6] >= n * 4 && runHistory[0] >= n ? 1 : 0);
    };
    
    QrCode.prototype.finderPenaltyTerminateAndCount = function(currentRunColor, currentRunLength, runHistory) {
        if (currentRunColor) {
            this.finderPenaltyAddHistory(currentRunLength, runHistory);
            currentRunLength = 0;
        }
        currentRunLength += this.size;
        this.finderPenaltyAddHistory(currentRunLength, runHistory);
        return this.finderPenaltyCountPatterns(runHistory);
    };
    
    QrCode.prototype.finderPenaltyAddHistory = function(currentRunLength, runHistory) {
        if (runHistory[0] == 0)
            currentRunLength += this.size;
        runHistory.pop();
        runHistory.unshift(currentRunLength);
    };
    
    // QR Code segment class
    function QrSegment(mode, numChars, bitData) {
        this.mode = mode;
        this.numChars = numChars;
        this.bitData = bitData;
    }
    
    QrSegment.makeBytes = function(data) {
        let bb = [];
        for (let b of data)
            appendBits(b, 8, bb);
        return new QrSegment(Mode.BYTE, data.length, bb);
    };
    
    QrSegment.makeNumeric = function(digits) {
        let bb = [];
        for (let i = 0; i < digits.length; ) {
            let n = Math.min(digits.length - i, 3);
            appendBits(parseInt(digits.substr(i, n), 10), n * 3 + 1, bb);
            i += n;
        }
        return new QrSegment(Mode.NUMERIC, digits.length, bb);
    };
    
    QrSegment.makeAlphanumeric = function(text) {
        let bb = [];
        let i;
        for (i = 0; i + 2 <= text.length; i += 2) {
            let temp = QrSegment.ALPHANUMERIC_CHARSET.indexOf(text.charAt(i)) * 45;
            temp += QrSegment.ALPHANUMERIC_CHARSET.indexOf(text.charAt(i + 1));
            appendBits(temp, 11, bb);
        }
        if (i < text.length)
            appendBits(QrSegment.ALPHANUMERIC_CHARSET.indexOf(text.charAt(i)), 6, bb);
        return new QrSegment(Mode.ALPHANUMERIC, text.length, bb);
    };
    
    QrSegment.makeSegments = function(text) {
        if (text == "")
            return [];
        else if (QrSegment.isNumeric(text))
            return [QrSegment.makeNumeric(text)];
        else if (QrSegment.isAlphanumeric(text))
            return [QrSegment.makeAlphanumeric(text)];
        else
            return [QrSegment.makeBytes(toUtf8ByteArray(text))];
    };
    
    QrSegment.isNumeric = function(text) {
        return /^[0-9]*$/.test(text);
    };
    
    QrSegment.isAlphanumeric = function(text) {
        return /^[A-Z0-9 $%*+.\/:-]*$/.test(text);
    };
    
    QrSegment.prototype.getData = function() {
        return this.bitData.slice();
    };
    
    QrSegment.getTotalBits = function(segs, version) {
        let result = 0;
        for (let seg of segs) {
            let ccbits = seg.mode.numCharCountBits(version);
            if (seg.numChars >= (1 << ccbits))
                return Infinity;
            result += 4 + ccbits + seg.bitData.length;
        }
        return result;
    };
    
    QrSegment.ALPHANUMERIC_CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";
    
    // Mode class
    function Mode(modeBits, numBitsCharCount) {
        this.modeBits = modeBits;
        this.numBitsCharCount = numBitsCharCount;
    }
    
    Mode.prototype.numCharCountBits = function(ver) {
        return this.numBitsCharCount[Math.floor((ver + 7) / 17)];
    };
    
    Mode.NUMERIC      = new Mode(0x1, [10, 12, 14]);
    Mode.ALPHANUMERIC = new Mode(0x2, [ 9, 11, 13]);
    Mode.BYTE         = new Mode(0x4, [ 8, 16, 16]);
    Mode.KANJI        = new Mode(0x8, [ 8, 10, 12]);
    Mode.ECI          = new Mode(0x7, [ 0,  0,  0]);
    
    // Error correction level class
    function Ecc(ordinal, formatBits) {
        this.ordinal = ordinal;
        this.formatBits = formatBits;
    }
    
    Ecc.LOW      = new Ecc(0, 1);
    Ecc.MEDIUM   = new Ecc(1, 0);
    Ecc.QUARTILE = new Ecc(2, 3);
    Ecc.HIGH     = new Ecc(3, 2);
    
    // Helper functions
    function appendBits(val, len, bb) {
        for (let i = len - 1; i >= 0; i--)
            bb.push((val >>> i) & 1);
    }
    
    function getBit(x, i) {
        return ((x >>> i) & 1) != 0;
    }
    
    function toUtf8ByteArray(str) {
        str = encodeURI(str);
        let result = [];
        for (let i = 0; i < str.length; i++) {
            if (str.charAt(i) != "%")
                result.push(str.charCodeAt(i));
            else {
                result.push(parseInt(str.substr(i + 1, 2), 16));
                i += 2;
            }
        }
        return result;
    }
    
    function reedSolomonComputeDivisor(degree) {
        let result = [];
        for (let i = 0; i < degree - 1; i++)
            result.push(0);
        result.push(1);
        let root = 1;
        for (let i = 0; i < degree; i++) {
            for (let j = 0; j < result.length; j++) {
                result[j] = reedSolomonMultiply(result[j], root);
                if (j + 1 < result.length)
                    result[j] ^= result[j + 1];
            }
            root = reedSolomonMultiply(root, 0x02);
        }
        return result;
    }
    
    function reedSolomonComputeRemainder(data, divisor) {
        let result = divisor.map(_ => 0);
        for (let b of data) {
            let factor = b ^ result.shift();
            result.push(0);
            divisor.forEach((coef, i) =>
                result[i] ^= reedSolomonMultiply(coef, factor));
        }
        return result;
    }
    
    function reedSolomonMultiply(x, y) {
        if (x >>> 8 != 0 || y >>> 8 != 0)
            throw "Byte out of range";
        let z = 0;
        for (let i = 7; i >= 0; i--) {
            z = (z << 1) ^ ((z >>> 7) * 0x11D);
            z ^= ((y >>> i) & 1) * x;
        }
        return z;
    }
    
    // Constants
    const PENALTY_N1 = 3;
    const PENALTY_N2 = 3;
    const PENALTY_N3 = 40;
    const PENALTY_N4 = 10;
    
    const ECC_CODEWORDS_PER_BLOCK = [
        [-1,  7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
        [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
        [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
        [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    ];
    
    const NUM_ERROR_CORRECTION_BLOCKS = [
        [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4,  4,  4,  4,  4,  6,  6,  6,  6,  7,  8,  8,  9,  9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
        [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5,  5,  8,  9,  9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
        [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8,  8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
        [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81],
    ];
    
    // Export
    QrCode.Ecc = Ecc;
    QrCode.Mode = Mode;
    
    return {
        QrCode: QrCode,
        QrSegment: QrSegment,
        Ecc: Ecc,
        Mode: Mode
    };
})();
