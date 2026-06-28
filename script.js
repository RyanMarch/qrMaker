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
    bgCorners: 0,
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
        const pass = document.getElementById('input-wifi-pass').value;
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
        const bgR = totalPx * 0.25 * (state.bgCorners / 100);
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
    if (logoImage) {
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
    if (logoImage) {
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
    }

    const bgRSvg = size * 0.25 * (state.bgCorners / 100);
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
    url.searchParams.set('bgc', state.bgCorners);
    url.searchParams.set('fg', state.fgColor.replace('#', ''));
    url.searchParams.set('bg', state.bgColor.replace('#', ''));
    url.searchParams.set('margin', state.margin);
    if (state.logoUrl) {
        url.searchParams.set('logo', state.logoUrl);
        url.searchParams.set('logosz', state.logoSize);
        url.searchParams.set('logocb', state.logoClearBehind ? '1' : '0');
        url.searchParams.set('logocs', state.logoCardShape);
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
            state.bgCorners = bgc;
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
    updateBgCornersLabel();
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

function updateBgCornersLabel() {
    const slider = document.getElementById('bg-corners-slider');
    if (!slider) return;
    const val = parseInt(slider.value, 10);
    state.bgCorners = val;
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
    state.bgCorners = randomRadius;
    const bgSlider = document.getElementById('bg-corners-slider');
    if (bgSlider) bgSlider.value = randomRadius;
    updateBgCornersLabel();
    
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
    state.bgCorners = 50;
    const bgSlider = document.getElementById('bg-corners-slider');
    if (bgSlider) bgSlider.value = 50;
    updateBgCornersLabel();
    
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
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
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
        tintBg = isDarkTheme ? '#0b0f19' : '#f1f5f9';
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
    const input = document.getElementById('input-wifi-pass');
    const btn = document.getElementById('password-toggle-btn');
    const showing = input.type === 'text';
    input.type = showing ? 'password' : 'text';
    btn.querySelector('.eye-icon').style.display = showing ? '' : 'none';
    btn.querySelector('.eye-off-icon').style.display = showing ? 'none' : '';
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
            URL.revokeObjectURL(objectUrl);
            let width = img.width;
            let height = img.height;

            if (width <= maxSize && height <= maxSize) {
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

function cycleTheme() {
    const current = document.documentElement.getAttribute('data-theme') ||
        (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('qrm-theme', next);
    updateAppTint(state.themeColor);
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

scheduleGenerate();
