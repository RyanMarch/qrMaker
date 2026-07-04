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
                <a href="/" class="nav-link ${activePage === 'app' ? 'active' : ''}">App</a>
                <a href="/about/" class="nav-link ${activePage === 'about' ? 'active' : ''}">About</a>
                <a href="/api/" class="nav-link ${activePage === 'api' ? 'active' : ''}">API</a>
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
            <a href="/" class="mobile-menu-link ${activePage === 'app' ? 'active' : ''}">App</a>
            <a href="/about/" class="mobile-menu-link ${activePage === 'about' ? 'active' : ''}">About</a>
            <a href="/api/" class="mobile-menu-link ${activePage === 'api' ? 'active' : ''}">API</a>
        </nav>
    </div>
    ` : ''}
    `;
}

function getFooterHTML() {
    return `
    <footer class="page-footer">
        <p class="footer-copyright">&copy; 2026 QR Maker. All rights reserved. <br> <a href="/terms/" class="footer-link footer-terms">Terms of Service</a > | <a href="/terms/#privacy-policy" class="footer-link">Privacy Policy</a> <span class="footer-app-link"> | <a href="/" class="footer-link">QR Maker</a></span></p>
    </footer>
    `;
}

class TemplateHandler {
    element(element) {
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
            .on('global-header', new TemplateHandler())
            .on('global-footer', new TemplateHandler())
            .transform(response);
    }
    return response;
}