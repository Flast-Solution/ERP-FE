const path = require('path')
const root = path.resolve(__dirname, '..')
const names = ['react', 'react-dom', 'react-router-dom', 'react-helmet', 'antd', 'axios',
  'dayjs', 'lodash', 'styled-components', 'i18next', 'react-i18next', 'moment',
  'jodit-react', 'query-string', 'react-waypoint']
const versions = Object.fromEntries(names.map(name => [name,
  require(path.join(root, 'node_modules', name, 'package.json')).version,
]))
const coreVersion = require(path.join(root, 'node_modules/@flast-erp/core/package.json')).version
for (const suffix of ['', '/components', '/hooks', '/utils', '/configs']) versions[`@flast-erp/core${suffix}`] = coreVersion
versions['@erp/tenant-runtime'] = require(path.join(root, 'node_modules/@erp/tenant-runtime/package.json')).version
module.exports = versions
