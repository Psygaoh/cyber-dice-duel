import type {Coord,GameState,Unit} from './types';
import {distance,equal,index,neighbors} from './board';
export function entryCost(s:GameState,u:Unit,p:Coord){
 let cost=s.board[index(p)]===u.side?1:2;
 if(u.side==='runner'){
   if(s.daemons.some(d=>d.template==='ghost'))cost=1;
   cost+=s.units.filter(v=>v.kind==='firewall'&&distance(v,p)===1).length;
 }
 return cost;
}
export function reachable(s:GameState,u:Unit):Map<number,{cost:number;path:Coord[]}>{
 const found=new Map<number,{cost:number;path:Coord[]}>();found.set(index(u),{cost:0,path:[]});
 const queue=[{p:{x:u.x,y:u.y},cost:0,path:[] as Coord[]}];
 const maxSteps=u.side==='runner'?Infinity:u.moveCap-(s.movement.moved[u.id]??0);
 // Cost and step count both matter for ICE. Keep Pareto states per cell.
 const seen=new Map<string,number>();
 while(queue.length){queue.sort((a,b)=>a.cost-b.cost);const item=queue.shift()!;
  for(const p of neighbors(item.p)){
   if(!s.board[index(p)]||s.units.some(v=>v.id!==u.id&&equal(v,p)))continue;
   const path=[...item.path,p],cost=item.cost+entryCost(s,u,p);
   if(cost>s.movement.points||path.length>maxSteps)continue;
   const k=`${index(p)}:${u.side==='runner'?0:path.length}`;if((seen.get(k)??Infinity)<=cost)continue;seen.set(k,cost);
   if((found.get(index(p))?.cost??Infinity)>cost)found.set(index(p),{cost,path});
   queue.push({p,cost,path});
  }
 }
 return found;
}
