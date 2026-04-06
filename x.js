import fs from 'fs';
import path from 'path';

function getAllFiles(dir, extList, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, extList, fileList);
    } else if (extList.includes(path.extname(filePath))) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

const targetExtensions = ['.jsx', '.css'];
const files = getAllFiles('frontend/src', targetExtensions);

let changedCount = 0;

files.forEach((file) => {
  let content = fs.readFileSync(file, 'utf8');
  const newContent = content.replace(/text-\[(\d+(?:\.\d+)?)px\]/g, (match, p1) => {
    const rem = (parseFloat(p1) / 16).toFixed(4).replace(/\.?0+$/, '');
    return `text-[${rem}rem]`;
  });
  if (content !== newContent) {
    fs.writeFileSync(file, newContent);
    console.log(`Updated: ${file}`);
    changedCount++;
  }
});

console.log(`Done. Updated ${changedCount} files.`);
