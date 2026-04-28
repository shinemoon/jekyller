const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// ── 读取 package.json 中的 build 配置 ──
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
const buildConfig = pkg.build;

const target = process.argv[2]; // 'chrome' | 'ff'

if (!target || !buildConfig[target]) {
  console.error('Usage: node build.js <chrome|ff>');
  process.exit(1);
}

const { manifest: manifestSrc } = buildConfig[target];
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });

const zipName = `jekyller_${target}_v${pkg.version}.zip`;
const zipPath = path.join(distDir, zipName);

// ── 收集所有需要打包的文件 ──
const root = __dirname;
const files = [];

function walk(dir, relativeDir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    const rel = path.join(relativeDir, entry.name);

    // 跳过隐藏文件/目录（以 . 开头）
    if (entry.name.startsWith('.') && entry.name !== '.') continue;

    // 跳过 node_modules
    if (entry.name === 'node_modules') continue;

    // 跳过构建产物目录 dist
    if (entry.name === 'dist') continue;

    // 跳过构建脚本自身 & package 文件
    if (entry.name === 'build.js' || entry.name === 'package.json' || entry.name === 'package-lock.json') continue;

    // 跳过源 manifest 文件（它们不会直接打入扩展）以及根目录已有的 manifest.json
    if (entry.name === 'manifest.chrome.json' || entry.name === 'manifest.ff.json' || entry.name === 'manifest.json') continue;

    // 跳过 .swp 和 .css.map（来自 .gitignore）
    if (entry.name.endsWith('.swp') || entry.name.endsWith('.css.map')) continue;

    // 跳过已有 zip 产物
    if (entry.name.endsWith('.zip')) continue;

    if (entry.isDirectory()) {
      walk(full, rel);
    } else {
      files.push({ full, rel });
    }
  }
}

walk(root, '');

// ── 创建 zip ──
const output = fs.createWriteStream(zipPath);
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => {
  console.log(`✅ ${zipName}  (${archive.pointer()} bytes / ${files.length + 1} files)`);
});

archive.on('error', (err) => {
  console.error('❌', err.message);
  process.exit(1);
});

archive.pipe(output);

// 1. 将目标 manifest 以 manifest.json 的名称打入 zip
archive.file(path.join(root, manifestSrc), { name: 'manifest.json' });

// 2. 打入所有其他文件（保持目录结构）
for (const { full, rel } of files) {
  archive.file(full, { name: rel });
  }

  archive.finalize();