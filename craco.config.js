const path = require("path")
const CracoLessPlugin = require("craco-less")
module.exports = {
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
    }
  },

  devServer: {
    port: 3000
  }
}
