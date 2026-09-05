import {build} from 'esbuild';
import {mkdir,cp,readFile} from 'node:fs/promises';
await mkdir('dist/server',{recursive:true});
await build({entryPoints:['src/server/worker.ts'],outfile:'dist/server/index.js',bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true});
await mkdir('dist/.openai',{recursive:true});
await cp('.openai/hosting.json','dist/.openai/hosting.json');
await cp('drizzle','dist/.openai/drizzle',{recursive:true});
const worker=await readFile('dist/server/index.js','utf8');if(!worker.includes('fetch'))throw Error('Worker fetch entrypoint missing');
console.log('Worker, client assets, hosting identity and migrations built.');
