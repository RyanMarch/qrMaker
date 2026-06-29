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
    
    const playgroundPlaceholder = document.getElementById('playground-placeholder');
    const placeholderText = document.getElementById('placeholder-text');
    const playgroundImage = document.getElementById('playground-image');
    const base64Indicator = document.getElementById('base64-indicator');
    const playgroundUrlInput = document.getElementById('playground-url');

    // Load state handlers
    playgroundImage.addEventListener('load', () => {
        playgroundPlaceholder.classList.add('hidden');
        playgroundImage.classList.remove('hidden');
    });

    playgroundImage.addEventListener('error', () => {
        // If we failed loading from a local hostname, fall back to production
        const prodUrl = playgroundUrlInput.value;
        if (playgroundImage.src !== prodUrl && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
            playgroundImage.src = prodUrl;
        } else {
            playgroundPlaceholder.classList.remove('hidden');
            playgroundImage.classList.add('hidden');
            placeholderText.textContent = "API Offline. Please check your connection.";
        }
    });

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

    // Update playground preview
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

        // Reset display to show placeholder while loading new src
        playgroundPlaceholder.classList.remove('hidden');
        playgroundImage.classList.add('hidden');
        placeholderText.textContent = "Loading preview...";

        // Local vs Prod request selection
        let requestUrl = apiUrl;
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            requestUrl = apiUrl.replace('https://qrmaker.ryanmarch.me', window.location.origin);
        }

        // Load preview
        if (format === 'base64') {
            // Base64 returns JSON, so we must fetch it to set preview img src
            base64Indicator.classList.remove('hidden');
            
            fetch(requestUrl)
                .then(res => res.json())
                .then(json => {
                    playgroundImage.src = json.data;
                })
                .catch(() => {
                    // Fallback to fetch from production if local fetch fails
                    if (requestUrl !== apiUrl) {
                        fetch(apiUrl)
                            .then(res => res.json())
                            .then(json => {
                                playgroundImage.src = json.data;
                            })
                            .catch(() => {
                                playgroundPlaceholder.classList.remove('hidden');
                                playgroundImage.classList.add('hidden');
                                placeholderText.textContent = "API Offline. Please check your connection.";
                            });
                    } else {
                        playgroundPlaceholder.classList.remove('hidden');
                        playgroundImage.classList.add('hidden');
                        placeholderText.textContent = "API Offline. Please check your connection.";
                    }
                });
        } else {
            base64Indicator.classList.add('hidden');
            playgroundImage.src = requestUrl;
        }
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

    // Run initial update on load
    updatePlayground();
});
