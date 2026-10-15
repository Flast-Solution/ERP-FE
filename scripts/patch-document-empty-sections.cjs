const fs = require('fs')
const path = require('path')
const os = require('os')
const { execFileSync } = require('child_process')

const root = path.resolve(__dirname, '..')
const dependency = require('../package.json').dependencies['@erp/shared-ui'].replace(/^file:/, '')
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'document-empty-sections-'))
const patch = directory => {
  for (const kind of ['cjs', 'esm']) {
    const base = path.join(directory, 'dist', kind, 'components/DocumentTemplateEditor/html')
    const contentPath = path.join(base, 'HtmlTemplateContent.js')
    let content = fs.readFileSync(contentPath, 'utf8')
    const marker = "    var repeatId = node.getAttribute('data-repeat');"
    const resolve = kind === 'cjs' ? '(0, _model.resolveHtmlField)' : 'resolveHtmlField'
    const condition = `    if (!editable && !onSelectField && node.classList.contains('document-hide-when-empty')) {
      var populated = Array.from(node.querySelectorAll('[data-field]')).some(element => {
        var fieldId = element.getAttribute('data-field');
        return String(${resolve}(fieldId, definition.fields[fieldId], definition, data, context.row, context.rowIndex) ?? '').trim() !== '';
      });
      if (!populated) return null;
    }
`
    if (!content.includes("classList.contains('document-hide-when-empty')")) {
      if (!content.includes(marker)) throw new Error('Unsupported HtmlTemplateContent version')
      fs.writeFileSync(contentPath, content.replace(marker, condition + marker))
    }
    const tablePath = path.join(base, 'HtmlSheetTable.js')
    let table = fs.readFileSync(tablePath, 'utf8')
    const start = table.indexOf('  if (!columns.length) {')
    const end = table.indexOf('  var firstAggregateIndex', start)
    if (start >= 0 && end > start) {
      table = table.slice(0, start) + '  if (!columns.length) return null;\n' + table.slice(end)
      fs.writeFileSync(tablePath, table)
    }
  }
}
try {
  execFileSync('tar', ['-xzf', path.join(root, dependency), '-C', temporary])
  patch(path.join(temporary, 'package'))
  execFileSync('tar', ['-czf', path.join(root, dependency), '-C', temporary, 'package'])
  patch(path.join(root, 'node_modules/@erp/shared-ui'))
} finally {
  fs.rmSync(temporary, { recursive: true, force: true })
}
