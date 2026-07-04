/* ============================================================
   File 2: qr-core.js
   Handles QR generation, content mapping, and canvas rendering
   ============================================================ */
"use strict";

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

function scheduleGenerate() {
    clearTimeout(generateTimer);
    generateTimer = setTimeout(generateQR, 100);
}

function generateQR() {
    const userContent = getQrContent();
    const content = userContent || DEFAULT_QR_CONTENT;
    const canvas = document.getElementById('qr-canvas');
    const placeholder = document.getElementById('qr-placeholder');
    const errorMsg = document.getElementById('qr-error-msg');

    if (!canvas || !placeholder || !errorMsg) return;

    try {
        let ecl = state.ecl;
        if (logoImage) {
            ecl = state.logoSize > 22 ? 'H' : 'Q';
        }
        const qr = qrcode(0, ecl);
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
                    drawCustomRect(ctx, x, y, moduleSize, moduleSize, left ? 0 : r, right ? 0 : r, right ? 0 : r, left ? 0 : r);
                } else if (ps === 'pill-v') {
                    const top = isDark(row - 1, col);
                    const bottom = isDark(row + 1, col);
                    const r = moduleSize * 0.5;
                    drawCustomRect(ctx, x, y, moduleSize, moduleSize, top ? 0 : r, top ? 0 : r, bottom ? 0 : r, bottom ? 0 : r);
                } else if (ps === 'connected') {
                    const top = isDark(row - 1, col);
                    const bottom = isDark(row + 1, col);
                    const left = isDark(row, col - 1);
                    const right = isDark(row, col + 1);
                    const r = moduleSize * 0.5;
                    drawCustomRect(ctx, x, y, moduleSize, moduleSize, (top || left) ? 0 : r, (top || right) ? 0 : r, (bottom || right) ? 0 : r, (bottom || left) ? 0 : r);
                } else {
                    ctx.fillRect(x, y, moduleSize, moduleSize);
                }
            }
        }
    }

    const cs = state.cornerStyle;
    drawFinderPattern(ctx, margin * moduleSize, margin * moduleSize, moduleSize, cs, 'TL');
    drawFinderPattern(ctx, (moduleCount - 7 + margin) * moduleSize, margin * moduleSize, moduleSize, cs, 'TR');
    drawFinderPattern(ctx, margin * moduleSize, (moduleCount - 7 + margin) * moduleSize, moduleSize, cs, 'BL');

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
            if (cardColor === 'transparent') cardColor = '#ffffff';

            ctx.save();
            ctx.fillStyle = cardColor;
            if (state.logoCardShape === 'circle') {
                ctx.beginPath();
                ctx.arc(center, center, cardSize / 2, 0, Math.PI * 2);
                ctx.fill();
            } else if (state.logoCardShape === 'rounded') {
                roundRect(ctx, cardX, cardY, cardSize, cardSize, cardSize * 0.2);
            } else {
                ctx.fillRect(cardX, cardY, cardSize, cardSize);
            }
            ctx.restore();
        }
        ctx.drawImage(logoImage, logoX, logoY, logoSizePx, logoSizePx);
    }

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
            if (cardColor === 'transparent') cardColor = '#ffffff';

            ctx.save();
            ctx.fillStyle = cardColor;
            if (state.iconCardShape === 'circle') {
                ctx.beginPath();
                ctx.arc(center, center, cardSize / 2, 0, Math.PI * 2);
                ctx.fill();
            } else if (state.iconCardShape === 'rounded') {
                roundRect(ctx, cardX, cardY, cardSize, cardSize, cardSize * 0.2);
            } else {
                ctx.fillRect(cardX, cardY, cardSize, cardSize);
            }
            ctx.restore();
        }

        const iconConfig = PREDEFINED_ICONS[state.icon];
        if (iconConfig) {
            ctx.save();
            ctx.translate(iconX, iconY);
            const scaleFactor = iconSizePx / 24;
            ctx.scale(scaleFactor, scaleFactor);
            ctx.strokeStyle = state.iconColor || state.fgColor;
            ctx.fillStyle = state.iconColor || state.fgColor;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            if (iconConfig.type === 'stroke') {
                ctx.lineWidth = 2;
                for (const pStr of iconConfig.paths) ctx.stroke(new Path2D(pStr));
            } else if (iconConfig.type === 'fill') {
                for (const pStr of iconConfig.paths) ctx.fill(new Path2D(pStr));
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
            ctx.font = `${iconSizePx * 0.75}px system-ui, -apple-system, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
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