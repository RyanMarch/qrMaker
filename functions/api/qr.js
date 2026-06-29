/**
 * QR Maker — Cloudflare Pages Function
 * POST /api/qr
 *
 * Request body (JSON):
 *   content     {string}  required — text or URL to encode
 *   format      {string}  "png" | "svg" | "base64"   default: "png"
 *   size        {number}  output pixels (png/base64)  default: 1024
 *   fgColor     {string}  hex color                   default: "#000000"
 *   bgColor     {string}  hex color                   default: "#ffffff"
 *   transparent {boolean} transparent background      default: false
 *   margin      {number}  quiet-zone modules           default: 2
 *   ecl         {string}  "L" | "M" | "Q" | "H"      default: "M"
 *
 * Auth (future-ready, currently disabled):
 *   Set AUTH_ENABLED=true in CF environment variables to enable.
 *   Set API_KEY=<your-secret> in CF environment secrets.
 *   Requests then require: Authorization: Bearer <your-secret>
 */

import qrcode from './qr-lib.js';
import { zlibSync } from 'fflate';

// ─── CORS headers ────────────────────────────────────────────────────────────

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// ─── Auth middleware ──────────────────────────────────────────────────────────

/**
 * Returns a 401 Response if auth is enabled and the request is not authorized.
 * Returns null if the request is allowed to proceed.
 *
 * To enable auth, set these in your Cloudflare Pages environment:
 *   AUTH_ENABLED = true
 *   API_KEY      = <your secret key>
 */
function checkAuth(request, env) {
  const authEnabled = env.AUTH_ENABLED === 'true' || env.AUTH_ENABLED === true;
  if (!authEnabled) return null; // auth is off — let it through

  const apiKey = env.API_KEY;
  if (!apiKey) {
    // Auth is enabled but no key is configured — fail safe
    return jsonError('API auth is misconfigured on the server', 500);
  }

  const authHeader = request.headers.get('Authorization') || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || token !== apiKey) {
    return jsonError('Unauthorized — provide a valid Bearer token', 401);
  }

  return null; // authorized
}

