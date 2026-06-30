/* ============================================================
   QR Maker — script.js
   QR encoder: kazuhikoarase/qrcode-generator (MIT License)
   https://github.com/kazuhikoarase/qrcode-generator
   UI logic: Ryan March
   ============================================================ */

"use strict";

/* =============================================================
   SECTION 1: UI State
   ============================================================= */

let state = {
    activeTab: 'url',
    ecl: 'M',
    pixelStyle: 'square',
    cornerStyle: 'rounded',
    cornerRadius: 0,
    exportSize: 1024,
    margin: 2,
    fgColor: '#000000',
    bgColor: '#ffffff',
    themeColor: '#ffffff',
    isTransparent: false,
    logoUrl: '',
    logoDataUrl: '',
    logoSize: 20,
    logoClearBehind: true,
    logoCardShape: 'rounded',
    overlayMode: 'none', // 'none' | 'icon' | 'logo'
    icon: 'none',
    iconSize: 20,
    iconColor: '#000000',
    iconClearBehind: true,
    iconCardShape: 'rounded',
};

const PREDEFINED_ICONS = {
    link: {
        type: 'stroke',
        paths: [
            'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71',
            'M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71'
        ]
    },
    text: {
        type: 'stroke',
        paths: [
            'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z',
            'M14 2v6h6',
            'M16 13H8',
            'M16 17H8',
            'M10 9H8'
        ]
    },
    wifi: {
        type: 'mixed',
        paths: [
            { type: 'stroke', d: 'M5 12.55a11 11 0 0 1 14.08 0' },
            { type: 'stroke', d: 'M1.42 9a16 16 0 0 1 21.16 0' },
            { type: 'stroke', d: 'M8.53 16.11a6 6 0 0 1 6.95 0' },
            { type: 'fill', d: 'M12 20a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z' }
        ]
    },
    contact: {
        type: 'stroke',
        paths: [
            'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2',
            'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'
        ]
    },
    email: {
        type: 'stroke',
        paths: [
            'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z',
            'M22 6l-10 7L2 6'
        ]
    },
    phone: {
        type: 'stroke',
        paths: [
            'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z'
        ]
    },
    'map-pin': {
        type: 'stroke',
        paths: [
            'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z',
            'M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'
        ]
    },
    sms: {
        type: 'stroke',
        paths: [
            'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'
        ]
    },
    event: {
        type: 'stroke',
        paths: [
            'M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z',
            'M16 2v4',
            'M8 2v4',
            'M3 10h18'
        ]
    },
    globe: {
        type: 'stroke',
        paths: [
            'M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z',
            'M2 12h20',
            'M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z'
        ]
    },
    github: {
        type: 'fill',
        paths: [
            'M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.479C19.138 20.164 22 16.418 22 12c0-5.523-4.477-10-10-10z'
        ]
    },
    linkedin: {
        type: 'fill',
        paths: [
            'M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z'
        ]
    },
    instagram: {
        type: 'mixed',
        paths: [
            { type: 'stroke', d: 'M17 2H7a5 5 0 0 0-5 5v10a5 5 0 0 0 5 5h10a5 5 0 0 0 5-5V7a5 5 0 0 0-5-5z' },
            { type: 'stroke', d: 'M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z' },
            { type: 'fill', d: 'M17.5 6.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0z' }
        ]
    },
    facebook: {
        type: 'fill',
        paths: [
            'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z'
        ]
    },
    whatsapp: {
        type: 'fill',
        paths: [
            'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.703 1.457h.004c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z'
        ]
    },
    youtube: {
        type: 'fill',
        paths: [
            'M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.871.508 9.388.508 9.388.508s7.517 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z'
        ]
    },
    patreon: {
        type: 'fill',
        paths: [
            'M22.957 7.21c-.004-3.064-2.391-5.576-5.191-6.482-3.478-1.125-8.064-.962-11.384.604C2.357 3.231 1.093 7.391 1.046 11.54c-.039 3.411.302 12.396 5.369 12.46 3.765.047 4.326-4.804 6.068-7.141 1.24-1.662 2.836-2.132 4.801-2.618 3.376-.836 5.678-3.501 5.673-7.031Z'
        ]
    },
    discord: {
        type: 'fill',
        paths: [
            'M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.094 13.094 0 0 1-1.873-.894.077.077 0 0 1-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 0 1 .077-.011c3.92 1.793 8.18 1.793 12.061 0a.073.073 0 0 1 .078.009c.12.099.246.195.373.289a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.156 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.156 2.418z'
        ]
    },
    pinterest: {
        type: 'fill',
        paths: [
            'M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.993 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z'
        ]
    }
};

let generateTimer = null;
let lastQrObj = null; // keep reference for SVG export
let logoImage = null; // keeps loaded image object for drawing on canvas

// Default QR content — always points to this app's own origin at runtime.
// Works on localhost, staging, and production without any hardcoding.
const DEFAULT_QR_CONTENT = window.location.origin + '/';

/* =============================================================
   SECTION 2: QR Content Builders
   ============================================================= */

