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
      "@/form-flast": path.resolve(__dirname, "node_modules/@flast-erp/core/components/form"),
      "@": path.resolve(__dirname, "src"),
    }
  },

  devServer: {
    port: 3000
  }
}