// ─── Entry points ─────────────────────────────────────────────────────────────

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestGet({ request, env }) {
  // Auth gate
  const authError = checkAuth(request, env);
  if (authError) return authError;

  // Extract parameters from URL search parameters
  const url = new URL(request.url);
  const params = url.searchParams;

  const content = (params.get('content') || '').trim();
  if (!content) return jsonError('content query parameter is required', 400);

  const format      = ['png', 'svg', 'base64'].includes(params.get('format')) ? params.get('format') : 'png';
  const size        = Math.min(Math.max(Number(params.get('size')) || 1024, 64), 4096);
  const fgColor     = parseHexColor(params.get('fgColor')) ?? [0, 0, 0];
  const bgColor     = parseHexColor(params.get('bgColor')) ?? [255, 255, 255];
  const transparent = params.get('transparent') === 'true' || params.get('transparent') === '1';
  const margin      = params.has('margin') && !isNaN(Number(params.get('margin'))) ? Math.min(Math.max(Number(params.get('margin')), 0), 10) : 2;
  const ecl         = ['L', 'M', 'Q', 'H'].includes(params.get('ecl')) ? params.get('ecl') : 'M';
  const cornerRadius = Math.min(Math.max(Number(params.get('cornerRadius') || params.get('bgCorners') || params.get('bgc')) || 0, 0), 100);
  const cornerStyle  = ['square', 'rounded', 'circle', 'leaf', 'beveled'].includes(params.get('cornerStyle') || params.get('cms')) ? (params.get('cornerStyle') || params.get('cms')) : 'square';

  // Build QR module matrix
  let matrix;
  try {
    matrix = buildMatrix(content, ecl, margin);
  } catch (err) {
    return jsonError(`Failed to generate QR code: ${err.message}`, 422);
  }

  // Render
  if (format === 'svg') {
    const svg = toSVG(matrix, fgColor, bgColor, transparent, cornerRadius, cornerStyle, margin);
    return new Response(svg, {
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  }

  // PNG or base64
  const pngBytes = toPNG(matrix, size, fgColor, bgColor, transparent, cornerRadius, cornerStyle, margin);

  if (format === 'base64') {
    const b64 = uint8ToBase64(pngBytes);
    return Response.json(
      { data: `data:image/png;base64,${b64}` },
      {
        headers: {
          ...CORS_HEADERS,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      }
    );
  }

  // Default: raw PNG binary
  return new Response(pngBytes, {
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'image/png',
      'Content-Disposition': 'inline; filename="qr.png"',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}

// ─── QR Matrix builder ────────────────────────────────────────────────────────

/**
 * Returns a 2D boolean array where true = dark module.
 * Includes quiet-zone padding.
 */
function buildMatrix(content, ecl, margin) {
  qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];
  const qr = qrcode(0, ecl);
  qr.addData(content, 'Byte');
  qr.make();
  const count = qr.getModuleCount();
  const total = count + margin * 2;
  const matrix = [];

  for (let row = 0; row < total; row++) {
    matrix[row] = [];
    for (let col = 0; col < total; col++) {
      const r = row - margin;
      const c = col - margin;
      if (r >= 0 && r < count && c >= 0 && c < count) {
        matrix[row][col] = qr.isDark(r, c);
      } else {
        matrix[row][col] = false; // quiet zone = light
      }
    }
  }

  return matrix;
}

// ─── SVG renderer ────────────────────────────────────────────────────────────

function toSVG(matrix, fgColor, bgColor, transparent, cornerRadius = 0, cornerStyle = 'square', margin = 2) {
  const size = matrix.length;
  const fg = rgbToHex(fgColor);
  const bg = rgbToHex(bgColor);
  const count = size - margin * 2;

  const rects = [];
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (isFinderPattern(row, col, size, margin)) continue;
      if (matrix[row][col]) {
        rects.push(`<rect x="${col}" y="${row}" width="1" height="1" fill="${fg}"/>`);
      }
    }
  }

  // Draw custom finder patterns in SVG
  const finderPatterns = [
    getFinderPatternSvg(margin, margin, cornerStyle, 'TL', fg),
    getFinderPatternSvg(margin + count - 7, margin, cornerStyle, 'TR', fg),
    getFinderPatternSvg(margin, margin + count - 7, cornerStyle, 'BL', fg),
  ];

  const bgRSvg = size * 0.25 * (cornerRadius / 100);
  const bgRect = transparent
    ? ''
    : (bgRSvg > 0
      ? `<rect width="${size}" height="${size}" rx="${bgRSvg}" ry="${bgRSvg}" fill="${bg}"/>`
      : `<rect width="${size}" height="${size}" fill="${bg}"/>`);

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges">`,
    bgRect,
    ...rects,
    ...finderPatterns,
    `</svg>`,
  ].join('\n');
}

// ─── PNG renderer ────────────────────────────────────────────────────────────

function toPNG(matrix, outputSize, fgColor, bgColor, transparent, cornerRadius = 0, cornerStyle = 'square', margin = 2) {
  const modules = matrix.length;
  // Scale: each module becomes cellSize × cellSize pixels
  const cellSize = Math.max(1, Math.floor(outputSize / modules));
  const px = modules * cellSize; // actual pixel dimensions

  const hasRoundedCorners = cornerRadius > 0;
  const channels = (transparent || hasRoundedCorners) ? 4 : 3;
  const scanline = px * channels;
  // PNG raw data: 1 filter byte per row + pixel data
  const rawData = new Uint8Array((scanline + 1) * px);

  const [fr, fg2, fb] = fgColor;
  const [br, bg2, bb] = bgColor;
  const bgRadius = px * 0.25 * (cornerRadius / 100);

  for (let row = 0; row < px; row++) {
    const moduleRow = Math.floor(row / cellSize);
    rawData[row * (scanline + 1)] = 0; // filter type: None

    for (let col = 0; col < px; col++) {
      const moduleCol = Math.floor(col / cellSize);
      
      // Determine pixel color based on finder patterns or regular modules
      let dark = false;
      const fpPixel = getFinderPatternPixel(row, col, px, cellSize, margin, cornerStyle);
      if (fpPixel !== null) {
        dark = fpPixel;
      } else {
        dark = matrix[moduleRow]?.[moduleCol] ?? false;
      }
      
      const offset = row * (scanline + 1) + 1 + col * channels;

      let isOutsideCorners = false;
      if (bgRadius > 0) {
        if (col < bgRadius && row < bgRadius) {
          const dx = col - bgRadius;
          const dy = row - bgRadius;
          if (dx * dx + dy * dy > bgRadius * bgRadius) isOutsideCorners = true;
        } else if (col >= px - bgRadius && row < bgRadius) {
          const dx = col - (px - bgRadius);
          const dy = row - bgRadius;
          if (dx * dx + dy * dy > bgRadius * bgRadius) isOutsideCorners = true;
        } else if (col < bgRadius && row >= px - bgRadius) {
          const dx = col - bgRadius;
          const dy = row - (px - bgRadius);
          if (dx * dx + dy * dy > bgRadius * bgRadius) isOutsideCorners = true;
        } else if (col >= px - bgRadius && row >= px - bgRadius) {
          const dx = col - (px - bgRadius);
          const dy = row - (px - bgRadius);
          if (dx * dx + dy * dy > bgRadius * bgRadius) isOutsideCorners = true;
        }
      }

      if (channels === 4) {
        if (isOutsideCorners) {
          rawData[offset]     = 0;
          rawData[offset + 1] = 0;
          rawData[offset + 2] = 0;
          rawData[offset + 3] = 0; // fully transparent
        } else if (transparent && !dark) {
          rawData[offset]     = br;
          rawData[offset + 1] = bg2;
          rawData[offset + 2] = bb;
          rawData[offset + 3] = 0; // fully transparent
        } else {
          rawData[offset]     = dark ? fr : br;
          rawData[offset + 1] = dark ? fg2 : bg2;
          rawData[offset + 2] = dark ? fb : bb;
          rawData[offset + 3] = 255;
        }
      } else {
        // RGB
        rawData[offset]     = dark ? fr : br;
        rawData[offset + 1] = dark ? fg2 : bg2;
        rawData[offset + 2] = dark ? fb : bb;
      }
    }
  }

  const compressed = zlibSync(rawData, { level: 6 });
  return assemblePNG(px, px, compressed, transparent || hasRoundedCorners);
}

// ─── Finder pattern style helpers ─────────────────────────────────────────────

function isFinderPattern(row, col, totalSize, margin) {
  const r = row - margin;
  const c = col - margin;
  const count = totalSize - margin * 2;
  if (r < 0 || c < 0 || r >= count || c >= count) return false;
  if (r < 7 && c < 7) return true;
  if (r < 7 && c >= count - 7) return true;
  if (r >= count - 7 && c < 7) return true;
  return false;
}

function getCustomRectSvgPath(x, y, w, h, rtl, rtr, rbr, rbl) {
  return `M ${x + rtl} ${y} ` +
         `h ${w - rtl - rtr} ` +
         (rtr > 0 ? `a ${rtr} ${rtr} 0 0 1 ${rtr} ${rtr} ` : '') +
         `v ${h - rtr - rbr} ` +
         (rbr > 0 ? `a ${rbr} ${rbr} 0 0 1 -${rbr} ${rbr} ` : '') +
         `h -${w - rbr - rbl} ` +
         (rbl > 0 ? `a ${rbl} ${rbl} 0 0 1 -${rbl} -${rbl} ` : '') +
         `v -${h - rbl - rtl} ` +
         (rtl > 0 ? `a ${rtl} ${rtl} 0 0 1 ${rtl} -${rtl} ` : '') +
         `z`;
}

function getBeveledSvgPath(x, y, size, bevel) {
  return `M ${x + bevel} ${y} ` +
         `L ${x + size - bevel} ${y} ` +
         `L ${x + size} ${y + bevel} ` +
         `L ${x + size} ${y + size - bevel} ` +
         `L ${x + size - bevel} ${y + size} ` +
         `L ${x + bevel} ${y + size} ` +
         `L ${x} ${y + size - bevel} ` +
         `L ${x} ${y + bevel} ` +
         `z`;
}

function getFinderPatternSvg(x, y, style, pos, fgColorHex) {
  if (style === 'circle') {
    const cx = x + 3.5;
    const cy = y + 3.5;
    const framePath = `M ${cx} ${y} a 3.5 3.5 0 1 0 0 7 a 3.5 3.5 0 1 0 0 -7 M ${cx} ${y + 1} a 2.5 2.5 0 1 0 0 5 a 2.5 2.5 0 1 0 0 -5`;
    const eyePath = `M ${cx} ${y + 2} a 1.5 1.5 0 1 0 0 3 a 1.5 1.5 0 1 0 0 -3`;
    return `<path fill="${fgColorHex}" fill-rule="evenodd" d="${framePath}"/>\n  <path fill="${fgColorHex}" d="${eyePath}"/>`;
  } else if (style === 'rounded') {
    const framePath = getCustomRectSvgPath(x, y, 7, 7, 2, 2, 2, 2) + ' ' + getCustomRectSvgPath(x + 1, y + 1, 5, 5, 1.2, 1.2, 1.2, 1.2);
    const eyePath = getCustomRectSvgPath(x + 2, y + 2, 3, 3, 0.9, 0.9, 0.9, 0.9);
    return `<path fill="${fgColorHex}" fill-rule="evenodd" d="${framePath}"/>\n  <path fill="${fgColorHex}" d="${eyePath}"/>`;
  } else if (style === 'leaf') {
    let rtl = 0, rtr = 0, rbr = 0, rbl = 0;
    if (pos === 'TL') rtl = 3.5;
    else if (pos === 'TR') rtr = 3.5;
    else if (pos === 'BL') rbl = 3.5;

    let irtl = 0, irtr = 0, irbr = 0, irbl = 0;
    if (pos === 'TL') irtl = 2.5;
    else if (pos === 'TR') irtr = 2.5;
    else if (pos === 'BL') irbl = 2.5;

    let ertl = 0, ertr = 0, erbr = 0, erbl = 0;
    if (pos === 'TL') ertl = 1.5;
    else if (pos === 'TR') ertr = 1.5;
    else if (pos === 'BL') erbl = 1.5;

    const framePath = getCustomRectSvgPath(x, y, 7, 7, rtl, rtr, rbr, rbl) + ' ' + getCustomRectSvgPath(x + 1, y + 1, 5, 5, irtl, irtr, irbr, irbl);
    const eyePath = getCustomRectSvgPath(x + 2, y + 2, 3, 3, ertl, ertr, erbr, erbl);
    return `<path fill="${fgColorHex}" fill-rule="evenodd" d="${framePath}"/>\n  <path fill="${fgColorHex}" d="${eyePath}"/>`;
  } else if (style === 'beveled') {
    const framePath = getBeveledSvgPath(x, y, 7, 1.75) + ' ' + getBeveledSvgPath(x + 1, y + 1, 5, 1.05);
    const eyePath = getBeveledSvgPath(x + 2, y + 2, 3, 0.7);
    return `<path fill="${fgColorHex}" fill-rule="evenodd" d="${framePath}"/>\n  <path fill="${fgColorHex}" d="${eyePath}"/>`;
  } else {
    // square
    const framePath = `M ${x} ${y} h 7 v 7 h -7 z M ${x + 1} ${y + 1} h 5 v 5 h -5 z`;
    const eyePath = `M ${x + 2} ${y + 2} h 3 v 3 h -3 z`;
    return `<path fill="${fgColorHex}" fill-rule="evenodd" d="${framePath}"/>\n  <path fill="${fgColorHex}" d="${eyePath}"/>`;
  }
}

// ─── PNG pixel geometry helpers ──────────────────────────────────────────────

function isInsideRoundRect(x, y, w, rad) {
  if (x < 0 || y < 0 || x > w || y > w) return false;
  if (x < rad && y < rad) {
    return (x - rad) * (x - rad) + (y - rad) * (y - rad) <= rad * rad;
  }
  if (x > w - rad && y < rad) {
    const dx = x - (w - rad);
    return dx * dx + (y - rad) * (y - rad) <= rad * rad;
  }
  if (x < rad && y > w - rad) {
    const dy = y - (w - rad);
    return (x - rad) * (x - rad) + dy * dy <= rad * rad;
  }
  if (x > w - rad && y > w - rad) {
    const dx = x - (w - rad);
    const dy = y - (w - rad);
    return dx * dx + dy * dy <= rad * rad;
  }
  return true;
}

function isInsideLeaf(x, y, w, rad, pos) {
  if (x < 0 || y < 0 || x > w || y > w) return false;
  if (pos === 'TL' && x < rad && y < rad) {
    return (x - rad) * (x - rad) + (y - rad) * (y - rad) <= rad * rad;
  }
  if (pos === 'TR' && x > w - rad && y < rad) {
    const dx = x - (w - rad);
    return dx * dx + (y - rad) * (y - rad) <= rad * rad;
  }
  if (pos === 'BL' && x < rad && y > w - rad) {
    const dy = y - (w - rad);
    return (x - rad) * (x - rad) + dy * dy <= rad * rad;
  }
  return true;
}

function isInsideBeveled(x, y, size, bevel) {
  if (x < 0 || y < 0 || x > size || y > size) return false;
  if (x + y < bevel) return false;
  if (x - y > size - bevel) return false;
  if (y - x > size - bevel) return false;
  if (x + y > 2 * size - bevel) return false;
  return true;
}

function getFinderPatternPixel(row, col, px, cellSize, margin, cornerStyle) {
  const count = px / cellSize - margin * 2;
  const topBorder = margin * cellSize;
  const bottomBorder = (margin + 7) * cellSize;
  const leftBorder = margin * cellSize;
  const rightBorder = (margin + 7) * cellSize;

  const trLeft = (margin + count - 7) * cellSize;
  const trRight = (margin + count) * cellSize;
  const blTop = (margin + count - 7) * cellSize;
  const blBottom = (margin + count) * cellSize;

  let rPixel, cPixel, pos;
  if (row >= topBorder && row < bottomBorder && col >= leftBorder && col < rightBorder) {
    rPixel = row - topBorder;
    cPixel = col - leftBorder;
    pos = 'TL';
  } else if (row >= topBorder && row < bottomBorder && col >= trLeft && col < trRight) {
    rPixel = row - topBorder;
    cPixel = col - trLeft;
    pos = 'TR';
  } else if (row >= blTop && row < blBottom && col >= leftBorder && col < rightBorder) {
    rPixel = row - blTop;
    cPixel = col - leftBorder;
    pos = 'BL';
  } else {
    return null; // Not in any finder pattern
  }

  // Convert to modular coordinate floats inside the 7x7 pattern
  const c = cPixel / cellSize;
  const r = rPixel / cellSize;

  if (cornerStyle === 'circle') {
    const d = Math.sqrt((c - 3.5) * (c - 3.5) + (r - 3.5) * (r - 3.5));
    if (d <= 1.5) return true;
    if (d <= 2.5) return false;
    if (d <= 3.5) return true;
    return false;
  } else if (cornerStyle === 'rounded') {
    if (isInsideRoundRect(c - 2, r - 2, 3, 0.9)) return true;
    if (isInsideRoundRect(c - 1, r - 1, 5, 1.2)) return false;
    if (isInsideRoundRect(c, r, 7, 2)) return true;
    return false;
  } else if (cornerStyle === 'leaf') {
    if (isInsideLeaf(c - 2, r - 2, 3, 1.5, pos)) return true;
    if (isInsideLeaf(c - 1, r - 1, 5, 2.5, pos)) return false;
    if (isInsideLeaf(c, r, 7, 3.5, pos)) return true;
    return false;
  } else if (cornerStyle === 'beveled') {
    if (isInsideBeveled(c - 2, r - 2, 3, 0.7)) return true;
    if (isInsideBeveled(c - 1, r - 1, 5, 1.05)) return false;
    if (isInsideBeveled(c, r, 7, 1.75)) return true;
    return false;
  } else {
    // Default: square
    if (c >= 2 && c < 5 && r >= 2 && r < 5) return true;
    if (c >= 1 && c < 6 && r >= 1 && r < 6) return false;
    if (c >= 0 && c < 7 && r >= 0 && r < 7) return true;
    return false;
  }
}

// ─── PNG binary assembler ─────────────────────────────────────────────────────

const PNG_SIGNATURE = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

// CRC32 lookup table (standard PNG CRC algorithm)
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    t[i] = c;
  }
  return t;
})();

