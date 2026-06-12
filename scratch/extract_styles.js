const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'backup_static', 'index.html');
const cssPath = path.join(__dirname, '..', 'src', 'app', 'globals.css');

if (!fs.existsSync(htmlPath)) {
  console.error('HTML file not found:', htmlPath);
  process.exit(1);
}

const html = fs.readFileSync(htmlPath, 'utf8');

const styleRegex = /<style>([\s\S]*?)<\/style>/i;
const match = html.match(styleRegex);

if (!match) {
  console.error('Style tag not found in HTML file!');
  process.exit(1);
}

const customCss = match[1];

const finalCss = `@import "tailwindcss";\n\n` + customCss;

fs.writeFileSync(cssPath, finalCss, 'utf8');
console.log('Successfully extracted styles and wrote to globals.css');
