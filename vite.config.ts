import {defineConfig} from 'vite';
export default defineConfig({build:{outDir:'dist/client',emptyOutDir:true,rollupOptions:{output:{manualChunks(id){if(id.includes('/three/'))return 'three';}}}},server:{port:4173,strictPort:true,host:'0.0.0.0',allowedHosts:['terminal.local'],proxy:{'/api':{target:'http://127.0.0.1:8787'}}}});
