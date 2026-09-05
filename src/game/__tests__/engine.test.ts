import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, command, replay } from '../engine';
import { NETS, rotatedNet, foldsToCube } from '../cube-nets';
import { legalPlacement, findPlacement } from '../board';
import type { GameState, Command, Side } from '../types';

function apply(s:GameState,c:Command,side:Side=s.activeSide){const r=command(s,side,c);if(!r.ok)assert.fail(r.code+': '+r.message);return r.state;}
function actions(){const s=createGame('test');s.stage='actions';s.resources.runner={move:9,attack:9,guard:9,code:9,ability:9};s.resources.corp={move:9,attack:9,guard:9,code:9,ability:9};return s;}

test('all eleven canonical nets fold into six distinct cube faces in every rotation',()=>{
 assert.equal(NETS.length,11);
 for(const n of NETS)for(const r of [0,1,2,3]) {const cells=rotatedNet(n.id,r);assert.equal(cells.length,6);assert.ok(foldsToCube(cells),n.id);assert.ok(cells.some(p=>p.x===0&&p.y===0));}
 assert.throws(()=>rotatedNet('NET-01',0,true));
});
test('rolls and a full round replay deterministically',()=>{
 let s=createGame('same-seed');const initial=structuredClone(s);
 for(const side of ['runner','corp'] as const){s=apply(s,{type:'roll',dice:s.loadouts[side].slice(0,3).map(d=>d.id)});s=apply(s,{type:'lock'});s=apply(s,{type:'end'});}
 assert.equal(s.round,2);assert.deepEqual(replay(initial.seed,s.eventLog),s);
 assert.deepEqual(command(initial,'runner',{type:'roll',dice:initial.loadouts.runner.slice(0,3).map(d=>d.id)}),command(createGame('same-seed'),'runner',{type:'roll',dice:initial.loadouts.runner.slice(0,3).map(d=>d.id)}));
});
test('invalid commands leave the exact input unchanged',()=>{
 const s=createGame('invalid');const before=JSON.stringify(s);
 assert.equal(command(s,'corp',{type:'end'}).ok,false);
 assert.equal(command(s,'runner',{type:'roll',dice:['missing','missing','missing']}).ok,false);
 assert.equal(command(s,'runner',{type:'move',unitId:'avatar',to:{x:1,y:5}}).ok,false);
 assert.equal(JSON.stringify(s),before);
});
test('only one paid reroll is available and newly rolled Code cannot pay for it',()=>{
 let s=createGame('reroll');s.resources.runner.code=1;
 s=apply(s,{type:'roll',dice:s.loadouts.runner.slice(0,3).map(d=>d.id)});
 s=apply(s,{type:'reroll',dieId:s.rolled[0].id});assert.equal(s.resources.runner.code,0);
 assert.equal(command(s,'runner',{type:'reroll',dieId:s.rolled[1].id}).ok,false);
 const t=createGame('reroll');const rolled=apply(t,{type:'roll',dice:t.loadouts.runner.slice(0,3).map(d=>d.id)});
 assert.equal(command(rolled,'runner',{type:'reroll',dieId:rolled.rolled[0].id}).ok,false);
});
test('resource gains cap at nine and compilation consumes one die and exactly six cells',()=>{
 let s=actions();s.stage='rolled';s.rolled=s.loadouts.runner.slice(0,3).map((d,i)=>({id:d.id,face:i<2?'deploy':'move'}));
 s=apply(s,{type:'lock'});assert.equal(s.resources.runner.move,9);
 const die=s.loadouts.runner[0],p=findPlacement(s,'runner',die.netId);assert.ok(p);
 const before=s.board.filter(Boolean).length;s=apply(s,{type:'compile',dieId:die.id,...p});
 assert.equal(s.board.filter(Boolean).length,before+6);assert.ok(s.loadouts.runner.find(d=>d.id===die.id)?.compiled);
 assert.equal(command(s,'runner',{type:'compile',dieId:s.rolled[1].id,...p}).ok,false);
});
test('placement rejects overlaps, bounds, disconnected ownership and reflection',()=>{
 const s=createGame('place');assert.ok(findPlacement(s,'runner','NET-01'));
 assert.equal(legalPlacement(s,'runner','NET-01',{x:0,y:0},0),false);
 assert.equal(legalPlacement(s,'runner','NET-01',{x:2,y:5},0),false);
 assert.equal(legalPlacement(s,'runner','NET-01',{x:8,y:5},0),false);
});
test('movement uses asymmetric costs and cannot cross empty or occupied cells',()=>{
 let s=actions();s=apply(s,{type:'chargeMove'});assert.equal(s.movement.points,4);
 s=apply(s,{type:'move',unitId:'avatar',to:{x:1,y:5}});assert.equal(s.movement.points,3);
 s.board[5*15+2]='corp';s=apply(s,{type:'move',unitId:'avatar',to:{x:2,y:5}});assert.equal(s.movement.points,1);assert.equal(s.phase,'intrusion');assert.equal(s.timer,12);
 assert.equal(command(s,'runner',{type:'move',unitId:'avatar',to:{x:3,y:5}}).ok,false);
});
test('Corp per-unit movement limit survives multiple Move resources',()=>{
 let s=actions();s.activeSide='corp';const ice=s.units[1];ice.kind='hunter';ice.moveCap=2;
 s=apply(s,{type:'chargeMove'});s=apply(s,{type:'move',unitId:ice.id,to:{x:12,y:5}});s=apply(s,{type:'move',unitId:ice.id,to:{x:12,y:4}});s=apply(s,{type:'chargeMove'});
 assert.equal(command(s,'corp',{type:'move',unitId:ice.id,to:{x:11,y:4}}).ok,false);
});
test('combat waits for defender Guard, deletes ICE, and limits attacks',()=>{
 let s=actions();s.units[1].x=1;s.units[1].y=5;s.units[1].hp=2;
 s=apply(s,{type:'attack',unitId:'avatar',targetId:s.units[1].id});assert.ok(s.pending);assert.equal(s.units[1].hp,2);
 assert.equal(command(s,'runner',{type:'end'}).ok,false);
 s=apply(s,{type:'defend',guard:1},'corp');assert.equal(s.units[1].hp,1);
 assert.equal(command(s,'runner',{type:'attack',unitId:'avatar',targetId:s.units[1].id}).ok,false);
});
test('Avatar crash and timer expiry both award Corp victory',()=>{
 let s=actions();s.activeSide='corp';s.units[0].hp=1;s.units[1].x=1;s.units[1].y=5;
 s=apply(s,{type:'attack',unitId:s.units[1].id,targetId:'avatar'});s=apply(s,{type:'defend',guard:0},'runner');assert.equal(s.winner,'corp');
 let t=actions();t.activeSide='corp';t.phase='intrusion';t.timer=1;t.intrusionRound=0;t=apply(t,{type:'end'});assert.equal(t.winner,'corp');
});
test('two breached Data and Gateway return win before the tick',()=>{
 let s=actions();s.units[0].x=10;s.units[0].y=2;s.board[2*15+10]='runner';s=apply(s,{type:'breach'});assert.equal(s.data[0].breached,true);assert.equal(s.timer,12);
 s.units[0].x=11;s.units[0].y=5;s.board[5*15+11]='runner';s.timer=6;s=apply(s,{type:'breach'});assert.equal(s.timer,8);
 s.units[0].x=1;s.units[0].y=5;s=apply(s,{type:'chargeMove'});s=apply(s,{type:'move',unitId:'avatar',to:{x:0,y:5}});assert.equal(s.winner,'runner');
});
test('intrusion triggering round is not decremented; next complete round is',()=>{
 let s=actions();s.board[5*15+1]='corp';s=apply(s,{type:'chargeMove'});s=apply(s,{type:'move',unitId:'avatar',to:{x:1,y:5}});s=apply(s,{type:'end'});s.stage='actions';s=apply(s,{type:'end'});assert.equal(s.timer,12);
 s.stage='actions';s=apply(s,{type:'end'});s.stage='actions';s=apply(s,{type:'end'});assert.equal(s.timer,11);
});
test('a Corp attack on backdoors during Recon does not start the Runner intrusion clock',()=>{
 let s=actions();s.activeSide='corp';s.units[1].x=1;s.units[1].y=5;
 s=apply(s,{type:'attack',unitId:s.units[1].id,targetId:'avatar'});
 assert.equal(s.phase,'recon');
 s=apply(s,{type:'defend',guard:0},'runner');assert.equal(s.phase,'recon');
});
