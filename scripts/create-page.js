const fs = require('fs');
const path = require('path');

// Helper to parse arguments
function parseArgs() {
    const args = process.argv.slice(2);
    const params = {
        name: '',
        type: 'content', // default
        title: ''
    };

    args.forEach(arg => {
        if (arg.startsWith('--name=')) {
            params.name = arg.split('=')[1];
        } else if (arg.startsWith('--type=')) {
            params.type = arg.split('=')[1];
        } else if (arg.startsWith('--title=')) {
            params.title = arg.split('=')[1];
        } else if (!arg.startsWith('--')) {
            // Positional arguments fallback
            if (!params.name) {
                params.name = arg;
            } else if (!params.type) {
                params.type = arg;
            }
        }
    });

    return params;
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function cleanName(name) {
    return name.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
}

function run() {
    const params = parseArgs();

    if (!params.name) {
        console.error('Error: Please specify a page name.');
        console.log('Usage: npm run create-page -- --name=<page-name> [--type=content|fullwidth] [--title="Page Title"]');
        process.exit(1);
    }

    const name = cleanName(params.name);
    const type = ['content', 'fullwidth'].includes(params.type) ? params.type : 'content';
    const displayTitle = params.title || `${capitalize(name)} — QR Maker`;
    
    const pageDir = path.resolve(__dirname, '..', name);

    if (fs.existsSync(pageDir)) {
        console.error(`Error: Directory /${name} already exists.`);
        process.exit(1);
    }

    // Create page directory
    fs.mkdirSync(pageDir, { recursive: true });

    // Generate HTML Content
    let htmlContent = '';
    if (type === 'content') {
        htmlContent = `<!DOCTYPE html>
<html lang="en" translate="no">

<head>
    <meta charset="UTF-8">
    <global-head></global-head>

    <title>${displayTitle}</title>
    <meta name="description" content="Description for ${displayTitle}.">
    <link rel="canonical" href="https://qrmaker.ryanmarch.me/${name}/">

    <!-- Open Graph -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://qrmaker.ryanmarch.me/${name}/">
    <meta property="og:title" content="${displayTitle}">
    <meta property="og:description" content="Description for ${displayTitle}.">

    <link rel="stylesheet" href="style.css">
</head>

<body>
    <global-header active-page="${name}" sidebar-toggle></global-header>

    <!-- Mobile Navigation Overlay -->
    <div id="mobile-overlay" class="mobile-overlay"></div>

    <!-- Main Container -->
    <main class="page-container-sidebar">
        <!-- Sidebar Navigation -->
        <nav class="page-sidebar" aria-label="Sections">
            <div class="sidebar-site-nav">
                <a href="/app/" class="sidebar-site-link">App</a>
                <a href="/api/" class="sidebar-site-link">API</a>
            </div>
            <hr class="sidebar-divider">
            <ul>
                <li><a href="#section-1" class="sidebar-link active">Section 1</a></li>
                <li><a href="#section-2" class="sidebar-link">Section 2</a></li>
            </ul>
        </nav>

        <!-- Content Area -->
        <section class="page-content" aria-label="${displayTitle}">
            <article id="section-1" class="doc-section">
                <h1>${displayTitle}</h1>
                <p>Welcome to the ${name} page. Start adding content here.</p>
            </article>

            <article id="section-2" class="doc-section">
                <h2>Section 2</h2>
                <p>Add supplementary details here.</p>
            </article>
        </section>
    </main>

    <script src="/js/header.js" defer></script>
</body>

</html>
`;
    } else {
        htmlContent = `<!DOCTYPE html>
<html lang="en" translate="no">

<head>
    <meta charset="UTF-8">
    <global-head></global-head>

    <title>${displayTitle}</title>
    <meta name="description" content="Description for ${displayTitle}.">
    <link rel="canonical" href="https://qrmaker.ryanmarch.me/${name}/">

    <!-- Open Graph -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://qrmaker.ryanmarch.me/${name}/">
    <meta property="og:title" content="${displayTitle}">
    <meta property="og:description" content="Description for ${displayTitle}.">

    <link rel="stylesheet" href="style.css">
</head>

<body>
    <global-header active-page="${name}"></global-header>

    <!-- Main Container -->
    <main class="page-container">
        <section class="hero-section">
            <h1>${displayTitle}</h1>
            <p class="lead">Add a sub-heading or description here.</p>
        </section>

        <section class="content-section">
            <p>Your fullwidth content goes here. You can use standard section components or grid layouts.</p>
        </section>
    </main>

    <script src="/js/header.js" defer></script>
</body>

</html>
`;
    }

    // Generate CSS Content
    let cssContent = '';
    if (type === 'content') {
        cssContent = `/* ============================================================
   QR Maker - ${displayTitle} — style.css
   ============================================================ */

:root {
    --radius-md: 8px;
}

body {
    background-color: var(--bg-color);
    color: var(--text-main);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    line-height: 1.6;
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    overflow-x: hidden;
}

/* --- Layout Structure --- */
.page-container-sidebar {
    display: flex;
    margin-top: 60px;
    min-height: calc(100vh - 60px);
}

.page-content {
    flex: 1;
    min-width: 0;
    width: 100%;
    margin: 0 auto;
    padding: 3rem 4rem 5rem 3.5rem;
    max-width: 960px;
}

/* --- Sidebar Navigation --- */
.page-sidebar {
    width: 260px;
    background-color: var(--sidebar-bg);
    border-right: 1px solid var(--border-color);
    padding: 2rem 1.5rem;
    position: sticky;
    top: 60px;
    height: calc(100vh - 60px);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    flex-shrink: 0;
}

.page-sidebar ul {
    list-style: none;
    padding: 0;
    margin: 0;
}

.sidebar-link {
    display: block;
    padding: 0.5rem 0.75rem;
    color: var(--text-muted);
    text-decoration: none;
    font-size: 0.9rem;
    border-radius: var(--radius-sm);
    transition: color 0.15s, background-color 0.15s;
}

.sidebar-link:hover {
    color: var(--text-main);
    background-color: var(--control-bg);
}

.sidebar-link.active {
    color: var(--text-main);
    font-weight: 500;
    background-color: var(--control-bg-hover);
}

@media (max-width: 768px) {
    .page-container-sidebar {
        flex-direction: column;
    }
    .page-sidebar {
        display: none; /* Relies on mobile drawer styles if customized */
    }
    .page-content {
        padding: 2rem 1.5rem;
    }
}
`;
    } else {
        cssContent = `/* ============================================================
   QR Maker - ${displayTitle} (Fullwidth) — style.css
   ============================================================ */

body {
    background-color: var(--bg-color);
    color: var(--text-main);
    font-family: 'Inter', sans-serif;
    margin: 0;
    padding: 0;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

/* Container */
.page-container {
    flex: 1;
    max-width: 1200px;
    margin: 60px auto 0 auto;
    padding: 3rem 1.5rem;
    box-sizing: border-box;
    width: 100%;
}

/* Hero Section */
.hero-section {
    text-align: center;
    margin-bottom: 4rem;
}

.hero-section h1 {
    font-family: 'Outfit', sans-serif;
    font-size: 3rem;
    font-weight: 800;
    margin: 0 0 1rem 0;
}

.hero-section .lead {
    font-size: 1.25rem;
    color: var(--text-muted);
    max-width: 600px;
    margin: 0 auto;
}

/* Content Section */
.content-section {
    max-width: 800px;
    margin: 0 auto;
    line-height: 1.7;
}
`;
    }

    fs.writeFileSync(path.join(pageDir, 'index.html'), htmlContent, 'utf8');
    fs.writeFileSync(path.join(pageDir, 'style.css'), cssContent, 'utf8');

    console.log(`\n🎉 Page /${name} successfully created!`);
    console.log(`📂 Path: ${pageDir}`);
    console.log(`- Created index.html (Type: ${type})`);
    console.log(`- Created style.css`);
    console.log(`\nNext Steps:`);
    console.log(`1. Add sitemap entry in /sitemap.xml`);
    console.log(`2. Update functions/_middleware.js (if adding it to global headers/footers)`);
}

run();
