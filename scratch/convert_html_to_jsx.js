const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'backup_static', 'index.html');
const jsxPath = path.join(__dirname, '..', 'scratch', 'body_jsx.txt');

if (!fs.existsSync(htmlPath)) {
  console.error('HTML file not found:', htmlPath);
  process.exit(1);
}

let html = fs.readFileSync(htmlPath, 'utf8');

const bodyRegex = /<body>([\s\S]*?)<\/body>/i;
const bodyMatch = html.match(bodyRegex);

if (!bodyMatch) {
  console.error('Body tag not found!');
  process.exit(1);
}

let body = bodyMatch[1];

const scripts = [];
const scriptRegex = /<script>([\s\S]*?)<\/script>/gi;
body = body.replace(scriptRegex, (match, scriptContent) => {
  scripts.push(scriptContent);
  return '';
});

body = body.replace(/class=/g, 'className=');

body = body.replace(/style="([^"]*)"/g, (match, styleStr) => {
  const parts = styleStr.split(';').map(p => p.trim()).filter(Boolean);
  const objEntries = parts.map(part => {
    const idx = part.indexOf(':');
    if (idx === -1) return '';
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    const camelKey = key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    return `"${camelKey}": "${value}"`;
  }).filter(Boolean);
  return `style={{ ${objEntries.join(', ')} }}`;
});

const tagsToSelfClose = ['img', 'br', 'input', 'source', 'hr', 'meta', 'link'];
for (const tag of tagsToSelfClose) {
  const tagRegex = new RegExp(`<(${tag})([^>]*?)(?<!/)>`, 'gi');
  body = body.replace(tagRegex, `<$1$2 />`);
}

body = body.replace(/\bautoplay\b/gi, 'autoPlay');
body = body.replace(/\bmuted\b/gi, 'muted');
body = body.replace(/\bloop\b/gi, 'loop');
body = body.replace(/\bplaysinline\b/gi, 'playsInline');
body = body.replace(/\bpreload=/gi, 'preload=');
body = body.replace(/\bonclick=/gi, 'onClick=');

// Convert HTML comments to JSX comments
body = body.replace(/<!--([\s\S]*?)-->/g, '{/*$1*/}');

fs.writeFileSync(jsxPath, body, 'utf8');
fs.writeFileSync(path.join(__dirname, '..', 'scratch', 'scripts.js'), scripts.join('\n\n'), 'utf8');

console.log('JSX body and script extracted to scratch folder!');
