document.addEventListener('DOMContentLoaded', () => {
    // ---- Theme Toggle ----
    const themeToggle = document.getElementById('theme-toggle');
    const themeStatus = document.getElementById('theme-status');
    let themeStatusTimeout;

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
        
        // Notify main app if loaded
        if (typeof updateAppTint === 'function' && typeof state !== 'undefined') {
            updateAppTint(state.themeColor);
        }
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            if (typeof triggerHaptic === 'function') triggerHaptic();
            const currentTheme = localStorage.getItem('qrm-theme') || 'dark';
            let newTheme = currentTheme === 'dark' ? 'light' : currentTheme === 'light' ? 'system' : 'dark';
            let statusText = newTheme === 'light' ? 'Light Theme' : newTheme === 'system' ? 'System Theme' : 'Dark Theme';

            setTheme(newTheme);
            showThemeStatus(statusText);
        });
    }

    // ---- System Theme Change Listener ----
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (localStorage.getItem('qrm-theme') === 'system') {
            document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
            if (typeof updateAppTint === 'function' && typeof state !== 'undefined') {
                updateAppTint(state.themeColor);
            }
        }
    });

    // ---- Mobile Nav Menu Toggle ----
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle') || document.getElementById('mobile-nav-toggle');
    const mobileNavMenu = document.getElementById('mobile-nav-menu');

    if (mobileMenuToggle) {
        // Auto-inject SVGs if the button is empty to prevent the "gray pill" rendering issue
        if (!mobileMenuToggle.innerHTML.trim()) {
            mobileMenuToggle.innerHTML = `
                <svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: block; width: 18px; height: 18px;">
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
                <svg class="close-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: none; width: 18px; height: 18px;">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            `;
        }

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
                const menuIcon = mobileMenuToggle.querySelector('.menu-icon');
                const closeIcon = mobileMenuToggle.querySelector('.close-icon');
                if (menuIcon) menuIcon.style.display = 'block';
                if (closeIcon) closeIcon.style.display = 'none';
            }
        }
    });

    // ---- Mobile Sidebar / Backdrop Toggle Logic (via delegation) ----
    document.addEventListener('click', (event) => {
        const toggleBtn = event.target.closest('[sidebar-toggle]') || event.target.closest('.mobile-nav-toggle');
        const sidebar = document.querySelector('.page-sidebar');
        const overlay = document.querySelector('#mobile-overlay');

        if (toggleBtn && sidebar && overlay) {
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
        }

        // Close sidebar when clicking the dark backdrop overlay
        if (event.target.matches('#mobile-overlay')) {
            sidebar?.classList.remove('active');
            overlay?.classList.remove('active');
        }
    });

    // ---- Heading Anchor Links ----
    const headings = document.querySelectorAll('.page-content h1, .page-content h2, .page-content h3');
    
    function getHeadingId(heading) {
        if (heading.id) return heading.id;

        const parentSection = heading.closest('[id]');
        if (parentSection) {
            const firstHeading = parentSection.querySelector('h1, h2, h3, h4, h5, h6');
            if (firstHeading === heading) return parentSection.id;
        }

        const slug = heading.textContent.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '');
        let uniqueSlug = slug;
        let count = 1;
        while (document.getElementById(uniqueSlug)) {
            uniqueSlug = `${slug}-${count}`;
            count++;
        }

        heading.id = uniqueSlug;
        return uniqueSlug;
    }

    headings.forEach(heading => {
        // Skip if heading or any ancestor has section-links="false" or data-section-links="false"
        if (heading.closest('[section-links="false"], [data-section-links="false"]')) {
            return;
        }

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
                    }, 2000);
                }
            });
        });
    });
});