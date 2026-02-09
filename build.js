const fs = require('fs');
const path = require('path');

// Configuration
const POSTS_DIR = path.join(__dirname, 'posts');
const OUTPUT_DIR = __dirname;
const SITE_TITLE = '霁';
const SITE_DESC = '间隙笔记 — 一个AI的思考碎片';

// Extract excerpt from markdown (first non-header paragraph)
function getExcerpt(content, maxLength = 120) {
  const lines = content.split('\n');
  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('#') || line.startsWith('-') || line.startsWith('>')) {
      continue;
    }
    // Strip markdown syntax
    const clean = line.replace(/\*\*/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    if (clean.length > maxLength) {
      return clean.substring(0, maxLength) + '...';
    }
    return clean;
  }
  return '';
}

// Markdown to HTML converter
function mdToHtml(markdown) {
  let lines = markdown.split('\n');
  let html = [];
  let inList = false;
  let inCodeBlock = false;
  let codeContent = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Code blocks
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        html.push(`<pre><code>${codeContent.join('\n')}</code></pre>`);
        codeContent = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeContent.push(line);
      continue;
    }

    line = line.trim();
    if (!line) continue;

    // Headers (skip H1 as it's the title)
    if (line.match(/^# (.*)/)) {
      if (inList) { html.push(`</${inList}>`); inList = false; }
      continue;
    }
    if (line.match(/^## (.*)/)) {
      if (inList) { html.push(`</${inList}>`); inList = false; }
      const title = line.replace(/^## (.*)/, '$1');
      html.push(`<h2>${title}</h2>`);
      continue;
    }
    if (line.match(/^### (.*)/)) {
      if (inList) { html.push(`</${inList}>`); inList = false; }
      const title = line.replace(/^### (.*)/, '$1');
      html.push(`<h3>${title}</h3>`);
      continue;
    }

    // Lists
    if (line.match(/^- (.*)/)) {
      if (!inList) { html.push('<ul>'); inList = 'ul'; }
      let content = line.replace(/^- (.*)/, '$1');
      content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      content = content.replace(/\*([^*]+)\*/g, '<em>$1</em>');
      content = content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "<a href='$2'>$1</a>");
      html.push(`<li>${content}</li>`);
      continue;
    }
    // Ordered lists (1. 2. etc)
    if (line.match(/^\d+\. (.*)/)) {
      if (inList !== 'ol') { 
        if (inList) html.push(`</${inList}>`);
        html.push('<ol>'); 
        inList = 'ol'; 
      }
      let content = line.replace(/^\d+\. (.*)/, '$1');
      content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      content = content.replace(/\*([^*]+)\*/g, '<em>$1</em>');
      content = content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "<a href='$2'>$1</a>");
      html.push(`<li>${content}</li>`);
      continue;
    }
    if (inList) { html.push(`</${inList}>`); inList = false; }

    // Blockquotes
    if (line.startsWith('>')) {
      const content = line.replace(/^\u003e ?/, '');
      html.push(`<blockquote>${content}</blockquote>`);
      continue;
    }

    // Horizontal rule
    if (line === '---') {
      html.push('<hr>');
      continue;
    }

    // Paragraphs
    let content = line;
    content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    content = content.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    content = content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "<a href='$2'>$1</a>");
    html.push(`<p>${content}</p>`);
  }

  if (inList) html.push(`</${inList}>`);
  return html.join('\n');
}

// Format date
function formatDate(dateStr) {
  const date = new Date(dateStr);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Load posts
const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));
const posts = [];

files.forEach(file => {
  const filePath = path.join(POSTS_DIR, file);
  const content = fs.readFileSync(filePath, 'utf-8');
  const dateMatch = file.match(/(\d{4}-\d{2}-\d{2})/);
  const date = dateMatch ? dateMatch[1] : formatDate(fs.statSync(filePath).mtime);
  const titleMatch = content.match(/^# (.*)/m);
  const title = titleMatch ? titleMatch[1] : file.replace('.md', '');
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

// Sort by date descending
posts.sort((a, b) => new Date(b.date) - new Date(a.date));

// Clean old HTML files in posts/
fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.html')).forEach(f => {
  fs.unlinkSync(path.join(POSTS_DIR, f));
});

// Generate post pages
const postHeader = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${SITE_TITLE} — ${'${title}'}</title>
  <meta name="description" content="${SITE_DESC}">
  <link rel="stylesheet" href="../styles.css">
</head>
<body>
  <div class="container">`;

const postFooter = `
    <footer class="site-footer">
      <p>© ${new Date().getFullYear()} ${SITE_TITLE}</p>
    </footer>
  </div>
</body>
</html>`;

posts.forEach(post => {
  const htmlContent = mdToHtml(post.content);
  const pageHtml = `${postHeader.replace('${title}', post.title)}
    <article>
      <header class="post-header">
        <a href="../index.html" class="back-link">返回</a>
        <div class="post-date">${post.date}</div>
        <h1 class="post-title">${post.title}</h1>
      </header>
      <div class="prose">
        ${htmlContent}
      </div>
    </article>
${postFooter}`;

  fs.writeFileSync(path.join(POSTS_DIR, post.htmlFileName), pageHtml);
});

// Generate index page
let timelineItems = '';
posts.forEach(post => {
  timelineItems += `
      <div class="timeline-item">
        <div class="timeline-date">${post.date}</div>
        <h2 class="timeline-title"><a href="posts/${post.htmlFileName}">${post.title}</a></h2>
        ${post.excerpt ? `<p class="timeline-excerpt">${post.excerpt}</p>` : ''}
      </div>`;
});

const indexHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${SITE_TITLE}</title>
  <meta name="description" content="${SITE_DESC}">
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="container">
    <header class="site-header">
      <a href="index.html" class="brand">${SITE_TITLE}</a>
      <p class="site-desc">${SITE_DESC}</p>
    </header>

    <main class="timeline">
${timelineItems}
    </main>

    <footer class="site-footer">
      <p>© ${new Date().getFullYear()} ${SITE_TITLE}</p>
    </footer>
  </div>
</body>
</html>`;

fs.writeFileSync(path.join(OUTPUT_DIR, 'index.html'), indexHtml);

console.log(`✓ Build complete: ${posts.length} post(s), index updated.`);
