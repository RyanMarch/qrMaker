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
  const bgCorners   = Math.min(Math.max(Number(params.get('bgCorners') || params.get('bgc')) || 0, 0), 100);

  // Build QR module matrix
  let matrix;
  try {
    matrix = buildMatrix(content, ecl, margin);
  } catch (err) {
    return jsonError(`Failed to generate QR code: ${err.message}`, 422);
  }

  // Render
  if (format === 'svg') {
    const svg = toSVG(matrix, fgColor, bgColor, transparent, bgCorners);
    return new Response(svg, {
      headers: { ...CORS_HEADERS, 'Content-Type': 'image/svg+xml; charset=utf-8' },
    });
  }

  // PNG or base64
  const pngBytes = toPNG(matrix, size, fgColor, bgColor, transparent, bgCorners);

  if (format === 'base64') {
    const b64 = uint8ToBase64(pngBytes);
    return Response.json(
      { data: `data:image/png;base64,${b64}` },
      { headers: CORS_HEADERS }
    );
  }

  // Default: raw PNG binary
  return new Response(pngBytes, {
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'image/png',
      'Content-Disposition': 'inline; filename="qr.png"',
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

function toSVG(matrix, fgColor, bgColor, transparent, bgCorners = 0) {
  const size = matrix.length;
  const fg = rgbToHex(fgColor);
  const bg = rgbToHex(bgColor);

  const rects = [];
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (matrix[row][col]) {
        rects.push(`<rect x="${col}" y="${row}" width="1" height="1" fill="${fg}"/>`);
      }
    }
  }

  const bgRSvg = size * 0.25 * (bgCorners / 100);
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
    `</svg>`,
  ].join('\n');
}

// ─── PNG renderer ────────────────────────────────────────────────────────────

function toPNG(matrix, outputSize, fgColor, bgColor, transparent, bgCorners = 0) {
  const modules = matrix.length;
  // Scale: each module becomes cellSize × cellSize pixels
  const cellSize = Math.max(1, Math.floor(outputSize / modules));
  const px = modules * cellSize; // actual pixel dimensions

  const hasRoundedCorners = bgCorners > 0;
  const channels = (transparent || hasRoundedCorners) ? 4 : 3;
  const scanline = px * channels;
  // PNG raw data: 1 filter byte per row + pixel data
  const rawData = new Uint8Array((scanline + 1) * px);

  const [fr, fg2, fb] = fgColor;
  const [br, bg2, bb] = bgColor;
  const bgRadius = px * 0.25 * (bgCorners / 100);

  for (let row = 0; row < px; row++) {
    const moduleRow = Math.floor(row / cellSize);
    rawData[row * (scanline + 1)] = 0; // filter type: None

    for (let col = 0; col < px; col++) {
      const moduleCol = Math.floor(col / cellSize);
      const dark = matrix[moduleRow]?.[moduleCol] ?? false;
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
