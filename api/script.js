// ============================================================
// QR Maker API Docs — script.js
// ============================================================

document.addEventListener('DOMContentLoaded', () => {


    // ---- Sidebar Active State on Scroll ----
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const sections = document.querySelectorAll('.doc-section');

    function highlightSidebar() {
        let scrollPosition = window.scrollY + 100;

        sections.forEach(section => {
            if (scrollPosition >= section.offsetTop && scrollPosition < (section.offsetTop + section.offsetHeight)) {
                const id = section.getAttribute('id');
                sidebarLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }
    window.addEventListener('scroll', highlightSidebar);

    // ---- Tabs switching ----
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');

            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(`tab-${tabId}`).classList.add('active');
        });
    });

    // ---- Playground Interactive Logic ----
    const playContent = document.getElementById('play-content');
    const playFgPicker = document.getElementById('play-fg-picker');
    const playFg = document.getElementById('play-fg');
    const playBgPicker = document.getElementById('play-bg-picker');
    const playBg = document.getElementById('play-bg');
    const playFormat = document.getElementById('play-format');
    const playStyle = document.getElementById('play-style');
    const playIcon = document.getElementById('play-icon');
    const playIconBg = document.getElementById('play-icon-bg');
    const playMargin = document.getElementById('play-margin');
    const playCornerRadius = document.getElementById('play-corner-radius');
    const playgroundUrlInput = document.getElementById('playground-url');

    // Synchronize color picker inputs
    function syncColorPicker(picker, textInput) {
        picker.addEventListener('input', () => {
            textInput.value = picker.value.replace('#', '').toUpperCase();
            updatePlayground();
        });
        textInput.addEventListener('input', () => {
            let val = textInput.value.trim();
            if (val.length === 6) {
                picker.value = '#' + val;
                updatePlayground();
            }
        });
    }
    syncColorPicker(playFgPicker, playFg);
    syncColorPicker(playBgPicker, playBg);

    // Update playground preview URL
    function updatePlayground() {
        const content = encodeURIComponent(playContent.value.trim() || 'https://qrmaker.ryanmarch.me');
        const format = playFormat.value;
        const fg = playFg.value.trim() || '000000';
        const bg = playBg.value.trim() || 'ffffff';
        const style = playStyle.value;
        const icon = playIcon.value;
        const iconBg = playIconBg.value;
        const margin = Math.min(Math.max(parseInt(playMargin.value) || 0, 0), 10);
        const cornerRadius = Math.min(Math.max(parseInt(playCornerRadius.value) || 0, 0), 100);

        // Base API path
        let apiUrl = `https://qrmaker.ryanmarch.me/api/qr?content=${content}&fgColor=${fg}&bgColor=${bg}&cornerStyle=${style}&margin=${margin}&cornerRadius=${cornerRadius}`;

        if (format !== 'png') {
            apiUrl += `&format=${format}`;
        }
        if (icon !== 'none') {
            apiUrl += `&icon=${icon}&iconBg=${iconBg}`;
        }

        // Set visual text URL
        playgroundUrlInput.value = apiUrl;
    }

    // Attach listeners to playground form controls
    [playContent, playFormat, playStyle, playIcon, playIconBg, playMargin, playCornerRadius].forEach(el => {
        el.addEventListener('input', updatePlayground);
    });

    // ---- Clipboard Copy Operations ----
    const btnCopyUrl = document.getElementById('btn-copy-url');
    btnCopyUrl.addEventListener('click', () => {
        navigator.clipboard.writeText(playgroundUrlInput.value)
            .then(() => {
                const originalText = btnCopyUrl.innerHTML;
                btnCopyUrl.innerHTML = 'Copied!';
                setTimeout(() => {
                    btnCopyUrl.innerHTML = originalText;
                }, 1500);
            });
    });

    const copyCodeBtns = document.querySelectorAll('.btn-copy-code');
    copyCodeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const codeEl = document.querySelector(`#tab-${targetId} code`);
            navigator.clipboard.writeText(codeEl.textContent)
                .then(() => {
                    const originalText = btn.textContent;
                    btn.textContent = 'Copied!';
                    setTimeout(() => {
                        btn.textContent = originalText;
                    }, 1500);
                });
        });
    });

    // ---- Dynamic Bruno / Postman Collection Generator ----
    const btnDownloadCollection = document.getElementById('btn-download-collection');
    if (btnDownloadCollection) {
        btnDownloadCollection.addEventListener('click', () => {
            const rows = document.querySelectorAll('.params-table tbody tr');
            const queryParams = [];

            rows.forEach(row => {
                const nameEl = row.querySelector('td:nth-child(1) code.param-name');
                const descEl = row.querySelector('td:nth-child(5)');
                const defaultEl = row.querySelector('td:nth-child(4)');

                if (nameEl && descEl) {
                    const key = nameEl.textContent.trim();
                    let description = descEl.textContent.trim();
                    let defaultValue = '';

                    if (defaultEl) {
                        defaultValue = defaultEl.textContent.trim();
                        if (defaultValue === '—') {
                            defaultValue = '';
                        }
                    }

                    // Sensible default values for testing
                    let value = defaultValue;
                    if (key === 'content') {
                        value = 'https://qrmaker.ryanmarch.me';
                    } else if (key === 'format') {
                        value = 'png';
                    } else if (key === 'size') {
                        value = '512';
                    } else if (key === 'fgColor') {
                        value = '000000';
                    } else if (key === 'bgColor') {
                        value = 'ffffff';
                    } else if (key === 'transparent') {
                        value = 'false';
                    } else if (key === 'margin') {
                        value = '2';
                    } else if (key === 'cornerRadius') {
                        value = '0';
                    } else if (key === 'cornerStyle') {
                        value = 'square';
                    } else if (key === 'icon') {
                        value = 'link';
                    } else if (key === 'iconBg') {
                        value = 'ffffff';
                    } else if (key === 'iconColor') {
                        value = '000000';
                    }

                    queryParams.push({
                        key: key,
                        value: value,
                        description: description
                    });
                }
            });

            const formattedDate = new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            const collection = {
                info: {
                    _postman_id: "7b0b263b-3bf1-4d37-8898-0c6778f5f6bb",
                    name: "QR Maker API",
                    description: `QR Maker API sample requests. Downloaded on ${formattedDate}.\n\nDocumentation: https://qrmaker.ryanmarch.me/api/`,
                    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
                },
                item: [
                    {
                        name: "Generate QR Code (Public)",
                        request: {
                            method: "GET",
                            header: [],
                            description: "Generate customized QR codes dynamically on the fly using the public rate-limited endpoint. No authentication required.",
                            url: {
                                raw: "",
                                protocol: "https",
                                host: ["qrmaker", "ryanmarch", "me"],
                                path: ["api", "qr"],
                                query: queryParams
                            }
                        },
                        response: []
                    },
                    {
                        name: "Generate QR Code (Secure)",
                        request: {
                            method: "GET",
                            header: [
                                {
                                    key: "Authorization",
                                    value: "Bearer YOUR_API_KEY",
                                    type: "text",
                                    description: "Replace YOUR_API_KEY with your generated API key"
                                }
                            ],
                            description: "Generate customized QR codes dynamically on the fly using the authenticated endpoint. Requires your personal Bearer API Key.",
                            url: {
                                raw: "",
                                protocol: "https",
                                host: ["qrmaker", "ryanmarch", "me"],
                                path: ["api", "plus"],
                                query: queryParams
                            }
                        },
                        response: []
                    }
                ]
            };

            // Set raw URL
            const rawUrlParams = queryParams
                .map(p => `${p.key}=${encodeURIComponent(p.value)}`)
                .join('&');
            collection.item[0].request.url.raw = `https://qrmaker.ryanmarch.me/api/qr?${rawUrlParams}`;
            collection.item[1].request.url.raw = `https://qrmaker.ryanmarch.me/api/plus?${rawUrlParams}`;

            // Trigger file download
            const blob = new Blob([JSON.stringify(collection, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'qrMaker.postman_collection.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }

    // Run initial update on load
    updatePlayground();

    // ---- API Key Registration Form Handling ----
    const formRegisterKey = document.getElementById('form-register-key');
    const regEmailInput = document.getElementById('reg-email');
    const btnRequestKey = document.getElementById('btn-request-key');
    const keyOutputWrapper = document.getElementById('key-output-wrapper');
    const generatedApiKey = document.getElementById('generated-api-key');
    const keyExpiryDate = document.getElementById('key-expiry-date');
    const regErrorMessage = document.getElementById('reg-error-message');
    const btnCopyKey = document.getElementById('btn-copy-key');

    if (formRegisterKey) {
        formRegisterKey.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Hide previous results/errors
            keyOutputWrapper.style.display = 'none';
            regErrorMessage.style.display = 'none';

            const email = regEmailInput.value.trim();

            // Retrieve Turnstile token
            let token = '';
            if (window.turnstile) {
                token = window.turnstile.getResponse();
            } else {
                const turnstileInput = formRegisterKey.querySelector('[name="cf-turnstile-response"]');
                token = turnstileInput ? turnstileInput.value : '';
            }

            if (!token) {
                regErrorMessage.textContent = 'Please solve the Turnstile security challenge first.';
                regErrorMessage.style.display = 'block';
                return;
            }

            btnRequestKey.disabled = true;
            btnRequestKey.textContent = 'Generating...';

            try {
                const res = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, token })
                });

                const data = await res.json();

                if (res.ok && data.apiKey) {
                    generatedApiKey.value = data.apiKey;

                    const expiry = new Date(data.expiresAt);
                    const expiryStr = expiry.toLocaleString(undefined, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZoneName: 'short'
                    });
                    keyExpiryDate.textContent = expiryStr;

                    // Update mailto URL
                    const lnkEmailKey = document.getElementById('lnk-email-key');
                    if (lnkEmailKey) {
                        const emailSubject = encodeURIComponent("Your QR Maker API Key");
                        const docUrl = window.location.href;
                        const emailBody = encodeURIComponent(`Here is your QR Maker developer API key:\n\n${data.apiKey}\n\nThis key is valid until: ${expiryStr}\n\nKeep this safe, as it cannot be recovered if lost.\n\nAPI Documentation: ${docUrl}`);
                        lnkEmailKey.href = `mailto:${encodeURIComponent(email)}?subject=${emailSubject}&body=${emailBody}`;
                    }

                    keyOutputWrapper.style.display = 'block';
                    regEmailInput.value = ''; // clear input
                } else {
                    regErrorMessage.textContent = data.error || 'An error occurred generating your key.';
                    regErrorMessage.style.display = 'block';
                }
            } catch (err) {
                regErrorMessage.textContent = 'Network error. Failed to reach the registration server.';
                regErrorMessage.style.display = 'block';
            } finally {
                btnRequestKey.disabled = false;
                btnRequestKey.textContent = 'Generate API Key';
                if (window.turnstile) {
                    window.turnstile.reset();
                }
            }
        });
    }

    if (btnCopyKey && generatedApiKey) {
        btnCopyKey.addEventListener('click', () => {
            navigator.clipboard.writeText(generatedApiKey.value)
                .then(() => {
                    const originalText = btnCopyKey.innerHTML;
                    btnCopyKey.innerHTML = 'Copied!';
                    setTimeout(() => {
                        btnCopyKey.innerHTML = originalText;
                    }, 1500);
                });
        });
    }

    // ---- Mobile Navigation Toggle ----
    const mobileNavToggle = document.getElementById('mobile-nav-toggle');
    const apiSidebar = document.querySelector('.api-sidebar');
    const mobileOverlay = document.getElementById('mobile-overlay');

    if (mobileNavToggle && apiSidebar && mobileOverlay) {
        function toggleMobileNav() {
            const isOpen = apiSidebar.classList.contains('active');
            if (isOpen) {
                closeMobileNav();
            } else {
                openMobileNav();
            }
        }

        function openMobileNav() {
            apiSidebar.classList.add('active');
            mobileOverlay.classList.add('active');
            mobileNavToggle.setAttribute('aria-expanded', 'true');
        }

        function closeMobileNav() {
            apiSidebar.classList.remove('active');
            mobileOverlay.classList.remove('active');
            mobileNavToggle.setAttribute('aria-expanded', 'false');
        }

        mobileNavToggle.addEventListener('click', toggleMobileNav);
        mobileOverlay.addEventListener('click', closeMobileNav);

        // Close sidebar when clicking any link inside it
        const sidebarLinks = apiSidebar.querySelectorAll('.sidebar-link');
        sidebarLinks.forEach(link => {
            link.addEventListener('click', closeMobileNav);
        });
    }

    // ---- Heading Anchor Links ----
    function getHeadingId(heading) {
        if (heading.id) return heading.id;

        // Check if this is the first heading in a section/article with an ID
        const parentSection = heading.closest('[id]');
        if (parentSection) {
            const firstHeading = parentSection.querySelector('h1, h2, h3, h4, h5, h6');
            if (firstHeading === heading) {
                return parentSection.id;
            }
        }

        // Generate slug
        const slug = heading.textContent
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_]+/g, '-')
            .replace(/^-+|-+$/g, '');

        let uniqueSlug = slug;
        let count = 1;
        while (document.getElementById(uniqueSlug)) {
            uniqueSlug = `${slug}-${count}`;
            count++;
        }

        heading.id = uniqueSlug;
        return uniqueSlug;
    }

    const headings = document.querySelectorAll('.api-content h1, .api-content h2, .api-content h3');
    headings.forEach(heading => {
        const id = getHeadingId(heading);
        if (!id) return;

        const anchor = document.createElement('a');
        anchor.className = 'heading-anchor';
        anchor.href = `#${id}`;
        anchor.setAttribute('aria-label', 'Copy link to this section');

        const linkIconSvg = `
            <svg class="anchor-svg-link" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
        `;

        const checkIconSvg = `
            <svg class="anchor-svg-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: none;">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
        `;

        anchor.innerHTML = linkIconSvg + checkIconSvg;
        heading.insertBefore(anchor, heading.firstChild);

        anchor.addEventListener('click', (e) => {
            e.preventDefault();
            const url = `${window.location.origin}${window.location.pathname}#${id}`;

            navigator.clipboard.writeText(url).then(() => {
                history.pushState(null, null, `#${id}`);
                
                // Scroll to the heading smoothly
                heading.scrollIntoView({ behavior: 'smooth' });

                const linkIcon = anchor.querySelector('.anchor-svg-link');
                const checkIcon = anchor.querySelector('.anchor-svg-check');

                if (linkIcon && checkIcon) {
                    linkIcon.style.display = 'none';
                    checkIcon.style.display = 'inline-block';
                    anchor.classList.add('copied');

                    setTimeout(() => {
                        linkIcon.style.display = 'inline-block';
                        checkIcon.style.display = 'none';
                        anchor.classList.remove('copied');
                    }, 1500);
                }
            });
        });
    });
});

// ---- Dynamic Turnstile Rendering ----
window.onloadTurnstileCallback = function () {
    const sitekey = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? '1x00000000000000000000AA' // Local dev dummy key
        : '0x4AAAAAADtAb2hYyQchZ15m'; // Production key

    if (window.turnstile) {
        window.turnstile.render('#registration-turnstile', {
            sitekey: sitekey,
            theme: 'dark'
        });
    }
};

// If Turnstile loaded before this script runs, manually initialize
if (window.turnstile && typeof window.turnstile.render === 'function') {
    window.onloadTurnstileCallback();
}
