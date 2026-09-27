/* Builds the single-file app from src/.
   node src/seed.cjs   -> regenerates data/seed.js (sample dataset)
   node build.cjs      -> index.html (standalone, offline storage) + dist/artifact.html (Claude artifact fragment) */
const fs = require('fs');
const path = require('path');
const r = f => fs.readFileSync(path.join(__dirname, 'src', f), 'utf8');
const js = ['schema.js', 'store.js', 'app1.js', 'app2.js', 'app3.js', 'app4.js'].map(r).join('\n;\n');
const head = `<title>صحت هرات</title>
<meta name="description" content="سیستم دیجیتال صحی هرات (HDHS)">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300..800&family=Noto+Nastaliq+Urdu:wght@600&family=IBM+Plex+Mono:wght@400;500;600&display=swap">
<style>
${r('styles.css')}
</style>`;
const app = `<div id="root" dir="rtl" lang="fa-AF"></div>
<script>
document.documentElement.setAttribute('dir','rtl');document.documentElement.setAttribute('lang','fa-AF');
${js}
</script>`;

const standalone = `<!doctype html>
<html lang="fa-AF" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#10233F">
${head}
</head>
<body>
${app.replace('<script>', '<script src="data/seed.js"></script>\n<script>')}
</body>
</html>
`;
fs.writeFileSync(path.join(__dirname, 'index.html'), standalone);
fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'dist', 'artifact.html'), `${head}\n${app}\n`);
console.log('index.html', standalone.length, 'bytes');
