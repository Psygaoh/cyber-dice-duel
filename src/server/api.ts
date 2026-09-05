import type {Database,RoomRow} from './database';
import {getRoom} from './database';
import type {Command,GameState,Side} from '../game/types';
import {createGame,command} from '../game/engine';

type Env={DB:Database};
const json=(body:unknown,status=200,headers:Record<string,string>={})=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}});
const fault=(code:string,error:string,status=400,extra={})=>json({code,error,...extra},status);
const newToken=()=>crypto.randomUUID().replaceAll('-','')+crypto.randomUUID().replaceAll('-','');
async function hash(v:string){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v)))].map(n=>n.toString(16).padStart(2,'0')).join('');}
const cookieName=(id:string)=>`cdd_${id}`;
function getCookie(req:Request,id:string){return (req.headers.get('cookie')??'').split(';').map(x=>x.trim()).find(x=>x.startsWith(cookieName(id)+'='))?.slice(cookieName(id).length+1);}
function setCookie(id:string,token:string,req:Request){return `${cookieName(id)}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${new URL(req.url).protocol==='https:'?'; Secure':''}`;}
function publicState(state:GameState){return {...state,seed:state.winner?state.seed:'hidden',rng:state.winner?state.rng:0,eventLog:state.eventLog.slice(-48)};}
function view(row:RoomRow,side:Side){return {id:row.id,version:row.version,side,ready:!!(row.runner_token&&row.corp_token),players:{runner:row.runner_name,corp:row.corp_name},state:publicState(JSON.parse(row.state))};}
const validName=(n:unknown)=>typeof n==='string'&&n.trim().length>0&&n.trim().length<=24&&!/[\x00-\x1f]/.test(n);
async function identity(row:RoomRow,req:Request){const token=getCookie(req,row.id);if(!token||token.length!==64)return null;const digest=await hash(token);return row.runner_token===digest?'runner':row.corp_token===digest?'corp':null;}

