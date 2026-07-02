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
 * Auth:
 *   Set API_KEY=<your-secret> in CF environment secrets.
 *   Requests require: Authorization: Bearer <API_KEY>
 */

import qrcode from './qr-lib.js';
import { zlibSync } from 'fflate';
import { initWasm, Resvg } from '@resvg/resvg-wasm';
import resvgWasm from '@resvg/resvg-wasm/index_bg.wasm';
let wasmInitialized = false;
async function ensureWasmInitialized() {
  if (!wasmInitialized) {
    try {
      await initWasm(resvgWasm);
    } catch (err) {
      // In local dev/hot reload, initWasm may throw if already initialized.
      // We can safely ignore this; if it was a fatal compile error,
      // the Resvg rendering call below will fail.
    }
    wasmInitialized = true;
  }
}

let fontBuffer = null;
async function getEmojiFont(context) {
  if (fontBuffer) return fontBuffer;
  const fontUrl = new URL('/assets/MaterialIcons-Regular.ttf', context.request.url);
  const fontResponse = await context.env.ASSETS.fetch(fontUrl);
  
  if (!fontResponse.ok) {
    throw new Error(`Font asset loading failed: ${fontResponse.status}`);
  }
  
  fontBuffer = await fontResponse.arrayBuffer();
  return fontBuffer;
}


