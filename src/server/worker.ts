import {handleApi} from './api';
import type {Database} from './database';
export default {
 async fetch(req:Request,env:{DB:Database;ASSETS:{fetch(req:Request):Promise<Response>}}){
  const url=new URL(req.url);
  if(url.pathname.startsWith('/api/'))return handleApi(req,env);
  const response=await env.ASSETS.fetch(req);
  const out=new Response(response.body,response);
  out.headers.set('X-Content-Type-Options','nosniff');out.headers.set('Referrer-Policy','same-origin');
  out.headers.set('Permissions-Policy','camera=(), microphone=(), geolocation=()');
  return out;
 }
};