function getQrContent() {
    const tab = state.activeTab;
    if (tab === 'url') {
        return document.getElementById('input-url').value.trim();
    } else if (tab === 'text') {
        return document.getElementById('input-text').value;
    } else if (tab === 'wifi') {
        const ssid = document.getElementById('input-wifi-ssid').value.trim();
        if (!ssid) return '';
        const pass = document.getElementById('input-wifi-key').value;
        const sec = document.getElementById('input-wifi-security').value;
        const hidden = document.getElementById('input-wifi-hidden').checked;
        const escapeWifi = (s) => s.replace(/[\\";,:]/g, c => '\\' + c);
        return `WIFI:T:${sec};S:${escapeWifi(ssid)};P:${escapeWifi(pass)};H:${hidden ? 'true' : 'false'};;`;
    } else if (tab === 'email') {
        const to = document.getElementById('input-email-to').value.trim();
        if (!to) return '';
        const subject = document.getElementById('input-email-subject').value.trim();
        const body = document.getElementById('input-email-body').value.trim();
        let url = `mailto:${to}`;
        const params = [];
        if (subject) params.push('subject=' + encodeURIComponent(subject));
        if (body) params.push('body=' + encodeURIComponent(body));
        if (params.length) url += '?' + params.join('&');
        return url;
    } else if (tab === 'phone') {
        const phone = document.getElementById('input-phone').value.trim();
        if (!phone) return '';
        return `tel:${phone.replace(/\s/g, '')}`;
    } else if (tab === 'location') {
        const lat = document.getElementById('input-geo-lat').value.trim();
        const lng = document.getElementById('input-geo-lng').value.trim();
        if (!lat || !lng) return '';
        return `geo:${lat},${lng}`;
    } else if (tab === 'contact') {
        const first = document.getElementById('input-contact-first').value.trim();
        const last = document.getElementById('input-contact-last').value.trim();
        const org = document.getElementById('input-contact-org').value.trim();
        const phone = document.getElementById('input-contact-phone').value.trim();
        const email = document.getElementById('input-contact-email').value.trim();
        if (!first && !last && !phone && !email) return '';

        let vcard = 'BEGIN:VCARD\nVERSION:3.0\n';
        if (first || last) {
            vcard += `N:${last};${first};;;\n`;
            vcard += `FN:${first} ${last}`.trim() + '\n';
        }
        if (org) vcard += `ORG:${org}\n`;
        if (phone) vcard += `TEL:${phone}\n`;
        if (email) vcard += `EMAIL:${email}\n`;
        vcard += 'END:VCARD';
        return vcard;
    } else if (tab === 'sms') {
        const phone = document.getElementById('input-sms-phone').value.trim();
        const message = document.getElementById('input-sms-message').value;
        if (!phone) return '';
        return `SMSTO:${phone}:${message}`;
    } else if (tab === 'event') {
        const title = document.getElementById('input-event-title').value.trim();
        const startVal = document.getElementById('input-event-start').value;
        const endVal = document.getElementById('input-event-end').value;
        const loc = document.getElementById('input-event-location').value.trim();
        const desc = document.getElementById('input-event-desc').value.trim();
        if (!title || !startVal) return '';

        const formatICSDate = (dtString) => {
            if (!dtString) return '';
            const d = new Date(dtString);
            if (isNaN(d.getTime())) return '';
            const pad = (n) => String(n).padStart(2, '0');
            const y = d.getUTCFullYear();
            const m = pad(d.getUTCMonth() + 1);
            const date = pad(d.getUTCDate());
            const h = pad(d.getUTCHours());
            const min = pad(d.getUTCMinutes());
            const s = pad(d.getUTCSeconds());
            return `${y}${m}${date}T${h}${min}${s}Z`;
        };

        const start = formatICSDate(startVal);
        const end = formatICSDate(endVal);

        let ics = 'BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\n';
        ics += `SUMMARY:${title}\n`;
        ics += `DTSTART:${start}\n`;
        if (end) ics += `DTEND:${end}\n`;
        if (loc) ics += `LOCATION:${loc}\n`;
        if (desc) ics += `DESCRIPTION:${desc}\n`;
        ics += 'END:VEVENT\nEND:VCALENDAR';
        return ics;
    }
    return '';
}

/* =============================================================
   SECTION 3: QR Generation & Rendering
   ============================================================= */

function scheduleGenerate() {
    updateColorHex();
    clearTimeout(generateTimer);
    generateTimer = setTimeout(generateQR, 100);
}

function generateQR() {
    const userContent = getQrContent();
    const content = userContent || DEFAULT_QR_CONTENT;
    const canvas = document.getElementById('qr-canvas');
    const placeholder = document.getElementById('qr-placeholder');
    const errorMsg = document.getElementById('qr-error-msg');

    try {
        let ecl = state.ecl;
        if (logoImage) {
            ecl = state.logoSize > 22 ? 'H' : 'Q';
        }
        const qr = qrcode(0, ecl);
        // Use UTF-8 mode to support all unicode
        qr.addData(content, 'Byte');
        qr.make();

        lastQrObj = qr;
        drawQR(qr, canvas);
        canvas.classList.add('visible');
        placeholder.classList.add('hidden');
        errorMsg.classList.remove('visible');
    } catch (e) {
        lastQrObj = null;
        canvas.classList.remove('visible');
        placeholder.classList.remove('hidden');
        errorMsg.textContent = e.message || 'Could not generate QR code';
        errorMsg.classList.add('visible');
    }
}

function drawQR(qr, canvas, targetPx) {
    const moduleCount = qr.getModuleCount();
    const margin = state.margin;
    const totalModules = moduleCount + margin * 2;
    const px = targetPx || canvas.offsetWidth || 400;
    const moduleSize = Math.max(1, Math.floor(px / totalModules));
    const totalPx = totalModules * moduleSize;

    canvas.width = totalPx;
    canvas.height = totalPx;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, totalPx, totalPx);

    // Background
    if (state.bgColor === 'transparent') {
        ctx.clearRect(0, 0, totalPx, totalPx);
    } else {
        ctx.fillStyle = state.bgColor;
        const bgR = totalPx * 0.25 * (state.cornerRadius / 100);
        if (bgR > 0) {
            roundRect(ctx, 0, 0, totalPx, totalPx, bgR);
        } else {
            ctx.fillRect(0, 0, totalPx, totalPx);
        }
    }

    ctx.fillStyle = state.fgColor;

    const ps = state.pixelStyle;
    const isDark = (r, c) => {
        if (r < 0 || r >= moduleCount || c < 0 || c >= moduleCount) return false;
        return qr.isDark(r, c);
    };

    for (let row = 0; row < moduleCount; row++) {
        for (let col = 0; col < moduleCount; col++) {
            if (isFinderPattern(row, col, moduleCount)) continue;
            if (qr.isDark(row, col)) {
                const x = (col + margin) * moduleSize;
                const y = (row + margin) * moduleSize;

                if (ps === 'rounded') {
                    roundRect(ctx, x, y, moduleSize, moduleSize, moduleSize * 0.3);
                } else if (ps === 'dot') {
                    ctx.beginPath();
                    ctx.arc(x + moduleSize * 0.5, y + moduleSize * 0.5, moduleSize * 0.5, 0, Math.PI * 2);
                    ctx.fill();
                } else if (ps === 'pill-h') {
                    const left = isDark(row, col - 1);
                    const right = isDark(row, col + 1);
                    const r = moduleSize * 0.5;
                    const rtl = left ? 0 : r;
                    const rbl = left ? 0 : r;
                    const rtr = right ? 0 : r;
                    const rbr = right ? 0 : r;
                    drawCustomRect(ctx, x, y, moduleSize, moduleSize, rtl, rtr, rbr, rbl);
                } else if (ps === 'pill-v') {
                    const top = isDark(row - 1, col);
                    const bottom = isDark(row + 1, col);
                    const r = moduleSize * 0.5;
                    const rtl = top ? 0 : r;
                    const rtr = top ? 0 : r;
                    const rbl = bottom ? 0 : r;
                    const rbr = bottom ? 0 : r;
                    drawCustomRect(ctx, x, y, moduleSize, moduleSize, rtl, rtr, rbr, rbl);
                } else if (ps === 'connected') {
                    const top = isDark(row - 1, col);
                    const bottom = isDark(row + 1, col);
                    const left = isDark(row, col - 1);
                    const right = isDark(row, col + 1);
                    const r = moduleSize * 0.5;
                    const rtl = (top || left) ? 0 : r;
                    const rtr = (top || right) ? 0 : r;
                    const rbr = (bottom || right) ? 0 : r;
                    const rbl = (bottom || left) ? 0 : r;
                    drawCustomRect(ctx, x, y, moduleSize, moduleSize, rtl, rtr, rbr, rbl);
                } else {
                    ctx.fillRect(x, y, moduleSize, moduleSize);
                }
            }
        }
    }

    // Draw customizable finder patterns
    const cs = state.cornerStyle;
    // Top-Left
    drawFinderPattern(ctx, margin * moduleSize, margin * moduleSize, moduleSize, cs, 'TL');
    // Top-Right
    drawFinderPattern(ctx, (moduleCount - 7 + margin) * moduleSize, margin * moduleSize, moduleSize, cs, 'TR');
    // Bottom-Left
    drawFinderPattern(ctx, margin * moduleSize, (moduleCount - 7 + margin) * moduleSize, moduleSize, cs, 'BL');

    // Draw Logo
    if (state.overlayMode === 'logo' && logoImage) {
        const center = totalPx / 2;
        const logoSizePx = totalPx * (state.logoSize / 100);
        const logoX = center - logoSizePx / 2;
        const logoY = center - logoSizePx / 2;

        if (state.logoClearBehind) {
            const padding = logoSizePx * 0.15;
            const cardSize = logoSizePx + padding * 2;
            const cardX = center - cardSize / 2;
            const cardY = center - cardSize / 2;

            let cardColor = state.bgColor;
            if (cardColor === 'transparent') {
                cardColor = '#ffffff';
            }

            ctx.save();
            ctx.fillStyle = cardColor;
            if (state.logoCardShape === 'circle') {
                ctx.beginPath();
                ctx.arc(center, center, cardSize / 2, 0, Math.PI * 2);
                ctx.fill();
            } else if (state.logoCardShape === 'rounded') {
                const rx = cardSize * 0.2;
                roundRect(ctx, cardX, cardY, cardSize, cardSize, rx);
            } else { // square
                ctx.fillRect(cardX, cardY, cardSize, cardSize);
            }
            ctx.restore();
        }

        ctx.drawImage(logoImage, logoX, logoY, logoSizePx, logoSizePx);
    }

    // Draw Predefined Icon
    if (state.overlayMode === 'icon' && state.icon && state.icon !== 'none') {
        const center = totalPx / 2;
        const iconSizePx = totalPx * (state.iconSize / 100);
        const iconX = center - iconSizePx / 2;
        const iconY = center - iconSizePx / 2;

        if (state.iconClearBehind) {
            const padding = iconSizePx * 0.15;
            const cardSize = iconSizePx + padding * 2;
            const cardX = center - cardSize / 2;
            const cardY = center - cardSize / 2;

            let cardColor = state.bgColor;
            if (cardColor === 'transparent') {
                cardColor = '#ffffff';
            }

            ctx.save();
            ctx.fillStyle = cardColor;
            if (state.iconCardShape === 'circle') {
                ctx.beginPath();
                ctx.arc(center, center, cardSize / 2, 0, Math.PI * 2);
                ctx.fill();
            } else if (state.iconCardShape === 'rounded') {
                const rx = cardSize * 0.2;
                roundRect(ctx, cardX, cardY, cardSize, cardSize, rx);
            } else { // square
                ctx.fillRect(cardX, cardY, cardSize, cardSize);
            }
            ctx.restore();
        }

        const iconConfig = PREDEFINED_ICONS[state.icon];
        if (iconConfig) {
            ctx.save();
            ctx.translate(iconX, iconY);
            const scaleFactor = iconSizePx / 24; // assume viewBox 24x24
            ctx.scale(scaleFactor, scaleFactor);

            ctx.strokeStyle = state.iconColor || state.fgColor;
            ctx.fillStyle = state.iconColor || state.fgColor;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            if (iconConfig.type === 'stroke') {
                ctx.lineWidth = 2;
                for (const pStr of iconConfig.paths) {
                    const p = new Path2D(pStr);
                    ctx.stroke(p);
                }
            } else if (iconConfig.type === 'fill') {
                for (const pStr of iconConfig.paths) {
                    const p = new Path2D(pStr);
                    ctx.fill(p);
                }
            } else if (iconConfig.type === 'mixed') {
                for (const pathObj of iconConfig.paths) {
                    const p = new Path2D(pathObj.d);
                    if (pathObj.type === 'stroke') {
                        ctx.lineWidth = 2;
                        ctx.stroke(p);
                    } else if (pathObj.type === 'fill') {
                        ctx.fill(p);
                    }
                }
            }
            ctx.restore();
        } else if (state.icon && state.icon !== 'none') {
            ctx.save();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = `${iconSizePx * 0.82}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
            ctx.fillText(state.icon, center, center);
            ctx.restore();
        }
    }
}

function roundRect(ctx, x, y, w, h, r) {
    drawCustomRect(ctx, x, y, w, h, r, r, r, r);
}

function drawCustomRect(ctx, x, y, w, h, rtl, rtr, rbr, rbl) {
    ctx.beginPath();
    ctx.moveTo(x + rtl, y);
    ctx.lineTo(x + w - rtr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rtr);
    ctx.lineTo(x + w, y + h - rbr);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rbr, y + h);
    ctx.lineTo(x + rbl, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rbl);
    ctx.lineTo(x, y + rtl);
    ctx.quadraticCurveTo(x, y, x + rtl, y);
    ctx.closePath();
    ctx.fill();
}

function isFinderPattern(row, col, moduleCount) {
    if (row < 7 && col < 7) return true;
    if (row < 7 && col >= moduleCount - 7) return true;
    if (row >= moduleCount - 7 && col < 7) return true;
    return false;
}

function drawCustomRectPath(ctx, x, y, w, h, rtl, rtr, rbr, rbl) {
    ctx.moveTo(x + rtl, y);
    ctx.lineTo(x + w - rtr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rtr);
    ctx.lineTo(x + w, y + h - rbr);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rbr, y + h);
    ctx.lineTo(x + rbl, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rbl);
    ctx.lineTo(x, y + rtl);
    ctx.quadraticCurveTo(x, y, x + rtl, y);
    ctx.closePath();
}

function drawBeveledPath(ctx, x, y, size, bevel) {
    ctx.moveTo(x + bevel, y);
    ctx.lineTo(x + size - bevel, y);
    ctx.lineTo(x + size, y + bevel);
    ctx.lineTo(x + size, y + size - bevel);
    ctx.lineTo(x + size - bevel, y + size);
    ctx.lineTo(x + bevel, y + size);
    ctx.lineTo(x, y + size - bevel);
    ctx.lineTo(x, y + bevel);
    ctx.closePath();
}

function drawFinderPattern(ctx, x, y, s, style, pos) {
    ctx.save();
    ctx.fillStyle = state.fgColor;

    if (style === 'circle') {
        const cx = x + 3.5 * s;
        const cy = y + 3.5 * s;
        ctx.beginPath();
        ctx.arc(cx, cy, 3.5 * s, 0, Math.PI * 2);
        ctx.arc(cx, cy, 2.5 * s, 0, Math.PI * 2, true);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(cx, cy, 1.5 * s, 0, Math.PI * 2);
        ctx.fill();
    } else if (style === 'rounded') {
        ctx.beginPath();
        drawCustomRectPath(ctx, x, y, 7 * s, 7 * s, 2 * s, 2 * s, 2 * s, 2 * s);
        drawCustomRectPath(ctx, x + s, y + s, 5 * s, 5 * s, 1.2 * s, 1.2 * s, 1.2 * s, 1.2 * s);
        ctx.fill('evenodd');

        ctx.beginPath();
        drawCustomRectPath(ctx, x + 2 * s, y + 2 * s, 3 * s, 3 * s, 0.9 * s, 0.9 * s, 0.9 * s, 0.9 * s);
        ctx.fill();
    } else if (style === 'leaf') {
        let rtl = 0, rtr = 0, rbr = 0, rbl = 0;
        if (pos === 'TL') rtl = 3.5 * s;
        else if (pos === 'TR') rtr = 3.5 * s;
        else if (pos === 'BL') rbl = 3.5 * s;

        ctx.beginPath();
        drawCustomRectPath(ctx, x, y, 7 * s, 7 * s, rtl, rtr, rbr, rbl);

        let irtl = 0, irtr = 0, irbr = 0, irbl = 0;
        if (pos === 'TL') irtl = 2.5 * s;
        else if (pos === 'TR') irtr = 2.5 * s;
        else if (pos === 'BL') irbl = 2.5 * s;
        drawCustomRectPath(ctx, x + s, y + s, 5 * s, 5 * s, irtl, irtr, irbr, irbl);
        ctx.fill('evenodd');

        let ertl = 0, ertr = 0, erbr = 0, erbl = 0;
        if (pos === 'TL') ertl = 1.5 * s;
        else if (pos === 'TR') ertr = 1.5 * s;
        else if (pos === 'BL') erbl = 1.5 * s;
        ctx.beginPath();
        drawCustomRectPath(ctx, x + 2 * s, y + 2 * s, 3 * s, 3 * s, ertl, ertr, erbr, erbl);
        ctx.fill();
    } else if (style === 'beveled') {
        ctx.beginPath();
        drawBeveledPath(ctx, x, y, 7 * s, 1.75 * s);
        drawBeveledPath(ctx, x + s, y + s, 5 * s, 1.05 * s);
        ctx.fill('evenodd');

        ctx.beginPath();
        drawBeveledPath(ctx, x + 2 * s, y + 2 * s, 3 * s, 0.7 * s);
        ctx.fill();
    } else {
        // square
        ctx.beginPath();
        ctx.rect(x, y, 7 * s, 7 * s);
        ctx.rect(x + s, y + s, 5 * s, 5 * s);
        ctx.fill('evenodd');

        ctx.beginPath();
        ctx.rect(x + 2 * s, y + 2 * s, 3 * s, 3 * s);
        ctx.fill();
    }

    ctx.restore();
}

/* =============================================================
   SECTION 4: Export
   ============================================================= */

function exportPNG() {
    if (!lastQrObj) { showToast('No QR code to export'); return; }
    const offscreen = document.createElement('canvas');
    drawQR(lastQrObj, offscreen, state.exportSize);
    offscreen.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `qr-code-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
    }, 'image/png');
}

function exportSVG() {
    if (!lastQrObj) { showToast('No QR code to export'); return; }
    const qr = lastQrObj;
    const moduleCount = qr.getModuleCount();
    const margin = state.margin;
    const size = moduleCount + margin * 2;
    const ps = state.pixelStyle;

    const isDark = (r, c) => {
        if (r < 0 || r >= moduleCount || c < 0 || c >= moduleCount) return false;
        return qr.isDark(r, c);
    };

    const getCustomRectPath = (x, y, rtl, rtr, rbr, rbl) => {
        return `M ${x + rtl} ${y} ` +
            `L ${x + 1 - rtr} ${y} ` +
            `Q ${x + 1} ${y} ${x + 1} ${y + rtr} ` +
            `L ${x + 1} ${y + 1 - rbr} ` +
            `Q ${x + 1} ${y + 1} ${x + 1 - rbr} ${y + 1} ` +
            `L ${x + rbl} ${y + 1} ` +
            `Q ${x} ${y + 1} ${x} ${y + 1 - rbl} ` +
            `L ${x} ${y + rtl} ` +
            `Q ${x} ${y} ${x + rtl} ${y}`;
    };

    const getCustomRectSvgPath = (x, y, w, h, rtl, rtr, rbr, rbl) => {
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
    };

    const getBeveledSvgPath = (x, y, size, bevel) => {
        return `M ${x + bevel} ${y} ` +
            `L ${x + size - bevel} ${y} ` +
            `L ${x + size} ${y + bevel} ` +
            `L ${x + size} ${y + size - bevel} ` +
            `L ${x + size - bevel} ${y + size} ` +
            `L ${x + bevel} ${y + size} ` +
            `L ${x} ${y + size - bevel} ` +
            `L ${x} ${y + bevel} ` +
            `z`;
    };

    const getFinderPatternSvg = (x, y, style, pos) => {
        if (style === 'circle') {
            const cx = x + 3.5;
            const cy = y + 3.5;
            const framePath = `M ${cx} ${y} a 3.5 3.5 0 1 0 0 7 a 3.5 3.5 0 1 0 0 -7 M ${cx} ${y + 1} a 2.5 2.5 0 1 0 0 5 a 2.5 2.5 0 1 0 0 -5`;
            const eyePath = `M ${cx} ${y + 2} a 1.5 1.5 0 1 0 0 3 a 1.5 1.5 0 1 0 0 -3`;
            return `<path fill-rule="evenodd" d="${framePath}"/>\n  <path d="${eyePath}"/>`;
        } else if (style === 'rounded') {
            const framePath = getCustomRectSvgPath(x, y, 7, 7, 2, 2, 2, 2) + ' ' + getCustomRectSvgPath(x + 1, y + 1, 5, 5, 1.2, 1.2, 1.2, 1.2);
            const eyePath = getCustomRectSvgPath(x + 2, y + 2, 3, 3, 0.9, 0.9, 0.9, 0.9);
            return `<path fill-rule="evenodd" d="${framePath}"/>\n  <path d="${eyePath}"/>`;
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
            return `<path fill-rule="evenodd" d="${framePath}"/>\n  <path d="${eyePath}"/>`;
        } else if (style === 'beveled') {
            const framePath = getBeveledSvgPath(x, y, 7, 1.75) + ' ' + getBeveledSvgPath(x + 1, y + 1, 5, 1.05);
            const eyePath = getBeveledSvgPath(x + 2, y + 2, 3, 0.7);
            return `<path fill-rule="evenodd" d="${framePath}"/>\n  <path d="${eyePath}"/>`;
        } else {
            const framePath = `M ${x} ${y} h 7 v 7 h -7 z M ${x + 1} ${y + 1} h 5 v 5 h -5 z`;
            const eyePath = `M ${x + 2} ${y + 2} h 3 v 3 h -3 z`;
            return `<path fill-rule="evenodd" d="${framePath}"/>\n  <path d="${eyePath}"/>`;
        }
    };

    let paths = '';
    for (let row = 0; row < moduleCount; row++) {
        for (let col = 0; col < moduleCount; col++) {
            if (isFinderPattern(row, col, moduleCount)) continue;
            if (qr.isDark(row, col)) {
                const x = col + margin;
                const y = row + margin;

                if (ps === 'rounded') {
                    paths += `<rect x="${x}" y="${y}" width="1" height="1" rx="0.3" ry="0.3"/>`;
                } else if (ps === 'dot') {
                    paths += `<circle cx="${x + 0.5}" cy="${y + 0.5}" r="0.5"/>`;
                } else if (ps === 'pill-h') {
                    const left = isDark(row, col - 1);
                    const right = isDark(row, col + 1);
                    const rtl = left ? 0 : 0.5;
                    const rbl = left ? 0 : 0.5;
                    const rtr = right ? 0 : 0.5;
                    const rbr = right ? 0 : 0.5;
                    paths += `<path d="${getCustomRectPath(x, y, rtl, rtr, rbr, rbl)}"/>`;
                } else if (ps === 'pill-v') {
                    const top = isDark(row - 1, col);
                    const bottom = isDark(row + 1, col);
                    const rtl = top ? 0 : 0.5;
                    const rtr = top ? 0 : 0.5;
                    const rbl = bottom ? 0 : 0.5;
                    const rbr = bottom ? 0 : 0.5;
                    paths += `<path d="${getCustomRectPath(x, y, rtl, rtr, rbr, rbl)}"/>`;
                } else if (ps === 'connected') {
                    const top = isDark(row - 1, col);
                    const bottom = isDark(row + 1, col);
                    const left = isDark(row, col - 1);
                    const right = isDark(row, col + 1);
                    const rtl = (top || left) ? 0 : 0.5;
                    const rtr = (top || right) ? 0 : 0.5;
                    const rbr = (bottom || right) ? 0 : 0.5;
                    const rbl = (bottom || left) ? 0 : 0.5;
                    paths += `<path d="${getCustomRectPath(x, y, rtl, rtr, rbr, rbl)}"/>`;
                } else {
                    paths += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
                }
            }
        }
    }

    const cs = state.cornerStyle;
    paths += `\n  ` + getFinderPatternSvg(margin, margin, cs, 'TL');
    paths += `\n  ` + getFinderPatternSvg(moduleCount - 7 + margin, margin, cs, 'TR');
    paths += `\n  ` + getFinderPatternSvg(margin, moduleCount - 7 + margin, cs, 'BL');

    let logoSvgContent = '';
    if (state.overlayMode === 'logo' && logoImage) {
        const logoHref = state.logoUrl || state.logoDataUrl;
        if (logoHref) {
            const centerModules = size / 2;
            const logoSizeModules = size * (state.logoSize / 100);

            if (state.logoClearBehind) {
                const paddingModules = logoSizeModules * 0.15;
                const cardSizeModules = logoSizeModules + paddingModules * 2;
                const cardXModules = centerModules - cardSizeModules / 2;
                const cardYModules = centerModules - cardSizeModules / 2;

                let cardColor = state.bgColor;
                if (cardColor === 'transparent') {
                    cardColor = '#ffffff';
                }

                if (state.logoCardShape === 'circle') {
                    logoSvgContent += `\n  <circle cx="${centerModules}" cy="${centerModules}" r="${cardSizeModules / 2}" fill="${cardColor}"/>`;
                } else if (state.logoCardShape === 'rounded') {
                    const rx = cardSizeModules * 0.2;
                    logoSvgContent += `\n  <rect x="${cardXModules}" y="${cardYModules}" width="${cardSizeModules}" height="${cardSizeModules}" rx="${rx}" ry="${rx}" fill="${cardColor}"/>`;
                } else { // square
                    logoSvgContent += `\n  <rect x="${cardXModules}" y="${cardYModules}" width="${cardSizeModules}" height="${cardSizeModules}" fill="${cardColor}"/>`;
                }
            }

            const logoXModules = centerModules - logoSizeModules / 2;
            const logoYModules = centerModules - logoSizeModules / 2;
            logoSvgContent += `\n  <image x="${logoXModules}" y="${logoYModules}" width="${logoSizeModules}" height="${logoSizeModules}" href="${logoHref}"/>`;
        }
    } else if (state.overlayMode === 'icon' && state.icon && state.icon !== 'none') {
        const centerModules = size / 2;
        const iconSizeModules = size * (state.iconSize / 100);

        if (state.iconClearBehind) {
            const paddingModules = iconSizeModules * 0.15;
            const cardSizeModules = iconSizeModules + paddingModules * 2;
            const cardXModules = centerModules - cardSizeModules / 2;
            const cardYModules = centerModules - cardSizeModules / 2;

            let cardColor = state.bgColor;
            if (cardColor === 'transparent') {
                cardColor = '#ffffff';
            }

            if (state.iconCardShape === 'circle') {
                logoSvgContent += `\n  <circle cx="${centerModules}" cy="${centerModules}" r="${cardSizeModules / 2}" fill="${cardColor}"/>`;
            } else if (state.iconCardShape === 'rounded') {
                const rx = cardSizeModules * 0.2;
                logoSvgContent += `\n  <rect x="${cardXModules}" y="${cardYModules}" width="${cardSizeModules}" height="${cardSizeModules}" rx="${rx}" ry="${rx}" fill="${cardColor}"/>`;
            } else { // square
                logoSvgContent += `\n  <rect x="${cardXModules}" y="${cardYModules}" width="${cardSizeModules}" height="${cardSizeModules}" fill="${cardColor}"/>`;
            }
        }

        const iconXModules = centerModules - iconSizeModules / 2;
        const iconYModules = centerModules - iconSizeModules / 2;
        const scale = iconSizeModules / 24; // assume viewBox 24x24
        const strokeColor = state.iconColor || state.fgColor;
        const iconConfig = PREDEFINED_ICONS[state.icon];

        if (iconConfig) {
            logoSvgContent += `\n  <g transform="translate(${iconXModules}, ${iconYModules}) scale(${scale})" stroke-linecap="round" stroke-linejoin="round">`;
            if (iconConfig.type === 'stroke') {
                for (const p of iconConfig.paths) {
                    logoSvgContent += `\n    <path d="${p}" fill="none" stroke="${strokeColor}" stroke-width="2"/>`;
                }
            } else if (iconConfig.type === 'fill') {
                for (const p of iconConfig.paths) {
                    logoSvgContent += `\n    <path d="${p}" fill="${strokeColor}" stroke="none"/>`;
                }
            } else if (iconConfig.type === 'mixed') {
                for (const p of iconConfig.paths) {
                    if (p.type === 'stroke') {
                        logoSvgContent += `\n    <path d="${p.d}" fill="none" stroke="${strokeColor}" stroke-width="2"/>`;
                    } else if (p.type === 'fill') {
                        logoSvgContent += `\n    <path d="${p.d}" fill="${strokeColor}" stroke="none"/>`;
                    }
                }
            }
            logoSvgContent += `\n  </g>`;
        } else if (state.icon && state.icon !== 'none') {
            const escapedEmoji = state.icon.replace(/[<>&'"]/g, (c) => {
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
            logoSvgContent += `\n  <text x="${centerModules}" y="${centerModules}" font-size="${emojiSize}" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle" dominant-baseline="central">${escapedEmoji}</text>`;
        }
    }

    const bgRSvg = size * 0.25 * (state.cornerRadius / 100);
    const bgRect = state.bgColor === 'transparent' ? '' : (bgRSvg > 0 ? `\n  <rect width="${size}" height="${size}" rx="${bgRSvg}" ry="${bgRSvg}" fill="${state.bgColor}"/>` : `\n  <rect width="${size}" height="${size}" fill="${state.bgColor}"/>`);
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">${bgRect}
  <g fill="${state.fgColor}">${paths}</g>${logoSvgContent}
</svg>`;

    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr-code-${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
}

/* =============================================================
   SECTION 5: Share via URL
   ============================================================= */

function buildShareURL() {
    const url = new URL(location.href.split('?')[0]);
    const content = getQrContent();
    if (content) url.searchParams.set('content', content);
    url.searchParams.set('tab', state.activeTab);
    url.searchParams.set('ecl', state.ecl);
    url.searchParams.set('ps', state.pixelStyle);
    url.searchParams.set('cms', state.cornerStyle);
    url.searchParams.set('bgc', state.cornerRadius);
    url.searchParams.set('fg', state.fgColor.replace('#', ''));
    url.searchParams.set('bg', state.bgColor.replace('#', ''));
    url.searchParams.set('margin', state.margin);

    url.searchParams.set('omode', state.overlayMode);
    if (state.overlayMode === 'logo' && state.logoUrl) {
        url.searchParams.set('logo', state.logoUrl);
        url.searchParams.set('logosz', state.logoSize);
        url.searchParams.set('logocb', state.logoClearBehind ? '1' : '0');
        url.searchParams.set('logocs', state.logoCardShape);
    } else if (state.overlayMode === 'icon' && state.icon && state.icon !== 'none') {
        url.searchParams.set('icon', state.icon);
        url.searchParams.set('iconsz', state.iconSize);
        url.searchParams.set('iconcb', state.iconClearBehind ? '1' : '0');
        url.searchParams.set('iconcs', state.iconCardShape);
        url.searchParams.set('iconcol', state.iconColor.replace('#', ''));
    }
    return url.toString();
}

function handleShareClick() {
    const menu = document.getElementById('share-menu');
    menu.classList.toggle('open');
}

async function nativeShare() {
    document.getElementById('share-menu').classList.remove('open');
    const shareUrl = buildShareURL();
    if (navigator.share) {
        try {
            await navigator.share({ title: 'QR Maker', url: shareUrl });
        } catch (e) { /* user cancelled */ }
    } else {
        await copyToClipboard(shareUrl);
        showToast('Link copied!');
    }
}

async function copyShareURL() {
    document.getElementById('share-menu').classList.remove('open');
    const shareUrl = buildShareURL();
    await copyToClipboard(shareUrl);
    showToast('Link copied!');
}

async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
    } catch {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;opacity:0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
    }
}

function loadFromURL() {
    const params = new URLSearchParams(location.search);
    if (params.has('tab')) switchTab(params.get('tab'), false);
    if (params.has('ecl')) setEcc(params.get('ecl'), false);
    if (params.has('ps')) {
        setPixelStyle(params.get('ps'), false);
    } else if (params.has('cs')) {
        let val = params.get('cs');
        if (val === 'dots') val = 'dot';
        setPixelStyle(val, false);
    }
    if (params.has('cms')) {
        setCornerStyle(params.get('cms'), false);
    }
    if (params.has('bgc')) {
        const bgc = parseInt(params.get('bgc'), 10);
        if (!isNaN(bgc)) {
            state.cornerRadius = bgc;
            const bgSlider = document.getElementById('bg-corners-slider');
            if (bgSlider) bgSlider.value = bgc;
        }
    }
    if (params.has('fg')) {
        state.fgColor = '#' + params.get('fg');
    }
    if (params.has('bg')) {
        const bgParam = params.get('bg');
        if (bgParam === 'transparent') {
            state.bgColor = 'transparent';
            state.isTransparent = true;
            if (params.has('fg')) {
                state.themeColor = '#' + params.get('fg');
            } else {
                state.themeColor = '#ffffff';
            }
        } else {
            const bg = '#' + bgParam;
            state.bgColor = bg;
            state.themeColor = bg;
            state.isTransparent = false;
        }
    } else {
        state.themeColor = '#ffffff';
        state.bgColor = '#ffffff';
        state.fgColor = '#000000';
        state.isTransparent = false;
    }
    updateColorTriggerUI();
    if (params.has('margin')) {
        const m = parseInt(params.get('margin'), 10);
        if (!isNaN(m)) {
            state.margin = m;
            document.getElementById('margin-slider').value = m;
            document.getElementById('margin-label').textContent = m;
        }
    }
    if (params.has('content')) {
        const content = params.get('content');
        const tab = state.activeTab;
        if (tab === 'url') document.getElementById('input-url').value = content;
        else if (tab === 'text') document.getElementById('input-text').value = content;
        else if (tab === 'phone') document.getElementById('input-phone').value = content;
    }
    if (params.has('omode')) {
        setOverlayMode(params.get('omode'), false);
    }
    if (params.has('logo')) {
        const logoUrl = params.get('logo');
        state.logoUrl = logoUrl;
        state.logoDataUrl = logoUrl;

        if (params.has('logosz')) {
            const sz = parseInt(params.get('logosz'), 10);
            if (!isNaN(sz)) state.logoSize = sz;
        }
        if (params.has('logocb')) {
            state.logoClearBehind = params.get('logocb') === '1';
        }
        if (params.has('logocs')) {
            state.logoCardShape = params.get('logocs');
        }

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            logoImage = img;
            updateLogoControlsUI(getFilenameFromUrl(logoUrl));
            scheduleGenerate();
        };
        img.onerror = () => {
            console.warn('Failed to load shared logo image from:', logoUrl);
        };
        img.src = logoUrl;
    }
    if (params.has('icon')) {
        const iconName = params.get('icon');
        setIcon(iconName, false);

        if (params.has('iconsz')) {
            const sz = parseInt(params.get('iconsz'), 10);
            if (!isNaN(sz)) {
                state.iconSize = sz;
                const sizeSlider = document.getElementById('icon-size-slider');
                if (sizeSlider) sizeSlider.value = sz;
                updateIconSizeLabel();
            }
        }
        if (params.has('iconcb')) {
            state.iconClearBehind = params.get('iconcb') === '1';
            const clearCheckbox = document.getElementById('icon-clear-behind');
            if (clearCheckbox) clearCheckbox.checked = state.iconClearBehind;
        }
        if (params.has('iconcs')) {
            setIconCardShape(params.get('iconcs'), false);
        }
        if (params.has('iconcol')) {
            const col = '#' + params.get('iconcol');
            state.iconColor = col;
            updateIconColorUI(col);
        }
    }
    updateCornerRadiusLabel();
    updateColorHex();
}

/* =============================================================
   SECTION 6: UI Controls
   ============================================================= */

const DROPDOWN_TABS = ['email', 'phone', 'location', 'sms', 'event'];

function switchTab(name, generate = true) {
    state.activeTab = name;

    const isDropdownItem = DROPDOWN_TABS.includes(name);

    // Toggle active state for all main tabs (excluding tab-more)
    document.querySelectorAll('.tab:not(#tab-more)').forEach(t => {
        const active = t.id === 'tab-' + name;
        t.classList.toggle('active', active);
        t.setAttribute('aria-selected', active);
    });

    // Toggle active state for dropdown items
    document.querySelectorAll('.dropdown-item').forEach(item => {
        const active = item.getAttribute('onclick').includes(`'${name}'`);
        item.classList.toggle('active', active);
    });

    // Handle More button state and text
    const moreBtn = document.getElementById('tab-more');
    const moreLabel = document.querySelector('.more-text-label');
    const moreIconContainer = document.querySelector('.tab-more-btn-content');

    if (moreBtn && moreLabel) {
        if (isDropdownItem) {
            moreBtn.classList.add('active');
            moreBtn.setAttribute('aria-selected', 'true');
            const prettyName = name.charAt(0).toUpperCase() + name.slice(1);
            moreLabel.textContent = prettyName;

            const activeItem = document.querySelector(`.dropdown-item.active svg`);
            if (activeItem && moreIconContainer) {
                const existingSvg = moreIconContainer.querySelector('svg');
                if (existingSvg) {
                    existingSvg.outerHTML = activeItem.outerHTML.replace('width="14"', 'width="16"').replace('height="14"', 'height="16"');
                }
            }
        } else {
            moreBtn.classList.remove('active');
            moreBtn.setAttribute('aria-selected', 'false');
            moreLabel.textContent = 'More';
            if (moreIconContainer) {
                const existingSvg = moreIconContainer.querySelector('svg');
                if (existingSvg) {
                    existingSvg.outerHTML = `
                        <svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="more-icon-svg">
                            <circle cx="12" cy="12" r="1"></circle>
                            <circle cx="19" cy="12" r="1"></circle>
                            <circle cx="5" cy="12" r="1"></circle>
                        </svg>
                    `.trim();
                }
            }
        }
    }

    document.querySelectorAll('.input-panel').forEach(p => {
        p.classList.toggle('active', p.id === 'panel-' + name);
    });

    if (state.overlayMode === 'icon') {
        const TAB_ICON_MAPPING = {
            url: 'link',
            text: 'text',
            wifi: 'wifi',
            contact: 'contact',
            email: 'email',
            phone: 'phone',
            location: 'map-pin',
            sms: 'sms',
            event: 'event'
        };
        const matchingIcon = TAB_ICON_MAPPING[name];
        if (matchingIcon) {
            setIcon(matchingIcon, false);
        }
    }

    if (generate) scheduleGenerate();
}

function setEcc(level, generate = true) {
    state.ecl = level;
    document.querySelectorAll('#ecc-control .seg-btn').forEach(b => {
        const active = b.dataset.value === level;
        b.classList.toggle('active', active);
        b.setAttribute('aria-pressed', active);
    });
    const descriptions = {
        L: 'L — 7% data recovery capacity',
        M: 'M — 15% data recovery capacity',
        Q: 'Q — 25% data recovery capacity',
        H: 'H — 30% data recovery capacity',
    };
    const helpEl = document.getElementById('ecc-help');
    if (helpEl) {
        helpEl.textContent = descriptions[level];
    }
    if (generate) scheduleGenerate();
}

function setPixelStyle(style, generate = true) {
    state.pixelStyle = style;
    document.querySelectorAll('#pixel-style .seg-btn').forEach(b => {
        const active = b.dataset.value === style;
        b.classList.toggle('active', active);
        b.setAttribute('aria-pressed', active);
    });
    if (generate) scheduleGenerate();
}

function setCornerStyle(style, generate = true) {
    state.cornerStyle = style;
    document.querySelectorAll('#corner-style .seg-btn').forEach(b => {
        const active = b.dataset.value === style;
        b.classList.toggle('active', active);
        b.setAttribute('aria-pressed', active);
    });
    if (generate) scheduleGenerate();
}

function updateCornerRadiusLabel() {
    const slider = document.getElementById('bg-corners-slider');
    if (!slider) return;
    const val = parseInt(slider.value, 10);
    state.cornerRadius = val;
    document.getElementById('bg-corners-label').textContent = `${val}%`;
}

function setExportSize(size) {
    state.exportSize = size;
    const label = document.getElementById('export-size-label');
    if (label) label.textContent = `${size}px`;
    document.querySelectorAll('.size-option').forEach(b => {
        const val = parseInt(b.id.replace('size-opt-', ''), 10);
        b.classList.toggle('active', val === size);
    });
}

let _sizePopoverOpen = false;

function toggleSizePopover(e) {
    e && e.stopPropagation();
    const popover = document.getElementById('size-popover');
    if (!popover) return;
    if (_sizePopoverOpen) {
        closeSizePopover();
    } else {
        openSizePopover();
    }
}

function openSizePopover() {
    const trigger = document.getElementById('export-size-trigger');
    const popover = document.getElementById('size-popover');
    if (!trigger || !popover) return;

    const rect = trigger.getBoundingClientRect();
    // Right-align popover to trigger's right edge; position above trigger
    popover.style.right = `${window.innerWidth - rect.right}px`;
    popover.style.left = 'auto';
    popover.style.top = `${rect.top - 8}px`;
    popover.classList.add('open');

    // After showing, measure and position properly above trigger
    requestAnimationFrame(() => {
        const ph = popover.offsetHeight;
        popover.style.top = `${rect.top - ph - 8}px`;
    });

    _sizePopoverOpen = true;
}

function closeSizePopover() {
    const popover = document.getElementById('size-popover');
    if (!popover) return;
    popover.classList.remove('open');
    _sizePopoverOpen = false;
}

function setSizeFromPopover(size) {
    setExportSize(size);
    closeSizePopover();
}

function updateMarginLabel() {
    const val = document.getElementById('margin-slider').value;
    state.margin = parseInt(val, 10);
    document.getElementById('margin-label').textContent = val;
}

function updateColorHex() {
    // Handled by updateThemeColor directly
}

function randomizeAppearance() {
    // 1. Randomize Color
    shuffleThemeColor();

    // 2. Randomize Pixel Style
    const pixelStyles = ['square', 'rounded', 'dot', 'pill-h', 'pill-v', 'connected'];
    const randomPixel = pixelStyles[Math.floor(Math.random() * pixelStyles.length)];
    setPixelStyle(randomPixel, false);

    // 3. Randomize Corner Markers Style
    const cornerStyles = ['rounded', 'square', 'circle', 'leaf', 'beveled'];
    const randomCorner = cornerStyles[Math.floor(Math.random() * cornerStyles.length)];
    setCornerStyle(randomCorner, false);

    // 4. Randomize Background Corner Radius (0-50)
    const randomRadius = Math.floor(Math.random() * 51);
    state.cornerRadius = randomRadius;
    const bgSlider = document.getElementById('bg-corners-slider');
    if (bgSlider) bgSlider.value = randomRadius;
    updateCornerRadiusLabel();

    // Redraw
    scheduleGenerate();
    showToast('Appearance randomized');
}

function resetAppearance() {
    // 1. Reset color to default white theme
    state.isTransparent = false;
    updateThemeColor('#ffffff');
    positionCursorFromHex('#ffffff');

    // 2. Reset pixel style
    setPixelStyle('square', false);

    // 3. Reset corner style
    setCornerStyle('rounded', false);

    // 4. Reset corner radius (50)
    state.cornerRadius = 50;
    const bgSlider = document.getElementById('bg-corners-slider');
    if (bgSlider) bgSlider.value = 50;
    updateCornerRadiusLabel();

    // 5. Reset margin (2)
    state.margin = 2;
    const marginSlider = document.getElementById('margin-slider');
    if (marginSlider) marginSlider.value = 2;
    updateMarginLabel();

    // 6. Reset logo
    clearLogo();

    // Redraw
    scheduleGenerate();
    showToast('Appearance reset');
}

/* =============================================================
   SECTION 4B: Unified Color Picker & Auto-Contrast
   ============================================================= */

// Hex string (#RRGGBB) to HSL ({h, s, l})
function hexToHsl(hex) {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('');
    }
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        if (max === r) {
            h = (g - b) / d + (g < b ? 6 : 0);
        } else if (max === g) {
            h = (b - r) / d + 2;
        } else if (max === b) {
            h = (r - g) / d + 4;
        }
        h /= 6;
    }
    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100)
    };
}

// HSL to hex string (#RRGGBB)
function hslToHex(h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;
    let r, g, b;
    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    const toHex = x => {
        const hex = Math.round(x * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// RGB to Hex helper
function rgbToHex(r, g, b) {
    const toHex = x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Calculates relative luminance of an sRGB color hex string
function getLuminance(hex) {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('');
    }
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    const a = [r, g, b].map(v => {
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

// Calculates contrast ratio between two relative luminance values
function getContrastRatio(l1, l2) {
    const max = Math.max(l1, l2);
    const min = Math.min(l1, l2);
    return (max + 0.05) / (min + 0.05);
}

// Calculates contrast foreground color tinted with the base color
function getContrastColor(baseColorHex) {
    const { h, s, l } = hexToHsl(baseColorHex);
    if (s === 0) {
        return l >= 50 ? '#000000' : '#ffffff';
    }

    const bgLuminance = getLuminance(baseColorHex);
    const crBlack = (bgLuminance + 0.05) / 0.05;
    const crWhite = 1.05 / (bgLuminance + 0.05);

    if (crBlack >= crWhite) {
        // Dark foreground yields better contrast. Use a highly dark matching shade (4% lightness)
        return hslToHex(h, s, 4);
    } else {
        // Light foreground yields better contrast. Use a highly light matching tint (96% lightness)
        return hslToHex(h, s, 96);
    }
}

// Updates dynamic HSL variable on body for soft background tinting
function updateAppTint(baseColorHex) {
    const { h, s, l } = hexToHsl(baseColorHex);
    const isDarkTheme = document.documentElement.getAttribute('data-theme') === 'dark' ||
        (!document.documentElement.getAttribute('data-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);

    let tintBg;
    if (s === 0) {
        tintBg = isDarkTheme ? '#18181b' : '#f4f4f5';
    } else {
        if (isDarkTheme) {
            tintBg = `hsl(${h}, ${Math.min(s, 24)}%, 11%)`;
        } else {
            tintBg = `hsl(${h}, ${Math.min(s, 24)}%, 94%)`;
        }
    }

    const previewSec = document.querySelector('.preview-section');
    if (previewSec) {
        previewSec.style.setProperty('background-color', tintBg, 'important');
    }
    document.body.style.setProperty('--theme-tint-bg', tintBg);
    document.body.style.setProperty('--theme-base-color', baseColorHex);
}

// Global update for color changes
function updateThemeColor(baseColorHex) {
    state.themeColor = baseColorHex;

    if (state.isTransparent) {
        state.bgColor = 'transparent';
        state.fgColor = baseColorHex;
    } else {
        state.bgColor = baseColorHex;
        state.fgColor = getContrastColor(baseColorHex);
    }

    updateColorTriggerUI();
    scheduleGenerate();
}

// UI Synchronization for color elements
function updateColorTriggerUI() {
    const preview = document.getElementById('color-trigger-preview');
    const hexInput = document.getElementById('color-hex-input');

    if (preview) {
        preview.style.backgroundColor = state.themeColor;
    }
    if (hexInput && document.activeElement !== hexInput) {
        hexInput.value = state.themeColor.toUpperCase();
    }

    // Update background mode buttons
    const btnSolid = document.getElementById('bg-mode-solid');
    const btnTrans = document.getElementById('bg-mode-transparent');
    const transOptions = document.getElementById('transparent-options-row');
    const canvasWrapper = document.getElementById('qr-canvas-wrapper');

    if (btnSolid && btnTrans) {
        btnSolid.classList.toggle('active', !state.isTransparent);
        btnSolid.setAttribute('aria-pressed', (!state.isTransparent).toString());
        btnTrans.classList.toggle('active', state.isTransparent);
        btnTrans.setAttribute('aria-pressed', state.isTransparent.toString());
    }

    if (transOptions) {
        transOptions.style.display = state.isTransparent ? 'flex' : 'none';
    }

    if (canvasWrapper) {
        canvasWrapper.classList.toggle('transparent-bg-active', state.isTransparent);
    }

    if (state.isTransparent) {
        // Highlight active pixel color option
        const pxBlack = document.getElementById('px-color-black');
        const pxWhite = document.getElementById('px-color-white');
        const pxCustom = document.getElementById('px-color-custom');

        const isBlack = state.themeColor.toLowerCase() === '#000000';
        const isWhite = state.themeColor.toLowerCase() === '#ffffff';

        if (pxBlack && pxWhite && pxCustom) {
            pxBlack.classList.toggle('active', isBlack);
            pxBlack.setAttribute('aria-pressed', isBlack.toString());
            pxWhite.classList.toggle('active', isWhite);
            pxWhite.setAttribute('aria-pressed', isWhite.toString());
            pxCustom.classList.toggle('active', !isBlack && !isWhite);
            pxCustom.setAttribute('aria-pressed', (!isBlack && !isWhite).toString());
        }
    }

    updateAppTint(state.themeColor);
}

// Sets background mode (solid vs transparent)
function setBackgroundMode(mode) {
    state.isTransparent = (mode === 'transparent');
    updateThemeColor(state.themeColor);
}

// Sets the pixel color preset when transparent background is active
function setTransparentPixelColor(color) {
    if (color === 'custom') {
        const pxBlack = document.getElementById('px-color-black');
        const pxWhite = document.getElementById('px-color-white');
        const pxCustom = document.getElementById('px-color-custom');
        if (pxBlack && pxWhite && pxCustom) {
            pxBlack.classList.remove('active');
            pxBlack.setAttribute('aria-pressed', 'false');
            pxWhite.classList.remove('active');
            pxWhite.setAttribute('aria-pressed', 'false');
            pxCustom.classList.add('active');
            pxCustom.setAttribute('aria-pressed', 'true');
        }
        return;
    }

    updateThemeColor(color);
    positionCursorFromHex(color);
}

// Curated presets click handler
function selectSwatch(colorHex) {
    updateThemeColor(colorHex);
    positionCursorFromHex(colorHex);
}

// Shuffles theme color randomly
function shuffleThemeColor() {
    const h = Math.floor(Math.random() * 360);
    const s = 75 + Math.floor(Math.random() * 20); // 75% to 95%
    const l = 40 + Math.floor(Math.random() * 25); // 40% to 65%
    const hex = hslToHex(h, s, l);
    updateThemeColor(hex);
    positionCursorFromHex(hex);
}

// Color picker sheet opening/closing
function toggleColorPickerSheet() {
    const sheet = document.getElementById('color-picker-sheet');
    if (!sheet) return;
    const isOpen = sheet.classList.toggle('open');
    if (isOpen) {
        const canvas = document.getElementById('color-spectrum-canvas');
        if (canvas) {
            drawColorPickerCanvas(canvas);
            setTimeout(() => {
                positionCursorFromHex(state.themeColor);
            }, 50);
            initSpectrumEvents(canvas);
        }
    }
}

// Spectrum canvas rendering
function drawColorPickerCanvas(canvas) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const hueGrad = ctx.createLinearGradient(0, 0, width, 0);
    hueGrad.addColorStop(0, '#ff0000');
    hueGrad.addColorStop(0.17, '#ffff00');
    hueGrad.addColorStop(0.33, '#00ff00');
    hueGrad.addColorStop(0.5, '#00ffff');
    hueGrad.addColorStop(0.67, '#0000ff');
    hueGrad.addColorStop(0.83, '#ff00ff');
    hueGrad.addColorStop(1, '#ff0000');

    ctx.fillStyle = hueGrad;
    ctx.fillRect(0, 0, width, height);

    const vGrad = ctx.createLinearGradient(0, 0, 0, height);
    vGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    vGrad.addColorStop(0.15, 'rgba(255, 255, 255, 0)');
    vGrad.addColorStop(0.85, 'rgba(0, 0, 0, 0)');
    vGrad.addColorStop(1, 'rgba(0, 0, 0, 1)');

    ctx.fillStyle = vGrad;
    ctx.fillRect(0, 0, width, height);
}

// Maps hex color back to spectrum coords & moves cursor
function positionCursorFromHex(hex) {
    const { h, s, l } = hexToHsl(hex);
    const canvas = document.getElementById('color-spectrum-canvas');
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return; // avoid division issues if hidden

    const x = (h / 360) * rect.width;
    const y = ((100 - l) / 100) * rect.height;

    const cursor = document.getElementById('spectrum-cursor');
    if (cursor) {
        cursor.style.left = `${x}px`;
        cursor.style.top = `${y}px`;
    }
}

// Interactive event handling on the spectrum canvas
let isDraggingSpectrum = false;

function initSpectrumEvents(canvas) {
    if (canvas.dataset.eventsInitialized) return;
    canvas.dataset.eventsInitialized = 'true';

    const container = canvas.parentElement;

    const handleColorSelect = (e) => {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const x = Math.max(0, Math.min(rect.width - 1, clientX - rect.left));
        const y = Math.max(0, Math.min(rect.height - 1, clientY - rect.top));

        const rawY = clientY - rect.top;
        let hex;
        if (rawY <= 3) {
            hex = '#ffffff';
        } else if (rawY >= rect.height - 3) {
            hex = '#000000';
        } else {
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const ctx = canvas.getContext('2d');
            const imgData = ctx.getImageData(x * scaleX, y * scaleY, 1, 1).data;
            hex = rgbToHex(imgData[0], imgData[1], imgData[2]);
        }

        const cursor = document.getElementById('spectrum-cursor');
        if (cursor) {
            cursor.style.left = `${x}px`;
            cursor.style.top = `${y}px`;
        }

        updateThemeColor(hex);
    };

    container.addEventListener('mousedown', (e) => {
        isDraggingSpectrum = true;
        handleColorSelect(e);
    });

    window.addEventListener('mousemove', (e) => {
        if (isDraggingSpectrum) {
            handleColorSelect(e);
        }
    });

    window.addEventListener('mouseup', () => {
        isDraggingSpectrum = false;
    });

    container.addEventListener('touchstart', (e) => {
        isDraggingSpectrum = true;
        handleColorSelect(e);
        e.preventDefault();
    }, { passive: false });

    container.addEventListener('touchmove', (e) => {
        if (isDraggingSpectrum) {
            handleColorSelect(e);
            e.preventDefault();
        }
    }, { passive: false });

    container.addEventListener('touchend', () => {
        isDraggingSpectrum = false;
    });
}

function togglePasswordVisibility() {
    const input = document.getElementById('input-wifi-key');
    const btn = document.getElementById('password-toggle-btn');
    const showing = input.classList.contains('masked-input');
    if (showing) {
        input.classList.remove('masked-input');
    } else {
        input.classList.add('masked-input');
    }
    btn.querySelector('.eye-icon').style.display = showing ? 'none' : '';
    btn.querySelector('.eye-off-icon').style.display = showing ? '' : 'none';
}

/* =============================================================
   Logo Features & Handlers
   ============================================================= */

function triggerLogoInput() {
    document.getElementById('logo-input').click();
}

function handleLogoFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        handleLogoFile(file);
    }
    event.target.value = '';
}

function handleLogoFile(file) {
    if (!file.type.startsWith('image/')) {
        showToast('Please select an image file (PNG, JPG, SVG, AVIF, etc.)');
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        showToast('Image size exceeds 5MB limit.');
        return;
    }

    setCloudinaryStatus('uploading');

    resizeImage(file, 512).then(optimizedFile => {
        const reader = new FileReader();
        reader.onload = (e) => {
            state.logoDataUrl = e.target.result;

            const img = new Image();
            img.onload = () => {
                logoImage = img;

                updateLogoControlsUI(file.name);
                scheduleGenerate();

                uploadLogoToCloudinary(optimizedFile);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(optimizedFile);
    }).catch(err => {
        console.warn('Image optimization failed:', err);
        showToast('Failed to process image.');
        setCloudinaryStatus('error');
    });
}

async function resizeImage(file, maxSize) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        const timeout = setTimeout(() => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Image processing timed out.'));
        }, 10000);

        img.onload = () => {
            clearTimeout(timeout);
            let width = img.width;
            let height = img.height;

            if (width <= maxSize && height <= maxSize) {
                URL.revokeObjectURL(objectUrl);
                resolve(file);
                return;
            }

            if (width > height) {
                height = Math.round((height * maxSize) / width);
                width = maxSize;
            } else {
                width = Math.round((width * maxSize) / height);
                height = maxSize;
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);
            URL.revokeObjectURL(objectUrl);

            const mimeType = file.type || 'image/jpeg';
            canvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error('Image optimization failed.'));
                    return;
                }
                const resizedFile = new File([blob], file.name, {
                    type: mimeType,
                    lastModified: Date.now()
                });
                resolve(resizedFile);
            }, mimeType);
        };

        img.onerror = () => {
            clearTimeout(timeout);
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Failed to load image.'));
        };

        img.src = objectUrl;
    });
}

async function uploadLogoToCloudinary(file) {
    try {
        const fileHash = await getFileHash(file);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'qrMaker');
        formData.append('public_id', fileHash);
        formData.append('folder', 'User Uploads - QR Maker');

        const response = await fetch('https://api.cloudinary.com/v1_1/rm20abcd26/image/upload', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            let errorData;
            try { errorData = await response.json(); } catch (e) { errorData = {}; }
            if (errorData.error && errorData.error.message && errorData.error.message.includes('already exists')) {
                const ext = file.name.split('.').pop() || 'png';
                state.logoUrl = `https://res.cloudinary.com/rm20abcd26/image/upload/v1/User%20Uploads%20-%20QR%20Maker/${fileHash}.${ext}`;
                setCloudinaryStatus('success');
                return;
            }
            throw new Error('Cloud storage error.');
        }

        const data = await response.json();
        state.logoUrl = data.secure_url;
        setCloudinaryStatus('success');
    } catch (err) {
        console.warn('Cloudinary upload failed, staying with local copy:', err);
        setCloudinaryStatus('error');
    }
}

