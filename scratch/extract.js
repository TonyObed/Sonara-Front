const fs = require('fs');
const path = require('path');

function extractDocxText(xmlPath, outputPath) {
  if (!fs.existsSync(xmlPath)) {
    console.error('File not found:', xmlPath);
    return;
  }
  const xml = fs.readFileSync(xmlPath, 'utf8');
  
  const paragraphs = xml.split(/<w:p\b[^>]*>/);
  const resultLines = [];
  
  for (const p of paragraphs) {
    let pText = '';
    const tRegex = /<w:t[^>]*>([\s\S]*?)<\/w:t>/g;
    let tMatch;
    while ((tMatch = tRegex.exec(p)) !== null) {
      pText += tMatch[1];
    }
    if (pText.trim().length > 0) {
      resultLines.push(pText);
    }
  }
  
  fs.writeFileSync(outputPath, resultLines.join('\n\n'), 'utf8');
  console.log('Successfully wrote text to', outputPath);
}

const doc1Xml = path.join(__dirname, 'doc1', 'word', 'document.xml');
const doc2Xml = path.join(__dirname, 'doc2', 'word', 'document.xml');

extractDocxText(doc1Xml, path.join(__dirname, 'doc1_text.txt'));
extractDocxText(doc2Xml, path.join(__dirname, 'doc2_text.txt'));