function crc32(data) {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ data[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function writeUint32BE(val) {
  return new Uint8Array([(val >>> 24) & 0xff, (val >>> 16) & 0xff, (val >>> 8) & 0xff, val & 0xff]);
}

function makeChunk(type, data) {
  const typeBytes = new TextEncoder().encode(type);
  const lenBytes  = writeUint32BE(data.length);
  const crcInput  = new Uint8Array(typeBytes.length + data.length);
  crcInput.set(typeBytes, 0);
  crcInput.set(data, typeBytes.length);
  const crcBytes = writeUint32BE(crc32(crcInput));
  // chunk = length + type + data + crc
  const chunk = new Uint8Array(4 + 4 + data.length + 4);
  chunk.set(lenBytes, 0);
  chunk.set(typeBytes, 4);
  chunk.set(data, 8);
  chunk.set(crcBytes, 8 + data.length);
  return chunk;
}

function assemblePNG(width, height, compressedData, transparent) {
  // IHDR: width(4) height(4) bitDepth(1) colorType(1) compression(1) filter(1) interlace(1)
  // colorType: 2 = RGB, 6 = RGBA
  const colorType = transparent ? 6 : 2;
  const ihdrData = new Uint8Array(13);
  const dv = new DataView(ihdrData.buffer);
  dv.setUint32(0, width, false);
  dv.setUint32(4, height, false);
  ihdrData[8]  = 8;         // bit depth
  ihdrData[9]  = colorType;
  ihdrData[10] = 0;         // compression method
  ihdrData[11] = 0;         // filter method
  ihdrData[12] = 0;         // interlace method

  const ihdr = makeChunk('IHDR', ihdrData);
  const idat = makeChunk('IDAT', compressedData);
  const iend = makeChunk('IEND', new Uint8Array(0));

  const total = PNG_SIGNATURE.length + ihdr.length + idat.length + iend.length;
  const out = new Uint8Array(total);
  let pos = 0;
  out.set(PNG_SIGNATURE, pos); pos += PNG_SIGNATURE.length;
  out.set(ihdr, pos);          pos += ihdr.length;
  out.set(idat, pos);          pos += idat.length;
  out.set(iend, pos);
  return out;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

/** Parse a hex color string like "#abc" or "#aabbcc" → [r, g, b] or null */
function parseHexColor(hex) {
  if (typeof hex !== 'string') return null;
  hex = hex.replace('#', '').trim();
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  if (hex.length !== 6) return null;
  const n = parseInt(hex, 16);
  if (isNaN(n)) return null;
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

function rgbToHex([r, g, b]) {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

/** Encode Uint8Array to base64 string (CF Workers compatible) */
function uint8ToBase64(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function jsonError(message, status = 400) {
  return Response.json({ error: message }, { status, headers: CORS_HEADERS });
}