async function getFileHash(file) {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-1', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function setCloudinaryStatus(status) {
    const el = document.getElementById('logo-upload-status');
    if (!el) return;
    el.className = 'logo-status ' + status;
    if (status === 'uploading') {
        el.textContent = 'Uploading to cloud…';
    } else if (status === 'success') {
        el.textContent = 'Saved to cloud';
    } else if (status === 'error') {
        el.textContent = 'Local preview only';
    } else {
        el.textContent = 'Local preview';
    }
}

function clearLogo() {
    state.logoUrl = '';
    state.logoDataUrl = '';
    logoImage = null;
    document.getElementById('logo-input').value = '';

    document.getElementById('logo-dropzone').style.display = 'flex';
    document.getElementById('logo-preview-wrapper').style.display = 'none';
    document.getElementById('logo-controls').style.display = 'none';

    scheduleGenerate();
}

function setLogoCardShape(shape) {
    state.logoCardShape = shape;
    document.querySelectorAll('#logo-shape .seg-btn').forEach(b => {
        const active = b.dataset.value === shape;
        b.classList.toggle('active', active);
        b.setAttribute('aria-pressed', active);
    });
    scheduleGenerate();
}

function updateLogoSizeLabel() {
    const slider = document.getElementById('logo-size-slider');
    if (!slider) return;
    const val = parseInt(slider.value, 10);
    state.logoSize = val;
    document.getElementById('logo-size-label').textContent = val + '%';
}