export async function handleApi(req:Request,env:Env):Promise<Response>{
 try{
  const url=new URL(req.url),parts=url.pathname.split('/').filter(Boolean);
  if(url.pathname==='/api/health')return json({ok:true,game:'cyber-dice-duel'});
  if(parts[0]!=='api'||parts[1]!=='rooms')return fault('NOT_FOUND','Route not found.',404);
  if(req.method!=='GET'&&req.method!=='POST')return fault('METHOD','Method not allowed.',405);
  let body:any;
  if(req.method==='POST'){
   const origin=req.headers.get('origin');if(origin&&origin!==url.origin)return fault('ORIGIN','Cross-origin requests are not allowed.',403);
   if(!req.headers.get('content-type')?.includes('application/json'))return fault('CONTENT_TYPE','Send JSON.',415);
   if(Number(req.headers.get('content-length')??0)>8192)return fault('TOO_LARGE','Request too large.',413);
   // Read at most 8 KiB, including chunked requests.
   const reader=req.body?.getReader();let size=0,raw='';const decoder=new TextDecoder();
   if(reader)while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>8192){await reader.cancel();return fault('TOO_LARGE','Request too large.',413);}raw+=decoder.decode(value,{stream:true});}
   try{body=JSON.parse(raw+decoder.decode());}catch{return fault('BAD_JSON','Invalid JSON.');}
   if(!body||typeof body!=='object'||Array.isArray(body))return fault('BAD_JSON','Expected an object.');
  }
  if(parts.length===2&&req.method==='POST'){
   if(!validName(body.name)||(body.side!=='runner'&&body.side!=='corp'))return fault('INVALID_INPUT','Choose a role and a name of 1–24 characters.');
   const id=crypto.randomUUID().replaceAll('-',''),token=newToken(),digest=await hash(token),now=Date.now();const side:Side=body.side;
   const state=createGame(newToken());
   await env.DB.prepare('INSERT INTO rooms (id, runner_token, corp_token, runner_name, corp_name, state, version, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)').bind(id,side==='runner'?digest:null,side==='corp'?digest:null,side==='runner'?body.name.trim():null,side==='corp'?body.name.trim():null,JSON.stringify(state),now,now).run();
   const row=await getRoom(env.DB,id);return json(view(row!,side),201,{'Set-Cookie':setCookie(id,token,req)});
  }
  const id=parts[2];if(!id||!/^[a-f0-9]{32}$/.test(id))return fault('NOT_FOUND','This room does not exist.',404);
  let row=await getRoom(env.DB,id);if(!row)return fault('NOT_FOUND','This room does not exist.',404);
  const side=await identity(row,req);
  if(parts[3]==='join'&&req.method==='POST'&&parts.length===4){
   if(side)return json(view(row,side));
   if(!validName(body.name))return fault('INVALID_INPUT','Enter a name of 1–24 characters.');
   if(row.runner_token&&row.corp_token)return fault('ROOM_FULL','Both seats are taken. Reopen this link in the browser you joined with.',409);
   const open:Side=row.runner_token?'corp':'runner',token=newToken(),digest=await hash(token);
   const result=await env.DB.prepare(`UPDATE rooms SET ${open}_token = ?, ${open}_name = ?, version = version + 1, updated_at = ? WHERE id = ? AND ${open}_token IS NULL`).bind(digest,body.name.trim(),Date.now(),id).run();
   if(result.meta.changes!==1)return fault('ROOM_FULL','Another player just claimed this seat.',409);
   row=(await getRoom(env.DB,id))!;return json(view(row,open),200,{'Set-Cookie':setCookie(id,token,req)});
  }
  if(!side)return fault('JOIN_REQUIRED','Join this duel to play.',401,{room:{ready:!!(row.runner_token&&row.corp_token),openSide:row.runner_token?'corp':'runner',hostName:row.runner_name??row.corp_name}});
  if(parts.length===3&&req.method==='GET')return json(view(row,side));
  if(parts[3]==='replay'&&req.method==='GET'){
   const state:GameState=JSON.parse(row.state);if(!state.winner)return fault('MATCH_ACTIVE','Replay becomes available when the duel ends.',409);
   return json({format:'cyber-dice-duel-replay-v1',seed:state.seed,events:state.eventLog,metrics:state.metrics,winner:state.winner});
  }
  if(parts[3]==='command'&&req.method==='POST'&&parts.length===4){
   if(!row.runner_token||!row.corp_token)return fault('WAITING','Waiting for the second player.',409);
   if(!Number.isInteger(body.version)||typeof body.requestId!=='string'||!/^[\w-]{8,100}$/.test(body.requestId))return fault('INVALID_INPUT','An action needs a revision and request ID.');
   const requestKey=`${side}:${body.requestId}`;
   if(row.last_request===requestKey)return json(view(row,side));
   if(body.version!==row.version)return fault('STALE_STATE','The duel changed. Your view has been refreshed; try again.',409,{room:view(row,side)});
   const result=command(JSON.parse(row.state),side,body.command as Command);
   if(!result.ok)return fault(result.code,result.message,422);
   const saved=await env.DB.prepare('UPDATE rooms SET state = ?, version = version + 1, last_request = ?, updated_at = ? WHERE id = ? AND version = ?').bind(JSON.stringify(result.state),requestKey,Date.now(),id,row.version).run();
   if(saved.meta.changes!==1){const current=(await getRoom(env.DB,id))!;return fault('STALE_STATE','Another action arrived first. Your view has been refreshed.',409,{room:view(current,side)});}
   row=(await getRoom(env.DB,id))!;return json(view(row,side));
  }
  return fault('NOT_FOUND','Route not found.',404);
 }catch(error){console.error('Room API unavailable',error instanceof Error?error.message:'Storage error');return fault('UNAVAILABLE','The room could not be reached. Please try again.',503);}
}
