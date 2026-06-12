const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      callback(dirPath);
    }
  });
}

const appDir = path.join(__dirname, '../src/app');

const replacements = [
  { regex: /stroke-width=/g, replacement: 'strokeWidth=' },
  { regex: /stroke-linecap=/g, replacement: 'strokeLinecap=' },
  { regex: /stroke-linejoin=/g, replacement: 'strokeLinejoin=' },
  { regex: /clip-rule=/g, replacement: 'clipRule=' },
  { regex: /fill-rule=/g, replacement: 'fillRule=' }
];

walkDir(appDir, (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let replacedCount = 0;
    
    for (const rep of replacements) {
      const countBefore = (content.match(rep.regex) || []).length;
      if (countBefore > 0) {
        content = content.replace(rep.regex, rep.replacement);
        console.log(`[${path.basename(filePath)}] Replaced ${countBefore} occurrences of ${rep.regex}`);
        replacedCount += countBefore;
      }
    }
    
    if (replacedCount > 0) {
      fs.writeFileSync(filePath, content, 'utf8');
    }
  }
});

console.log('All files checked and fixed.');
