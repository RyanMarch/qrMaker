document.addEventListener('DOMContentLoaded', () => {
    // ---- Theme Toggle ----
    const themeToggle = document.getElementById('theme-toggle');
    const themeStatus = document.getElementById('theme-status');
    let themeStatusTimeout;

    function triggerHaptic() {
        if ('vibrate' in navigator) { try { navigator.vibrate(12); } catch (e) { } }
    }

    function showThemeStatus(text) {
        if (!themeStatus) return;
        themeStatus.textContent = text;
        themeStatus.classList.add('visible');
        clearTimeout(themeStatusTimeout);
        themeStatusTimeout = setTimeout(() => { themeStatus.classList.remove('visible'); }, 2000);
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

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            triggerHaptic();
            const currentTheme = localStorage.getItem('qrm-theme') || 'dark';
            let newTheme = currentTheme === 'dark' ? 'light' : currentTheme === 'light' ? 'system' : 'dark';
            let statusText = newTheme === 'light' ? 'Light Theme' : newTheme === 'system' ? 'System Theme' : 'Dark Theme';

            setTheme(newTheme);
            showThemeStatus(statusText);
        });
    }

    // ---- Mobile Nav Menu Toggle ----
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle') || document.getElementById('mobile-nav-toggle');
    const mobileNavMenu = document.getElementById('mobile-nav-menu');

    if (mobileMenuToggle) {
        const menuIcon = mobileMenuToggle.querySelector('.menu-icon');
        const closeIcon = mobileMenuToggle.querySelector('.close-icon');

        mobileMenuToggle.addEventListener('click', () => {
            const isExpanded = mobileMenuToggle.getAttribute('aria-expanded') === 'true';
            mobileMenuToggle.setAttribute('aria-expanded', !isExpanded);

            if (mobileNavMenu) {
                mobileNavMenu.classList.toggle('active', !isExpanded);
            }

            if (menuIcon) menuIcon.style.display = isExpanded ? 'block' : 'none';
            if (closeIcon) closeIcon.style.display = isExpanded ? 'none' : 'block';
        });
    }

    window.addEventListener('resize', () => {
        if (window.innerWidth > 640 && mobileNavMenu && mobileNavMenu.classList.contains('active')) {
            mobileNavMenu.classList.remove('active');
            if (mobileMenuToggle) {
                mobileMenuToggle.setAttribute('aria-expanded', 'false');
                mobileMenuToggle.querySelector('.menu-icon').style.display = 'block';
                mobileMenuToggle.querySelector('.close-icon').style.display = 'none';
            }
        }
    });
});