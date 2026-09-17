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
    host: "127.0.0.1",
    port: 3000
  }
}
