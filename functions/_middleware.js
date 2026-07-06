// functions/_middleware.js

function getHeaderHTML(activePage = '', showBadge = '', sidebarToggle = false) {
    const badgeHTML = showBadge ? `<span class="badge">${showBadge}</span>` : '';
    const mobileToggleId = sidebarToggle ? 'mobile-nav-toggle' : 'mobile-menu-toggle';

    return `
    <header class="global-header">
        <div class="header-left">
            <a href="/" class="logo-link">
                <span class="logo-text">QR Maker</span>
                ${badgeHTML}
            </a>
        </div>
        <div class="header-right">
            <nav class="header-nav" aria-label="Main Navigation">
                <a href="/app/" class="nav-link ${activePage === 'app' ? 'active' : ''}">App</a>
                <a href="/api/" class="nav-link ${activePage === 'api' ? 'active' : ''}">Docs</a>
            </nav>
            <button id="theme-toggle" class="theme-toggle" aria-label="Toggle theme">
                <svg class="sun-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                <svg class="moon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
                <svg class="system-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                <span id="theme-status" class="theme-status"></span>
            </button>
            <button id="${mobileToggleId}" class="${mobileToggleId}" aria-label="Toggle navigation menu" aria-expanded="false">
                <svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                <svg class="close-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: none;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        </div>
    </header>
    ${!sidebarToggle ? `
    <div id="mobile-nav-menu" class="mobile-nav-menu">
        <nav class="mobile-menu-nav">
            <a href="/app/" class="mobile-menu-link ${activePage === 'app' ? 'active' : ''}">App</a>
            <a href="/api/" class="mobile-menu-link ${activePage === 'api' ? 'active' : ''}">Docs</a>
        </nav>
    </div>
    ` : ''}
    `;
}

function getFooterHTML() {
    return `
    <footer class="page-footer">
        <p class="footer-copyright">&copy; 2026 QR Maker | <a href="/terms/" class="footer-link footer-terms">Terms</a> | <a href="/terms/#privacy-policy" class="footer-link">Privacy</a> | <a href="/api/" class="footer-link">API</a> | <a href="/" class="footer-link">About</a><span class="footer-app-link"> | <a href="/app/" class="footer-link">QR Maker</a></span></p>
    </footer>
    `;
}

function getHeadHTML() {
    return `
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <meta name="google" content="notranslate">
    <script>
        // Theme initialization to prevent flicker
        (function () {
            const savedTheme = localStorage.getItem('qrm-theme') || 'dark';
            if (savedTheme === 'system') {
                const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
                document.documentElement.setAttribute('data-theme-mode', 'system');
            } else {
                document.documentElement.setAttribute('data-theme', savedTheme);
                document.documentElement.removeAttribute('data-theme-mode');
            }
        })();
    </script>
    <!-- Preconnect Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@500;700;800&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">
    
    <!-- Favicons -->
    <link rel="icon" type="image/png" href="/assets/favicon/favicon-96x96.png?v=2" sizes="96x96" />
    <link rel="icon" type="image/svg+xml" href="/assets/favicon/favicon.svg?v=2" />
    <link rel="shortcut icon" href="/assets/favicon/favicon.ico?v=2" />
    <link rel="apple-touch-icon" sizes="180x180" href="/assets/favicon/apple-touch-icon.png?v=2" />
    <meta name="apple-mobile-web-app-title" content="QR Maker" />

    <!-- Global Style -->
    <link rel="stylesheet" href="/css/style.css">

    <!-- Global SEO & Social Sharing -->
    <meta property="og:site_name" content="QR Maker" />
    <meta property="og:image" content="https://qrmaker.ryanmarch.me/assets/og-image.png" />
    `;
}

class TemplateHandler {
    element(element) {
        if (element.tagName === 'global-head') {
            element.replace(getHeadHTML(), { html: true });
        }
        if (element.tagName === 'global-header') {
            const activePage = element.getAttribute('active-page') || '';
            const showBadge = element.getAttribute('show-badge') || '';
            const sidebarToggle = element.hasAttribute('sidebar-toggle');
            element.replace(getHeaderHTML(activePage, showBadge, sidebarToggle), { html: true });
        }
        if (element.tagName === 'global-footer') {
            element.replace(getFooterHTML(), { html: true });
        }
    }
}

export async function onRequest(context) {
    const response = await context.next();

    if (response.headers.get("content-type")?.includes("text/html")) {
        return new HTMLRewriter()
            .on('global-head', new TemplateHandler())
            .on('global-header', new TemplateHandler())
            .on('global-footer', new TemplateHandler())
            .transform(response);
    }
    return response;
}