const { createProxyMiddleware } = require("http-proxy-middleware")

module.exports = (app) => {
  app.use(
    "/api",
    createProxyMiddleware({
      target: "http://localhost:8080",
      changeOrigin: true,
      secure: false,
      pathRewrite: {
        "^/api": "/api", // Keep the /api prefix
      },
      onProxyReq: (proxyReq, req, res) => {
        // Log the outgoing request for debugging
        console.log("Proxying request:", req.method, req.url)

        // If the request has a body, you might need to handle it specially
        if (req.body) {
          const bodyData = JSON.stringify(req.body)
          proxyReq.setHeader("Content-Type", "application/json")
          proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData))
          proxyReq.write(bodyData)
        }
      },
      onProxyRes: (proxyRes, req, res) => {
        // Log the response status for debugging
        console.log("Proxy response:", proxyRes.statusCode, req.url)
      },
    }),
  )
}
