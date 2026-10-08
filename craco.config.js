const command = process.env.NODE_ENV === 'production' ? 'build'
  : process.env.NODE_ENV === 'test' ? 'test' : 'start'
require('./scripts/host-environment.cjs')(command)
const path = require("path")
const CracoLessPlugin = require("craco-less")
const root = __dirname
module.exports = {
  jest: {
    configure: {
      moduleNameMapper: {
        "^@/(.*)$": path.join(__dirname, 'src/$1'),
        "^@flast-erp/core/(components|hooks|utils|configs)$": path.join(root, "node_modules/@flast-erp/core/dist/$1/index.js"),
        "^@erp/tenant-runtime$": path.join(root, 'node_modules/@erp/tenant-runtime/dist/cjs/index.js'),
        "^@erp/shared-ui/(.*)$": path.join(root, 'node_modules/@erp/shared-ui/dist/cjs/$1.js'),
      },
    },
  },
  plugins: [
    {
      plugin: CracoLessPlugin,
      options: {
        lessLoaderOptions: {
          lessOptions: { javascriptEnabled: true },
        }
      }
    }
  ],
  webpack: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
    configure: (config) => {
      // docx-preview publishes maps pointing at TypeScript files omitted from
      // its npm package. Skip those maps while keeping application maps enabled.
      const sourceMaps = config.module.rules.find(rule => rule.enforce === 'pre'
        && rule.loader?.includes('source-map-loader'))
      if (sourceMaps) {
        sourceMaps.exclude = [
          ...(Array.isArray(sourceMaps.exclude) ? sourceMaps.exclude : sourceMaps.exclude ? [sourceMaps.exclude] : []),
          /[\\/]node_modules[\\/]docx-preview[\\/]/,
        ]
      }
      config.resolve.modules.push(path.join(root, 'node_modules'))
      return config
    },
  },

  // devServer: {
  //   host: "127.0.0.1",
  //   port: 3000
  // }
  devServer: {
    host: "127.0.0.1",
    port: 3000,
    proxy: {
      "/api": {
        target: "http://157.10.199.138:9080",
        changeOrigin: true,
        secure: false,
        cookieDomainRewrite: "127.0.0.1",
        cookiePathRewrite: "/",
      },
    },
  },
}
