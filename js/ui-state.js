/* ============================================================
   File 1: ui-state.js
   Handles state, UI controls, color picking, and logos
   ============================================================ */
"use strict";

if (typeof qrcode === 'undefined') {
    window.qrcode = { stringToBytesFuncs: {} };
}

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
    pixelAutoContrast: true,
    logoUrl: '',
    logoDataUrl: '',
    logoSize: 20,
    logoClearBehind: true,
    logoCardShape: 'rounded',
    overlayMode: 'none',
    icon: 'none',
    iconSize: 20,
    iconColor: '#000000',
    iconClearBehind: true,
    iconCardShape: 'rounded',
};

const PREDEFINED_ICONS = {
    link: { type: 'stroke', paths: ['M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71', 'M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71'] },
    text: { type: 'stroke', paths: ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', 'M14 2v6h6', 'M16 13H8', 'M16 17H8', 'M10 9H8'] },
    wifi: { type: 'mixed', paths: [{ type: 'stroke', d: 'M5 12.55a11 11 0 0 1 14.08 0' }, { type: 'stroke', d: 'M1.42 9a16 16 0 0 1 21.16 0' }, { type: 'stroke', d: 'M8.53 16.11a6 6 0 0 1 6.95 0' }, { type: 'fill', d: 'M12 20a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z' }] },
    contact: { type: 'stroke', paths: ['M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2', 'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'] },
    email: { type: 'stroke', paths: ['M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z', 'M22 6l-10 7L2 6'] },
    phone: { type: 'stroke', paths: ['M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z'] },
    'map-pin': { type: 'stroke', paths: ['M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z', 'M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'] },
    sms: { type: 'stroke', paths: ['M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'] },
    event: { type: 'stroke', paths: ['M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z', 'M16 2v4', 'M8 2v4', 'M3 10h18'] },
    globe: { type: 'stroke', paths: ['M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z', 'M2 12h20', 'M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z'] },
    github: { type: 'fill', paths: ['M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.479C19.138 20.164 22 16.418 22 12c0-5.523-4.477-10-10-10z'] },
    linkedin: { type: 'fill', paths: ['M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z'] },
    instagram: { type: 'mixed', paths: [{ type: 'stroke', d: 'M17 2H7a5 5 0 0 0-5 5v10a5 5 0 0 0 5 5h10a5 5 0 0 0 5-5V7a5 5 0 0 0-5-5z' }, { type: 'stroke', d: 'M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z' }, { type: 'fill', d: 'M17.5 6.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0z' }] },
    facebook: { type: 'fill', paths: ['M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z'] },
    whatsapp: { type: 'fill', paths: ['M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.703 1.457h.004c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z'] },
    youtube: { type: 'fill', paths: ['M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.871.508 9.388.508 9.388.508s7.517 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z'] },
    patreon: { type: 'fill', paths: ['M22.957 7.21c-.004-3.064-2.391-5.576-5.191-6.482-3.478-1.125-8.064-.962-11.384.604C2.357 3.231 1.093 7.391 1.046 11.54c-.039 3.411.302 12.396 5.369 12.46 3.765.047 4.326-4.804 6.068-7.141 1.24-1.662 2.836-2.132 4.801-2.618 3.376-.836 5.678-3.501 5.673-7.031Z'] },
    discord: { type: 'fill', paths: ['M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.094 13.094 0 0 1-1.873-.894.077.077 0 0 1-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 0 1 .077-.011c3.92 1.793 8.18 1.793 12.061 0a.073.073 0 0 1 .078.009c.12.099.246.195.373.289a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.156 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.156 2.418z'] },
    pinterest: { type: 'fill', paths: ['M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.993 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z'] }
};

let generateTimer = null;
let lastQrObj = null;
let logoImage = null;
const DEFAULT_QR_CONTENT = window.location.origin + '/';
const DROPDOWN_TABS = ['email', 'phone', 'location', 'sms', 'event'];
const TAB_ICON_MAPPING = { url: 'link', text: 'text', wifi: 'wifi', contact: 'contact', email: 'email', phone: 'phone', location: 'map-pin', sms: 'sms', event: 'event' };

function switchTab(name, generate = true) {
    state.activeTab = name;
    const isDropdownItem = DROPDOWN_TABS.includes(name);

    document.querySelectorAll('.tab:not(#tab-more)').forEach(t => {
        const active = t.id === 'tab-' + name;
        t.classList.toggle('active', active);
        t.setAttribute('aria-selected', active);
    });

    document.querySelectorAll('.dropdown-item').forEach(item => {
        const active = item.getAttribute('onclick').includes(`'${name}'`);
        item.classList.toggle('active', active);
    });

    const moreBtn = document.getElementById('tab-more');
    const moreLabel = document.querySelector('.more-text-label');
    const moreIconContainer = document.querySelector('.tab-more-btn-content');

    if (moreBtn && moreLabel) {
        if (isDropdownItem) {
            moreBtn.classList.add('active');
            moreBtn.setAttribute('aria-selected', 'true');
            moreLabel.textContent = name === 'sms' ? 'SMS' : (name.charAt(0).toUpperCase() + name.slice(1));
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
                    existingSvg.outerHTML = `<svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="more-icon-svg"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>`;
                }
            }
        }
    }

    document.querySelectorAll('.input-panel').forEach(p => {
        p.classList.toggle('active', p.id === 'panel-' + name);
    });

    if (state.overlayMode === 'icon') {
        const matchingIcon = TAB_ICON_MAPPING[name];
        if (matchingIcon) setIcon(matchingIcon, false);
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
    const descriptions = { L: 'L — 7% data recovery capacity', M: 'M — 15% data recovery capacity', Q: 'Q — 25% data recovery capacity', H: 'H — 30% data recovery capacity' };
    const helpEl = document.getElementById('ecc-help');
    if (helpEl) helpEl.textContent = descriptions[level];
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
    state.cornerRadius = parseInt(slider.value, 10);
    document.getElementById('bg-corners-label').textContent = `${state.cornerRadius}%`;
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
    _sizePopoverOpen ? closeSizePopover() : openSizePopover();
}

