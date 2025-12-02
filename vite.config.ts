import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // This allows access to process.env.API_KEY if you set it in Vercel
    'process.env': process.env
  }
});