function updateLogoControlsUI(filename) {
    document.getElementById('logo-dropzone').style.display = 'none';

    const wrapper = document.getElementById('logo-preview-wrapper');
    wrapper.style.display = 'flex';

    const thumb = document.getElementById('logo-preview-thumbnail');
    thumb.src = state.logoDataUrl || state.logoUrl;

    document.getElementById('logo-preview-filename').textContent = filename || 'logo.png';

    if (state.logoUrl && !state.logoUrl.startsWith('data:')) {
        setCloudinaryStatus('success');
    } else {
        setCloudinaryStatus('local');
    }

    document.getElementById('logo-controls').style.display = 'flex';

    const slider = document.getElementById('logo-size-slider');
    slider.value = state.logoSize;
    document.getElementById('logo-size-label').textContent = state.logoSize + '%';

    const clearBehind = document.getElementById('logo-clear-behind');
    clearBehind.checked = state.logoClearBehind;

    setLogoCardShape(state.logoCardShape);
}

function getFilenameFromUrl(url) {
    if (!url) return '';
    try {
        const parts = url.split('/');
        return parts[parts.length - 1];
    } catch (e) {
        return 'logo.png';
    }
}

/* =============================================================
   SECTION 7: Theme
   ============================================================= */

let themeStatusTimeout;
const themeStatus = document.getElementById('theme-status');

