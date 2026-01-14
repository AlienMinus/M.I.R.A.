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
  plugins: [
    react(),
    process.env.ANALYZE && visualizer({ open: true, filename: 'stats.html' })
  ]
})