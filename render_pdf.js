const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function mdToHtml(md) {
  let html = md
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Bold / Italic
    .replace(/\*\*\*(.*?)\*\*\*/gim, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    // Links
    .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2">$1</a>')
    // Horizontal rule
    .replace(/^---$/gim, '<hr/>')
    // Inline code
    .replace(/`([^`]+)`/gim, '<code>$1</code>');

  // Simple table parser
  const lines = html.split('\n');
  let inTable = false;
  let tableHtml = '';
  const resultLines = [];
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('|') && line.endsWith('|')) {
      if (line.includes('---')) {
        continue; // delimiter row
      }
      const cells = line.slice(1, -1).split('|').map(c => c.trim());
      if (!inTable) {
        inTable = true;
        tableHtml = '<table><thead><tr>' + cells.map(c => `<th>${c}</th>`).join('') + '</tr></thead><tbody>';
      } else {
        tableHtml += '<tr>' + cells.map(c => `<td>${c}</td>`).join('') + '</tr>';
      }
    } else {
      if (inTable) {
        inTable = false;
        tableHtml += '</tbody></table>';
        resultLines.push(tableHtml);
      }
      if (line.startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          resultLines.push('<pre><code>');
        } else {
          inCodeBlock = false;
          resultLines.push('</code></pre>');
        }
      } else if (inCodeBlock) {
        resultLines.push(line.replace(/</g, '&lt;').replace(/>/g, '&gt;'));
      } else if (line.length > 0 && !line.startsWith('<h') && !line.startsWith('<hr')) {
        resultLines.push(`<p>${line}</p>`);
      } else {
        resultLines.push(line);
      }
    }
  }
  if (inTable) {
    resultLines.push(tableHtml + '</tbody></table>');
  }

  return resultLines.join('\n');
}

const mdPath = path.join(__dirname, 'BAO_CAO_KY_THUAT_REPORT.md');
const htmlPath = path.join(__dirname, 'temp_report.html');
const pdfPath = path.join(__dirname, 'BAO_CAO_KY_THUAT_REPORT.pdf');

const mdContent = fs.readFileSync(mdPath, 'utf8');
const bodyHtml = mdToHtml(mdContent);

const fullHtml = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>VKU Mini-Project 2 Report</title>
  <style>
    @page {
      size: A4;
      margin: 18mm 16mm 18mm 16mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 13.5px;
      line-height: 1.55;
      color: #1e293b;
      margin: 0;
      padding: 0;
    }
    h1 {
      font-size: 20px;
      color: #0f172a;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 6px;
      margin-top: 0;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    h2 {
      font-size: 15px;
      color: #1e40af;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 4px;
      margin-top: 18px;
      margin-bottom: 10px;
    }
    h3 {
      font-size: 14px;
      color: #334155;
      margin-top: 14px;
      margin-bottom: 6px;
    }
    p {
      margin: 6px 0;
    }
    hr {
      border: none;
      border-top: 1px solid #e2e8f0;
      margin: 14px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      font-size: 12px;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 7px 10px;
      text-align: left;
      vertical-align: top;
    }
    th {
      background-color: #f1f5f9;
      color: #0f172a;
      font-weight: 600;
    }
    tr:nth-child(even) td {
      background-color: #f8fafc;
    }
    code {
      background-color: #f1f5f9;
      color: #0369a1;
      padding: 2px 5px;
      border-radius: 4px;
      font-family: Consolas, "Courier New", monospace;
      font-size: 11.5px;
    }
    pre {
      background-color: #0f172a;
      color: #f8fafc;
      padding: 10px 14px;
      border-radius: 6px;
      overflow-x: auto;
      font-size: 11px;
      line-height: 1.45;
      margin: 10px 0;
    }
    pre code {
      background-color: transparent;
      color: inherit;
      padding: 0;
    }
    a {
      color: #2563eb;
      text-decoration: none;
    }
  </style>
</head>
<body>
  ${bodyHtml}
</body>
</html>`;

fs.writeFileSync(htmlPath, fullHtml, 'utf8');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const cmd = `"${edgePath}" --headless --disable-gpu --print-to-pdf="${pdfPath}" "${htmlPath}"`;

console.log('Rendering PDF via Microsoft Edge...');
execSync(cmd, { stdio: 'inherit' });

if (fs.existsSync(pdfPath)) {
  const stats = fs.statSync(pdfPath);
  console.log(`✓ PDF Generated Successfully (${stats.size} bytes): ${pdfPath}`);
  fs.unlinkSync(htmlPath);
} else {
  console.error('Failed to generate PDF');
}