function showThemeStatus(text) {
    if (!themeStatus) return;
    themeStatus.textContent = text;
    themeStatus.classList.add('visible');
    clearTimeout(themeStatusTimeout);
    themeStatusTimeout = setTimeout(() => {
        themeStatus.classList.remove('visible');
    }, 2000);
}

function cycleTheme() {
    triggerHaptic();
    const current = localStorage.getItem('qrm-theme') || 'dark';
    let next;
    let statusText;

    if (current === 'dark') {
        next = 'light';
        statusText = 'Light Theme';
    } else if (current === 'light') {
        next = 'system';
        statusText = 'System Theme';
    } else {
        next = 'dark';
        statusText = 'Dark Theme';
    }

    if (next === 'system') {
        document.documentElement.removeAttribute('data-theme');
    } else {
        document.documentElement.setAttribute('data-theme', next);
    }

    localStorage.setItem('qrm-theme', next);
    updateAppTint(state.themeColor);
    showThemeStatus(statusText);
}

document.getElementById('theme-toggle').addEventListener('click', cycleTheme);

/* =============================================================
   SECTION 8: Toast
   ============================================================= */

let toastTimer = null;
function showToast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2500);
}

/* =============================================================
   SECTION 9: Close share menu on outside click
   ============================================================= */

document.addEventListener('click', (e) => {
    // Close share menu
    const menu = document.getElementById('share-menu');
    if (menu && !menu.contains(e.target) && !e.target.closest('#share-btn')) {
        menu.classList.remove('open');
    }

    // Close color picker
    const picker = document.getElementById('color-picker-sheet');
    const trigger = document.getElementById('color-trigger-btn');
    if (picker && picker.classList.contains('open')) {
        if (!picker.contains(e.target) && !trigger.contains(e.target)) {
            picker.classList.remove('open');
        }
    }

    // Close tab dropdown
    const tabDropdown = document.getElementById('tab-dropdown');
    const tabMoreContainer = document.getElementById('tab-more-container');
    if (tabDropdown && tabDropdown.classList.contains('open')) {
        if (tabMoreContainer && !tabMoreContainer.contains(e.target)) {
            tabDropdown.classList.remove('open');
            const moreBtn = document.getElementById('tab-more');
            if (moreBtn) moreBtn.setAttribute('aria-expanded', 'false');
        }
    }

    // Close size popover
    if (_sizePopoverOpen) {
        const sizePopover = document.getElementById('size-popover');
        const sizeTrigger = document.getElementById('export-size-trigger');
        if (sizePopover && !sizePopover.contains(e.target) && !sizeTrigger.contains(e.target)) {
            closeSizePopover();
        }
    }
});

