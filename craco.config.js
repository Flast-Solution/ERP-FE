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
