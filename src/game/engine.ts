import type {Command,GameState,Side,Resource,Unit,Result,GameEvent} from './types';
import {WIDTH,HEIGHT,makeLoadout,makeIce,template,GATEWAY,CORE} from './content';
import {hashText,nextRandom} from './random';
import {distance,equal,index,inBounds,legalPlacement,placementCells} from './board';
import {entryCost,reachable} from './movement';

export function createGame(seed:string):GameState {
 const board:(Side|null)[]=Array(WIDTH*HEIGHT).fill(null);
 for(const [x,y] of [[0,5],[1,5],[2,5],[2,4],[2,6],[3,4],[3,6]])board[y*WIDTH+x]='runner';
 for(const [x,y] of [[14,5],[13,5],[12,5],[12,4],[12,6],[11,4],[11,6]])board[y*WIDTH+x]='corp';
 const pools=()=>({move:0,attack:0,guard:0,code:0,ability:0});
 return {seed,rng:hashText(seed),round:1,phase:'recon',activeSide:'runner',stage:'choose',board,resources:{runner:pools(),corp:pools()},loadouts:{runner:makeLoadout('runner'),corp:makeLoadout('corp')},rolled:[],rerolled:false,compiledThisTurn:false,compilationOpen:false,movement:{points:0,moved:{}},attacked:[],units:[{id:'avatar',side:'runner',kind:'avatar',name:'Avatar',x:0,y:5,hp:8,maxHp:8,power:2,moveCap:99,shield:0},makeIce('sentry','initial-sentry',13,5)],daemons:[],payloads:[],data:[{id:'A',x:10,y:2,breached:false},{id:'B',x:11,y:5,breached:false},{id:'C',x:10,y:8,breached:false}],timer:12,intrusionRound:0,pending:null,winner:null,winReason:null,eventLog:[],metrics:{deploys:0,compilations:0,rerolls:0,gained:0,spent:0,flipped:0,damage:0,breached:0,reconRounds:0},lastDeployment:null};
}
class RuleError extends Error {constructor(public code:string,message:string){super(message);}}
function need(condition:unknown,code:string,message:string):asserts condition {if(!condition)throw new RuleError(code,message);}
const other=(side:Side):Side=>side==='runner'?'corp':'runner';
function spend(s:GameState,side:Side,r:Resource,n=1){need(Number.isInteger(n)&&n>=0,'INVALID_COMMAND','Choose a whole resource amount.');need(s.resources[side][r]>=n,'RESOURCE_INSUFFICIENT',`You need ${n} ${r}.`);s.resources[side][r]-=n;s.metrics.spent+=n;}
function gain(s:GameState,side:Side,r:Resource,n=1){const old=s.resources[side][r];s.resources[side][r]=Math.min(9,old+n);s.metrics.gained+=s.resources[side][r]-old;}
function intrusion(s:GameState){if(s.phase==='recon'){s.phase='intrusion';s.timer=12;s.intrusionRound=s.round;s.metrics.reconRounds=s.round;}}
function ownUnit(s:GameState,id:string,side:Side){const u=s.units.find(u=>u.id===id);need(u&&u.side===side,'INVALID_UNIT','Select one of your units.');return u;}
function actions(s:GameState){need(s.stage==='actions','WRONG_PHASE','Roll and lock your dice first.');}
function finish(s:GameState,side:Side,reason:string){s.winner=side;s.winReason=reason;s.pending=null;}
function damage(s:GameState,u:Unit,amount:number){const absorbed=Math.min(u.shield,amount);u.shield-=absorbed;amount-=absorbed;u.hp=Math.max(0,u.hp-amount);s.metrics.damage+=amount;if(!u.hp){if(u.side==='runner')finish(s,'corp','Avatar crashed');else s.units=s.units.filter(v=>v.id!==u.id);}}
function rollDie(s:GameState,id:string,side:Side){const d=s.loadouts[side].find(d=>d.id===id);need(d&&!d.compiled,'DIE_UNAVAILABLE','That die is unavailable.');const [r,rng]=nextRandom(s.rng);s.rng=rng;return {id,face:d.faces[Math.floor(r*6)]};}
export function stateHash(s:GameState){const {eventLog,...state}=s;return hashText(JSON.stringify(state)).toString(16).padStart(8,'0');}