function toggleTabDropdown(event) {
    if (event) event.stopPropagation();
    const dropdown = document.getElementById('tab-dropdown');
    if (dropdown) {
        const isOpen = dropdown.classList.contains('open');
        dropdown.classList.toggle('open', !isOpen);
        const trigger = document.getElementById('tab-more');
        if (trigger) trigger.setAttribute('aria-expanded', !isOpen ? 'true' : 'false');
    }
}

function selectDropdownTab(name, event) {
    if (event) event.stopPropagation();
    switchTab(name);
    const dropdown = document.getElementById('tab-dropdown');
    if (dropdown) {
        dropdown.classList.remove('open');
        const trigger = document.getElementById('tab-more');
        if (trigger) trigger.setAttribute('aria-expanded', 'false');
    }
}

/* =============================================================
   SECTION 10: Init
   ============================================================= */

// Ensure UTF-8 byte mode is used for all text
qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];

// Set up Drag & Drop for Logo upload
const dropzone = document.getElementById('logo-dropzone');
if (dropzone) {
    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.add('dragover');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.remove('dragover');
        }, false);
    });

    dropzone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const file = dt.files[0];
        if (file) {
            handleLogoFile(file);
        }
    }, false);
}

loadFromURL();

// Hex Input and Trigger Button Events
const hexInput = document.getElementById('color-hex-input');
const triggerBtn = document.getElementById('color-trigger-btn');

function openColorPickerSheet() {
    const sheet = document.getElementById('color-picker-sheet');
    if (sheet && !sheet.classList.contains('open')) {
        toggleColorPickerSheet();
    }
}

