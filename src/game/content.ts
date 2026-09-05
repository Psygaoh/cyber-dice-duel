import type {Die,Side,Symbol,Unit} from './types';
export const SYMBOLS:Symbol[]=['deploy','move','attack','guard','code','ability'];
export const RESOURCES=['move','attack','guard','code','ability'] as const;
export const WIDTH=15, HEIGHT=11;
export const GATEWAY={x:0,y:5}, CORE={x:14,y:5};
export type Template = {id:string;name:string;side:Side;category:string;faces:Symbol[];netId:string;description:string;hp?:number;power?:number;moveCap?:number};
const faces=(s:string)=>s.split(' ') as Symbol[];
export const TEMPLATES:Template[]=[
 {id:'breach',name:'Breach',side:'runner',category:'Exploit',faces:faces('deploy deploy move attack code ability'),netId:'NET-01',description:'On compile: gain 2 Ability.'},
 {id:'sprint',name:'Sprint',side:'runner',category:'Exploit',faces:faces('deploy deploy move move code ability'),netId:'NET-04',description:'On compile: gain 4 Mobility Points this turn.'},
 {id:'ghost',name:'Ghost',side:'runner',category:'Daemon',faces:faces('deploy deploy move move code guard'),netId:'NET-08',description:'Secured cells cost 1 Mobility Point. Does not stack.'},
 {id:'spike',name:'Spike',side:'runner',category:'Payload',faces:faces('deploy deploy attack attack code ability'),netId:'NET-03',description:'Place a mine at the origin. The next ICE entering takes 2 damage.'},
 {id:'daemon',name:'Daemon',side:'runner',category:'Daemon',faces:faces('deploy deploy move code code ability'),netId:'NET-09',description:'Each Move resource grants +1 Mobility Point.'},
 {id:'payload',name:'Payload',side:'runner',category:'Payload',faces:faces('deploy deploy move attack ability guard'),netId:'NET-11',description:'Place a restore patch at the origin. Next Avatar entry restores 2 Integrity.'},
 {id:'sentry',name:'Sentry',side:'corp',category:'ICE',faces:faces('deploy deploy guard guard attack code'),netId:'NET-02',description:'Patrol up to 1 cell per turn. Power 2 · Integrity 4.',hp:4,power:2,moveCap:1},
 {id:'hunter',name:'Hunter',side:'corp',category:'ICE',faces:faces('deploy deploy move attack guard code'),netId:'NET-05',description:'Pursue up to 2 cells per turn. Power 3 · Integrity 3.',hp:3,power:3,moveCap:2},
 {id:'firewall',name:'Firewall',side:'corp',category:'ICE',faces:faces('deploy deploy guard guard code ability'),netId:'NET-06',description:'Immobile. Adjacent cells cost Runner +1 movement. Power 1 · Integrity 5.',hp:5,power:1,moveCap:0},
 {id:'repair',name:'Repair Utility',side:'corp',category:'Utility ICE',faces:faces('deploy deploy guard code code ability'),netId:'NET-07',description:'1 Ability: restore 2 Integrity to self or adjacent ICE.',hp:3,power:1,moveCap:2},
 {id:'reinforce',name:'Reinforce Utility',side:'corp',category:'Utility ICE',faces:faces('deploy deploy guard guard ability attack'),netId:'NET-10',description:'1 Ability: grant 1 shield to self or adjacent ICE (max 2).',hp:3,power:1,moveCap:2},
 {id:'sanitise',name:'Sanitise Utility',side:'corp',category:'Utility ICE',faces:faces('deploy deploy attack guard code ability'),netId:'NET-11',description:'1 Ability: sanitise one adjacent backdoor without an enemy on it.',hp:3,power:1,moveCap:2}
];
export const template=(id:string)=>{const t=TEMPLATES.find(t=>t.id===id);if(!t)throw Error('Unknown content');return t;};
export function makeLoadout(side:Side):Die[]{return TEMPLATES.filter(t=>t.side===side).flatMap(t=>[0,1].map(i=>({id:`${side}-${t.id}-${i+1}`,side,template:t.id,faces:[...t.faces],netId:t.netId,compiled:false})));}
export function makeIce(kind:string,id:string,x:number,y:number):Unit{const t=template(kind);return {id,side:'corp',kind,name:t.name,x,y,hp:t.hp!,maxHp:t.hp!,power:t.power!,moveCap:t.moveCap!,shield:0};}