function openSizePopover() {
    const trigger = document.getElementById('export-size-trigger');
    const popover = document.getElementById('size-popover');
    if (!trigger || !popover) return;
    const rect = trigger.getBoundingClientRect();
    popover.style.right = `${window.innerWidth - rect.right}px`;
    popover.style.left = 'auto';
    popover.style.top = `${rect.top - 8}px`;
    popover.classList.add('open');
    requestAnimationFrame(() => { popover.style.top = `${rect.top - popover.offsetHeight - 8}px`; });
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

// updateColorHex() removed — was an empty no-op (call site in qr-core.js also removed)

function randomizeAppearance() {
    state.pixelAutoContrast = true;
    shuffleThemeColor();
    const pixelStyles = ['square', 'rounded', 'dot', 'pill-h', 'pill-v', 'connected'];
    setPixelStyle(pixelStyles[Math.floor(Math.random() * pixelStyles.length)], false);
    const cornerStyles = ['rounded', 'square', 'circle', 'leaf', 'beveled'];
    setCornerStyle(cornerStyles[Math.floor(Math.random() * cornerStyles.length)], false);
    const randomRadius = Math.floor(Math.random() * 51);
    state.cornerRadius = randomRadius;
    const bgSlider = document.getElementById('bg-corners-slider');
    if (bgSlider) bgSlider.value = randomRadius;
    updateCornerRadiusLabel();
    scheduleGenerate();
    showToast('Appearance randomized');
}

function resetAppearance() {
    state.isTransparent = false;
    state.pixelAutoContrast = true;
    updateThemeColor('#ffffff');
    positionCursorFromHex('#ffffff');
    setPixelStyle('square', false);
    setCornerStyle('rounded', false);
    state.cornerRadius = 50;
    const bgSlider = document.getElementById('bg-corners-slider');
    if (bgSlider) bgSlider.value = 50;
    updateCornerRadiusLabel();
    state.margin = 2;
    const marginSlider = document.getElementById('margin-slider');
    if (marginSlider) marginSlider.value = 2;
    updateMarginLabel();
    clearLogo();
    scheduleGenerate();
    showToast('Appearance reset');
}

function hexToHsl(hex) {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
        else if (max === g) h = (b - r) / d + 2;
        else if (max === b) h = (r - g) / d + 4;
        h /= 6;
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToHex(h, s, l) {
    h /= 360; s /= 100; l /= 100;
    let r, g, b;
    if (s === 0) { r = g = b = l; } else {
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
    const toHex = x => { const hex = Math.round(x * 255).toString(16); return hex.length === 1 ? '0' + hex : hex; };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function rgbToHex(r, g, b) {
    const toHex = x => { const hex = x.toString(16); return hex.length === 1 ? '0' + hex : hex; };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function getLuminance(hex) {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    const a = [r, g, b].map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function getContrastRatio(l1, l2) {
    const max = Math.max(l1, l2), min = Math.min(l1, l2);
    return (max + 0.05) / (min + 0.05);
}

function getContrastColor(baseColorHex) {
    const { h, s, l } = hexToHsl(baseColorHex);
    if (s === 0) return l >= 50 ? '#000000' : '#ffffff';
    const bgLuminance = getLuminance(baseColorHex);
    const crBlack = (bgLuminance + 0.05) / 0.05;
    const crWhite = 1.05 / (bgLuminance + 0.05);
    return crBlack >= crWhite ? hslToHex(h, s, 4) : hslToHex(h, s, 96);
}

function updateAppTint(baseColorHex) {
    const { h, s, l } = hexToHsl(baseColorHex);
    const isDarkTheme = document.documentElement.getAttribute('data-theme') === 'dark' || (!document.documentElement.getAttribute('data-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    let tintBg;
    if (s === 0) {
        tintBg = isDarkTheme ? 'rgb(32, 32, 36)' : '#f4f4f5';
    } else {
        tintBg = isDarkTheme ? `hsl(${h}, ${Math.min(s, 24)}%, 11%)` : `hsl(${h}, ${Math.min(s, 24)}%, 94%)`;
    }
    const previewSec = document.querySelector('.preview-section');
    if (previewSec) previewSec.style.setProperty('background-color', tintBg, 'important');
    document.body.style.setProperty('--theme-tint-bg', tintBg);
    document.body.style.setProperty('--theme-base-color', baseColorHex);
}

function updateThemeColor(baseColorHex) {
    state.themeColor = baseColorHex;
    if (state.isTransparent) {
        state.bgColor = 'transparent';
        if (state.pixelAutoContrast) {
            state.fgColor = baseColorHex;
        }
    } else {
        state.bgColor = baseColorHex;
        if (state.pixelAutoContrast) {
            state.fgColor = getContrastColor(baseColorHex);
        }
    }
    updateColorTriggerUI();
    scheduleGenerate();
}

function updateColorTriggerUI() {
    const preview = document.getElementById('color-trigger-preview');
    const hexInput = document.getElementById('color-hex-input');
    if (preview) preview.style.backgroundColor = state.themeColor;
    if (hexInput && document.activeElement !== hexInput) hexInput.value = state.themeColor.toUpperCase();

    const btnSolid = document.getElementById('bg-mode-solid');
    const btnTrans = document.getElementById('bg-mode-transparent');
    const canvasWrapper = document.getElementById('qr-canvas-wrapper');

    if (btnSolid && btnTrans) {
        btnSolid.classList.toggle('active', !state.isTransparent);
        btnSolid.setAttribute('aria-pressed', (!state.isTransparent).toString());
        btnTrans.classList.toggle('active', state.isTransparent);
        btnTrans.setAttribute('aria-pressed', state.isTransparent.toString());
    }
    if (canvasWrapper) canvasWrapper.classList.toggle('transparent-bg-active', state.isTransparent);

    // Update Pixel Color UI
    const pixelPreview = document.getElementById('pixel-color-trigger-preview');
    const pixelHexInput = document.getElementById('pixel-color-hex-input');
    const pixelAutoBtn = document.getElementById('pixel-auto-btn');

    if (pixelPreview) pixelPreview.style.backgroundColor = state.fgColor;
    if (pixelHexInput && document.activeElement !== pixelHexInput) pixelHexInput.value = state.fgColor.toUpperCase();
    if (pixelAutoBtn) {
        pixelAutoBtn.classList.toggle('active', state.pixelAutoContrast);
        pixelAutoBtn.setAttribute('aria-pressed', state.pixelAutoContrast.toString());
    }

    // Check contrast warning
    const warningEl = document.getElementById('pixel-contrast-warning');
    if (warningEl) {
        if (state.isTransparent) {
            warningEl.style.display = 'none';
        } else {
            const l1 = getLuminance(state.bgColor);
            const l2 = getLuminance(state.fgColor);
            const ratio = getContrastRatio(l1, l2);
            if (ratio < 4.5) {
                warningEl.style.display = 'flex';
            } else {
                warningEl.style.display = 'none';
            }
        }
    }

    updateAppTint(state.themeColor);
}

function setBackgroundMode(mode) {
    state.isTransparent = (mode === 'transparent');
    updateThemeColor(state.themeColor);
}

function handlePixelColorHexInput(val) {
    let cleanHex = val.trim();
    if (!cleanHex.startsWith('#')) cleanHex = '#' + cleanHex;
    if (/^#[0-9A-F]{6}$/i.test(cleanHex) || /^#[0-9A-F]{3}$/i.test(cleanHex)) {
        state.fgColor = cleanHex;
        state.pixelAutoContrast = false;
        updateColorTriggerUI();
        positionPixelCursorFromHex(cleanHex);
        scheduleGenerate();
    }
}

function togglePixelAutoContrast() {
    state.pixelAutoContrast = !state.pixelAutoContrast;
    if (state.pixelAutoContrast) {
        state.fgColor = state.isTransparent ? state.themeColor : getContrastColor(state.bgColor);
        positionPixelCursorFromHex(state.fgColor);
    }
    updateColorTriggerUI();
    scheduleGenerate();
}

function togglePixelColorPickerSheet() {
    const sheet = document.getElementById('pixel-color-picker-sheet');
    if (!sheet) return;
    const isOpen = sheet.classList.toggle('open');
    if (isOpen) {
        const canvas = document.getElementById('pixel-color-spectrum-canvas');
        if (canvas) {
            drawColorPickerCanvas(canvas);
            setTimeout(() => { positionPixelCursorFromHex(state.fgColor); }, 50);
            initPixelSpectrumEvents(canvas);
        }
        // Close background picker
        const bgSheet = document.getElementById('color-picker-sheet');
        if (bgSheet) bgSheet.classList.remove('open');
    }
}

function positionPixelCursorFromHex(hex) {
    const { h, s, l } = hexToHsl(hex);
    const canvas = document.getElementById('pixel-color-spectrum-canvas');
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = (h / 360) * rect.width;
    const y = ((100 - l) / 100) * rect.height;
    const cursor = document.getElementById('pixel-spectrum-cursor');
    if (cursor) {
        cursor.style.left = `${x}px`;
        cursor.style.top = `${y}px`;
    }
}

function initPixelSpectrumEvents(canvas) {
    if (canvas.dataset.eventsInitialized) return;
    canvas.dataset.eventsInitialized = 'true';
    const container = canvas.parentElement;

    const handleColorSelect = (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = Math.max(0, Math.min(rect.width - 1, e.clientX - rect.left));
        const y = Math.max(0, Math.min(rect.height - 1, e.clientY - rect.top));
        const rawY = e.clientY - rect.top;

        let hex;
        if (rawY <= 3) hex = '#ffffff';
        else if (rawY >= rect.height - 3) hex = '#000000';
        else {
            const scaleX = canvas.width / rect.width, scaleY = canvas.height / rect.height;
            const ctx = canvas.getContext('2d');
            const imgData = ctx.getImageData(x * scaleX, y * scaleY, 1, 1).data;
            hex = rgbToHex(imgData[0], imgData[1], imgData[2]);
        }
        const cursor = document.getElementById('pixel-spectrum-cursor');
        if (cursor) { cursor.style.left = `${x}px`; cursor.style.top = `${y}px`; }
        
        state.fgColor = hex;
        state.pixelAutoContrast = false;
        updateColorTriggerUI();
        scheduleGenerate();
    };

    container.addEventListener('pointerdown', (e) => {
        container.setPointerCapture(e.pointerId);
        handleColorSelect(e);
    });
    container.addEventListener('pointermove', (e) => {
        if (container.hasPointerCapture(e.pointerId)) {
            handleColorSelect(e);
        }
    });
    container.addEventListener('pointerup', (e) => {
        container.releasePointerCapture(e.pointerId);
    });
    container.addEventListener('pointercancel', (e) => {
        container.releasePointerCapture(e.pointerId);
    });
}

function selectPixelSwatch(colorHex) {
    state.fgColor = colorHex;
    state.pixelAutoContrast = false;
    updateColorTriggerUI();
    positionPixelCursorFromHex(colorHex);
    scheduleGenerate();
}

function shufflePixelColor() {
    let hex;
    let attempts = 0;
    const bgLuminance = state.isTransparent ? null : getLuminance(state.bgColor);

    do {
        const h = Math.floor(Math.random() * 360);
        const s = 75 + Math.floor(Math.random() * 20);
        const l = 15 + Math.floor(Math.random() * 70); // Generates full range of dark/light colors
        hex = hslToHex(h, s, l);
        attempts++;

        if (state.isTransparent) break;

        const ratio = getContrastRatio(bgLuminance, getLuminance(hex));
        if (ratio >= 4.5) break;
    } while (attempts < 50);

    // Fallback if we couldn't find a contrasty random color
    if (!state.isTransparent && getContrastRatio(bgLuminance, getLuminance(hex)) < 4.5) {
        hex = getContrastColor(state.bgColor);
    }

    state.fgColor = hex;
    state.pixelAutoContrast = false;
    updateColorTriggerUI();
    positionPixelCursorFromHex(hex);
    scheduleGenerate();
}

function openPixelColorPickerSheet() {
    const sheet = document.getElementById('pixel-color-picker-sheet');
    if (sheet && !sheet.classList.contains('open')) togglePixelColorPickerSheet();
}

function selectSwatch(colorHex) {
    updateThemeColor(colorHex);
    positionCursorFromHex(colorHex);
}

function shuffleThemeColor() {
    const h = Math.floor(Math.random() * 360);
    const s = 75 + Math.floor(Math.random() * 20);
    const l = 40 + Math.floor(Math.random() * 25);
    const hex = hslToHex(h, s, l);
    updateThemeColor(hex);
    positionCursorFromHex(hex);
}

function toggleColorPickerSheet() {
    const sheet = document.getElementById('color-picker-sheet');
    if (!sheet) return;
    const isOpen = sheet.classList.toggle('open');
    if (isOpen) {
        const canvas = document.getElementById('color-spectrum-canvas');
        if (canvas) {
            drawColorPickerCanvas(canvas);
            setTimeout(() => { positionCursorFromHex(state.themeColor); }, 50);
            initSpectrumEvents(canvas);
        }
        // Close pixel picker
        const pixelSheet = document.getElementById('pixel-color-picker-sheet');
        if (pixelSheet) pixelSheet.classList.remove('open');
    }
}

function drawColorPickerCanvas(canvas) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width, height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const hueGrad = ctx.createLinearGradient(0, 0, width, 0);
    hueGrad.addColorStop(0, '#ff0000'); hueGrad.addColorStop(0.17, '#ffff00');
    hueGrad.addColorStop(0.33, '#00ff00'); hueGrad.addColorStop(0.5, '#00ffff');
    hueGrad.addColorStop(0.67, '#0000ff'); hueGrad.addColorStop(0.83, '#ff00ff');
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

function positionCursorFromHex(hex) {
    const { h, s, l } = hexToHsl(hex);
    const canvas = document.getElementById('color-spectrum-canvas');
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = (h / 360) * rect.width;
    const y = ((100 - l) / 100) * rect.height;
    const cursor = document.getElementById('spectrum-cursor');
    if (cursor) {
        cursor.style.left = `${x}px`;
        cursor.style.top = `${y}px`;
    }
}

function initSpectrumEvents(canvas) {
    if (canvas.dataset.eventsInitialized) return;
    canvas.dataset.eventsInitialized = 'true';
    const container = canvas.parentElement;

    const handleColorSelect = (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = Math.max(0, Math.min(rect.width - 1, e.clientX - rect.left));
        const y = Math.max(0, Math.min(rect.height - 1, e.clientY - rect.top));
        const rawY = e.clientY - rect.top;

        let hex;
        if (rawY <= 3) hex = '#ffffff';
        else if (rawY >= rect.height - 3) hex = '#000000';
        else {
            const scaleX = canvas.width / rect.width, scaleY = canvas.height / rect.height;
            const ctx = canvas.getContext('2d');
            const imgData = ctx.getImageData(x * scaleX, y * scaleY, 1, 1).data;
            hex = rgbToHex(imgData[0], imgData[1], imgData[2]);
        }
        const cursor = document.getElementById('spectrum-cursor');
        if (cursor) { cursor.style.left = `${x}px`; cursor.style.top = `${y}px`; }
        updateThemeColor(hex);
    };

    container.addEventListener('pointerdown', (e) => {
        container.setPointerCapture(e.pointerId);
        handleColorSelect(e);
    });
    container.addEventListener('pointermove', (e) => {
        if (container.hasPointerCapture(e.pointerId)) {
            handleColorSelect(e);
        }
    });
    container.addEventListener('pointerup', (e) => {
        container.releasePointerCapture(e.pointerId);
    });
    container.addEventListener('pointercancel', (e) => {
        container.releasePointerCapture(e.pointerId);
    });
}

function toggleKeyVisibility() {
    const input = document.getElementById('input-wifi-key');
    const btn = document.getElementById('key-visibility-toggle-btn');
    const showing = input.classList.contains('masked-input');
    showing ? input.classList.remove('masked-input') : input.classList.add('masked-input');
    btn.querySelector('.eye-icon').style.display = showing ? 'none' : '';
    btn.querySelector('.eye-off-icon').style.display = showing ? '' : 'none';
}

function triggerLogoInput() { document.getElementById('logo-input').click(); }
function handleLogoFileSelect(event) {
    const file = event.target.files[0];
    if (file) handleLogoFile(file);
    event.target.value = '';
}

function handleLogoFile(file) {
    if (!file.type.startsWith('image/')) { showToast('Please select an image file (PNG, JPG, SVG, AVIF, etc.)'); return; }
    if (file.size > 5 * 1024 * 1024) { showToast('Image size exceeds 5MB limit.'); return; }
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
        const timeout = setTimeout(() => { URL.revokeObjectURL(objectUrl); reject(new Error('Image processing timed out.')); }, 10000);
        img.onload = () => {
            clearTimeout(timeout);
            let width = img.width, height = img.height;
            if (width <= maxSize && height <= maxSize) { URL.revokeObjectURL(objectUrl); resolve(file); return; }
            if (width > height) { height = Math.round((height * maxSize) / width); width = maxSize; }
            else { width = Math.round((width * maxSize) / height); height = maxSize; }
            const canvas = document.createElement('canvas');
            canvas.width = width; canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);
            URL.revokeObjectURL(objectUrl);
            const mimeType = file.type || 'image/jpeg';
            canvas.toBlob((blob) => {
                if (!blob) { reject(new Error('Image optimization failed.')); return; }
                resolve(new File([blob], file.name, { type: mimeType, lastModified: Date.now() }));
            }, mimeType);
        };
        img.onerror = () => { clearTimeout(timeout); URL.revokeObjectURL(objectUrl); reject(new Error('Failed to load image.')); };
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
        const response = await fetch('https://api.cloudinary.com/v1_1/rm20abcd26/image/upload', { method: 'POST', body: formData });
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
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function setCloudinaryStatus(status) {
    const el = document.getElementById('logo-upload-status');
    if (!el) return;
    el.className = 'logo-status ' + status;
    if (status === 'uploading') el.textContent = 'Uploading to cloud…';
    else if (status === 'success') el.textContent = 'Saved to cloud';
    else if (status === 'error') el.textContent = 'Local preview only';
    else el.textContent = 'Local preview';
}

function clearLogo() {
    state.logoUrl = ''; state.logoDataUrl = ''; logoImage = null;
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
    state.logoSize = parseInt(slider.value, 10);
    document.getElementById('logo-size-label').textContent = state.logoSize + '%';
}

function updateLogoControlsUI(filename) {
    document.getElementById('logo-dropzone').style.display = 'none';
    const wrapper = document.getElementById('logo-preview-wrapper');
    wrapper.style.display = 'flex';
    document.getElementById('logo-preview-thumbnail').src = state.logoDataUrl || state.logoUrl;
    document.getElementById('logo-preview-filename').textContent = filename || 'logo.png';
    (state.logoUrl && !state.logoUrl.startsWith('data:')) ? setCloudinaryStatus('success') : setCloudinaryStatus('local');
    document.getElementById('logo-controls').style.display = 'flex';
    const slider = document.getElementById('logo-size-slider');
    slider.value = state.logoSize;
    document.getElementById('logo-size-label').textContent = state.logoSize + '%';
    document.getElementById('logo-clear-behind').checked = state.logoClearBehind;
    setLogoCardShape(state.logoCardShape);
}

function getFilenameFromUrl(url) {
    if (!url) return '';
    try { const parts = url.split('/'); return parts[parts.length - 1]; } catch (e) { return 'logo.png'; }
}



let toastTimer = null;
function showToast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2500);
}

document.addEventListener('click', (e) => {
    const menu = document.getElementById('share-menu');
    if (menu && !menu.contains(e.target) && !e.target.closest('#share-btn')) menu.classList.remove('open');

    const picker = document.getElementById('color-picker-sheet');
    const trigger = document.getElementById('color-trigger-btn');
    if (picker && picker.classList.contains('open')) {
        if (!picker.contains(e.target) && !trigger.contains(e.target)) picker.classList.remove('open');
    }

    const pixelPicker = document.getElementById('pixel-color-picker-sheet');
    const pixelTrigger = document.getElementById('pixel-color-trigger-btn');
    if (pixelPicker && pixelPicker.classList.contains('open')) {
        if (!pixelPicker.contains(e.target) && !pixelTrigger.contains(e.target) && !e.target.closest('#pixel-auto-btn')) {
            pixelPicker.classList.remove('open');
        }
    }

    const tabDropdown = document.getElementById('tab-dropdown');
    const tabMoreContainer = document.getElementById('tab-more-container');
    if (tabDropdown && tabDropdown.classList.contains('open')) {
        if (tabMoreContainer && !tabMoreContainer.contains(e.target)) {
            tabDropdown.classList.remove('open');
            const moreBtn = document.getElementById('tab-more');
            if (moreBtn) moreBtn.setAttribute('aria-expanded', 'false');
        }
    }

    if (_sizePopoverOpen) {
        const sizePopover = document.getElementById('size-popover');
        const sizeTrigger = document.getElementById('export-size-trigger');
        if (sizePopover && !sizePopover.contains(e.target) && !sizeTrigger.contains(e.target)) closeSizePopover();
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

function initIconSelector() {
    const grid = document.getElementById('icon-selector-grid');
    if (!grid) return;
    grid.innerHTML = '';
    for (const [key, iconCfg] of Object.entries(PREDEFINED_ICONS)) {
        const btn = document.createElement('button');
        btn.type = 'button'; btn.className = 'icon-select-btn'; btn.id = `icon-btn-${key}`; btn.title = key.toUpperCase();
        btn.onclick = () => setIcon(key);
        let svgHtml = `<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">`;
        if (iconCfg.type === 'stroke') { for (const p of iconCfg.paths) svgHtml += `<path d="${p}" fill="none"/>`; }
        else if (iconCfg.type === 'fill') { for (const p of iconCfg.paths) svgHtml += `<path d="${p}" fill="currentColor" stroke="none"/>`; }
        else if (iconCfg.type === 'mixed') {
            for (const p of iconCfg.paths) {
                if (p.type === 'stroke') svgHtml += `<path d="${p.d}" fill="none"/>`;
                else if (p.type === 'fill') svgHtml += `<path d="${p.d}" fill="currentColor" stroke="none"/>`;
            }
        }
        svgHtml += `</svg>`;
        btn.innerHTML = svgHtml;
        grid.appendChild(btn);
    }
    const emojiBtn = document.createElement('button');
    emojiBtn.type = 'button'; emojiBtn.className = 'icon-select-btn'; emojiBtn.id = 'icon-btn-emoji'; emojiBtn.title = 'CUSTOM EMOJI';
    emojiBtn.onclick = () => selectCustomEmojiMode(); emojiBtn.innerHTML = '<span>😃</span>';
    grid.appendChild(emojiBtn);
    const hexInput = document.getElementById('icon-color-hex');
    if (hexInput) hexInput.value = state.iconColor;
    const colorBtn = document.getElementById('icon-color-btn');
    if (colorBtn) colorBtn.style.backgroundColor = state.iconColor;
}

function setOverlayMode(mode, generate = true) {
    state.overlayMode = mode;
    document.querySelectorAll('#overlay-mode .seg-btn').forEach(btn => {
        const active = btn.getAttribute('data-value') === mode;
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    const iconContainer = document.getElementById('icon-controls-container');
    const logoContainer = document.getElementById('logo-controls-container');
    if (iconContainer) iconContainer.style.display = mode === 'icon' ? 'flex' : 'none';
    if (logoContainer) logoContainer.style.display = mode === 'logo' ? 'flex' : 'none';

    if (mode === 'icon' && state.icon === 'none') {
        const matchingIcon = TAB_ICON_MAPPING[state.activeTab];
        if (matchingIcon) setIcon(matchingIcon, false);
    }

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
    document.querySelectorAll('.icon-select-btn').forEach(btn => {
        const active = isPredefined ? btn.id === `icon-btn-${name}` : btn.id === 'icon-btn-emoji';
        btn.classList.toggle('active', active);
    });
    const container = document.getElementById('emoji-input-container');
    if (container) container.style.display = !isPredefined ? 'flex' : 'none';
    const iconColorRow = document.getElementById('icon-color-row');
    if (iconColorRow) iconColorRow.style.display = !isPredefined ? 'none' : '';

    if (generate) {
        if (name !== 'none' && state.ecl !== 'H') {
            const requiredEcl = state.iconSize > 22 ? 'H' : 'Q';
            setEcc(requiredEcl, false);
        }
        scheduleGenerate();
    }
}

function selectCustomEmojiMode() {
    const container = document.getElementById('emoji-input-container');
    if (container) container.style.display = 'flex';
    const input = document.getElementById('custom-emoji-input');
    if (input) {
        input.focus();
        const currentEmoji = (state.icon && !PREDEFINED_ICONS[state.icon] && state.icon !== 'none') ? state.icon : '😃';
        input.value = currentEmoji;
        setIcon(currentEmoji);
    }
}

function handleCustomEmojiInput(val) {
    const chars = Array.from(val);
    const emoji = chars.slice(0, 10).join('');
    const input = document.getElementById('custom-emoji-input');
    if (input) input.value = emoji;
    if (emoji) {
        setIcon(emoji);
    } else {
        // Field is cleared — keep the emoji panel visible, just remove the icon from the QR
        state.icon = '';
        scheduleGenerate();
    }
}

function applySuggestionEmoji(emoji) {
    const input = document.getElementById('custom-emoji-input');
    if (input) input.value = emoji;
    setIcon(emoji);
}

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
    if (!cleanHex.startsWith('#')) cleanHex = '#' + cleanHex;
    if (/^#[0-9A-F]{6}$/i.test(cleanHex) || /^#[0-9A-F]{3}$/i.test(cleanHex)) {
        state.iconColor = cleanHex;
        const colorBtn = document.getElementById('icon-color-btn');
        if (colorBtn) colorBtn.style.backgroundColor = cleanHex;
        const picker = document.getElementById('icon-color-picker');
        if (picker) picker.value = cleanHex;
        scheduleGenerate();
    }
}

function matchIconColorToFg() {
    const newColor = state.fgColor;

    state.iconColor = newColor;
    updateIconColorUI(newColor);

    const picker = document.getElementById('icon-color-picker');
    if (picker) picker.value = newColor;
    scheduleGenerate();
}

function forceDisableAutofill() {
    document.querySelectorAll('input, textarea, select').forEach(el => {
        if (el.type === 'password') el.setAttribute('autocomplete', 'one-time-code');
        else el.setAttribute('autocomplete', 'off');
    });
}

function openColorPickerSheet() {
    const sheet = document.getElementById('color-picker-sheet');
    if (sheet && !sheet.classList.contains('open')) toggleColorPickerSheet();
}

function getUserLocation() {
    const errorEl = document.getElementById('geo-error');
    const detectBtn = document.getElementById('geo-detect-btn');
    if (!navigator.geolocation) {
        if (errorEl) { errorEl.textContent = 'Geolocation is not supported by your browser.'; errorEl.style.display = 'block'; }
        return;
    }
    if (detectBtn) {
        detectBtn.disabled = true;
        detectBtn.innerHTML = `<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" fill="none" class="spin"><circle cx="12" cy="12" r="10"></circle><line x1="22" y1="12" x2="18" y2="12"></line><line x1="6" y1="12" x2="2" y2="12"></line><line x1="12" y1="6" x2="12" y2="2"></line><line x1="12" y1="22" x2="12" y2="18"></line></svg> Locating…`;
    }
    if (errorEl) errorEl.style.display = 'none';
    navigator.geolocation.getCurrentPosition(
        (position) => {
            document.getElementById('input-geo-lat').value = position.coords.latitude.toFixed(6);
            document.getElementById('input-geo-lng').value = position.coords.longitude.toFixed(6);
            if (detectBtn) {
                detectBtn.disabled = false;
                detectBtn.innerHTML = `<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" fill="none"><circle cx="12" cy="12" r="10"></circle><line x1="22" y1="12" x2="18" y2="12"></line><line x1="6" y1="12" x2="2" y2="12"></line><line x1="12" y1="6" x2="12" y2="2"></line><line x1="12" y1="22" x2="12" y2="18"></line></svg> Use Current Location`;
            }
            scheduleGenerate();
        },
        (error) => {
            let msg = 'Unable to retrieve location.';
            if (error.code === error.PERMISSION_DENIED) msg = 'Location access denied.';
            else if (error.code === error.POSITION_UNAVAILABLE) msg = 'Location info unavailable.';
            else if (error.code === error.TIMEOUT) msg = 'Location request timed out.';
            if (errorEl) { errorEl.textContent = msg; errorEl.style.display = 'block'; }
            if (detectBtn) {
                detectBtn.disabled = false;
                detectBtn.innerHTML = `<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" fill="none"><circle cx="12" cy="12" r="10"></circle><line x1="22" y1="12" x2="18" y2="12"></line><line x1="6" y1="12" x2="2" y2="12"></line><line x1="12" y1="6" x2="12" y2="2"></line><line x1="12" y1="22" x2="12" y2="18"></line></svg> Use Current Location`;
            }
        },
        { timeout: 10000 }
    );
}

function handleMobileScroll() {
    if (window.innerWidth <= 960) {
        const scrollY = window.scrollY;
        const maxScroll = 80;
        const scrollProgress = Math.min(1, Math.max(0, scrollY / maxScroll));
        document.documentElement.style.setProperty('--scroll-progress', scrollProgress);
        if (scrollY > 40) {
            if (!document.body.classList.contains('scrolled')) {
                document.body.classList.add('scrolled');
                if (typeof closeSizePopover === 'function') closeSizePopover();
            }
        } else {
            document.body.classList.remove('scrolled');
        }
    } else {
        document.body.classList.remove('scrolled');
        document.documentElement.style.setProperty('--scroll-progress', 0);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const dropzone = document.getElementById('logo-dropzone');
    if (dropzone) {
        ['dragenter', 'dragover'].forEach(eventName => {
            dropzone.addEventListener(eventName, (e) => { e.preventDefault(); e.stopPropagation(); dropzone.classList.add('dragover'); }, false);
        });
        ['dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, (e) => { e.preventDefault(); e.stopPropagation(); dropzone.classList.remove('dragover'); }, false);
        });
        dropzone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const file = dt.files[0];
            if (file) handleLogoFile(file);
        }, false);
    }

    const hexInput = document.getElementById('color-hex-input');
    const triggerBtn = document.getElementById('color-trigger-btn');
    if (hexInput) {
        hexInput.addEventListener('input', (e) => {
            let val = e.target.value.trim();
            if (val && !val.startsWith('#')) { val = '#' + val; e.target.value = val; }
            if (/^#[0-9A-F]{6}$/i.test(val)) { updateThemeColor(val); positionCursorFromHex(val); }
            else if (/^#[0-9A-F]{3}$/i.test(val)) {
                const expanded = '#' + val[1] + val[1] + val[2] + val[2] + val[3] + val[3];
                updateThemeColor(expanded); positionCursorFromHex(expanded);
            }
        });
        hexInput.addEventListener('blur', (e) => {
            let val = e.target.value.trim();
            if (!val.startsWith('#')) val = '#' + val;
            e.target.value = state.themeColor.toUpperCase();
        });
        hexInput.addEventListener('focus', () => { openColorPickerSheet(); });
        hexInput.addEventListener('click', (e) => { e.stopPropagation(); openColorPickerSheet(); });
    }
    if (triggerBtn && hexInput) {
        triggerBtn.addEventListener('click', (e) => {
            if (e.target !== hexInput && e.target !== document.getElementById('color-trigger-preview')) {
                hexInput.focus(); openColorPickerSheet();
            }
        });
    }

    const pixelHexInput = document.getElementById('pixel-color-hex-input');
    const pixelTriggerBtn = document.getElementById('pixel-color-trigger-btn');
    if (pixelHexInput) {
        pixelHexInput.addEventListener('input', (e) => {
            let val = e.target.value.trim();
            if (val && !val.startsWith('#')) { val = '#' + val; e.target.value = val; }
            if (/^#[0-9A-F]{6}$/i.test(val)) {
                state.fgColor = val;
                state.pixelAutoContrast = false;
                updateColorTriggerUI();
                positionPixelCursorFromHex(val);
                scheduleGenerate();
            }
            else if (/^#[0-9A-F]{3}$/i.test(val)) {
                const expanded = '#' + val[1] + val[1] + val[2] + val[2] + val[3] + val[3];
                state.fgColor = expanded;
                state.pixelAutoContrast = false;
                updateColorTriggerUI();
                positionPixelCursorFromHex(expanded);
                scheduleGenerate();
            }
        });
        pixelHexInput.addEventListener('blur', (e) => {
            e.target.value = state.fgColor.toUpperCase();
        });
        pixelHexInput.addEventListener('focus', () => { openPixelColorPickerSheet(); });
        pixelHexInput.addEventListener('click', (e) => { e.stopPropagation(); openPixelColorPickerSheet(); });
    }
    if (pixelTriggerBtn && pixelHexInput) {
        pixelTriggerBtn.addEventListener('click', (e) => {
            if (e.target !== pixelHexInput && e.target !== document.getElementById('pixel-color-trigger-preview')) {
                pixelHexInput.focus(); openPixelColorPickerSheet();
            }
        });
    }



    window.addEventListener('scroll', handleMobileScroll, { passive: true });
    window.addEventListener('resize', handleMobileScroll, { passive: true });
    handleMobileScroll();
});