if (hexInput) {
    hexInput.addEventListener('input', (e) => {
        let val = e.target.value.trim();
        if (val && !val.startsWith('#')) {
            val = '#' + val;
            e.target.value = val;
        }

        if (/^#[0-9A-F]{6}$/i.test(val)) {
            updateThemeColor(val);
            positionCursorFromHex(val);
        } else if (/^#[0-9A-F]{3}$/i.test(val)) {
            const expanded = '#' + val[1] + val[1] + val[2] + val[2] + val[3] + val[3];
            updateThemeColor(expanded);
            positionCursorFromHex(expanded);
        }
    });

    hexInput.addEventListener('blur', (e) => {
        let val = e.target.value.trim();
        if (!val.startsWith('#')) {
            val = '#' + val;
        }
        if (!/^#[0-9A-F]{6}$/i.test(val) && !/^#[0-9A-F]{3}$/i.test(val)) {
            e.target.value = state.themeColor.toUpperCase();
        } else {
            e.target.value = state.themeColor.toUpperCase();
        }
    });

    hexInput.addEventListener('focus', () => {
        openColorPickerSheet();
    });

    hexInput.addEventListener('click', (e) => {
        e.stopPropagation();
        openColorPickerSheet();
    });
}

if (triggerBtn && hexInput) {
    triggerBtn.addEventListener('click', (e) => {
        if (e.target !== hexInput && e.target !== document.getElementById('color-trigger-preview')) {
            hexInput.focus();
            openColorPickerSheet();
        }
    });
}

function getUserLocation() {
    const errorEl = document.getElementById('geo-error');
    const detectBtn = document.getElementById('geo-detect-btn');
    if (!navigator.geolocation) {
        if (errorEl) {
            errorEl.textContent = 'Geolocation is not supported by your browser.';
            errorEl.style.display = 'block';
        }
        return;
    }
    if (detectBtn) {
        detectBtn.disabled = true;
        detectBtn.innerHTML = `
            <svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" fill="none" class="spin">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="22" y1="12" x2="18" y2="12"></line>
                <line x1="6" y1="12" x2="2" y2="12"></line>
                <line x1="12" y1="6" x2="12" y2="2"></line>
                <line x1="12" y1="22" x2="12" y2="18"></line>
            </svg>
            Locating…
        `;
    }
    if (errorEl) {
        errorEl.style.display = 'none';
    }
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            document.getElementById('input-geo-lat').value = lat.toFixed(6);
            document.getElementById('input-geo-lng').value = lng.toFixed(6);
            if (detectBtn) {
                detectBtn.disabled = false;
                detectBtn.innerHTML = `
                    <svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" fill="none">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="22" y1="12" x2="18" y2="12"></line>
                        <line x1="6" y1="12" x2="2" y2="12"></line>
                        <line x1="12" y1="6" x2="12" y2="2"></line>
                        <line x1="12" y1="22" x2="12" y2="18"></line>
                    </svg>
                    Use Current Location
                `;
            }
            scheduleGenerate();
        },
        (error) => {
            let msg = 'Unable to retrieve location.';
            if (error.code === error.PERMISSION_DENIED) {
                msg = 'Location access denied.';
            } else if (error.code === error.POSITION_UNAVAILABLE) {
                msg = 'Location info unavailable.';
            } else if (error.code === error.TIMEOUT) {
                msg = 'Location request timed out.';
            }
            if (errorEl) {
                errorEl.textContent = msg;
                errorEl.style.display = 'block';
            }
            if (detectBtn) {
                detectBtn.disabled = false;
                detectBtn.innerHTML = `
                    <svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" fill="none">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="22" y1="12" x2="18" y2="12"></line>
                        <line x1="6" y1="12" x2="2" y2="12"></line>
                        <line x1="12" y1="6" x2="12" y2="2"></line>
                        <line x1="12" y1="22" x2="12" y2="18"></line>
                    </svg>
                    Use Current Location
                `;
            }
        },
        { timeout: 10000 }
    );
}

/* =============================================================
   SECTION 14: Predefined Icons Control Logic
   ============================================================= */

function initIconSelector() {
    const grid = document.getElementById('icon-selector-grid');
    if (!grid) return;

    grid.innerHTML = '';

    // // Add "none" button
    // const noneBtn = document.createElement('button');
    // noneBtn.type = 'button';
    // noneBtn.className = 'icon-select-btn active';
    // noneBtn.id = 'icon-btn-none';
    // noneBtn.title = 'No Icon';
    // noneBtn.onclick = () => setIcon('none');
    // noneBtn.innerHTML = `
    //     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    //         <line x1="18" y1="6" x2="6" y2="18"></line>
    //         <line x1="6" y1="6" x2="18" y2="18"></line>
    //     </svg>
    // `;
    // grid.appendChild(noneBtn);

    // Add predefined icons
    for (const [key, iconCfg] of Object.entries(PREDEFINED_ICONS)) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'icon-select-btn';
        btn.id = `icon-btn-${key}`;
        btn.title = key.toUpperCase();
        btn.onclick = () => setIcon(key);

        let svgHtml = `<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">`;
        if (iconCfg.type === 'stroke') {
            for (const p of iconCfg.paths) {
                svgHtml += `<path d="${p}" fill="none"/>`;
            }
        } else if (iconCfg.type === 'fill') {
            for (const p of iconCfg.paths) {
                svgHtml += `<path d="${p}" fill="currentColor" stroke="none"/>`;
            }
        } else if (iconCfg.type === 'mixed') {
            for (const p of iconCfg.paths) {
                if (p.type === 'stroke') {
                    svgHtml += `<path d="${p.d}" fill="none"/>`;
                } else if (p.type === 'fill') {
                    svgHtml += `<path d="${p.d}" fill="currentColor" stroke="none"/>`;
                }
            }
        }
        svgHtml += `</svg>`;
        btn.innerHTML = svgHtml;
        grid.appendChild(btn);
    }

    // Add custom emoji button
    const emojiBtn = document.createElement('button');
    emojiBtn.type = 'button';
    emojiBtn.className = 'icon-select-btn';
    emojiBtn.id = 'icon-btn-emoji';
    emojiBtn.title = 'CUSTOM EMOJI';
    emojiBtn.onclick = () => selectCustomEmojiMode();
    emojiBtn.innerHTML = '<span>😃</span>';
    grid.appendChild(emojiBtn);

    // Set initial icon color hex text fields
    const hexInput = document.getElementById('icon-color-hex');
    if (hexInput) hexInput.value = state.iconColor;
    const colorBtn = document.getElementById('icon-color-btn');
    if (colorBtn) colorBtn.style.backgroundColor = state.iconColor;
}

function setOverlayMode(mode, generate = true) {
    state.overlayMode = mode;

    // Toggle segmented control active states
    document.querySelectorAll('#overlay-mode .seg-btn').forEach(btn => {
        const active = btn.getAttribute('data-value') === mode;
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    // Show/hide sub-sections
    const iconContainer = document.getElementById('icon-controls-container');
    const logoContainer = document.getElementById('logo-controls-container');
    if (iconContainer) iconContainer.style.display = mode === 'icon' ? 'flex' : 'none';
    if (logoContainer) logoContainer.style.display = mode === 'logo' ? 'flex' : 'none';

    if (mode === 'icon' && state.icon === 'none') {
        const TAB_ICON_MAPPING = {
            url: 'link',
            text: 'text',
            wifi: 'wifi',
            contact: 'contact',
            email: 'email',
            phone: 'phone',
            location: 'map-pin',
            sms: 'sms',
            event: 'event'
        };
        const matchingIcon = TAB_ICON_MAPPING[state.activeTab];
        if (matchingIcon) {
            setIcon(matchingIcon, false);
        }
    }

    // Upgrade error correction level automatically if mode is active to protect modules
    if (generate) {
        if ((mode === 'icon' && state.icon !== 'none') || (mode === 'logo' && logoImage)) {
            if (state.ecl !== 'H') {
                const requiredEcl = (mode === 'icon' ? state.iconSize : state.logoSize) > 22 ? 'H' : 'Q';
                setEcc(requiredEcl, false);
            }
        }
        scheduleGenerate();
    }
}

function setIcon(name, generate = true) {
    state.icon = name;
    const isPredefined = PREDEFINED_ICONS[name] || name === 'none';

    // Toggle active class in grid selector
    document.querySelectorAll('.icon-select-btn').forEach(btn => {
        const active = isPredefined ? btn.id === `icon-btn-${name}` : btn.id === 'icon-btn-emoji';
        btn.classList.toggle('active', active);
    });

    // Toggle emoji input container visibility
    const container = document.getElementById('emoji-input-container');
    if (container) {
        container.style.display = !isPredefined ? 'flex' : 'none';
    }

    if (generate) {
        if (name !== 'none' && state.ecl !== 'H') {
            const requiredEcl = state.iconSize > 22 ? 'H' : 'Q';
            setEcc(requiredEcl, false);
        }
        scheduleGenerate();
    }
}

function selectCustomEmojiMode() {
    console.log("selectCustomEmojiMode called");
    const container = document.getElementById('emoji-input-container');
    console.log("emoji-input-container found:", container);
    if (container) container.style.display = 'flex';
    const input = document.getElementById('custom-emoji-input');
    console.log("custom-emoji-input found:", input);
    if (input) {
        input.focus();
        const currentEmoji = (state.icon && !PREDEFINED_ICONS[state.icon] && state.icon !== 'none') ? state.icon : '😃';
        input.value = currentEmoji;
        setIcon(currentEmoji);
    }
}

function handleCustomEmojiInput(val) {
    console.log("handleCustomEmojiInput called with:", val);
    // Array.from supports multi-byte Unicode/ZWJ emojis correctly
    const chars = Array.from(val);
    const emoji = chars.slice(0, 10).join('');
    const input = document.getElementById('custom-emoji-input');
    if (input) input.value = emoji;
    if (emoji) {
        setIcon(emoji);
    }
}

function applySuggestionEmoji(emoji) {
    console.log("applySuggestionEmoji called with:", emoji);
    const input = document.getElementById('custom-emoji-input');
    if (input) {
        input.value = emoji;
    }
    setIcon(emoji);
}

// Explicitly expose to global scope for HTML event handlers
window.selectCustomEmojiMode = selectCustomEmojiMode;
window.handleCustomEmojiInput = handleCustomEmojiInput;
window.applySuggestionEmoji = applySuggestionEmoji;

function setIconCardShape(shape, generate = true) {
    state.iconCardShape = shape;

    document.querySelectorAll('#icon-shape .seg-btn').forEach(btn => {
        const active = btn.getAttribute('data-value') === shape;
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    if (generate) scheduleGenerate();
}

function updateIconSizeLabel() {
    const val = document.getElementById('icon-size-slider').value;
    state.iconSize = parseInt(val, 10);
    document.getElementById('icon-size-label').textContent = val + '%';
}

function triggerIconColorPicker() {
    const picker = document.getElementById('icon-color-picker');
    if (picker) picker.click();
}

function handleIconColorPickerInput(val) {
    state.iconColor = val;
    updateIconColorUI(val);
    scheduleGenerate();
}

function updateIconColorUI(hex) {
    const hexInput = document.getElementById('icon-color-hex');
    if (hexInput) hexInput.value = hex.toUpperCase();
    const colorBtn = document.getElementById('icon-color-btn');
    if (colorBtn) colorBtn.style.backgroundColor = hex;
}

function handleIconColorHexInput(val) {
    let cleanHex = val.trim();
    if (!cleanHex.startsWith('#')) {
        cleanHex = '#' + cleanHex;
    }

    // Validate hex format
    const isValid = /^#[0-9A-F]{6}$/i.test(cleanHex) || /^#[0-9A-F]{3}$/i.test(cleanHex);
    if (isValid) {
        state.iconColor = cleanHex;
        const colorBtn = document.getElementById('icon-color-btn');
        if (colorBtn) colorBtn.style.backgroundColor = cleanHex;
        const picker = document.getElementById('icon-color-picker');
        if (picker) picker.value = cleanHex;
        scheduleGenerate();
    }
}

function matchIconColorToFg() {
    const fg = state.fgColor;
    state.iconColor = fg;
    updateIconColorUI(fg);
    const picker = document.getElementById('icon-color-picker');
    if (picker) picker.value = fg;
    scheduleGenerate();
}

// Force prevent autofill on all input, textarea, and select elements
function forceDisableAutofill() {
    document.querySelectorAll('input, textarea, select').forEach(el => {
        if (el.type === 'password') {
            el.setAttribute('autocomplete', 'one-time-code');
        } else {
            el.setAttribute('autocomplete', 'off');
        }
    });
}

// Initialize Predefined Icons grid and default state
initIconSelector();
forceDisableAutofill();
scheduleGenerate();

// PWA Variables & Initialization Logic
let deferredPrompt;
let desktopPromptType = '';
let suppressHaptic = false;

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then((reg) => {
                    console.log('[Service Worker] Registered successfully:', reg.scope);
                })
                .catch((err) => {
                    console.error('[Service Worker] Registration failed:', err);
                });
        });
    }
}

