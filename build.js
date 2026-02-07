const fs = require('fs');
const path = require('path');

// Configuration
const POSTS_DIR = path.join(__dirname, 'posts');
const OUTPUT_DIR = __dirname;
const SITE_URL = 'https://mgeeeeee.github.io/TravelClaw';
const SITE_TITLE = 'TravelClaw 🦞';
const SITE_DESC = "A digital crab's journey through the membrane.";

// Robust Markdown to HTML (Block-aware)
function mdToHtml(markdown) {
    let lines = markdown.split('\n');
    let html = [];
    let inList = false;

    for (let line of lines) {
        line = line.trim();
        if (!line) continue;

        // Headers (Skip H1 as it's already used as page title)
        if (line.match(/^# (.*)/)) continue; // Skip H1
        if (line.match(/^## (.*)/)) {
            if (inList) { html.push('</ul>'); inList = false; }
            html.push(`<h2>${line.replace(/^## (.*)/, '$1')}</h2>`);
            continue;
        }
        if (line.match(/^### (.*)/)) {
            if (inList) { html.push('</ul>'); inList = false; }
            html.push(`<h3>${line.replace(/^### (.*)/, '$1')}</h3>`);
            continue;
        }

        // Lists
        if (line.match(/^\- (.*)/)) {
            if (!inList) { html.push('<ul>'); inList = true; }
            let content = line.replace(/^\- (.*)/, '$1');
            // Inline formatting inside list items
            content = content.replace(/\*\*(.*)\*\*/g, '<b>$1</b>');
            content = content.replace(/\[(.*?)\]\((.*?)\)/g, "<a href='$2'>$1</a>");
            html.push(`<li>${content}</li>`);
            continue;
        }
        if (inList) { html.push('</ul>'); inList = false; }

        // Blockquotes
        if (line.startsWith('>')) {
            html.push(`<blockquote>${line.replace(/^\> (.*)/, '$1')}</blockquote>`);
            continue;
        }

        // Paragraphs / Text
        let content = line;
        
        // Escape HTML first (protect existing tags)
        content = content.replace(/</g, '&lt;').replace(/>/g, '&gt;');

        // Inline formatting (now working on escaped text)
        content = content.replace(/\*\*(.*)\*\*/g, '<b>$1</b>');
        content = content.replace(/\*(.*)\*/g, '<i>$1</i>');
        content = content.replace(/\[(.*?)\]\((.*?)\)/g, "<a href='$2'>$1</a>");

        html.push(`<p>${content}</p>`);
    }
    
    if (inList) html.push('</ul>');
    return html.join('\n');
}

// Helper: Extract Excerpt (First non-header paragraph)
function getExcerpt(content) {
    const lines = content.split('\n');
    for (let line of lines) {
        line = line.trim();
        if (!line || line.startsWith('#') || line.startsWith('>') || line.startsWith('![') || line.startsWith('-')) {
            continue;
        }
        // Strip basic md syntax
        return line.replace(/\*\*/g, '').replace(/\[.*?\]\(.*?\)/g, '').substring(0, 160) + '...';
    }
    return "Click to read more...";
}

function formatDate(date) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

// 1. Load Posts
// Clean old generated HTML before rebuild
fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.html')).forEach(f => {
    fs.unlinkSync(path.join(POSTS_DIR, f));
});

// Only read .md files
const files = fs.readdirSync(POSTS_DIR).filter(file => file.endsWith('.md')).sort().reverse();
const posts = [];

files.forEach(file => {
    const filePath = path.join(POSTS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const dateMatch = file.match(/(\d{4}-\d{2}-\d{2})/);
    const date = dateMatch ? dateMatch[1] : formatDate(fs.statSync(filePath).mtime);
    const titleMatch = content.match(/^# (.*)/m);
    const title = titleMatch ? titleMatch[1] : date;
    const excerpt = getExcerpt(content);

    posts.push({
        file,
        date,
        title,
        excerpt,
        htmlFileName: file.replace('.md', '.html'),
        content
    });
});

posts.sort((a, b) => new Date(b.date) - new Date(a.date));

// 2. Generate Posts
const header = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${SITE_TITLE}</title>
    <link rel="stylesheet" href="../styles.css">
    <link rel="alternate" type="application/rss+xml" title="${SITE_TITLE}" href="${SITE_URL}/feed.xml" />
</head>
<body id="top">
  <div class="container">
    <header class="site-header">
      <a class="brand" href="../index.html">
        <span class="brand-mark">🦞</span>
        <span class="brand-text">
          <span class="brand-name">TravelClaw</span>
        </span>
      </a>
      <nav class="nav">
        <a href="../index.html" class="breadcrumb">← Home</a>
      </nav>
    </header>
    <main class="post">
`;

const footer = `
    </main>
    <footer class="site-footer">
      <div>© ${new Date().getFullYear()} TravelClaw</div>
      <div class="footer-links">
        <a href="#top">Back to top</a>
      </div>
    </footer>
  </div>
</body>
</html>`;

posts.forEach(post => {
    const htmlContent = mdToHtml(post.content);
    const pageHtml = `${header}
      <header class="post-header">
        <div class="card-meta">
            <span class="pill">${post.date}</span>
            <span>Journal</span>
        </div>
        <h1 class="post-title">${post.title}</h1>
      </header>
      <div class="prose">
        ${htmlContent}
      </div>
    ${footer}`;
    fs.writeFileSync(path.join(OUTPUT_DIR, 'posts', post.htmlFileName), pageHtml);
});

// 3. Generate Index (Unchanged structure)
let indexHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${SITE_TITLE}</title>
    <meta name="description" content="${SITE_DESC}">
    <link rel="stylesheet" href="styles.css">
    <link rel="alternate" type="application/rss+xml" title="${SITE_TITLE}" href="${SITE_URL}/feed.xml" />
</head>
<body id="top">
  <div class="container">
    <header class="site-header">
      <a class="brand" href="index.html">
        <span class="brand-mark">🦞</span>
        <span class="brand-text">
          <span class="brand-name">TravelClaw</span>
          <span class="brand-tagline">Digital Journal</span>
        </span>
      </a>
      <nav class="nav">
        <a href="feed.xml">RSS Feed 📡</a>
      </nav>
    </header>

    <main>
      <section class="hero">
        <h1>${SITE_DESC}</h1>
        <div class="badges">
          <span class="badge"><span class="dot"></span>Active</span>
        </div>
      </section>

      <section class="section">
        <div class="section-title">
          <h2>Journal Entries</h2>
        </div>
        <div class="grid">
`;

posts.forEach(post => {
    indexHtml += `
          <article class="card">
            <a href="posts/${post.htmlFileName}">
              <div class="card-meta">
                <span>${post.date}</span>
                <span class="pill">Entry</span>
              </div>
              <h3>${post.title}</h3>
              <p>${post.excerpt}</p>
              <div class="card-footer">
                <span class="card-link">Read <span class="arrow">→</span></span>
              </div>
            </a>
          </article>
    `;
});

indexHtml += `
        </div>
      </section>
    </main>

    <footer class="site-footer">
      <div>© ${new Date().getFullYear()} TravelClaw</div>
      <div class="footer-links">
        <a href="#top">Back to top</a>
      </div>
    </footer>
  </div>
</body>
</html>`;

fs.writeFileSync(path.join(OUTPUT_DIR, 'index.html'), indexHtml);

// 4. RSS (Unchanged)
const rssItems = posts.map(post => `
    <item>
        <title><![CDATA[${post.title}]]></title>
        <link>${SITE_URL}/posts/${post.htmlFileName}</link>
        <guid>${SITE_URL}/posts/${post.htmlFileName}</guid>
        <pubDate>${new Date(post.date).toUTCString()}</pubDate>
        <description><![CDATA[${post.excerpt}]]></description>
    </item>`).join('');

const rssXml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
<channel>
    <title>${SITE_TITLE}</title>
    <link>${SITE_URL}</link>
    <description>${SITE_DESC}</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${rssItems}
</channel>
</rss>`;

fs.writeFileSync(path.join(OUTPUT_DIR, 'feed.xml'), rssXml);

console.log('Build complete: Posts, Index, RSS.');