function transition(s:GameState,side:Side,c:Command):string {
 need(!s.winner,'GAME_OVER','This duel has ended.');
 if(c.type==='resign'){finish(s,other(side),`${side==='runner'?'Runner':'Corp'} conceded`);return `${side} conceded the duel.`;}
 if(s.pending){
  need(c.type==='defend'&&side===s.pending.defender,'RESPONSE_PENDING','Waiting for the defender to resolve Guard.');
  need(Number.isInteger(c.guard)&&c.guard>=0&&c.guard<=s.pending.damage,'INVALID_GUARD','Guard must be between zero and incoming damage.');
  spend(s,side,'guard',c.guard);const target=s.units.find(u=>u.id===s.pending!.target)!;const amount=s.pending.damage-c.guard;
  const label=target.name;damage(s,target,amount);s.pending=null;return `${label}: ${c.guard} Guard used, ${amount} damage before shields.`;
 }
 need(side===s.activeSide,'WRONG_TURN','It is the other player’s turn.');
 switch(c.type){
 case 'roll':{
  need(s.stage==='choose','WRONG_PHASE','Dice have already been rolled.');const available=s.loadouts[side].filter(d=>!d.compiled);
  need(Array.isArray(c.dice)&&c.dice.length===Math.min(3,available.length)&&new Set(c.dice).size===c.dice.length,'DIE_UNAVAILABLE','Select three different available dice (or all remaining dice).');
  s.rolled=c.dice.map(id=>rollDie(s,id,side));s.stage='rolled';return `${side} rolled ${s.rolled.map(r=>r.face).join(' · ')}.`;
 }
 case 'reroll':{
  need(s.stage==='rolled','WRONG_PHASE','Reroll before locking results.');need(!s.rerolled,'REROLL_USED','Only one reroll is allowed per turn.');need(s.resources[side].code>0,'NO_CODE','You need a Code saved before this roll.');
  const i=s.rolled.findIndex(d=>d.id===c.dieId);need(i>=0,'DIE_UNAVAILABLE','Select a rolled die.');spend(s,side,'code');s.rolled[i]=rollDie(s,c.dieId,side);s.rerolled=true;s.metrics.rerolls++;return `${side} rerolled → ${s.rolled[i].face}.`;
 }
 case 'lock':{
  need(s.stage==='rolled','WRONG_PHASE','Roll your dice first.');for(const r of s.rolled){if(r.face==='deploy')s.metrics.deploys++;else gain(s,side,r.face);}
  s.stage='actions';s.compilationOpen=true;return `${side} locked results and banked resources.`;
 }
 case 'compile':{
  actions(s);need(s.compilationOpen&&!s.compiledThisTurn,'COMPILE_CLOSED','Compile before taking other actions, once per turn.');
  need(s.rolled.filter(r=>r.face==='deploy').length>=2,'DEPLOY_REQUIREMENT_NOT_MET','Compilation requires two Deploy results.');
  const d=s.loadouts[side].find(d=>d.id===c.dieId);need(d&&!d.compiled&&s.rolled.some(r=>r.id===d.id&&r.face==='deploy'),'DIE_UNAVAILABLE','Choose a die showing Deploy.');
  need(!c.mirror&&inBounds(c.origin)&&legalPlacement(s,side,d.netId,c.origin,c.rotation),'ILLEGAL_PLACEMENT','The six cells must fit, stay empty and touch your network. Rotation only.');
  for(const p of placementCells(d.netId,c.origin,c.rotation))s.board[index(p)]=side;
  d.compiled=true;s.compiledThisTurn=true;s.compilationOpen=false;s.metrics.compilations++;
  s.lastDeployment={id:d.id,side,netId:d.netId,origin:{...c.origin},rotation:c.rotation};
  if(side==='corp')s.units.push(makeIce(d.template,d.id,c.origin.x,c.origin.y));
  else if(d.template==='breach')gain(s,side,'ability',2);
  else if(d.template==='sprint')s.movement.points+=4;
  else if(d.template==='ghost'||d.template==='daemon'){
   if(s.daemons.length===3){need(c.discardDaemon&&s.daemons.some(p=>p.id===c.discardDaemon),'DAEMON_SLOTS_FULL','Choose a Daemon to replace.');s.daemons=s.daemons.filter(p=>p.id!==c.discardDaemon);}
   s.daemons.push({id:d.id,template:d.template});
  }else s.payloads.push({id:d.id,kind:d.template==='spike'?'mine':'restore',...c.origin});
  return `${side} compiled ${template(d.template).name} into ${d.netId}.`;
 }
 case 'chargeMove':{
  actions(s);spend(s,side,'move');s.compilationOpen=false;const points=side==='runner'?4+s.daemons.filter(d=>d.template==='daemon').length:2;s.movement.points+=points;return `${side} gained ${points} ${side==='runner'?'Mobility':'Command'} Points.`;
 }
 case 'move':{
  actions(s);need(inBounds(c.to),'ILLEGAL_MOVE','Choose a cell on the board.');const u=ownUnit(s,c.unitId,side);const route=reachable(s,u).get(index(c.to));
  need(route&&route.path.length>0,'MOVEMENT_LIMIT','That cell cannot be reached with your current movement budget.');s.compilationOpen=false;
  for(const p of route.path){
   const cost=entryCost(s,u,p);s.movement.points-=cost;s.movement.moved[u.id]=(s.movement.moved[u.id]??0)+1;
   if(side==='runner'&&s.board[index(p)]==='corp')intrusion(s);u.x=p.x;u.y=p.y;
   const triggers=s.payloads.filter(t=>equal(t,p)&&((side==='corp'&&t.kind==='mine')||(side==='runner'&&t.kind==='restore')));
   for(const t of triggers){s.payloads=s.payloads.filter(v=>v.id!==t.id);if(t.kind==='mine'){intrusion(s);damage(s,u,2);}else u.hp=Math.min(u.maxHp,u.hp+2);}
   if(!s.units.some(v=>v.id===u.id)||s.winner)break;
   if(side==='runner'&&equal(u,GATEWAY)&&s.data.filter(d=>d.breached).length>=2){finish(s,'runner','Two Data extracted');break;}
  }
  return `${u.name} moved to ${u.x+1},${u.y+1}.`;
 }
 case 'attack':{
  actions(s);const u=ownUnit(s,c.unitId,side),target=s.units.find(u=>u.id===c.targetId);
  need(target&&target.side!==side&&distance(u,target)===1,'INVALID_TARGET','Attack an orthogonally adjacent enemy.');need(!s.attacked.includes(u.id),'ATTACK_USED','This unit has already attacked this turn.');
  spend(s,side,'attack');s.compilationOpen=false;s.attacked.push(u.id);if(side==='runner')intrusion(s);s.pending={attacker:u.id,target:target.id,damage:u.power,defender:target.side};return `${u.name} attacks ${target.name} for ${u.power}. Awaiting Guard.`;
 }
 case 'defend':throw new RuleError('NO_RESPONSE','There is no attack to defend.');
 case 'flip':{
  actions(s);need(side==='runner','INVALID_ABILITY','Corp sanitises with Sanitise Utility ICE.');const avatar=ownUnit(s,'avatar',side);
  need(inBounds(c.to)&&distance(avatar,c.to)<=1&&!equal(c.to,CORE)&&s.board[index(c.to)]==='corp'&&!s.units.some(u=>u.side==='corp'&&equal(u,c.to)),'INVALID_TARGET','Corrupt your cell or an adjacent secured cell without enemy ICE.');
  spend(s,side,'ability');s.compilationOpen=false;intrusion(s);s.board[index(c.to)]='runner';s.metrics.flipped++;return `Runner corrupted cell ${c.to.x+1},${c.to.y+1}.`;
 }
 case 'ability':{
  actions(s);need(side==='corp','INVALID_ABILITY','Choose a Utility ICE.');const u=ownUnit(s,c.unitId,side);
  need(inBounds(c.to)&&distance(u,c.to)<=1,'INVALID_TARGET','Utility range is self or one adjacent cell.');const target=s.units.find(v=>v.side==='corp'&&equal(v,c.to));
  if(u.kind==='repair'){need(target&&target.hp<target.maxHp,'INVALID_TARGET','Choose a damaged ICE.');spend(s,side,'ability');target.hp=Math.min(target.maxHp,target.hp+2);}
  else if(u.kind==='reinforce'){need(target&&target.shield<2,'INVALID_TARGET','Choose an ICE with fewer than two shields.');spend(s,side,'ability');target.shield++;}
  else if(u.kind==='sanitise'){need(!equal(c.to,GATEWAY)&&s.board[index(c.to)]==='runner'&&!s.units.some(v=>v.side==='runner'&&equal(v,c.to)),'INVALID_TARGET','Choose a backdoor without the Avatar.');spend(s,side,'ability');s.board[index(c.to)]='corp';s.metrics.flipped++;}
  else throw new RuleError('INVALID_ABILITY','That ICE has no activated utility.');
  s.compilationOpen=false;return `${u.name} activated at ${c.to.x+1},${c.to.y+1}.`;
 }
 case 'breach':{
  actions(s);need(side==='runner','INVALID_ABILITY','Only the Runner can breach Data.');const avatar=ownUnit(s,'avatar',side);const d=s.data.find(d=>equal(d,avatar));
  need(d&&!d.breached&&s.board[index(avatar)],'INVALID_TARGET','Stand on an unbreached connected Data Node.');spend(s,side,'ability',2);s.compilationOpen=false;intrusion(s);d.breached=true;s.timer=Math.min(12,s.timer+2);s.metrics.breached++;return `Data ${d.id} breached. Intrusion Window +2.`;
 }
 case 'end':{
  actions(s);if(side==='corp'){if(s.phase==='intrusion'&&s.round>s.intrusionRound){s.timer--;if(s.timer<=0)finish(s,'corp','Intrusion Window closed');}s.round++;}
  s.activeSide=other(side);s.stage='choose';s.rolled=[];s.rerolled=false;s.compiledThisTurn=false;s.compilationOpen=false;s.movement={points:0,moved:{}};s.attacked=[];return `${side} ended their turn.`;
 }
 default:throw new RuleError('INVALID_COMMAND','Unknown action.');
 }
}

export function command(state:GameState,side:Side,c:Command):Result{
 try{
  need(side==='runner'||side==='corp','WRONG_TURN','Unknown role.');need(c&&typeof c==='object'&&typeof c.type==='string','INVALID_COMMAND','Invalid action.');
  const s=structuredClone(state),text=transition(s,side,c);
  s.eventLog.push({index:s.eventLog.length,side,command:structuredClone(c),random:c.type==='roll'||c.type==='reroll'?structuredClone(s.rolled):null,hash:stateHash(s),text});
  return {ok:true,state:s};
 }catch(e){return e instanceof RuleError?{ok:false,code:e.code,message:e.message}:{ok:false,code:'INVALID_COMMAND',message:'That action is malformed.'};}
}
export function replay(seed:string,events:GameEvent[]):GameState{
 let s=createGame(seed);for(const e of events){const result=command(s,e.side,e.command);if(!result.ok)throw Error(`Replay rejected: ${result.code}`);s=result.state;const actual=s.eventLog.at(-1)!;if(actual.hash!==e.hash||JSON.stringify(actual.random)!==JSON.stringify(e.random))throw Error('Replay hash mismatch');}return s;
}
