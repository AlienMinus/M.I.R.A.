import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') && !id.includes('react-syntax-highlighter')) return 'vendor_react'
            if (id.includes('react-syntax-highlighter')) return 'vendor_syntax'
            if (id.includes('react-markdown') || id.includes('remark') || id.includes('rehype')) return 'vendor_markdown'
            if (id.includes('unified') || id.includes('vfile') || id.includes('property-information') || id.includes('hast-') || id.includes('mdast-')) return 'vendor_unified'
            return 'vendor'
          }
        }
      }
    },
    // optional: increase warning threshold if you accept bigger chunks
    chunkSizeWarningLimit: 1000
  },
  // Dev server config — make HMR resilient across ports and environments
  server: {
    // bind explicitly to IPv4 0.0.0.0 so localhost (127.0.0.1) and other network interfaces work reliably
    host: '0.0.0.0',
    // preferred port, but allow Vite to pick another if this is in use
    port: 5173,
    strictPort: false,
    // Use WebSocket protocol and explicitly set clientPort to ensure localhost connects to correct port
    hmr: {
      protocol: 'ws',
      clientPort: 5173
    },
    // use polling on some Windows filesystems / network mounts for more reliable reloads
    watch: {
      usePolling: true,
      interval: 100
    }
  },
  plugins: [
    react(),
    process.env.ANALYZE && visualizer({ open: true, filename: 'stats.html' })
  ]
})