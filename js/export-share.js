/* ============================================================
   File 3: export-share.js
   Handles downloads, clipboard actions, sharing URLs, and init
   ============================================================ */
"use strict";

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
        return `M ${x + rtl} ${y} L ${x + 1 - rtr} ${y} Q ${x + 1} ${y} ${x + 1} ${y + rtr} L ${x + 1} ${y + 1 - rbr} Q ${x + 1} ${y + 1} ${x + 1 - rbr} ${y + 1} L ${x + rbl} ${y + 1} Q ${x} ${y + 1} ${x} ${y + 1 - rbl} L ${x} ${y + rtl} Q ${x} ${y} ${x + rtl} ${y}`;
    };

    const getCustomRectSvgPath = (x, y, w, h, rtl, rtr, rbr, rbl) => {
        return `M ${x + rtl} ${y} h ${w - rtl - rtr} ` +
            (rtr > 0 ? `a ${rtr} ${rtr} 0 0 1 ${rtr} ${rtr} ` : '') +
            `v ${h - rtr - rbr} ` +
            (rbr > 0 ? `a ${rbr} ${rbr} 0 0 1 -${rbr} ${rbr} ` : '') +
            `h -${w - rbr - rbl} ` +
            (rbl > 0 ? `a ${rbl} ${rbl} 0 0 1 -${rbl} -${rbl} ` : '') +
            `v -${h - rbl - rtl} ` +
            (rtl > 0 ? `a ${rtl} ${rtl} 0 0 1 ${rtl} -${rtl} ` : '') + `z`;
    };

    const getBeveledSvgPath = (x, y, size, bevel) => {
        return `M ${x + bevel} ${y} L ${x + size - bevel} ${y} L ${x + size} ${y + bevel} L ${x + size} ${y + size - bevel} L ${x + size - bevel} ${y + size} L ${x + bevel} ${y + size} L ${x} ${y + size - bevel} L ${x} ${y + bevel} z`;
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
            if (pos === 'TL') rtl = 3.5; else if (pos === 'TR') rtr = 3.5; else if (pos === 'BL') rbl = 3.5;
            let irtl = 0, irtr = 0, irbr = 0, irbl = 0;
            if (pos === 'TL') irtl = 2.5; else if (pos === 'TR') irtr = 2.5; else if (pos === 'BL') irbl = 2.5;
            let ertl = 0, ertr = 0, erbr = 0, erbl = 0;
            if (pos === 'TL') ertl = 1.5; else if (pos === 'TR') ertr = 1.5; else if (pos === 'BL') erbl = 1.5;
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
                    const left = isDark(row, col - 1), right = isDark(row, col + 1);
                    paths += `<path d="${getCustomRectPath(x, y, left ? 0 : 0.5, right ? 0 : 0.5, right ? 0 : 0.5, left ? 0 : 0.5)}"/>`;
                } else if (ps === 'pill-v') {
                    const top = isDark(row - 1, col), bottom = isDark(row + 1, col);
                    paths += `<path d="${getCustomRectPath(x, y, top ? 0 : 0.5, top ? 0 : 0.5, bottom ? 0 : 0.5, bottom ? 0 : 0.5)}"/>`;
                } else if (ps === 'connected') {
                    const top = isDark(row - 1, col), bottom = isDark(row + 1, col), left = isDark(row, col - 1), right = isDark(row, col + 1);
                    paths += `<path d="${getCustomRectPath(x, y, (top || left) ? 0 : 0.5, (top || right) ? 0 : 0.5, (bottom || right) ? 0 : 0.5, (bottom || left) ? 0 : 0.5)}"/>`;
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
                if (cardColor === 'transparent') cardColor = '#ffffff';

                if (state.logoCardShape === 'circle') {
                    logoSvgContent += `\n  <circle cx="${centerModules}" cy="${centerModules}" r="${cardSizeModules / 2}" fill="${cardColor}"/>`;
                } else if (state.logoCardShape === 'rounded') {
                    const rx = cardSizeModules * 0.2;
                    logoSvgContent += `\n  <rect x="${cardXModules}" y="${cardYModules}" width="${cardSizeModules}" height="${cardSizeModules}" rx="${rx}" ry="${rx}" fill="${cardColor}"/>`;
                } else {
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
            if (cardColor === 'transparent') cardColor = '#ffffff';

            if (state.iconCardShape === 'circle') {
                logoSvgContent += `\n  <circle cx="${centerModules}" cy="${centerModules}" r="${cardSizeModules / 2}" fill="${cardColor}"/>`;
            } else if (state.iconCardShape === 'rounded') {
                const rx = cardSizeModules * 0.2;
                logoSvgContent += `\n  <rect x="${cardXModules}" y="${cardYModules}" width="${cardSizeModules}" height="${cardSizeModules}" rx="${rx}" ry="${rx}" fill="${cardColor}"/>`;
            } else {
                logoSvgContent += `\n  <rect x="${cardXModules}" y="${cardYModules}" width="${cardSizeModules}" height="${cardSizeModules}" fill="${cardColor}"/>`;
            }
        }

        const iconXModules = centerModules - iconSizeModules / 2;
        const iconYModules = centerModules - iconSizeModules / 2;
        const scale = iconSizeModules / 24;
        const strokeColor = state.iconColor || state.fgColor;
        const iconConfig = PREDEFINED_ICONS[state.icon];

        if (iconConfig) {
            logoSvgContent += `\n  <g transform="translate(${iconXModules}, ${iconYModules}) scale(${scale})" stroke-linecap="round" stroke-linejoin="round">`;
            if (iconConfig.type === 'stroke') {
                for (const p of iconConfig.paths) logoSvgContent += `\n    <path d="${p}" fill="none" stroke="${strokeColor}" stroke-width="2"/>`;
            } else if (iconConfig.type === 'fill') {
                for (const p of iconConfig.paths) logoSvgContent += `\n    <path d="${p}" fill="${strokeColor}" stroke="none"/>`;
            } else if (iconConfig.type === 'mixed') {
                for (const p of iconConfig.paths) {
                    if (p.type === 'stroke') logoSvgContent += `\n    <path d="${p.d}" fill="none" stroke="${strokeColor}" stroke-width="2"/>`;
                    else if (p.type === 'fill') logoSvgContent += `\n    <path d="${p.d}" fill="${strokeColor}" stroke="none"/>`;
                }
            }
            logoSvgContent += `\n  </g>`;
        } else if (state.icon && state.icon !== 'none') {
            const escapedEmoji = state.icon.replace(/[<>&'"]/g, (c) => {
                switch (c) { case '<': return '&lt;'; case '>': return '&gt;'; case '&': return '&amp;'; case '\'': return '&apos;'; case '"': return '&quot;'; default: return c; }
            });
            const emojiSize = iconSizeModules * 0.82;
            logoSvgContent += `\n  <text x="${centerModules}" y="${centerModules}" font-size="${emojiSize}" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle" dominant-baseline="central">${escapedEmoji}</text>`;
        }
    }

    const bgRSvg = size * 0.25 * (state.cornerRadius / 100);
    const bgRect = state.bgColor === 'transparent' ? '' : (bgRSvg > 0 ? `\n  <rect width="${size}" height="${size}" rx="${bgRSvg}" ry="${bgRSvg}" fill="${state.bgColor}"/>` : `\n  <rect width="${size}" height="${size}" fill="${state.bgColor}"/>`);
    const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">${bgRect}\n  <g fill="${state.fgColor}">${paths}</g>${logoSvgContent}\n</svg>`;

    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr-code-${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
}

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
        try { await navigator.share({ title: 'QR Maker', url: shareUrl }); } catch (e) { }
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
    if (params.has('cms')) setCornerStyle(params.get('cms'), false);
    if (params.has('bgc')) {
        const bgc = parseInt(params.get('bgc'), 10);
        if (!isNaN(bgc)) {
            state.cornerRadius = bgc;
            const bgSlider = document.getElementById('bg-corners-slider');
            if (bgSlider) bgSlider.value = bgc;
        }
    }
    if (params.has('fg')) state.fgColor = '#' + params.get('fg');
    if (params.has('bg')) {
        const bgParam = params.get('bg');
        if (bgParam === 'transparent') {
            state.bgColor = 'transparent';
            state.isTransparent = true;
            state.themeColor = params.has('fg') ? '#' + params.get('fg') : '#ffffff';
        } else {
            const bg = '#' + bgParam;
            state.bgColor = bg;
            state.themeColor = bg;
            state.isTransparent = false;
        }
    } else {
        state.themeColor = '#ffffff'; state.bgColor = '#ffffff'; state.fgColor = '#000000'; state.isTransparent = false;
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
    if (params.has('omode')) setOverlayMode(params.get('omode'), false);

    if (params.has('logo')) {
        const logoUrl = params.get('logo');
        state.logoUrl = logoUrl;
        state.logoDataUrl = logoUrl;
        if (params.has('logosz')) {
            const sz = parseInt(params.get('logosz'), 10);
            if (!isNaN(sz)) state.logoSize = sz;
        }
        if (params.has('logocb')) state.logoClearBehind = params.get('logocb') === '1';
        if (params.has('logocs')) state.logoCardShape = params.get('logocs');

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            logoImage = img;
            updateLogoControlsUI(getFilenameFromUrl(logoUrl));
            scheduleGenerate();
        };
        img.onerror = () => { console.warn('Failed to load shared logo image from:', logoUrl); };
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
        if (params.has('iconcs')) setIconCardShape(params.get('iconcs'), false);
        if (params.has('iconcol')) {
            const col = '#' + params.get('iconcol');
            state.iconColor = col;
            updateIconColorUI(col);
        }
    }
    updateCornerRadiusLabel();
}

document.addEventListener('DOMContentLoaded', () => {
    if (typeof qrcode !== 'undefined' && qrcode.stringToBytesFuncs && qrcode.stringToBytesFuncs['UTF-8']) {
        qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];
    }
    forceDisableAutofill();
    initIconSelector();
    loadFromURL();
    scheduleGenerate();
});