// ─── Predefined Vector Icons ──────────────────────────────────────────────────
const PREDEFINED_ICONS = {
  link: {
    type: 'stroke',
    paths: [
      'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71',
      'M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71'
    ],
    grid: '00000000000000000000000000000000000000000000f00000000007fe000000001f9f800000007c03c0000000f000e0000001e000e0000001c000700000008000700000000000300000000000380000000000380000000000380000000000380000000000700000fe0000700003ffc000e0000781e000e0001e007000e0003c003801c000780000038000f00000070001e000000e0003c00c001c0003801e00780007000f00f000070007efc0000e0001ff80000e00001000000c00000000001c00000000001c00000000001c00000000001c00000000000e00000000000e000180000007000380000007000700000007801e00000003f07c00000000fff0000000001f80000000000200000000000000000000000000000000000000000000'
  },
  globe: {
    type: 'stroke',
    paths: [
      'M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z',
      'M2 12h20',
      'M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z'
    ],
    grid: '00000000000000000000000000000000000000000f0000000001ffc0c0000003f1cfc000000f01e0f000001e02707800007806701e0000f00c380f0000e0181c070001c0381c03800380700e01c00380700e01c00700600600e00e00e00700700e00e00700700e00e00700700c00e00700301c00c00300381c01c00380381c01c00380381c01c00380381ffffffffff81ffffffffff81c01c00380381c01c00380381c01c00380380c01c00380300e00e00700700e00e00700700e00e00700700700e00700e00780600601e00380700e01c001c0700e038001e0381c078000f0381c0f0000781c381e00003e0e707c00000f0e70f0000007e7e7e0000001ffff800000003ffc0000000001800000000000000000000000000000000000000000'
  },
  text: {
    type: 'stroke',
    paths: [
      'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z',
      'M14 2v6h6',
      'M16 13H8',
      'M16 17H8',
      'M10 9H8'
    ],
    grid: '000000000000000000000000000000000000007ffffc000000fffffe000001c0001f000001c0001f800001c0001bc00001800019e00001800018f000018000187800018000183c00018000181e00018000180f000180001807800180001fff800180000fff800180f00001800180f00001800180000001800180000001800180000001800180000001800180000001800180ffff01800180ffff01800180000001800180000001800180000001800180000001800180000001800180000001800180ffff01800180ffff018001800000018001800000018001800000018001800000018001800000018001c00000038001c00000038000f000000f00007ffffffe00000ffffff000000000000000000000000000000000000000'
  },
  wifi: {
    type: 'mixed',
    paths: [
      { type: 'stroke', d: 'M5 12.55a11 11 0 0 1 14.08 0' },
      { type: 'stroke', d: 'M1.42 9a16 16 0 0 1 21.16 0' },
      { type: 'stroke', d: 'M8.53 16.11a6 6 0 0 1 6.95 0' },
      { type: 'fill', d: 'M12 20a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z' }
    ],
    grid: '00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000ff000000003ffffc000001ff00ff800007c00003e0000f000000f0003c0000003c00f80000001f01e000000007838000000001c00000000000800001ff800000001ffff80000007e007e000000f0000f800003c00003c00007800001e0000200000040000000000000000000000000000000000000000000000000000000ff0000000007ffe00000000781f0000000040020000000000000000000007e00000000007e00000000007e00000000007e00000000007e00000000000800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
  },
  contact: {
    type: 'stroke',
    paths: [
      'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2',
      'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'
    ],
    grid: '000000000000000000000000000000000000000000000000000000000000000003c0000000001ff8000000007c3e00000000700e00000000e00700000000e00700000001c00380000001c00380000001c00380000001c00380000001c00380000000e00700000000e007000000006006000000007c3e000000003ffc0000000007e000000000018000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000007ffffe000001f0000f800007c00003e00007000000e0000e00000070000e00000070001c00000038001c000000380018000000180018000000180018000000180018000000180018000000180000000000000000000000000000000000000000000000000000000000000'
  },
  email: {
    type: 'stroke',
    paths: [
      'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z',
      'M22 6l-10 7L2 6'
    ],
    grid: '00000000000000000000000000000000000000000000000000000000000000000000000000000000000007ffffffffe00ffffffffff01c00000000381c00000000381c00000000381e00000000781f80000001f81bc0000003d819e000000798187800001e18183c00003c18180f0000f01818078001e0181803e007c0181800f00f00181800781e001818001e78001818000ff00018180003c000181800018000181800000000181800000000181800000000181800000000181800000000181800000000181800000000181800000000181800000000181c00000000381c00000000380f00000000f007ffffffffe000ffffffff00000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
  },
  phone: {
    type: 'stroke',
    paths: [
      'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z'
    ],
    grid: '00000000000000000000000000000000000003ff800000000fffc00000000e00e00000001c00e00000001c00700000001c00700000001c00700000001c00300000000c00380000000e00380000000e00380000000e00380000000e00300000000700700000000700700000000700e00000000381c00000000381c000000001c0e000000001c07000000000e03800000000e03c00000000701c00000000380e000000003c07807000001c03c3ff80000e01e78fe00007007e00f00003803c00380003c00000380001e000001000007800001800003c00001800001e00001800000f800018000003e00018000000f800180000003e00380000000fe03800000003fef0000000001fe0000000000100000000000000000000000000000000000000'
  },
  'map-pin': {
    type: 'stroke',
    paths: [
      'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z',
      'M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'
    ],
    grid: '00000000000000000ff000000000ffff00000003f00fc00000078001e000001f0000f800003c00003c00007800001e00007000000e0000e00000070001e00000078001c0000003800380000001c0038003c001c003001ff800c007003c3c00e00700381c00e00700700e00e00700700e00e00600700e00600700700e00e00700700e00e00700381c00e003003c3c00c003801ff801c0038007e001c00380018001c001c00000038001c00000038001c00000038000e000000700007000000e00007800001e00003800001c00001c00003800000e00007000000e0000700000070000e00000038001c0000001c00380000000f00f00000000781e000000003c3c000000001e78000000000ff00000000003c00000000001800000000000000000'
  },
  sms: {
    type: 'stroke',
    paths: [
      'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'
    ],
    grid: '00000000000000000000000000000000000000000000000000000000000000ffffffff0003ffffffffc00380000001c00700000000e00700000000e00600000000600600000000600600000000600600000000600600000000600600000000600600000000600600000000600600000000600600000000600600000000600600000000600600000000600600000000600600000000600600000000600600000000600600000000600600000000600600000000600600000000e00600000000e00600000003c00607ffffffc0060ffffffe00061c0000000006380000000006700000000006e00000000007c000000000078000000000070000000000020000000000000000000000000000000000000000000000000000000000000000000000'
  },
  event: {
    type: 'stroke',
    paths: [
      'M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z',
      'M16 2v4',
      'M8 2v4',
      'M3 10h18'
    ],
    grid: '0000000000000000000000000000000000000000000000000000000000000018001800000018001800001ffffffff8003ffffffffc00701800180e00701800180e00701800180e006018001806006000000006006000000006006000000006006000000006006000000006006000000006007ffffffffe007ffffffffe00600000000600600000000600600000000600600000000600600000000600600000000600600000000600600000000600600000000600600000000600600000000600600000000600600000000600600000000600600000000600600000000600600000000600600000000600600000000600700000000e00700000000e003c0000003c001ffffffff80003ffffffc00000000000000000000000000000000000000'
  },
  github: {
    type: 'fill',
    paths: [
      'M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.479C19.138 20.164 22 16.418 22 12c0-5.523-4.477-10-10-10z'
    ],
    grid: '00000000000000000000000000000000000000000000000000001ff800000001ffff80000003ffffc000000ffffff000001ffffff800007ffffffe00007ffffffe0000ffffffff0001fcffff3f8001fc3c3c3f8003fc00003fc007f800001fe007fc00003fe007fc00003fe007f800001fe00ff800001ff00ff000000ff00ff000000ff00ff000000ff00ff000000ff00ff000000ff00ff000000ff00ff000000ff00ff800001ff00ff800001ff00ffc00003ff007ff0000ffe007ffe003ffe003eff81fffc003f7f00fffc001f3f00fff8000f8800fff00007c000ffe00003e000ffc00001ff00ff800000ff00ff0000007f00fe0000001f00f8000000000020000000000000000000000000000000000000000000000000000000000000000'
  },
  linkedin: {
    type: 'fill',
    paths: [
      'M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z'
    ],
    grid: '00000000000007ffffffffe00ffffffffff03ffffffffffc3ffffffffffc7ffffffffffefffffffffffffff3ffffffffffe1ffffffffffc0ffffffffffc0ffffffffffc0ffffffffffe1fffffffffff3ffffffffffffffffffffffffffffffffffffffffffffffc0f0381fffffc0f03007ffffc0f02003ffffc0f00003ffffc0f00003ffffc0f00601ffffc0f01f81ffffc0f03fc1ffffc0f03fc0ffffc0f03fc0ffffc0f03fc0ffffc0f03fc0ffffc0f03fc0ffffc0f03fc0ffffc0f03fc0ffffc0f03fc0ffffc0f03fc0ffffc0f03fc0ffffc0f03fc0ffffc0f03fc0ffffc0f03fc0ffffc0f03fc0ffffffffffffffffffffffffffffffffffffffffffffffffff7ffffffffffe3ffffffffffc3ffffffffffc0ffffffffff007ffffffffe0'
  },
  instagram: {
    type: 'mixed',
    paths: [
      { type: 'stroke', d: 'M17 2H7a5 5 0 0 0-5 5v10a5 5 0 0 0 5 5h10a5 5 0 0 0 5-5V7a5 5 0 0 0-5-5z' },
      { type: 'stroke', d: 'M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z' },
      { type: 'fill', d: 'M17.5 6.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0z' }
    ],
    grid: '000000000000000000000000000000000000007ffffffe0000ffffffff0003e0000007c00780000001e00700000000e00e00000000701e00000000781c00000000381c00000000381c0000000038180000006018180000002018180007e0001818001ff800181800383e00181800700e00181800e00700181801c00700181801c00380181801c00380181801c00380181801c00380181801c00380181801c00380181800e00780181800e00f00181800781e001818003efc001818000ff800181800020000181800000000181c00000000381c00000000381c00000000381c00000000380e00000000700700000000e00780000001e003c0000003c000fc00003f00007ffffffe000003ffffc000000000000000000000000000000000000000'
  },
  facebook: {
    type: 'fill',
    paths: [
      'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z'
    ],
    grid: '0000000000000000000000000000000000000000000000000000000000000000007ff000000000fff000000003fff000000003fff000000007fff00000000ffff00000000ffff00000000ffff00000000ff8000000000ff0000000000ff0000000000ff0000000000ff0000000000ff0000000000ff0000000000ff000000003fffff0000003fffff0000003fffff0000003ffffe0000003ffffe0000003ffffe0000003ffffe0000003ffffc00000000ff0000000000ff0000000000ff0000000000ff0000000000ff0000000000ff0000000000ff0000000000ff0000000000ff0000000000ff0000000000ff0000000000ff0000000000ff0000000000ff0000000000ff0000000000ff00000000000000000000000000000000000000000'
  },
  whatsapp: {
    type: 'fill',
    paths: [
      'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.703 1.457h.004c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z'
    ],
    grid: '00000080000000001ffc00000003ffffc0000007ffffe000001ffffff800003ff007fc0000ff0000ff0001fe00007f8003f800001fc007f000000fe007e0000003e00fc0000003f01f80000001f81f01c00000f83f07e00000fc3e0fe000007e7c0ff000003e7c0ff000003e7c0ff000003e7c0ff800003e7c0ff000001ff80fe000001ff80fe000001ff807e000001ff803f000001ff803f800001ff801f800001ff800fe03001ff8007f0fc01f7c003fcff03e7c001ffff83e7c0007fff03e7e0003fff07e3e0001fff07e3f00007fe0fc1f00000701f81f00000001f81f00000003f03f00000007e03e0000000fc03e0000003fc07e3e00007f807dffe001fe007ffffe3ffc007ffffffff000fff7ffffe000ff007fff0000f00007e00000'
  }
};

