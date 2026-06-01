import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function buildCompatMap() {
  const compatDir = path.resolve(__dirname, 'node_modules/es-toolkit/compat');
  const map = new Map();
  if (fs.existsSync(compatDir)) {
    for (const file of fs.readdirSync(compatDir).filter(f => f.endsWith('.js'))) {
      const content = fs.readFileSync(path.join(compatDir, file), 'utf8');
      const match = content.match(/module\.exports\s*=\s*require\(['"](.+?)['"]\)\.(\w+);/);
      if (match) {
        const name = file.replace(/\.js$/, '');
        const jsPath = match[1];
        const exportName = match[2];
        const esmPath = path.resolve(__dirname, 'node_modules/es-toolkit/compat', jsPath.replace(/\.js$/, '.mjs'));
        map.set(name, { esmPath: esmPath.replace(/\\/g, '/'), exportName });
      }
    }
  }
  return map;
}

const compatMap = buildCompatMap();
const VIRTUAL_PREFIX = '\0es-toolkit-compat:';

// Vite plugin: resolves es-toolkit/compat/* to virtual ESM modules
function esToolkitCompatPlugin() {
  return {
    name: 'es-toolkit-compat',
    enforce: 'pre',
    resolveId(id) {
      const match = id.match(/^es-toolkit\/compat\/(\w+)$/);
      if (match && compatMap.has(match[1])) {
        return VIRTUAL_PREFIX + match[1];
      }
      return null;
    },
    load(id) {
      if (id.startsWith(VIRTUAL_PREFIX)) {
        const name = id.slice(VIRTUAL_PREFIX.length);
        const info = compatMap.get(name);
        if (info) {
          return `export { ${info.exportName} as default } from "${info.esmPath}";`;
        }
      }
      return null;
    },
  };
}

// Rolldown plugin: same logic for dep pre-bundling
function rolldownCompatPlugin() {
  return {
    name: 'es-toolkit-compat-rolldown',
    resolveId(id, importer) {
      if (!importer) return null;
      const match = id.match(/^es-toolkit\/compat\/(\w+)$/);
      if (match && compatMap.has(match[1])) {
        return VIRTUAL_PREFIX + match[1];
      }
      return null;
    },
    load(id) {
      if (id.startsWith(VIRTUAL_PREFIX)) {
        const name = id.slice(VIRTUAL_PREFIX.length);
        const info = compatMap.get(name);
        if (info) {
          return `export { ${info.exportName} as default } from "${info.esmPath}";`;
        }
      }
      return null;
    },
  };
}

export default defineConfig({
  plugins: [react(), esToolkitCompatPlugin()],
  optimizeDeps: {
    rolldownOptions: {
      plugins: [rolldownCompatPlugin()],
    },
    include: ['recharts'],
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
