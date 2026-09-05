import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { handleApi } from '../api';
import type { Database } from '../database';

// Real SQLite, with the same prepared-statement interface used by D1.
function setup(){
 const sql=new DatabaseSync(':memory:');
 sql.exec('CREATE TABLE rooms (id TEXT PRIMARY KEY, runner_token TEXT, corp_token TEXT, runner_name TEXT, corp_name TEXT, state TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 0, last_request TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);');
 const db:Database={prepare(query:string){let values:any[]=[];const statement={bind(...v:any[]){values=v;return statement},async first<T>(){return (sql.prepare(query).get(...values) as T)??null},async run(){const r=sql.prepare(query).run(...values);return {meta:{changes:Number(r.changes)}}}};return statement;}};
 const env={DB:db};
 async function request(path:string,body?:unknown,cookie?:string){const res=await handleApi(new Request('https://duel.test'+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',Origin:'https://duel.test',...(cookie?{Cookie:cookie}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})}),env);return {status:res.status,data:await res.json() as any,cookie:res.headers.get('set-cookie')?.split(';')[0]};}
 return {request,sql,env};
}

test('two separate sessions claim roles, resume, play in sync, and a third cannot join',async()=>{
 const {request,sql}=setup();
 const a=await request('/api/rooms',{name:'Runner',side:'runner'});assert.equal(a.status,201);assert.ok(a.cookie);const id=a.data.id;
 const b=await request('/api/rooms/'+id+'/join',{name:'Corp'});assert.equal(b.status,200);assert.ok(b.cookie);assert.notEqual(a.cookie,b.cookie);
 assert.equal((await request('/api/rooms/'+id+'/join',{name:'Third'})).status,409);
 const resumed=await request('/api/rooms/'+id,undefined,a.cookie);assert.equal(resumed.data.side,'runner');assert.equal(resumed.data.ready,true);assert.equal(resumed.data.state.seed,'hidden');
 const roll={type:'roll',dice:resumed.data.state.loadouts.runner.slice(0,3).map((d:any)=>d.id)};
 const accepted=await request('/api/rooms/'+id+'/command',{version:resumed.data.version,requestId:'request-001',command:roll},a.cookie);assert.equal(accepted.status,200);
 const other=await request('/api/rooms/'+id,undefined,b.cookie);assert.deepEqual(other.data.state,accepted.data.state);
 assert.equal((await request('/api/rooms/'+id+'/command',{version:accepted.data.version,requestId:'request-002',command:{type:'end'}},b.cookie)).status,422);
 const duplicate=await request('/api/rooms/'+id+'/command',{version:resumed.data.version,requestId:'request-001',command:roll},a.cookie);assert.equal(duplicate.status,200);assert.equal(duplicate.data.version,accepted.data.version);
 const stale=await request('/api/rooms/'+id+'/command',{version:0,requestId:'request-003',command:{type:'lock'}},a.cookie);assert.equal(stale.status,409);
 sql.close();
});
test('rooms require authentication and reject malformed input and cross-origin writes',async()=>{
 const {request,sql,env}=setup();const a=await request('/api/rooms',{name:'Alice',side:'corp'});const id=a.data.id;
 assert.equal((await request('/api/rooms/'+id,undefined)).status,401);
 assert.equal((await request('/api/rooms/'+id+'/command',{command:{type:'end'},version:0,requestId:'abc12345'})).status,401);
 assert.equal((await request('/api/rooms',{name:'',side:'runner'})).status,400);
 assert.equal((await request('/api/rooms',{name:'a',side:'admin'})).status,400);
 assert.equal((await request('/api/rooms/does-not-exist')).status,404);
 const crossOrigin=await handleApi(new Request('https://duel.test/api/rooms',{method:'POST',headers:{Origin:'https://elsewhere.test','Content-Type':'application/json'},body:JSON.stringify({name:'Eve',side:'runner'})}),env);
 assert.equal(crossOrigin.status,403);
 sql.close();
});
test('simultaneous joins claim only one seat and simultaneous actions commit only once',async()=>{
 const {request,sql}=setup();const host=await request('/api/rooms',{name:'Runner',side:'runner'});const id=host.data.id;
 const joins=await Promise.all([request('/api/rooms/'+id+'/join',{name:'First'}),request('/api/rooms/'+id+'/join',{name:'Second'})]);assert.deepEqual(joins.map(j=>j.status).sort(),[200,409]);
 const ready=await request('/api/rooms/'+id,undefined,host.cookie);const dice=ready.data.state.loadouts.runner.slice(0,3).map((d:any)=>d.id);
 const actions=await Promise.all([request('/api/rooms/'+id+'/command',{version:ready.data.version,requestId:'competing-001',command:{type:'roll',dice}},host.cookie),request('/api/rooms/'+id+'/command',{version:ready.data.version,requestId:'competing-002',command:{type:'roll',dice}},host.cookie)]);assert.deepEqual(actions.map(a=>a.status).sort(),[200,409]);
 const final=await request('/api/rooms/'+id,undefined,host.cookie);assert.equal(final.data.version,ready.data.version+1);assert.equal(final.data.state.eventLog.length,1);sql.close();
});