// ─── CORS headers ────────────────────────────────────────────────────────────

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// ─── Auth middleware ──────────────────────────────────────────────────────────

async function verifyHmacSignature(message, signature, secret) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const base64 = signature.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return crypto.subtle.verify('HMAC', cryptoKey, bytes, encoder.encode(message));
}

/**
 * Returns a 401 Response if the request is not authorized.
 * Returns null if the request is allowed to proceed.
 */
async function checkAuth(request, env) {
  const authHeader = request.headers.get('Authorization') || '';
  if (!authHeader) {
    return null; // Allow unauthenticated requests
  }

  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return jsonError('Unauthorized — provide a valid Bearer API Key', 401);
  }

  // 1. Check static API keys first
  const staticApiKey = env.API_KEY;
  const motionPosterKey = env.MOTION_POSTER_API_KEY;
  if (
    (staticApiKey && token === staticApiKey) ||
    (motionPosterKey && token === motionPosterKey)
  ) {
    return null; // authorized with static key
  }

  // 2. Check stateless signed API key
  const signingSecret = env.API_SIGNING_SECRET;
  if (!signingSecret) {
    return jsonError('API auth is misconfigured on the server', 500);
  }

  const parts = token.split(':');
  if (parts.length !== 3) {
    return jsonError('Unauthorized — invalid API Key format', 401);
  }

  const [encodedEmail, expirationStr, signature] = parts;
  const expiration = parseInt(expirationStr, 10);

  if (isNaN(expiration) || expiration < Date.now()) {
    return jsonError('Unauthorized — API Key has expired', 401);
  }

  // Check blocklist if configured
  const blockedKeysVar = env.BLOCKED_KEYS || '';
  if (blockedKeysVar) {
    const blockedList = blockedKeysVar.split(',').map(s => s.trim().toLowerCase());

    // Decode email to check if the user is blocked
    let decodedEmail = '';
    try {
      // Decode base64url or base64 email safely
      const normalizedBase64 = encodedEmail.replace(/-/g, '+').replace(/_/g, '/');
      decodedEmail = atob(normalizedBase64).toLowerCase();
    } catch (e) {
      // Fallback if base64 decoding fails
    }

    if (
      blockedList.includes(token.toLowerCase()) ||
      (decodedEmail && blockedList.includes(decodedEmail))
    ) {
      return jsonError('Forbidden — this API Key has been revoked', 403);
    }
  }

  const rawKeyData = `${encodedEmail}:${expirationStr}`;
  try {
    const isValid = await verifyHmacSignature(rawKeyData, signature, signingSecret);
    if (!isValid) {
      return jsonError('Unauthorized — invalid API Key signature', 401);
    }
  } catch (err) {
    return jsonError('Unauthorized — API Key signature verification error', 401);
  }

  return null; // authorized
}

