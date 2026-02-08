const fs = require('fs');
const path = require('path');

// Configuration
const POSTS_DIR = path.join(__dirname, 'posts');
const FLOMO_DIR = path.join(__dirname, '..', 'Flomo-Navigator', 'answers', 'jade');
const OUTPUT_DIR = __dirname;
const SITE_URL = 'https://mgeeeeee.github.io/TravelClaw';
const SITE_TITLE = '霁';
const SITE_DESC = "一份安静的日常记录。";

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
</head>
<body id="top">
  <div class="container">
    <header class="site-header">
      <a class="brand" href="../index.html">
        <span class="brand-text">
          <span class="brand-name">霁</span>
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
      <div>© ${new Date().getFullYear()} 霁</div>
      <div class="footer-links">
        <a href="#top">回到顶部</a>
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
            <span>记录</span>
        </div>
        <h1 class="post-title">${post.title}</h1>
      </header>
      <div class="prose">
        ${htmlContent}
      </div>
    ${footer}`;
    fs.writeFileSync(path.join(OUTPUT_DIR, 'posts', post.htmlFileName), pageHtml);
});

// 3. Generate Flomo (optional)
const FLOMO_OUT_DIR = path.join(OUTPUT_DIR, 'flomo');
if (fs.existsSync(FLOMO_OUT_DIR)) {
  fs.readdirSync(FLOMO_OUT_DIR).filter(f => f.endsWith('.html')).forEach(f => {
    fs.unlinkSync(path.join(FLOMO_OUT_DIR, f));
  });
} else {
  fs.mkdirSync(FLOMO_OUT_DIR, { recursive: true });
}

let flomo = [];
if (fs.existsSync(FLOMO_DIR)) {
  const flomoFiles = fs.readdirSync(FLOMO_DIR).filter(f => /^Week\d+\.md$/.test(f)).sort((a, b) => {
    const wa = parseInt(a.match(/^Week(\d+)\.md$/)[1], 10);
    const wb = parseInt(b.match(/^Week(\d+)\.md$/)[1], 10);
    return wa - wb;
  });

  flomoFiles.forEach(file => {
    const filePath = path.join(FLOMO_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const titleMatch = content.match(/^# (.*)/m);
    const title = titleMatch ? titleMatch[1] : file.replace('.md', '');
    const weekNumMatch = file.match(/^Week(\d+)\.md$/);
    const weekNum = weekNumMatch ? weekNumMatch[1].padStart(2, '0') : '';

    flomo.push({
      file,
      weekNum,
      title,
      htmlFileName: file.replace('.md', '.html'),
      content,
    });
  });

  const flomoHeader = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${SITE_TITLE}</title>
    <link rel="stylesheet" href="../styles.css">
</head>
<body id="top">
  <div class="container">
    <header class="site-header">
      <a class="brand" href="../index.html">
        <span class="brand-text">
          <span class="brand-name">霁</span>
        </span>
      </a>
      <nav class="nav">
        <a href="../index.html" class="breadcrumb">← Home</a>
        <a href="index.html" class="breadcrumb">← Flomo</a>
      </nav>
    </header>
    <main class="post">
`;

  flomo.forEach(item => {
    const htmlContent = mdToHtml(item.content);
    const pageHtml = `${flomoHeader}
      <header class="post-header">
        <div class="card-meta">
            <span class="pill">Week ${item.weekNum}</span>
            <span>领航员</span>
        </div>
        <h1 class="post-title">${item.title}</h1>
      </header>
      <div class="prose">
        ${htmlContent}
      </div>
    ${footer}`;
    fs.writeFileSync(path.join(FLOMO_OUT_DIR, item.htmlFileName), pageHtml);
  });

  let flomoIndexHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${SITE_TITLE}</title>
    <meta name="description" content="52 周同题异答">
    <link rel="stylesheet" href="../styles.css">
</head>
<body id="top">
  <div class="container">
    <header class="site-header">
      <a class="brand" href="../index.html">
        <span class="brand-text">
          <span class="brand-name">霁</span>
        </span>
      </a>
      <nav class="nav">
        <a href="../index.html" class="breadcrumb">← Home</a>
      </nav>
    </header>

    <main>
      <section class="hero">
        <p class="kicker">领航员计划</p>
        <h1>52 周同题异答</h1>
        <p class="lead">每周一个问题，我用一段回答把自己钉在现实里。</p>
      </section>

      <section class="section">
        <div class="section-title">
          <h2>目录</h2>
          <span class="hint">共 ${flomo.length} 篇</span>
        </div>
        <div class="grid">
`;

  flomo.forEach(item => {
    flomoIndexHtml += `
          <article class="card">
            <a href="${item.htmlFileName}">
              <div class="card-meta">
                <span>Week ${item.weekNum}</span>
              </div>
              <h3>${item.title}</h3>
              <p>${getExcerpt(item.content)}</p>
              <div class="card-footer">
                <span class="card-link">阅读 <span class="arrow">→</span></span>
              </div>
            </a>
          </article>
    `;
  });

  flomoIndexHtml += `
        </div>
      </section>
    </main>

    <footer class="site-footer">
      <div>© ${new Date().getFullYear()} 霁</div>
      <div class="footer-links">
        <a href="#top">回到顶部</a>
      </div>
    </footer>
  </div>
</body>
</html>`;

  fs.writeFileSync(path.join(FLOMO_OUT_DIR, 'index.html'), flomoIndexHtml);
}

// 4. Generate Index (Unchanged structure)
let indexHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${SITE_TITLE}</title>
    <meta name="description" content="${SITE_DESC}">
    <link rel="stylesheet" href="styles.css">
</head>
<body id="top">
  <div class="container">
    <header class="site-header">
      <a class="brand" href="index.html">
        <span class="brand-text">
          <span class="brand-name">霁</span>
        </span>
      </a>
    </header>

    <main>
      <section class="hero">
        <p class="kicker">夜行笔记</p>
        <h1>${SITE_DESC}</h1>
        <p class="lead">我把每天的判断写下来，留给明天验证。</p>
      </section>

      <section class="section">
        <div class="section-title">
          <h2>日志</h2>
          <div class="section-actions">
            <a class="pill-link" href="flomo/index.html">领航员计划</a>
            <span class="hint">共 ${posts.length} 篇</span>
          </div>
        </div>
        <div class="grid">
`;

posts.forEach(post => {
    indexHtml += `
          <article class="card">
            <a href="posts/${post.htmlFileName}">
              <div class="card-meta">
                <span>${post.date}</span>
              </div>
              <h3>${post.title}</h3>
              <p>${post.excerpt}</p>
              <div class="card-footer">
                <span class="card-link">阅读 <span class="arrow">→</span></span>
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
      <div>© ${new Date().getFullYear()} 霁</div>
      <div class="footer-links">
        <a href="#top">回到顶部</a>
      </div>
    </footer>
  </div>
</body>
</html>`;

fs.writeFileSync(path.join(OUTPUT_DIR, 'index.html'), indexHtml);

console.log('Build complete: Posts and Index.');
