import * as T from 'three';
import {rotatedNet} from '../game/cube-nets';
import type {GameState} from '../game/types';
import {COLORS} from './miniatures';
export function unfolding(deployment:NonNullable<GameState['lastDeployment']>){
 const group=new T.Group();group.position.set(deployment.origin.x-7,.055,deployment.origin.y-5);group.rotation.x=-Math.PI/2;
 const cells=rotatedNet(deployment.netId,deployment.rotation).map(p=>({x:p.x,y:-p.y}));
 const hinges:{group:T.Group;axis:'x'|'y';angle:number;depth:number}[]=[];
 const visited=new Set<string>();const color=COLORS[deployment.side];
 function face(parent:T.Group,x:number,y:number,depth:number){
  visited.add(`${x},${y}`);
  const tile=new T.Mesh(new T.BoxGeometry(.96,.96,.055),new T.MeshStandardMaterial({color,metalness:.3,roughness:.48,emissive:color,emissiveIntensity:.10}));parent.add(tile);
  const inset=new T.Mesh(new T.BoxGeometry(.70,.70,.058),new T.MeshStandardMaterial({color:deployment.side==='runner'?0x254738:0x4d2939,roughness:.6}));parent.add(inset);
  const pip=new T.Mesh(new T.BoxGeometry(.17,.17,.064),new T.MeshBasicMaterial({color}));parent.add(pip);
  for(const p of cells){const dx=p.x-x,dy=p.y-y;if(Math.abs(dx)+Math.abs(dy)!==1||visited.has(`${p.x},${p.y}`))continue;
   const hinge=new T.Group();hinge.position.set(dx*.5,dy*.5,0);parent.add(hinge);const child=new T.Group();child.position.set(dx*.5,dy*.5,0);hinge.add(child);
   const axis=dx?'y':'x',angle=(dx?-dx:dy)*Math.PI/2;hinges.push({group:hinge,axis,angle,depth});face(child,p.x,p.y,depth+1);
  }
 }
 face(group,0,0,0);
 const duration=1900;
 function update(elapsed:number){for(const h of hinges){const p=T.MathUtils.clamp((elapsed-200-h.depth*240)/650,0,1),ease=p*p*(3-2*p);h.group.rotation[h.axis]=h.angle*(1-ease);}return elapsed>=duration;}
 update(0);return {group,update};
}