// Rate limiting helper using Cloudflare Cache API
async function checkRateLimit(request, authHeader) {
  const cache = caches.default;
  const period = 10; // 10-second window
  const timestamp = Math.floor(Date.now() / (period * 1000));

  // Use the token to identify rate-limit state (safely hashed or sliced)
  const token = authHeader.split(' ')[1] || 'anonymous';
  const rateLimitKey = `token-${token.slice(-16)}`;

  const limit = 20; // 20 requests per 10 seconds

  const cacheKey = new Request(`https://rate-limit.internal/${rateLimitKey}/${timestamp}`);

  const cachedResponse = await cache.match(cacheKey);
  let count = 0;
  if (cachedResponse) {
    count = parseInt(await cachedResponse.text(), 10) || 0;
  }

  if (count >= limit) {
    return new Response(JSON.stringify({ error: 'Too Many Requests — Rate limit exceeded for this API Key' }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  // Increment count and write back to cache
  const newResponse = new Response((count + 1).toString(), {
    headers: { 'Cache-Control': `public, max-age=${period}` }
  });

  await cache.put(cacheKey, newResponse);

  return null; // Under the limit
}

// ─── Entry points ─────────────────────────────────────────────────────────────

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestGet(context) {
  const { request, env, data } = context;
  const isSecureRoute = data?.isSecureRoute || false;

  // Auth gate
  const authHeader = request.headers.get('Authorization') || '';

  if (isSecureRoute && !authHeader) {
    return jsonError('Unauthorized — API Key required on secure route', 401);
  }

  if (authHeader) {
    const authError = await checkAuth(request, env);
    if (authError) return authError;
  }

  // Enforce secure rate limit in code (only runs for verified keys on /plus)
  if (isSecureRoute) {
    const rateLimitError = await checkRateLimit(request, authHeader);
    if (rateLimitError) return rateLimitError;
  }

  // Extract parameters from URL search parameters
  const url = new URL(request.url);
  const params = url.searchParams;

  const content = (params.get('content') || '').trim();
  if (!content) return jsonError('content query parameter is required', 400);

  const format = ['png', 'svg', 'base64'].includes(params.get('format')) ? params.get('format') : 'png';
  const size = Math.min(Math.max(Number(params.get('size')) || 512, 64), 4096);
  const fgColor = parseHexColor(params.get('fgColor')) ?? [0, 0, 0];
  const bgColor = parseHexColor(params.get('bgColor')) ?? [255, 255, 255];
  const transparent = params.get('transparent') === 'true' || params.get('transparent') === '1';
  const margin = params.has('margin') && !isNaN(Number(params.get('margin'))) ? Math.min(Math.max(Number(params.get('margin')), 0), 10) : 2;
  let ecl = ['L', 'M', 'Q', 'H'].includes(params.get('ecl')) ? params.get('ecl') : 'M';
  const cornerRadius = Math.min(Math.max(Number(params.get('cornerRadius') || params.get('bgCorners') || params.get('bgc')) || 0, 0), 100);
  const cornerStyle = ['square', 'rounded', 'circle', 'leaf', 'beveled'].includes(params.get('cornerStyle') || params.get('cms')) ? (params.get('cornerStyle') || params.get('cms')) : 'square';

  // Predefined Vector Icons parameters
  const iconParam = params.get('icon');
  const icon = iconParam ? decodeURIComponent(iconParam) : 'none';
  const iconSize = Math.min(Math.max(Number(params.get('iconSize') || params.get('iconsz')) || 20, 10), 30);
  const iconColorParam = params.get('iconColor') || params.get('iconcol');
  const iconColor = iconColorParam ? (parseHexColor(iconColorParam) ?? fgColor) : fgColor;
  const iconClearParam = params.get('iconClear') || params.get('iconcl');
  const iconClear = iconClearParam !== 'false' && iconClearParam !== '0';
  const iconBgParam = params.get('iconBg') || params.get('iconbg');
  let iconBg = 'rounded';
  if (iconBgParam === 'false' || iconBgParam === '0') {
    iconBg = 'none';
  } else if (['circle', 'rounded', 'square'].includes(iconBgParam)) {
    iconBg = iconBgParam;
  } else if (iconBgParam === 'true' || iconBgParam === '1') {
    iconBg = 'rounded';
  }

  // Adjust error correction level for icon overlay data loss if not explicitly set
  const hasIcon = icon && icon !== 'none';
  if (hasIcon && !params.has('ecl')) {
    ecl = iconSize > 22 ? 'H' : 'Q';
  }

  // Build QR module matrix
  let matrix;
  try {
    matrix = buildMatrix(content, ecl, margin);
  } catch (err) {
    return jsonError(`Failed to generate QR code: ${err.message}`, 422);
  }

  // Render
  if (format === 'svg') {
    const svg = toSVG(matrix, fgColor, bgColor, transparent, cornerRadius, cornerStyle, margin, icon, iconSize, iconColor, iconClear, iconBg);
    return new Response(svg, {
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  }

  // PNG or base64
  const isPredefined = hasIcon && PREDEFINED_ICONS[icon];
  const isEmoji = hasIcon && !isPredefined;

  let pngBytes;
  try {
    // Generate SVG first
    const svg = toSVG(matrix, fgColor, bgColor, transparent, cornerRadius, cornerStyle, margin, icon, iconSize, iconColor, iconClear, iconBg);
    await ensureWasmInitialized();

    const fontData = new Uint8Array(await getEmojiFont(context));

    const resvgOpts = {
      fitTo: { mode: 'width', value: size },
      font: {
        loadSystemFonts: false,
        fontBuffers: [fontData],
        defaultFontFamily: 'Material Icons'
      }
    };

    const resvg = new Resvg(svg, resvgOpts);
    const pngData = resvg.render();
    pngBytes = pngData.asPng();
  } catch (err) {
    console.error('Failed to render PNG via Resvg, falling back to pure-JS encoder:', err);
    pngBytes = toPNG(matrix, size, fgColor, bgColor, transparent, cornerRadius, cornerStyle, margin, icon, iconSize, iconColor, iconClear, iconBg);
  }

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

function toSVG(matrix, fgColor, bgColor, transparent, cornerRadius = 0, cornerStyle = 'square', margin = 2, icon = 'none', iconSize = 20, iconColor = fgColor, iconClear = true, iconBg = 'rounded') {
  const size = matrix.length;
  const fg = rgbToHex(fgColor);
  const bg = rgbToHex(bgColor);
  const count = size - margin * 2;

  const rects = [];

  // Icon configuration
  const iconSizeModules = count * (iconSize / 100);
  const centerModules = margin + count / 2;
  const paddingModules = iconSizeModules * 0.15;
  const cardSizeModules = iconSizeModules + paddingModules * 2;
  const cardXModules = centerModules - cardSizeModules / 2;
  const cardYModules = centerModules - cardSizeModules / 2;

  const cardShape = (typeof iconBg === 'string' && ['circle', 'rounded', 'square'].includes(iconBg))
    ? iconBg
    : (iconBg ? 'rounded' : 'none');

  const hasIcon = icon && icon !== 'none';
  const isPredefined = hasIcon && PREDEFINED_ICONS[icon];

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (isFinderPattern(row, col, size, margin)) continue;

      // Skip modules covered by the card background if clearing is enabled
      if (hasIcon && iconClear && cardShape !== 'none') {
        if (isInsideCard(col + 0.5, row + 0.5, centerModules, cardSizeModules, cardShape)) {
          continue;
        }
      }

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

  let iconSvgContent = '';
  if (hasIcon) {
    const cardColor = transparent ? '#ffffff' : bg;

    // Draw background card if requested
    if (cardShape !== 'none') {
      if (cardShape === 'circle') {
        iconSvgContent += `\n  <circle cx="${centerModules}" cy="${centerModules}" r="${cardSizeModules / 2}" fill="${cardColor}"/>`;
      } else if (cardShape === 'rounded') {
        const rx = cardSizeModules * 0.2;
        iconSvgContent += `\n  <rect x="${cardXModules}" y="${cardYModules}" width="${cardSizeModules}" height="${cardSizeModules}" rx="${rx}" ry="${rx}" fill="${cardColor}"/>`;
      } else if (cardShape === 'square') {
        iconSvgContent += `\n  <rect x="${cardXModules}" y="${cardYModules}" width="${cardSizeModules}" height="${cardSizeModules}" fill="${cardColor}"/>`;
      }
    }

    // Draw the icon itself
    if (isPredefined) {
      const iconXModules = centerModules - iconSizeModules / 2;
      const iconYModules = centerModules - iconSizeModules / 2;
      const scale = iconSizeModules / 24; // assuming viewBox is 24x24
      const strokeHex = rgbToHex(iconColor);
      const iconConfig = PREDEFINED_ICONS[icon];

      iconSvgContent += `\n  <g transform="translate(${iconXModules}, ${iconYModules}) scale(${scale})" stroke-linecap="round" stroke-linejoin="round">`;
      if (iconConfig.type === 'stroke') {
        for (const p of iconConfig.paths) {
          iconSvgContent += `\n    <path d="${p}" fill="none" stroke="${strokeHex}" stroke-width="2"/>`;
        }
      } else if (iconConfig.type === 'fill') {
        for (const p of iconConfig.paths) {
          iconSvgContent += `\n    <path d="${p}" fill="${strokeHex}" stroke="none"/>`;
        }
      } else if (iconConfig.type === 'mixed') {
        for (const p of iconConfig.paths) {
          if (p.type === 'stroke') {
            iconSvgContent += `\n    <path d="${p.d}" fill="none" stroke="${strokeHex}" stroke-width="2"/>`;
          } else if (p.type === 'fill') {
            iconSvgContent += `\n    <path d="${p.d}" fill="${strokeHex}" stroke="none"/>`;
          }
        }
      }
      iconSvgContent += `\n  </g>`;
    } else {
      const escapedEmoji = icon.replace(/[<>&'"]/g, (c) => {
        switch (c) {
          case '<': return '&lt;';
          case '>': return '&gt;';
          case '&': return '&amp;';
          case '\'': return '&apos;';
          case '"': return '&quot;';
          default: return c;
        }
      });
      const emojiSize = iconSizeModules * 0.82;
      iconSvgContent += `\n  <text x="${centerModules}" y="${centerModules}" font-size="${emojiSize}" font-family="'Material Icons', system-ui, -apple-system, sans-serif" text-anchor="middle" dominant-baseline="central">${escapedEmoji}</text>`;
    }
  }

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="100%" height="100%" shape-rendering="crispEdges">`,
    bgRect,
    ...rects,
    ...finderPatterns,
    iconSvgContent,
    `</svg>`,
  ].join('\n');
}

// ─── PNG renderer ────────────────────────────────────────────────────────────

function toPNG(matrix, outputSize, fgColor, bgColor, transparent, cornerRadius = 0, cornerStyle = 'square', margin = 2, icon = 'none', iconSize = 20, iconColor = fgColor, iconClear = true, iconBg = 'rounded') {
  const modules = matrix.length;
  // Scale: each module becomes cellSize × cellSize pixels
  const cellSize = Math.max(1, Math.floor(outputSize / modules));
  const px = modules * cellSize; // actual pixel dimensions
  const center = px / 2;

  const hasRoundedCorners = cornerRadius > 0;
  const channels = (transparent || hasRoundedCorners) ? 4 : 3;
  const scanline = px * channels;
  // PNG raw data: 1 filter byte per row + pixel data
  const rawData = new Uint8Array((scanline + 1) * px);

  const [fr, fg2, fb] = fgColor;
  const [br, bg2, bb] = bgColor;
  const bgRadius = px * 0.25 * (cornerRadius / 100);

  // Icon geometry
  const iconSizePx = px * (iconSize / 100);
  const iconX = center - iconSizePx / 2;
  const iconY = center - iconSizePx / 2;
  const padding = iconSizePx * 0.15;
  const cardSize = iconSizePx + padding * 2;

  const cardShape = (typeof iconBg === 'string' && ['circle', 'rounded', 'square'].includes(iconBg))
    ? iconBg
    : (iconBg ? 'rounded' : 'none');

  const hasIcon = icon && icon !== 'none';
  const isPredefined = hasIcon && PREDEFINED_ICONS[icon];
  const iconGridHex = isPredefined ? PREDEFINED_ICONS[icon].grid : '';
  const [icR, icG, icB] = iconColor;
  const cardR = br, cardG = bg2, cardB = bb;

  for (let row = 0; row < px; row++) {
    const moduleRow = Math.floor(row / cellSize);
    rawData[row * (scanline + 1)] = 0; // filter type: None

    for (let col = 0; col < px; col++) {
      const moduleCol = Math.floor(col / cellSize);

      let inCard = false;
      if (hasIcon && iconClear && cardShape !== 'none') {
        inCard = isInsideCard(col, row, center, cardSize, cardShape);
      }

      let inIcon = false;
      let iconPixelDark = false;
      if (isPredefined && col >= iconX && col < iconX + iconSizePx && row >= iconY && row < iconY + iconSizePx) {
        const gridCol = Math.floor((col - iconX) * 48 / iconSizePx);
        const gridRow = Math.floor((row - iconY) * 48 / iconSizePx);
        if (gridCol >= 0 && gridCol < 48 && gridRow >= 0 && gridRow < 48) {
          const byteIndex = Math.floor(gridCol / 8);
          const bitPos = 7 - (gridCol % 8);
          const hexByteString = iconGridHex.substring(gridRow * 12 + byteIndex * 2, gridRow * 12 + byteIndex * 2 + 2);
          const byteVal = parseInt(hexByteString, 16);
          iconPixelDark = (byteVal & (1 << bitPos)) !== 0;
          inIcon = true;
        }
      }

      let drawR = 0, drawG = 0, drawB = 0, drawA = 255;
      let pixelColored = false;

      if (inIcon && iconPixelDark) {
        drawR = icR;
        drawG = icG;
        drawB = icB;
        drawA = 255;
        pixelColored = true;
      } else if (inCard) {
        // Draw the background card under the icon
        drawR = transparent ? 255 : cardR;
        drawG = transparent ? 255 : cardG;
        drawB = transparent ? 255 : cardB;
        drawA = 255;
        pixelColored = true;
      }

      if (!pixelColored) {
        // Determine pixel color based on finder patterns or regular modules
        let dark = false;
        const fpPixel = getFinderPatternPixel(row, col, px, cellSize, margin, cornerStyle);
        if (fpPixel !== null) {
          dark = fpPixel;
        } else {
          dark = matrix[moduleRow]?.[moduleCol] ?? false;
        }

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
            drawR = 0; drawG = 0; drawB = 0; drawA = 0;
          } else if (transparent && !dark) {
            drawR = br; drawG = bg2; drawB = bb; drawA = 0;
          } else {
            drawR = dark ? fr : br;
            drawG = dark ? fg2 : bg2;
            drawB = dark ? fb : bb;
            drawA = 255;
          }
        } else {
          drawR = dark ? fr : br;
          drawG = dark ? fg2 : bg2;
          drawB = dark ? fb : bb;
        }
      }

      const offset = row * (scanline + 1) + 1 + col * channels;
      if (channels === 4) {
        rawData[offset] = drawR;
        rawData[offset + 1] = drawG;
        rawData[offset + 2] = drawB;
        rawData[offset + 3] = drawA;
      } else {
        rawData[offset] = drawR;
        rawData[offset + 1] = drawG;
        rawData[offset + 2] = drawB;
      }
    }
  }

  const compressed = zlibSync(rawData, { level: 3 });
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
  const lenBytes = writeUint32BE(data.length);
  const crcInput = new Uint8Array(typeBytes.length + data.length);
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
  ihdrData[8] = 8;         // bit depth
  ihdrData[9] = colorType;
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
  out.set(ihdr, pos); pos += ihdr.length;
  out.set(idat, pos); pos += idat.length;
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

// Check if a point (x, y) relative to the card's bounding box is inside the card
function isInsideCard(x, y, center, cardSize, shape) {
  const half = cardSize / 2;
  const cardX = center - half;
  const cardY = center - half;
  if (x < cardX || x >= cardX + cardSize || y < cardY || y >= cardY + cardSize) return false;

  if (shape === 'circle') {
    const dx = x - center;
    const dy = y - center;
    return dx * dx + dy * dy <= half * half;
  } else if (shape === 'rounded') {
    const rad = cardSize * 0.2;
    const relX = x - cardX;
    const relY = y - cardY;
    return isInsideRoundRect(relX, relY, cardSize, rad);
  }

  // default: square
  return true;
}
