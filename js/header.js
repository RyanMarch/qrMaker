// Global Header Custom Element
class GlobalHeader extends HTMLElement {
    connectedCallback() {
        const activePage = this.getAttribute('active-page') || '';
        const showBadge = this.getAttribute('show-badge') || '';
        const sidebarToggle = this.hasAttribute('sidebar-toggle');

        this.innerHTML = `
        <header class="global-header">
            <div class="header-left">
                ${sidebarToggle ? `
                <button id="mobile-nav-toggle" class="mobile-nav-toggle" aria-label="Toggle navigation" aria-expanded="false">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                        <line x1="3" y1="12" x2="21" y2="12"></line>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <line x1="3" y1="18" x2="21" y2="18"></line>
                    </svg>
                </button>
                ` : ''}
                <a href="/" class="logo-link">
                    <span class="logo-text">QR Maker</span>
                    ${showBadge ? `<span class="badge">${showBadge}</span>` : ''}
                </a>
            </div>
            <div class="header-right">
                <nav class="header-nav" aria-label="Main Navigation">
                    <a href="/" class="nav-link ${activePage === 'app' ? 'active' : ''}">App</a>
                    <a href="/about/" class="nav-link ${activePage === 'about' ? 'active' : ''}">About</a>
                    <a href="/api/" class="nav-link ${activePage === 'api' ? 'active' : ''}">API</a>
                </nav>
                <button id="theme-toggle" class="theme-toggle" aria-label="Toggle theme" title="Toggle theme">
                    <svg class="sun-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="5"></circle>
                        <line x1="12" y1="1" x2="12" y2="3"></line>
                        <line x1="12" y1="21" x2="12" y2="23"></line>
                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                        <line x1="1" y1="12" x2="3" y2="12"></line>
                        <line x1="21" y1="12" x2="23" y2="12"></line>
                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                    </svg>
                    <svg class="moon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                    </svg>
                    <svg class="system-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                        <line x1="8" y1="21" x2="16" y2="21"></line>
                        <line x1="12" y1="17" x2="12" y2="21"></line>
                    </svg>
                    <span id="theme-status" class="theme-status"></span>
                </button>
                ${!sidebarToggle ? `
                <button id="mobile-menu-toggle" class="mobile-menu-toggle" aria-label="Toggle navigation menu"
                    aria-expanded="false">
                    <svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round">
                        <line x1="3" y1="12" x2="21" y2="12"></line>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <line x1="3" y1="18" x2="21" y2="18"></line>
                    </svg>
                    <svg class="close-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round" style="display: none;">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
                ` : ''}
            </div>
        </header>

        ${!sidebarToggle ? `
        <!-- Mobile Navigation Overlay -->
        <div id="mobile-nav-menu" class="mobile-nav-menu">
            <nav class="mobile-menu-nav">
                <a href="/" class="mobile-menu-link ${activePage === 'app' ? 'active' : ''}">App</a>
                <a href="/about/" class="mobile-menu-link ${activePage === 'about' ? 'active' : ''}">About</a>
                <a href="/api/" class="mobile-menu-link ${activePage === 'api' ? 'active' : ''}">API</a>
            </nav>
        </div>
        ` : ''}
        `;

        this.initControls();
    }

    initControls() {
        // ---- Theme Toggle ----
        const themeToggle = this.querySelector('#theme-toggle');
        const themeStatus = this.querySelector('#theme-status');
        let themeStatusTimeout;

        function triggerHaptic() {
            if ('vibrate' in navigator) {
                try {
                    navigator.vibrate(12);
                } catch (e) {
                    // Ignore
                }
            }
        }

        function showThemeStatus(text) {
            if (!themeStatus) return;
            themeStatus.textContent = text;
            themeStatus.classList.add('visible');
            clearTimeout(themeStatusTimeout);
            themeStatusTimeout = setTimeout(() => {
                themeStatus.classList.remove('visible');
            }, 2000);
        }

        function setTheme(theme) {
            if (theme === 'system') {
                const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
                document.documentElement.setAttribute('data-theme-mode', 'system');
            } else {
                document.documentElement.setAttribute('data-theme', theme);
                document.documentElement.removeAttribute('data-theme-mode');
            }
            localStorage.setItem('qrm-theme', theme);
        }

        // Handle dynamic system preference updates
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (localStorage.getItem('qrm-theme') === 'system') {
                document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
            }
        });

        if (themeToggle && !document.getElementById('main-body')) {
            themeToggle.addEventListener('click', () => {
                triggerHaptic();
                const currentTheme = localStorage.getItem('qrm-theme') || 'dark';
                let newTheme;
                let statusText;

                if (currentTheme === 'dark') {
                    newTheme = 'light';
                    statusText = 'Light Theme';
                } else if (currentTheme === 'light') {
                    newTheme = 'system';
                    statusText = 'System Theme';
                } else {
                    newTheme = 'dark';
                    statusText = 'Dark Theme';
                }

                setTheme(newTheme);
                showThemeStatus(statusText);
            });
        }

        // Synchronize theme across open tabs/pages
        window.addEventListener('storage', (e) => {
            if (e.key === 'qrm-theme') {
                setTheme(e.newValue);
            }
        });

        // ---- Mobile Nav Menu Dropdown (About / 404 pages) ----
        const mobileMenuToggle = this.querySelector('#mobile-menu-toggle');
        const mobileNavMenu = this.querySelector('#mobile-nav-menu');

        if (mobileMenuToggle && mobileNavMenu) {
            const menuIcon = mobileMenuToggle.querySelector('.menu-icon');
            const closeIcon = mobileMenuToggle.querySelector('.close-icon');

            mobileMenuToggle.addEventListener('click', () => {
                const isOpen = mobileNavMenu.classList.contains('active');
                if (isOpen) {
                    mobileNavMenu.classList.remove('active');
                    mobileMenuToggle.setAttribute('aria-expanded', 'false');
                    if (menuIcon) menuIcon.style.display = 'block';
                    if (closeIcon) closeIcon.style.display = 'none';
                } else {
                    mobileNavMenu.classList.add('active');
                    mobileMenuToggle.setAttribute('aria-expanded', 'true');
                    if (menuIcon) menuIcon.style.display = 'none';
                    if (closeIcon) closeIcon.style.display = 'block';
                }
            });

            // Close menu if viewport resized to desktop width
            window.addEventListener('resize', () => {
                if (window.innerWidth > 640 && mobileNavMenu.classList.contains('active')) {
                    mobileNavMenu.classList.remove('active');
                    mobileMenuToggle.setAttribute('aria-expanded', 'false');
                    if (menuIcon) menuIcon.style.display = 'block';
                    if (closeIcon) closeIcon.style.display = 'none';
                }
            });
        }
    }
}

customElements.define('global-header', GlobalHeader);
