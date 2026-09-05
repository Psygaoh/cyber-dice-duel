import * as T from 'three';
import type {Coord,GameState} from '../game/types';
import {COLORS,miniature,disposeObject} from './miniatures';
import {unfolding} from './unfold';
import {placementCells} from '../game/board';

export type BoardView={highlights:Coord[];preview:Coord[];valid:boolean;selected:string|null;hover:Coord|null;topDown:boolean;zoom:number};
export class BoardScene{
 private renderer:T.WebGLRenderer;private scene=new T.Scene();private camera=new T.OrthographicCamera();private ray=new T.Raycaster();
 private paths=new T.Group();private markers=new T.Group();private overlays=new T.Group();private pieces=new Map<string,T.Group>();private targets=new Map<string,T.Vector3>();
 private view:BoardView={highlights:[],preview:[],valid:false,selected:null,hover:null,topDown:false,zoom:1};
 private resizeObserver:ResizeObserver;private frame=0;private disposed=false;private state:GameState|null=null;private previousDeployment:string|null=null;
 private animation:{effect:ReturnType<typeof unfolding>;start:number;cells:Set<string>}|null=null;
 private down:{x:number;y:number}|null=null;private onPick:(p:Coord)=>void;private onHover:(p:Coord|null)=>void;
 constructor(private canvas:HTMLCanvasElement,onPick:(p:Coord)=>void,onHover:(p:Coord|null)=>void){
  this.onPick=onPick;this.onHover=onHover;
  this.renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));this.renderer.outputColorSpace=T.SRGBColorSpace;
  this.scene.add(new T.HemisphereLight(0xe1eeff,0x283441,2.1));const key=new T.DirectionalLight(0xffffff,3);key.position.set(-4,12,8);this.scene.add(key);
  const fill=new T.DirectionalLight(0x96bddd,1);fill.position.set(8,6,-8);this.scene.add(fill);
  const base=new T.Mesh(new T.BoxGeometry(15.3,.14,11.3),new T.MeshStandardMaterial({color:0x17212c,metalness:.2,roughness:.85}));base.position.y=-.12;this.scene.add(base);
  const tileGeo=new T.BoxGeometry(.96,.045,.96),tileMat=new T.MeshStandardMaterial({color:0x26323f,roughness:.9,metalness:.15});
  const tiles=new T.InstancedMesh(tileGeo,tileMat,165);const dummy=new T.Object3D();
  for(let y=0;y<11;y++)for(let x=0;x<15;x++){dummy.position.set(x-7,-.025,y-5);dummy.updateMatrix();tiles.setMatrixAt(y*15+x,dummy.matrix);tiles.setColorAt(y*15+x,new T.Color((x+y)%2?0x26313c:0x2a3541));}this.scene.add(tiles);
  this.scene.add(this.paths,this.markers,this.overlays);
  canvas.addEventListener('pointermove',this.move);canvas.addEventListener('pointerleave',this.leave);canvas.addEventListener('pointerdown',this.pointerDown);canvas.addEventListener('pointerup',this.pointerUp);
  this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(canvas);this.resize();this.tick();
 }
 private clear(g:T.Group){disposeObject(g);g.clear();}
 private plate(g:T.Group,p:Coord,color:number,opacity=1,y=.018,size=.92){const mesh=new T.Mesh(new T.BoxGeometry(size,.027,size),new T.MeshStandardMaterial({color,transparent:opacity<1,opacity,metalness:.25,roughness:.55,emissive:color,emissiveIntensity:.06}));mesh.position.set(p.x-7,y,p.y-5);g.add(mesh);return mesh;}
 private ring(g:T.Group,p:Coord,color:number,y=.06,size=.82){const points=[[-size/2,-size/2],[size/2,-size/2],[size/2,size/2],[-size/2,size/2],[-size/2,-size/2]].map(([x,z])=>new T.Vector3(p.x-7+x,y,p.y-5+z));const line=new T.Line(new T.BufferGeometry().setFromPoints(points),new T.LineBasicMaterial({color}));g.add(line);}
 updateState(state:GameState){
  const initial=!this.state;this.state=state;
  if(state.lastDeployment?.id&&state.lastDeployment.id!==this.previousDeployment){
   if(!initial&&!matchMedia('(prefers-reduced-motion: reduce)').matches){if(this.animation){this.scene.remove(this.animation.effect.group);disposeObject(this.animation.effect.group);}const effect=unfolding(state.lastDeployment);this.scene.add(effect.group);this.animation={effect,start:performance.now(),cells:new Set(placementCells(state.lastDeployment.netId,state.lastDeployment.origin,state.lastDeployment.rotation).map(p=>`${p.x},${p.y}`))};}
   this.previousDeployment=state.lastDeployment.id;
  }
  this.rebuildPaths();this.clear(this.markers);
  for(const d of state.data){this.plate(this.markers,d,d.breached?0x3b5558:0x3d657a,1,.08,.63);const diamond=new T.Mesh(new T.OctahedronGeometry(.21),new T.MeshStandardMaterial({color:d.breached?0x6b9297:COLORS.data,emissive:d.breached?0:COLORS.data,emissiveIntensity:.35,metalness:.4,roughness:.3}));diamond.position.set(d.x-7,.37,d.y-5);this.markers.add(diamond);}
  for(const [p,color] of [[{x:0,y:5},COLORS.runner],[{x:14,y:5},COLORS.corp]] as const){this.ring(this.markers,p,color,.08,.86);this.ring(this.markers,p,color,.082,.68);}
  for(const p of state.payloads){this.ring(this.markers,p,p.kind==='mine'?0xf5a263:0x92dca8,.1,.5);}
  for(const [id,g] of this.pieces)if(!state.units.some(u=>u.id===id)){this.scene.remove(g);disposeObject(g);this.pieces.delete(id);this.targets.delete(id);}
  for(const u of state.units){let g=this.pieces.get(u.id);if(!g){g=miniature(u);g.position.set(u.x-7,.02,u.y-5);this.scene.add(g);this.pieces.set(u.id,g);}this.targets.set(u.id,new T.Vector3(u.x-7,.02,u.y-5));}
  this.drawView();
 }
 private rebuildPaths(){if(!this.state)return;this.clear(this.paths);this.state.board.forEach((side,i)=>{if(!side)return;const p={x:i%15,y:Math.floor(i/15)};if(this.animation?.cells.has(`${p.x},${p.y}`))return;this.plate(this.paths,p,side==='runner'?0x385840:0x593743);this.ring(this.paths,p,COLORS[side],.04,.87);});}
 updateView(view:BoardView){this.view=view;this.resize();this.drawView();}
 private drawView(){this.clear(this.overlays);for(const p of this.view.highlights)this.plate(this.overlays,p,0xb1e378,.38,.073,.74);for(const p of this.view.preview){if(p.x>=0&&p.x<15&&p.y>=0&&p.y<11){this.plate(this.overlays,p,this.view.valid?0xc1f76d:0xff647c,.70,.11,.9);this.ring(this.overlays,p,this.view.valid?0xe0ffa9:0xff99a7,.135);}}
  const selected=this.state?.units.find(u=>u.id===this.view.selected);if(selected)this.ring(this.overlays,selected,0xffffff,.09,.96);if(this.view.hover&&this.view.preview.length===0)this.ring(this.overlays,this.view.hover,0xd9e4ec,.1,.94);
 }
 private resize(){const w=this.canvas.clientWidth,h=this.canvas.clientHeight;if(!w||!h)return;this.renderer.setSize(w,h,false);const aspect=w/h;const vertical=Math.max(this.view.topDown?12.5:12.8,17/aspect)/this.view.zoom;this.camera.left=-vertical*aspect/2;this.camera.right=vertical*aspect/2;this.camera.top=vertical/2;this.camera.bottom=-vertical/2;this.camera.near=.1;this.camera.far=80;this.camera.position.set(0,this.view.topDown?25:20,this.view.topDown?.01:15);this.camera.lookAt(0,0,0);this.camera.updateProjectionMatrix();}
 private pick(e:PointerEvent){const r=this.canvas.getBoundingClientRect();this.ray.setFromCamera(new T.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),this.camera);const p=new T.Vector3();if(!this.ray.ray.intersectPlane(new T.Plane(new T.Vector3(0,1,0),0),p))return null;const x=Math.round(p.x+7),y=Math.round(p.z+5);return x>=0&&x<15&&y>=0&&y<11?{x,y}:null;}
 private move=(e:PointerEvent)=>this.onHover(this.pick(e));
 private leave=()=>this.onHover(null);
 private pointerDown=(e:PointerEvent)=>{this.down={x:e.clientX,y:e.clientY};};
 private pointerUp=(e:PointerEvent)=>{if(this.down&&Math.hypot(e.clientX-this.down.x,e.clientY-this.down.y)<12){const p=this.pick(e);if(p)this.onPick(p);}this.down=null;};
 private tick=()=>{if(this.disposed)return;this.frame=requestAnimationFrame(this.tick);if(document.hidden)return;
  if(this.animation&&this.animation.effect.update(performance.now()-this.animation.start)){this.scene.remove(this.animation.effect.group);disposeObject(this.animation.effect.group);this.animation=null;this.rebuildPaths();}
  for(const [id,g] of this.pieces){g.position.lerp(this.targets.get(id)!,0.19);g.visible=!(this.animation?.cells.has(`${Math.round(this.targets.get(id)!.x+7)},${Math.round(this.targets.get(id)!.z+5)}`));}
  this.renderer.render(this.scene,this.camera);
 };
 dispose(){this.disposed=true;cancelAnimationFrame(this.frame);this.resizeObserver.disconnect();this.canvas.removeEventListener('pointermove',this.move);this.canvas.removeEventListener('pointerleave',this.leave);this.canvas.removeEventListener('pointerdown',this.pointerDown);this.canvas.removeEventListener('pointerup',this.pointerUp);disposeObject(this.scene);this.renderer.dispose();}
}
