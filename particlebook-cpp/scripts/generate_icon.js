// Generate ICO file with PNG-encoded images
const fs = require('fs');
const path = require('path');
let createCanvas;
try { createCanvas = require('canvas').createCanvas; } catch (e) { /* use raw pixel buffer */ }

// Simple PNG encoder - produces valid PNG for solid/simple images
// We'll write a minimal PNG generator since we don't have canvas
function createPNG(size) {
    // Build pixel data: 32-bit RGBA
    const pixels = Buffer.alloc(size * size * 4, 0);

    const margin = Math.max(1, Math.round(size * 0.10));
    const r = Math.round(size * 0.20);

    // Colors
    const bgStart = [79, 70, 229, 255];  // indigo-600
    const bgEnd = [124, 58, 237, 255];   // violet-600
    const white = [255, 255, 255, 255];

    function setPixel(x, y, color) {
        if (x < 0 || y < 0 || x >= size || y >= size) return;
        const idx = (y * size + x) * 4;
        pixels[idx] = color[0];
        pixels[idx + 1] = color[1];
        pixels[idx + 2] = color[2];
        pixels[idx + 3] = color[3];
    }

    function getPixel(x, y) {
        if (x < 0 || y < 0 || x >= size || y >= size) return [0,0,0,0];
        const idx = (y * size + x) * 4;
        return [pixels[idx], pixels[idx+1], pixels[idx+2], pixels[idx+3]];
    }

    function dist(x1, y1, x2, y2) {
        return Math.sqrt((x1-x2)**2 + (y1-y2)**2);
    }

    function mix(c1, c2, t) {
        return c1.map((v, i) => Math.round(v + (c2[i] - v) * t));
    }

    function inRoundedRect(x, y, rx, ry, rw, rh, cr) {
        // Check if point is inside rounded rectangle
        if (x < rx || x > rx + rw || y < ry || y > ry + rh) return false;

        // Corner checks
        if (x < rx + cr && y < ry + cr) return dist(x, y, rx + cr, ry + cr) <= cr;
        if (x > rx + rw - cr && y < ry + cr) return dist(x, y, rx + rw - cr, ry + cr) <= cr;
        if (x < rx + cr && y > ry + rh - cr) return dist(x, y, rx + cr, ry + rh - cr) <= cr;
        if (x > rx + rw - cr && y > ry + rh - cr) return dist(x, y, rx + rw - cr, ry + rh - cr) <= cr;

        return true;
    }

    // Fill background
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            if (inRoundedRect(x, y, margin, margin, size - 2*margin, size - 2*margin, r)) {
                // Gradient from top-left to bottom-right
                const t = (x + y) / (2 * size);
                const color = mix(bgStart, bgEnd, t);
                setPixel(x, y, color);
            }
        }
    }

    // Draw thick lines (book shape)
    function drawLine(x1, y1, x2, y2, color, width) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.sqrt(dx*dx + dy*dy);
        const steps = Math.ceil(len);
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const cx = x1 + dx * t;
            const cy = y1 + dy * t;
            const rw = Math.ceil(width / 2);
            for (let wy = -rw; wy <= rw; wy++) {
                for (let wx = -rw; wx <= rw; wx++) {
                    setPixel(Math.round(cx + wx), Math.round(cy + wy), color);
                }
            }
        }
    }

    const cx = size / 2;
    const cy = size / 2;
    const bw = size * 0.26;
    const bh = size * 0.30;
    const sh = size * 0.04;
    const penW = Math.max(1, size * 0.05);
    const spineTop = cy - bh - size * 0.015;
    const spineBot = cy + bh + size * 0.015;

    // Left page
    drawLine(cx, cy - bh, cx - bw, cy - bh + sh, white, penW);
    drawLine(cx - bw, cy - bh + sh, cx - bw, cy + bh - sh, white, penW);
    drawLine(cx - bw, cy + bh - sh, cx, cy + bh, white, penW);

    // Right page
    drawLine(cx, cy - bh, cx + bw, cy - bh + sh, white, penW);
    drawLine(cx + bw, cy - bh + sh, cx + bw, cy + bh - sh, white, penW);
    drawLine(cx + bw, cy + bh - sh, cx, cy + bh, white, penW);

    // Spine
    drawLine(cx, spineTop, cx, spineBot, white, penW);

    // Page lines
    const thinW = Math.max(0.5, size * 0.012);
    const lineGap = size * 0.07;
    for (let y = cy - bh + size * 0.12; y < cy + bh - size * 0.08; y += lineGap) {
        const midX = (y - cy) / bh * bw * 0.15;
        drawLine(cx - bw + size * 0.06 + midX, y, cx - size * 0.015, y, white, thinW);
        drawLine(cx + size * 0.015, y, cx + bw - size * 0.06 - midX, y, white, thinW);
    }

    return encodePNG(pixels, size, size);
}

