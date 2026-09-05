import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createGame,command,replay} from '../engine';
import {findPlacement,index} from '../board';
import {makeIce,TEMPLATES} from '../content';
import {NETS} from '../cube-nets';
import type {GameState,Command,Side} from '../types';
const step=(s:GameState,c:Command,side:Side=s.activeSide)=>{const r=command(s,side,c);if(!r.ok)assert.fail(r.message);return r.state;};
function fixture(){const s=createGame('content');s.stage='actions';for(const side of ['runner','corp'] as const)s.resources[side]={move:9,attack:9,guard:9,code:9,ability:9};return s;}
function compile(s:GameState,id:string,discardDaemon?:string){const die=s.loadouts[s.activeSide].find(d=>d.template===id&&!d.compiled)!;s.stage='actions';s.compilationOpen=true;s.compiledThisTurn=false;s.rolled=[{id:die.id,face:'deploy'},{id:'support',face:'deploy'}];const p=findPlacement(s,s.activeSide,die.netId)!;assert.ok(p);return step(s,{type:'compile',dieId:die.id,...p,discardDaemon});}

test('canonical net geometry and origins still match the source SVG',()=>{
 const svg=readFileSync('docs/reference/cube-nets-reference.svg','utf8');
 for(const net of NETS){const section=svg.split(`aria-label="Cube net ${net.id.slice(-2)}"`)[1].split('<g aria-label=')[0];const cells=[...section.matchAll(/<g class="cell( origin)?">\s*<rect x="([\d.]+)" y="([\d.]+)"/g)];const origin=cells.find(c=>c[1])!;assert.deepEqual(cells.map(c=>({x:Math.round((Number(c[2])-Number(origin[2]))/42),y:Math.round((Number(c[3])-Number(origin[3]))/42)})),net.cells);}
});
test('every template has six exact faces, two Deploy faces and two copies',()=>{
 const s=createGame('templates');for(const t of TEMPLATES){assert.equal(t.faces.length,6);assert.equal(t.faces.filter(f=>f==='deploy').length,2);assert.equal(s.loadouts[t.side].filter(d=>d.template===t.id).length,2);}
});
test('a die cannot compile with fewer than two Deploy, after an action, or be rolled after compilation',()=>{
 let s=fixture();s.compilationOpen=true;const die=s.loadouts.runner[0],p=findPlacement(s,'runner',die.netId)!;s.rolled=[{id:die.id,face:'deploy'}];const snapshot=JSON.stringify(s);assert.equal(command(s,'runner',{type:'compile',dieId:die.id,...p}).ok,false);assert.equal(JSON.stringify(s),snapshot);
 s=compile(s,'breach');s.stage='choose';assert.equal(command(s,'runner',{type:'roll',dice:[die.id,...s.loadouts.runner.slice(2,4).map(d=>d.id)]}).ok,false);
 let t=fixture();t.compilationOpen=true;t.rolled=[{id:t.loadouts.runner[0].id,face:'deploy'},{id:t.loadouts.runner[1].id,face:'deploy'}];t=step(t,{type:'chargeMove'});assert.equal(command(t,'runner',{type:'compile',dieId:t.loadouts.runner[0].id,...findPlacement(t,'runner','NET-01')!}).ok,false);
});
test('rolling all remaining dice keeps a heavily compiled loadout playable',()=>{
 let s=createGame('remaining');s.loadouts.runner.forEach((d,i)=>d.compiled=i>=2);s=step(s,{type:'roll',dice:s.loadouts.runner.slice(0,2).map(d=>d.id)});assert.equal(s.rolled.length,2);s=step(s,{type:'lock'});s=step(s,{type:'end'});assert.equal(s.activeSide,'corp');
});
test('overspending and malformed coordinates are rejected without mutation',()=>{
 const s=fixture();s.resources.runner.move=0;const snapshot=JSON.stringify(s);assert.equal(command(s,'runner',{type:'chargeMove'}).ok,false);assert.equal(command(s,'runner',{type:'flip',to:{x:NaN,y:5}}).ok,false);assert.equal(JSON.stringify(s),snapshot);
});
test('Ghost reduces enemy movement cost and bandwidth Daemons add Mobility',()=>{
 let s=fixture();s.daemons=[{id:'ghost',template:'ghost'},{id:'bandwidth',template:'daemon'}];s.board[index({x:1,y:5})]='corp';s=step(s,{type:'chargeMove'});assert.equal(s.movement.points,5);s=step(s,{type:'move',unitId:'avatar',to:{x:1,y:5}});assert.equal(s.movement.points,4);
});
test('a fourth Daemon requires explicit replacement and preserves state on rejection',()=>{
 let s=fixture();s.daemons=[{id:'a',template:'daemon'},{id:'b',template:'daemon'},{id:'c',template:'ghost'}];
 const die=s.loadouts.runner.find(d=>d.template==='ghost')!,p=findPlacement(s,'runner',die.netId)!;s.compilationOpen=true;s.rolled=[{id:die.id,face:'deploy'},{id:'other',face:'deploy'}];const before=JSON.stringify(s);
 assert.equal(command(s,'runner',{type:'compile',dieId:die.id,...p}).ok,false);assert.equal(JSON.stringify(s),before);
 s=step(s,{type:'compile',dieId:die.id,...p,discardDaemon:'b'});assert.equal(s.daemons.length,3);assert.ok(!s.daemons.some(d=>d.id==='b'));
});
test('Runner corruption and Corp sanitisation respect permanent locations and occupancy',()=>{
 let s=fixture();s.board[index({x:1,y:5})]='corp';s=step(s,{type:'flip',to:{x:1,y:5}});assert.equal(s.board[index({x:1,y:5})],'runner');assert.equal(s.phase,'intrusion');
 s.activeSide='corp';s.units.push(makeIce('sanitise','utility',2,5));s=step(s,{type:'ability',unitId:'utility',to:{x:1,y:5}});assert.equal(s.board[index({x:1,y:5})],'corp');
 s.units.find(u=>u.id==='utility')!.x=1;assert.equal(command(s,'corp',{type:'ability',unitId:'utility',to:{x:0,y:5}}).ok,false);
});
test('repair and reinforcement obey caps; shields absorb damage',()=>{
 let s=fixture();s.activeSide='corp';s.units.push(makeIce('repair','repair',12,5));s.units[1].hp=1;s=step(s,{type:'ability',unitId:'repair',to:{x:13,y:5}});assert.equal(s.units[1].hp,3);
 s.units.find(u=>u.id==='repair')!.kind='reinforce';s=step(s,{type:'ability',unitId:'repair',to:{x:13,y:5}});s=step(s,{type:'ability',unitId:'repair',to:{x:13,y:5}});assert.equal(command(s,'corp',{type:'ability',unitId:'repair',to:{x:13,y:5}}).ok,false);
 s.activeSide='runner';s.units[0].x=12;s.units[0].y=5;s.units=s.units.filter(u=>u.id!=='repair');s=step(s,{type:'attack',unitId:'avatar',targetId:s.units[1].id});s=step(s,{type:'defend',guard:0},'corp');assert.equal(s.units[1].hp,3);assert.equal(s.units[1].shield,0);
});
test('Payloads trigger once and destroyed ICE leaves its path intact',()=>{
 let s=fixture();s.activeSide='corp';s.units[1].hp=2;s.payloads=[{id:'mine',kind:'mine',x:12,y:5}];s=step(s,{type:'chargeMove'});s=step(s,{type:'move',unitId:s.units[1].id,to:{x:12,y:5}});assert.equal(s.units.length,1);assert.equal(s.payloads.length,0);assert.equal(s.board[index({x:12,y:5})],'corp');
 s.activeSide='runner';s.units[0].hp=4;s.payloads=[{id:'patch',kind:'restore',x:1,y:5}];s.movement.points=2;s=step(s,{type:'move',unitId:'avatar',to:{x:1,y:5}});assert.equal(s.units[0].hp,6);assert.equal(s.payloads.length,0);
});
test('Firewall adds traversal cost and cannot move',()=>{
 let s=fixture();s.units.push(makeIce('firewall','wall',1,4));s=step(s,{type:'chargeMove'});s=step(s,{type:'move',unitId:'avatar',to:{x:1,y:5}});assert.equal(s.movement.points,2);
 s.activeSide='corp';s.movement.points=9;assert.equal(command(s,'corp',{type:'move',unitId:'wall',to:{x:2,y:4}}).ok,false);
});
test('replay rejects tampered event hashes',()=>{
 let s=createGame('tamper');s=step(s,{type:'roll',dice:s.loadouts.runner.slice(0,3).map(d=>d.id)});const events=structuredClone(s.eventLog);events[0].hash='not-the-hash';assert.throws(()=>replay(s.seed,events),/hash mismatch/);
});