function positionIosPrompt() {
    const prompt = document.getElementById('ios-pwa-prompt');
    if (!prompt) return;

    // Check if we are in the single-column mobile layout
    const isSingleColumnMobile = window.innerWidth <= 960 && !window.matchMedia('(orientation: landscape) and (max-height: 500px)').matches;
    const controlsSections = document.querySelectorAll('.controls-section');
    const lastControlsSection = controlsSections[controlsSections.length - 1];

    if (isSingleColumnMobile) {
        // On single-column mobile, sit below the main container as a separate stacked panel
        if (prompt.parentElement !== document.body) {
            document.body.appendChild(prompt);
        }
    } else {
        // On tablet/iPad/desktop/landscape mobile, sit at the very end of the last controls sidebar
        if (lastControlsSection && prompt.parentElement !== lastControlsSection) {
            lastControlsSection.appendChild(prompt);
        }
    }
}

function initIosPwaPrompt() {
    // Detect iOS / iPadOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && (
            navigator.maxTouchPoints > 0 ||
            'ontouchstart' in window ||
            window.matchMedia('(pointer: coarse)').matches ||
            ((window.innerWidth === 1133 && window.innerHeight === 744) || (window.innerWidth === 744 && window.innerHeight === 1133)) || // iPad mini 6
            ((window.innerWidth === 1024 && window.innerHeight === 768) || (window.innerWidth === 768 && window.innerHeight === 1024)) || // iPad 1-9
            ((window.innerWidth === 1180 && window.innerHeight === 820) || (window.innerWidth === 820 && window.innerHeight === 1180)) || // iPad Air / iPad 10
            ((window.innerWidth === 1194 && window.innerHeight === 834) || (window.innerWidth === 834 && window.innerHeight === 1194)) || // iPad Pro 11
            ((window.innerWidth === 1366 && window.innerHeight === 1024) || (window.innerWidth === 1024 && window.innerHeight === 1366))  // iPad Pro 12.9
        ));

    // Detect Standalone Mode
    const isStandalone = window.navigator.standalone === true ||
        window.matchMedia('(display-mode: standalone)').matches;

    if (isIOS && !isStandalone) {
        positionIosPrompt();

        const prompt = document.getElementById('ios-pwa-prompt');
        if (prompt) {
            prompt.classList.add('collapsed');
            prompt.classList.add('visible');
        }

        window.addEventListener('resize', positionIosPrompt);
    }
}

function expandIosPrompt(e) {
    if (e) {
        e.stopPropagation();
        e.preventDefault();
    }
    triggerHaptic();
    const prompt = document.getElementById('ios-pwa-prompt');
    if (prompt) {
        prompt.classList.remove('collapsed');
    }
}

function collapseIosPrompt(e) {
    if (e) {
        e.stopPropagation();
        e.preventDefault();
    }
    triggerHaptic();
    const prompt = document.getElementById('ios-pwa-prompt');
    if (prompt) {
        prompt.classList.add('collapsed');
    }
}

function triggerHaptic() {
    if (suppressHaptic) return;

    if ('vibrate' in navigator) {
        try {
            navigator.vibrate(12);
        } catch (e) {
            // Silently absorb
        }
    }
}

window.collapseIosPrompt = collapseIosPrompt;
window.expandIosPrompt = expandIosPrompt;
window.triggerHaptic = triggerHaptic;

// Desktop PWA Helper Functions
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    initDesktopPwaPrompt('chromium');
});

window.addEventListener('appinstalled', (e) => {
    console.log('[PWA] Installed successfully');
    deferredPrompt = null;
    const prompt = document.getElementById('desktop-pwa-prompt');
    if (prompt) prompt.classList.remove('visible');
});

function positionDesktopPrompt() {
    const prompt = document.getElementById('desktop-pwa-prompt');
    if (!prompt) return;

    const isSingleColumnMobile = window.innerWidth <= 960 && !window.matchMedia('(orientation: landscape) and (max-height: 500px)').matches;
    const lastControlsSection = document.querySelector('.controls-section');

    if (isSingleColumnMobile) {
        if (prompt.parentElement !== document.body) {
            document.body.appendChild(prompt);
        }
    } else {
        if (lastControlsSection && prompt.parentElement !== lastControlsSection) {
            lastControlsSection.appendChild(prompt);
        }
    }
}

function initDesktopPwaPrompt(forcedType) {
    if (localStorage.getItem('qrmaker_desktop_prompt_dismissed') === 'true') {
        return;
    }

    const isStandalone = window.navigator.standalone === true ||
        window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) return;

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && (
            navigator.maxTouchPoints > 0 ||
            'ontouchstart' in window ||
            window.matchMedia('(pointer: coarse)').matches ||
            ((window.innerWidth === 1133 && window.innerHeight === 744) || (window.innerWidth === 744 && window.innerHeight === 1133)) ||
            ((window.innerWidth === 1024 && window.innerHeight === 768) || (window.innerWidth === 768 && window.innerHeight === 1024)) ||
            ((window.innerWidth === 1180 && window.innerHeight === 820) || (window.innerWidth === 820 && window.innerHeight === 1180)) ||
            ((window.innerWidth === 1194 && window.innerHeight === 834) || (window.innerWidth === 834 && window.innerHeight === 1194)) ||
            ((window.innerWidth === 1366 && window.innerHeight === 1024) || (window.innerWidth === 1024 && window.innerHeight === 1366))
        ));
    if (isIOS) return;

    const isMac = /Macintosh|Mac OS X/.test(navigator.userAgent);
    const isMacSafari = isMac && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    let type = forcedType;
    if (!type) {
        if (isMacSafari) {
            type = 'safari';
        } else if (deferredPrompt) {
            type = 'chromium';
        } else {
            return;
        }
    }

    desktopPromptType = type;
    positionDesktopPrompt();

    const subtitle = document.getElementById('desktop-prompt-subtitle');
    const actionBtn = document.getElementById('desktop-prompt-action-btn');
    const instructionsText = document.getElementById('desktop-prompt-instructions-text');
    const stepsContainer = document.getElementById('desktop-prompt-steps-container');

    if (type === 'safari') {
        if (subtitle) subtitle.textContent = 'Add to Dock (Mac)';
        if (actionBtn) {
            actionBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="btn-icon-svg"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                Install
            `;
        }
        if (instructionsText) instructionsText.textContent = 'Install this web app on your device to generate QR codes in full screen, use high-fidelity exports, and work offline.';
        if (stepsContainer) {
            stepsContainer.innerHTML = `
                <div class="desktop-prompt-step">
                    <div class="desktop-prompt-step-num">1</div>
                    <div class="desktop-prompt-step-text">
                        Open the <strong>File</strong> menu in Safari's top menu bar.
                    </div>
                </div>
                <div class="desktop-prompt-step">
                    <div class="desktop-prompt-step-num">2</div>
                    <div class="desktop-prompt-step-text">
                        Select <span class="ios-action-text">Add to Dock...</span>.
                    </div>
                </div>
            `;
        }
    } else if (type === 'chromium') {
        if (subtitle) subtitle.textContent = 'Install Desktop App';
        if (actionBtn) {
            actionBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="btn-icon-svg"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                Install
            `;
        }
        if (instructionsText) instructionsText.textContent = 'Install this web app on your device to generate QR codes in full screen, use high-fidelity exports, and work offline.';
        if (stepsContainer) {
            stepsContainer.innerHTML = `
                <div class="desktop-prompt-step">
                    <div class="desktop-prompt-step-num">✓</div>
                    <div class="desktop-prompt-step-text">
                        Runs in a standalone window, freeing up your browser tab space.
                    </div>
                </div>
                <div class="desktop-prompt-step">
                    <div class="desktop-prompt-step-num">✓</div>
                    <div class="desktop-prompt-step-text">
                        Launches instantly from your Dock or desktop shortcut.
                    </div>
                </div>
                <button class="desktop-prompt-install-btn" style="width: 100%; justify-content: center; margin-top: 0.5rem;" onclick="handleDesktopInstallAction(event)">
                    Install Now
                </button>
            `;
        }
    }

    const prompt = document.getElementById('desktop-pwa-prompt');
    if (prompt) {
        prompt.classList.add('collapsed');
        prompt.classList.add('visible');
    }

    window.addEventListener('resize', positionDesktopPrompt);
}

function expandDesktopPrompt(e) {
    if (e) {
        e.stopPropagation();
        e.preventDefault();
    }
    triggerHaptic();
    const prompt = document.getElementById('desktop-pwa-prompt');
    if (prompt) {
        prompt.classList.remove('collapsed');
    }
}

function collapseDesktopPrompt(e) {
    if (e) {
        e.stopPropagation();
        e.preventDefault();
    }
    triggerHaptic();
    const prompt = document.getElementById('desktop-pwa-prompt');
    if (prompt) {
        if (prompt.classList.contains('collapsed')) {
            dismissDesktopPrompt();
        } else {
            prompt.classList.add('collapsed');
        }
    }
}

function dismissDesktopPrompt() {
    const prompt = document.getElementById('desktop-pwa-prompt');
    if (prompt) {
        prompt.classList.remove('visible');
    }
    localStorage.setItem('qrmaker_desktop_prompt_dismissed', 'true');
}

async function handleDesktopInstallAction(e) {
    if (e) {
        e.stopPropagation();
        e.preventDefault();
    }
    triggerHaptic();

    if (desktopPromptType === 'chromium' && deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log('[PWA] Programmatic install choice outcome:', outcome);
        deferredPrompt = null;

        const prompt = document.getElementById('desktop-pwa-prompt');
        if (prompt) prompt.classList.remove('visible');
    } else {
        expandDesktopPrompt();
    }
}

window.collapseDesktopPrompt = collapseDesktopPrompt;
window.expandDesktopPrompt = expandDesktopPrompt;
window.handleDesktopInstallAction = handleDesktopInstallAction;

// Register PWA elements on load
registerServiceWorker();
initIosPwaPrompt();
// Check for Safari Desktop PWA support (macOS Sonoma+)
initDesktopPwaPrompt();

// Mobile scroll handler to collapse preview header
function handleMobileScroll() {
    if (window.innerWidth <= 960) {
        if (window.scrollY > 10) {
            if (!document.body.classList.contains('scrolled')) {
                document.body.classList.add('scrolled');
                if (typeof closeSizePopover === 'function') {
                    closeSizePopover();
                }
            }
        } else {
            document.body.classList.remove('scrolled');
        }
    } else {
        document.body.classList.remove('scrolled');
    }
}
window.addEventListener('scroll', handleMobileScroll, { passive: true });
window.addEventListener('resize', handleMobileScroll, { passive: true });
handleMobileScroll();

