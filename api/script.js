// ============================================================
// QR Maker API Docs — script.js
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    // ---- Theme Toggle ----
    const themeToggle = document.getElementById('theme-toggle');

    function setTheme(theme) {
        if (theme === 'system') {
            document.documentElement.removeAttribute('data-theme');
        } else {
            document.documentElement.setAttribute('data-theme', theme);
        }
        localStorage.setItem('qrm-theme', theme);
    }

    themeToggle.addEventListener('click', () => {
        const currentTheme = localStorage.getItem('qrm-theme') || 'dark';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
    });

    // Listen for storage changes to sync themes across open tabs
    window.addEventListener('storage', (e) => {
        if (e.key === 'qrm-theme') {
            setTheme(e.newValue);
        }
    });

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
                    description: `QR Maker API sample request. Downloaded on ${formattedDate}.\n\nDocumentation: https://qrmaker.ryanmarch.me/api/`,
                    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
                },
                item: [
                    {
                        name: "Generate QR Code",
                        request: {
                            method: "GET",
                            header: [],
                            description: "Generate customized QR codes dynamically on the fly. Returns raw binary data for PNG/SVG, or JSON for base64 format.",
                            url: {
                                raw: "",
                                protocol: "https",
                                host: ["qrmaker", "ryanmarch", "me"],
                                path: ["api", "qr"],
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
});
