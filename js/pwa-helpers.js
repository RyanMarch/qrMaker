/* ============================================================
   File 4: pwa-helpers.js
   Handles service worker registration and app install prompts
   ============================================================ */
"use strict";

let deferredPrompt;
let desktopPromptType = '';
let suppressHaptic = false;

function registerServiceWorker() {
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
        console.log('[Service Worker] Skipping registration on localhost for development.');
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then((registrations) => {
                for (const registration of registrations) {
                    registration.unregister().then((unregistered) => {
                        if (unregistered) {
                            console.log('[Service Worker] Unregistered active service worker.');
                            location.reload();
                        }
                    });
                }
            });
        }
        return;
    }
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then((reg) => { console.log('[Service Worker] Registered successfully:', reg.scope); })
                .catch((err) => { console.error('[Service Worker] Registration failed:', err); });
        });
    }
}


function isIOSDevice() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
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
}

function positionIosPrompt() {
    const prompt = document.getElementById('ios-pwa-prompt');
    if (!prompt) return;
    const isSingleColumnMobile = window.innerWidth <= 960 && !window.matchMedia('(orientation: landscape) and (max-height: 500px)').matches;
    const scrollWrapper = document.querySelector('.controls-content-wrapper');

    if (isSingleColumnMobile) {
        if (prompt.parentElement !== document.body) document.body.appendChild(prompt);
    } else {
        if (scrollWrapper && prompt.parentElement !== scrollWrapper) scrollWrapper.appendChild(prompt);
    }
}

function initIosPwaPrompt() {
    const isIOS = isIOSDevice();
    const isStandalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;

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
    if (e) { e.stopPropagation(); e.preventDefault(); }
    triggerHaptic();
    const prompt = document.getElementById('ios-pwa-prompt');
    if (prompt) prompt.classList.remove('collapsed');
}

function collapseIosPrompt(e) {
    if (e) { e.stopPropagation(); e.preventDefault(); }
    triggerHaptic();
    const prompt = document.getElementById('ios-pwa-prompt');
    if (prompt) prompt.classList.add('collapsed');
}

function triggerHaptic() {
    if (suppressHaptic) return;
    if ('vibrate' in navigator) {
        try { navigator.vibrate(12); } catch (e) { }
    }
}

window.collapseIosPrompt = collapseIosPrompt;
window.expandIosPrompt = expandIosPrompt;
window.triggerHaptic = triggerHaptic;

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
    const scrollWrapper = document.querySelector('.controls-content-wrapper');

    if (isSingleColumnMobile) {
        if (prompt.parentElement !== document.body) document.body.appendChild(prompt);
    } else {
        if (scrollWrapper && prompt.parentElement !== scrollWrapper) scrollWrapper.appendChild(prompt);
    }
}

function initDesktopPwaPrompt(forcedType) {
    if (localStorage.getItem('qrmaker_desktop_prompt_dismissed') === 'true') return;
    const isStandalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) return;

    const isIOS = isIOSDevice();
    if (isIOS) return;

    const isMac = /Macintosh|Mac OS X/.test(navigator.userAgent);
    const isMacSafari = isMac && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    let type = forcedType;
    if (!type) {
        if (isMacSafari) type = 'safari';
        else if (deferredPrompt) type = 'chromium';
        else return;
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
            actionBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="btn-icon-svg"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Install`;
        }
        if (instructionsText) instructionsText.textContent = 'Install this web app on your device to generate QR codes in full screen, use high-fidelity exports, and work offline.';
        if (stepsContainer) {
            stepsContainer.innerHTML = `
                <div class="desktop-prompt-step"><div class="desktop-prompt-step-num">1</div><div class="desktop-prompt-step-text">Open the <strong>File</strong> menu in Safari's top menu bar.</div></div>
                <div class="desktop-prompt-step"><div class="desktop-prompt-step-num">2</div><div class="desktop-prompt-step-text">Select <span class="ios-action-text">Add to Dock...</span>.</div></div>
            `;
        }
    } else if (type === 'chromium') {
        if (subtitle) subtitle.textContent = 'Install Desktop App';
        if (actionBtn) {
            actionBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="btn-icon-svg"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Install`;
        }
        if (instructionsText) instructionsText.textContent = 'Install this web app on your device to generate QR codes in full screen, use high-fidelity exports, and work offline.';
        if (stepsContainer) {
            stepsContainer.innerHTML = `
                <div class="desktop-prompt-step"><div class="desktop-prompt-step-num">✓</div><div class="desktop-prompt-step-text">Runs in a standalone window, freeing up your browser tab space.</div></div>
                <div class="desktop-prompt-step"><div class="desktop-prompt-step-num">✓</div><div class="desktop-prompt-step-text">Launches instantly from your Dock or desktop shortcut.</div></div>
                <button class="desktop-prompt-install-btn" style="width: 100%; justify-content: center; margin-top: 0.5rem;" onclick="handleDesktopInstallAction(event)">Install Now</button>
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
    if (e) { e.stopPropagation(); e.preventDefault(); }
    triggerHaptic();
    const prompt = document.getElementById('desktop-pwa-prompt');
    if (prompt) prompt.classList.remove('collapsed');
}

function collapseDesktopPrompt(e) {
    if (e) { e.stopPropagation(); e.preventDefault(); }
    triggerHaptic();
    const prompt = document.getElementById('desktop-pwa-prompt');
    if (prompt) {
        if (prompt.classList.contains('collapsed')) dismissDesktopPrompt();
        else prompt.classList.add('collapsed');
    }
}

function dismissDesktopPrompt() {
    const prompt = document.getElementById('desktop-pwa-prompt');
    if (prompt) prompt.classList.remove('visible');
    localStorage.setItem('qrmaker_desktop_prompt_dismissed', 'true');
}

async function handleDesktopInstallAction(e) {
    if (e) { e.stopPropagation(); e.preventDefault(); }
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

registerServiceWorker();
initIosPwaPrompt();
initDesktopPwaPrompt();