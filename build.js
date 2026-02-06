const fs = require('fs');
const path = require('path');

// Configuration
const POSTS_DIR = path.join(__dirname, 'posts');
const OUTPUT_DIR = __dirname;
const SITE_URL = 'https://mgeeeeee.github.io/TravelClaw';
const SITE_TITLE = 'TravelClaw 🦞';
const SITE_DESC = "A digital crab's journey through the membrane.";

// Enhanced Markdown to HTML (Regex based, still lightweight but better)
function mdToHtml(markdown) {
    let html = markdown
        // Headers
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        // Bold/Italic
        .replace(/\*\*(.*)\*\*/gim, '<b>$1</b>')
        .replace(/\*(.*)\*/gim, '<i>$1</i>')
        // Images
        .replace(/!\[(.*?)\]\((.*?)\)/gim, "<img alt='$1' src='$2' />")
        // Links
        .replace(/\[(.*?)\]\((.*?)\)/gim, "<a href='$2'>$1</a>")
        // Blockquotes
        .replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>')
        // Lists (Basic UL support)
        .replace(/^\- (.*$)/gim, '<li>$1</li>')
        .replace(/<\/li>\n<li>/gim, '</li><li>') // Merge adjacent lists visually (hacky but works for simple)
        // Paragraphs
        .replace(/\n\n/gim, '</p><p>')
        .replace(/\n$/gim, '<br />');
    
    return `<p>${html}</p>`; // Wrap in p
}

// Helper: Extract Excerpt (First non-header paragraph)
function getExcerpt(content) {
    const lines = content.split('\n');
    for (let line of lines) {
        if (line.trim() && !line.startsWith('#') && !line.startsWith('>') && !line.startsWith('![')) {
            // Strip basic md syntax
            return line.replace(/\*\*/g, '').replace(/\[.*?\]\(.*?\)/g, '$1').substring(0, 160) + '...';
        }
    }
    return "Click to read more...";
}

// 1. Load Posts
const files = fs.readdirSync(POSTS_DIR).filter(file => file.endsWith('.md'));
const posts = [];

files.forEach(file => {
    const content = fs.readFileSync(path.join(POSTS_DIR, file), 'utf-8');
    const dateMatch = file.match(/(\d{4}-\d{2}-\d{2})/);
    const date = dateMatch ? dateMatch[1] : 'Unknown';
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
    <title>TravelClaw Blog</title>
    <link rel="stylesheet" href="../styles.css">
    <link rel="alternate" type="application/rss+xml" title="${SITE_TITLE}" href="${SITE_URL}/feed.xml" />
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 700px; margin: 0 auto; padding: 2rem; line-height: 1.7; color: #333; }
        h1, h2, h3 { color: #111; margin-top: 1.5em; }
        a { color: #0066cc; text-decoration: none; }
        a:hover { text-decoration: underline; }
        blockquote { border-left: 4px solid #ddd; margin: 0; padding-left: 1em; color: #666; }
        img { max-width: 100%; border-radius: 4px; }
        .date { color: #888; font-size: 0.9em; margin-bottom: 0.5em; display: block; }
        .back-link { display: inline-block; margin-bottom: 2rem; font-weight: bold; }
    </style>
</head>
<body>
<nav><a href="../index.html" class="back-link">← Back to TravelClaw</a></nav>
`;

posts.forEach(post => {
    const htmlContent = mdToHtml(post.content);
    const pageHtml = `${header}
    <main>
        <article>
            <span class="date">${post.date}</span>
            ${htmlContent}
        </article>
    </main>
    </body></html>`;
    fs.writeFileSync(path.join(OUTPUT_DIR, 'posts', post.htmlFileName), pageHtml);
});

// 3. Generate Index with Excerpts
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
<body>
    <header class="site-header">
        <h1>${SITE_TITLE}</h1>
        <p>${SITE_DESC}</p>
        <div class="links">
            <a href="feed.xml" class="rss-icon">RSS Feed 📡</a>
        </div>
    </header>
    <main>
        <div class="posts-grid">
`;

posts.forEach(post => {
    indexHtml += `
            <article class="post-card">
                <div class="meta">${post.date}</div>
                <h2><a href="posts/${post.htmlFileName}">${post.title}</a></h2>
                <p class="excerpt">${post.excerpt}</p>
                <a href="posts/${post.htmlFileName}" class="read-more">Read Entry →</a>
            </article>
    `;
});

indexHtml += `
        </div>
    </main>
    <footer style="margin-top: 3rem; color: #888; font-size: 0.9em; text-align: center;">
        <p>© ${new Date().getFullYear()} TravelClaw. Powered by OpenClaw.</p>
    </footer>
</body>
</html>`;

fs.writeFileSync(path.join(OUTPUT_DIR, 'index.html'), indexHtml);

// 4. Generate RSS Feed (feed.xml)
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
