// Global Header Controls
document.addEventListener('DOMContentLoaded', () => {
    // ---- Theme Toggle ----
    const themeToggle = document.getElementById('theme-toggle');
    const themeStatus = document.getElementById('theme-status');
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
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mobileNavMenu = document.getElementById('mobile-nav-menu');

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
});
