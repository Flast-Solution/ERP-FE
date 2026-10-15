const fs = require('fs')
const os = require('os')
const path = require('path')
const { execFileSync } = require('child_process')
const { zipSync } = require('fflate')

const root = path.resolve(__dirname, '..')
const source = path.resolve(root, '../fs-hatenko')
const staging = fs.mkdtempSync(path.join(os.tmpdir(), 'hatenko-packing-'))
for (const name of ['src', 'scripts', 'webpack.config.cjs', 'shared-versions.json', 'package.json']) {
  fs.cpSync(path.join(source, name), path.join(staging, name), { recursive: true })
}
fs.symlinkSync(path.join(source, 'node_modules'), path.join(staging, 'node_modules'))
const shared = path.join(root, 'node_modules/@erp/shared-ui/dist/cjs')
const testPath = path.join(staging, 'scripts/test.cjs')
fs.writeFileSync(testPath, fs.readFileSync(testPath, 'utf8').replace(
  "path.join(root, 'node_modules/@erp/shared-ui/dist/cjs/$1.js')",
  JSON.stringify(path.join(shared, '$1.js')),
))
const configPath = path.join(staging, 'webpack.config.cjs')
fs.appendFileSync(configPath, `\nmodule.exports.resolve.alias['@erp/shared-ui'] = ${JSON.stringify(shared)}\n`)
execFileSync(process.execPath, ['scripts/test.cjs'], {
  cwd: staging, stdio: 'inherit',
})
execFileSync(process.execPath, ['scripts/build.cjs'], { cwd: staging, stdio: 'inherit' })
const files = {}
const visit = directory => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name)
    if (entry.isDirectory()) visit(filename)
    else files[path.relative(path.join(staging, 'dist'), filename)] = new Uint8Array(fs.readFileSync(filename))
  }
}
visit(path.join(staging, 'dist'))
const output = path.join(root, 'docs/hatenko/templates/Hatenko-module-Packing-List-20261015.zip')
fs.writeFileSync(output, zipSync(files))
console.log(output)
console.log(`Build directory: ${staging}`)
