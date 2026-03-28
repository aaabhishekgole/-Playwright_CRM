const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const config = JSON.parse(fs.readFileSync(path.join(repoRoot, 'rules', 'framework-rule-engine.json'), 'utf8'));

function toPosix(filePath) {
  return filePath.split(path.sep).join('/');
}

function collectAllFiles(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }
  const items = fs.readdirSync(directory, { withFileTypes: true });
  return items.flatMap((item) => {
    const fullPath = path.join(directory, item.name);
    if (item.isDirectory()) {
      return collectAllFiles(fullPath);
    }
    return [fullPath];
  });
}

function resolveTargetFiles() {
  const flag = process.argv[2];
  const srcFiles = collectAllFiles(path.join(repoRoot, 'src')).filter((file) => /\.(ts|json)$/.test(file));

  if (!flag) {
    return srcFiles;
  }

  const command =
    flag === '--staged'
      ? 'git diff --name-only --cached'
      : flag === '--changed'
        ? 'git diff --name-only'
        : '';

  if (!command) {
    return srcFiles;
  }

  try {
    const output = childProcess.execSync(command, { cwd: repoRoot, stdio: ['ignore', 'pipe', 'ignore'] }).toString();
    const files = output
      .split(/\r?\n/)
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => path.resolve(repoRoot, entry))
      .filter((entry) => entry.startsWith(path.join(repoRoot, 'src')));
    return files.length > 0 ? files : srcFiles;
  } catch {
    return srcFiles;
  }
}

function validatePage(filePath, contents, violations) {
  if (path.basename(filePath) === 'index.ts') {
    return;
  }
  if (!filePath.endsWith(config.rules.pageFileSuffix)) {
    violations.push(`${toPosix(filePath)} must end with ${config.rules.pageFileSuffix}`);
  }
  if (!/= \(\) =>/.test(contents) && !/= \([^)]*\) =>/.test(contents)) {
    violations.push(`${toPosix(filePath)} should define locators as arrow functions`);
  }
  if (/\bif\s*\(/.test(contents) || /\bswitch\s*\(/.test(contents)) {
    violations.push(`${toPosix(filePath)} should avoid business branching logic`);
  }
}

function validateModule(filePath, contents, violations) {
  if (path.basename(filePath) === 'index.ts') {
    return;
  }
  if (!filePath.endsWith(config.rules.moduleFileSuffix)) {
    violations.push(`${toPosix(filePath)} must end with ${config.rules.moduleFileSuffix}`);
  }
  if (/page\.locator\s*\(/.test(contents)) {
    violations.push(`${toPosix(filePath)} must not call page.locator() directly`);
  }
}

function validateTest(filePath, contents, violations) {
  if (!filePath.endsWith(config.rules.testFileSuffix)) {
    violations.push(`${toPosix(filePath)} must end with ${config.rules.testFileSuffix}`);
  }
  if (!/test\.describe\s*\(/.test(contents)) {
    violations.push(`${toPosix(filePath)} must use test.describe()`);
  }
  if (!/test\.step\s*\(/.test(contents)) {
    violations.push(`${toPosix(filePath)} must use test.step()`);
  }
  if (/from ['"][^'"]*(\.\.\/)+pages\//.test(contents) || /from ['"]@pages\//.test(contents)) {
    violations.push(`${toPosix(filePath)} must not import page objects directly`);
  }
}

const files = resolveTargetFiles();
const violations = [];

for (const filePath of files) {
  const relative = toPosix(path.relative(repoRoot, filePath));
  const contents = fs.readFileSync(filePath, 'utf8');

  if (relative.startsWith(toPosix(config.pageDirectory))) {
    validatePage(filePath, contents, violations);
  }
  if (relative.startsWith(toPosix(config.moduleDirectory))) {
    validateModule(filePath, contents, violations);
  }
  if (relative.startsWith(toPosix(config.testDirectory))) {
    validateTest(filePath, contents, violations);
  }
}

if (violations.length > 0) {
  console.error('Framework rule violations found:');
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log(`Framework rule engine passed for ${files.length} files.`);
