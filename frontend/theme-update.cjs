const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src/pages');

const replaceInFile = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // General Replacements
  content = content.replace(/bg-white rounded-xl shadow-sm border border-slate-200/g, 'bg-surface backdrop-blur-2xl rounded-mac-card shadow-mac-card border border-surfaceSolid');
  content = content.replace(/bg-white rounded-xl shadow-xl border border-slate-200/g, 'bg-surface backdrop-blur-2xl rounded-mac-card shadow-mac-modal border border-surfaceSolid');
  content = content.replace(/bg-white rounded-xl shadow-2xl border border-slate-200/g, 'bg-surface backdrop-blur-2xl rounded-mac-card shadow-mac-modal border border-surfaceSolid');
  
  // Modals in POS
  content = content.replace(/bg-white rounded-2xl shadow-xl/g, 'bg-surface backdrop-blur-2xl rounded-mac-float shadow-mac-modal border border-surfaceSolid');
  
  // Specific replacements for text and background
  content = content.replace(/text-slate-900/g, 'text-textPrimary');
  content = content.replace(/text-slate-800/g, 'text-textPrimary');
  content = content.replace(/text-slate-700/g, 'text-textSecondary');
  content = content.replace(/text-slate-600/g, 'text-textSecondary');
  content = content.replace(/text-slate-500/g, 'text-textSecondary');
  content = content.replace(/text-slate-400/g, 'text-textSecondary');
  
  content = content.replace(/border-slate-300/g, 'border-separator');
  content = content.replace(/border-slate-200/g, 'border-separator');
  content = content.replace(/border-slate-100/g, 'border-separator');
  
  content = content.replace(/bg-slate-50/g, 'bg-surfaceSolid/50');
  content = content.replace(/bg-slate-100/g, 'bg-surfaceSolid');
  
  content = content.replace(/rounded-lg/g, 'rounded-mac-btn');
  content = content.replace(/rounded-xl/g, 'rounded-mac-card');
  
  // Make sure tables look clean
  content = content.replace(/divide-slate-200/g, 'divide-separator');
  content = content.replace(/divide-slate-100/g, 'divide-separator');
  
  // Buttons
  content = content.replace(/shadow-sm/g, 'shadow-mac-subtle');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
};

const walkSync = (dir) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkSync(filePath);
    } else if (filePath.endsWith('.jsx')) {
      replaceInFile(filePath);
    }
  }
};

walkSync(directoryPath);
console.log('Theme update complete!');
