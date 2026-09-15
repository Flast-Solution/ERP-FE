const { createProxyMiddleware } = require('http-proxy-middleware')

const NOTIFICATION_STREAM_PATH = '/api/notification/action/stream/'
const API_TARGET = 'http://157.10.199.138:9080'

module.exports = (app) => {
  app.use(createProxyMiddleware(
    pathname => pathname.startsWith(NOTIFICATION_STREAM_PATH),
    {
      target: API_TARGET,
      changeOrigin: true,
      secure: false,
      proxyTimeout: 0,
      timeout: 0,
      onProxyReq: (proxyReq) => {
        proxyReq.setHeader('accept-encoding', 'identity')
        proxyReq.setHeader('cache-control', 'no-cache')
        proxyReq.setHeader('connection', 'keep-alive')
      },
      onProxyRes: (proxyRes) => {
        proxyRes.headers['cache-control'] = 'no-cache, no-transform'
        proxyRes.headers['x-accel-buffering'] = 'no'
      },
    },
  ))
}
