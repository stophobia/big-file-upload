import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {

    // alias:{
    // '@/': path.resolve(process.cwd(), '.','src')
    // }
    alias: [
      {
        find: /\@\//,
        replacement: path.resolve(process.cwd(), '.','src') +'/'
      }
    ]
 
  },
  server: {
    proxy: {
      // String abbreviation
      // 'upload': 'http://localhost:3000',
      // option writing
      '/file': {
        target: 'http://localhost:3000',
        changeOrigin: true
        // rewrite: (path) => path.replace(/^\/api/, '')
      }
      // Regular expression writing
      // '^/fallback/.*': {
      //   target: 'http://jsonplaceholder.typicode.com',
      //   changeOrigin: true,
      //   rewrite: (path) => path.replace(/^\/fallback/, '')
      // },
      // Using proxy instance
      // '/api': {
      //   target: 'http://jsonplaceholder.typicode.com',
      //   changeOrigin: true,
      //   configure: (proxy, options) => {
      //     // proxy is an instance of 'http-proxy'
      //   }
      // },
      // // Proxying websockets or socket.io
      // '/socket.io': {
      //   target: 'ws://localhost:3000',
      //   ws: true
      // }
    }
  }
})
