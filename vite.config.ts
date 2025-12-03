
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // In Vercel, process.env contains the variables set in the dashboard.
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [
      react(),
      {
        name: 'html-transform',
        transformIndexHtml(html) {
          if (mode === 'production') {
            // Remove Tailwind CDN script (used only for dev preview)
            html = html.replace(/<script src="https:\/\/cdn\.tailwindcss\.com"><\/script>/, '');
            // Remove ImportMap script block (used only for dev preview)
            html = html.replace(/<script type="importmap">[\s\S]*?<\/script>/, '');
          }
          return html;
        },
      },
    ],
    define: {
      // This explicitly replaces 'process.env.API_KEY' in your code with the actual string value during build
      'process.env.API_KEY': JSON.stringify((process as any).env.API_KEY || env.API_KEY)
    }
  };
});
