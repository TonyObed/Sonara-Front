const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function extractDocxText(docxPath, outputPath) {
  const tempDir = path.join(__dirname, 'temp_docx_extract');
  const tempZip = path.join(__dirname, 'temp_docx.zip');

  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  if (fs.existsSync(tempZip)) {
    fs.unlinkSync(tempZip);
  }

  fs.mkdirSync(tempDir, { recursive: true });

  try {
    // Copy docx to temp zip because Expand-Archive demands .zip extension
    fs.copyFileSync(docxPath, tempZip);

    const escapedZip = tempZip.replace(/'/g, "''");
    const escapedTemp = tempDir.replace(/'/g, "''");
    
    // Run PowerShell Expand-Archive
    execSync(`powershell -Command "Expand-Archive -Path '${escapedZip}' -DestinationPath '${escapedTemp}' -Force"`, { stdio: 'inherit' });

    const docXmlPath = path.join(tempDir, 'word', 'document.xml');
    if (!fs.existsSync(docXmlPath)) {
      console.error(`document.xml not found in ${docxPath}`);
      return;
    }

    const xmlContent = fs.readFileSync(docXmlPath, 'utf8');

    // Extract paragraphs by matching <w:p>...</w:p>
    const paragraphs = xmlContent.match(/<w:p\b[^>]*>([\s\S]*?)<\/w:p>/g);
    let extractedText = '';
    if (paragraphs) {
      extractedText = paragraphs.map(p => {
        const tMatches = p.match(/<w:t[^>]*>(.*?)<\/w:t>/g);
        if (!tMatches) return '';
        return tMatches.map(m => m.replace(/<w:t[^>]*>/, '').replace(/<\/w:t>/, '')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'")
        ).join('');
      }).filter(p => p.trim() !== '').join('\n');
    } else {
      // Fallback
      const matches = xmlContent.match(/<w:t[^>]*>(.*?)<\/w:t>/g);
      if (matches) {
        extractedText = matches.map(m => m.replace(/<w:t[^>]*>/, '').replace(/<\/w:t>/, '')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'")
        ).join('');
      }
    }

    fs.writeFileSync(outputPath, extractedText, 'utf8');
    console.log(`Successfully extracted to ${outputPath}`);
  } catch (error) {
    console.error('Error extracting text:', error);
  } finally {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    if (fs.existsSync(tempZip)) {
      fs.unlinkSync(tempZip);
    }
  }
}

const doc1 = path.join(__dirname, '../Document/Sonara_CDC_Technique_Global_v1.0 (3).docx');
const doc2 = path.join(__dirname, '../Document/Sonara_Document_Maitre_v1.0.docx');

extractDocxText(doc1, path.join(__dirname, 'Sonara_CDC_Technique_Global.txt'));
extractDocxText(doc2, path.join(__dirname, 'Sonara_Document_Maitre.txt'));