function encodePNG(pixels, width, height) {
    // Build raw scanlines (1-byte filter prefix + RGBA data)
    const rawData = Buffer.alloc(height * (1 + width * 4));
    for (let y = 0; y < height; y++) {
        rawData[y * (1 + width * 4)] = 0; // filter: none
        for (let x = 0; x < width; x++) {
            const srcIdx = (y * width + x) * 4;
            const dstIdx = y * (1 + width * 4) + 1 + x * 4;
            rawData[dstIdx] = pixels[srcIdx];       // R
            rawData[dstIdx + 1] = pixels[srcIdx + 1]; // G
            rawData[dstIdx + 2] = pixels[srcIdx + 2]; // B
            rawData[dstIdx + 3] = pixels[srcIdx + 3]; // A
        }
    }

    // Deflate the raw data
    const zlib = require('zlib');
    const compressed = zlib.deflateSync(rawData, { level: 9 });

    // Build minimal PNG
    const chunks = [];

    // IHDR
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr[8] = 8;  // bit depth
    ihdr[9] = 6;  // color type: RGBA
    ihdr[10] = 0; // compression
    ihdr[11] = 0; // filter
    ihdr[12] = 0; // interlace
    chunks.push(makeChunk('IHDR', ihdr));

    // IDAT
    chunks.push(makeChunk('IDAT', compressed));

    // IEND
    chunks.push(makeChunk('IEND', Buffer.alloc(0)));

    // PNG signature + chunks
    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    return Buffer.concat([signature, ...chunks]);
}

function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBin = Buffer.from(type, 'ascii');
    const crc = crc32(Buffer.concat([typeBin, data]));
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc, 0);
    return Buffer.concat([len, typeBin, data, crcBuf]);
}

function crc32(data) {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < data.length; i++) {
        crc ^= data[i];
        for (let j = 0; j < 8; j++) {
            if (crc & 1) crc = (crc >>> 1) ^ 0xEDB88320;
            else crc >>>= 1;
        }
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
}

// Generate ICO with multiple sizes
const sizes = [16, 24, 32, 48, 64, 128, 256];
const pngBuffers = sizes.map(s => createPNG(s));

// Build ICO file
const dirEntrySize = 16;
const headerSize = 6;
const dirSize = headerSize + sizes.length * dirEntrySize;

let offset = dirSize;
const dirEntries = [];
for (let i = 0; i < sizes.length; i++) {
    const s = sizes[i];
    const sz = s >= 256 ? 0 : s;
    const buf = Buffer.alloc(dirEntrySize);
    buf.writeUInt8(sz, 0);     // width
    buf.writeUInt8(sz, 1);     // height
    buf.writeUInt8(0, 2);      // palette
    buf.writeUInt8(0, 3);      // reserved
    buf.writeUInt16LE(1, 4);   // planes
    buf.writeUInt16LE(32, 6);  // bpp
    buf.writeUInt32LE(pngBuffers[i].length, 8);  // size
    buf.writeUInt32LE(offset, 12);                // offset
    dirEntries.push(buf);
    offset += pngBuffers[i].length;
}

// Write file
const icoPath = path.join(__dirname, '..', 'assets', 'app.ico');
const dir = path.dirname(icoPath);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const fd = fs.openSync(icoPath, 'w');
fs.writeSync(fd, Buffer.of(0, 0));           // reserved
fs.writeSync(fd, Buffer.of(1, 0));           // ICO type
const countBuf = Buffer.alloc(2);
countBuf.writeUInt16LE(sizes.length, 0);
fs.writeSync(fd, countBuf);                   // count

for (const entry of dirEntries) {
    fs.writeSync(fd, entry);
}
for (const png of pngBuffers) {
    fs.writeSync(fd, png);
}
fs.closeSync(fd);

console.log('Icon created: ' + icoPath + ' (' + fs.statSync(icoPath).size + ' bytes)');
