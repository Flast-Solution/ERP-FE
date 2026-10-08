const path = require('path')
const root = path.resolve(__dirname, '..')

module.exports = function configureHostEnvironment(command) {
  process.env.NODE_ENV = command === 'build' ? 'production' : command === 'test' ? 'test' : 'development'
  process.env.BABEL_ENV = process.env.NODE_ENV
  process.env.REACT_APP_TENANT_SHARED_VERSIONS = JSON.stringify(require('./shared-dependencies.cjs'))
  for (const file of [`.env.${process.env.NODE_ENV}.local`, '.env.local', `.env.${process.env.NODE_ENV}`, '.env']) {
    if (command === 'test' && file === '.env.local') continue
    require('dotenv').config({ path: path.join(root, file) })
  }
  process.chdir(root)
}
