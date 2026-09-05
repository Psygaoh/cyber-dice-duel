import * as T from 'three';
import type {Unit} from '../game/types';
export const COLORS={runner:0xc1f76d,corp:0xff7185,data:0x87cfff};
const mat=(color:number,emissive=false)=>new T.MeshStandardMaterial({color,roughness:.6,metalness:.25,emissive:emissive?color:0,emissiveIntensity:emissive?.25:0});
function box(g:T.Group,w:number,h:number,d:number,x:number,y:number,z:number,m:T.Material){const b=new T.Mesh(new T.BoxGeometry(w,h,d),m);b.position.set(x,y,z);b.castShadow=true;b.receiveShadow=true;g.add(b);return b;}
export function miniature(unit:Unit){
 const g=new T.Group(),accent=mat(COLORS[unit.side],true),dark=mat(0x24303b),black=mat(0x080e16),eye=mat(0x9ff8ff,true);
 if(unit.kind==='avatar'){
  const red=mat(0xd56862),shade=mat(0x2e3f58);
  // Eight radial voxel arms, squat mantle, square hacker visor: a small octopus.
  for(let i=0;i<8;i++){const a=i*Math.PI/4;const arm=new T.Group();arm.rotation.y=a;box(arm,.14,.12,.26,0,.14,.24,red);box(arm,.15,.10,.17,0,.10,.39,shade);g.add(arm);}
  box(g,.46,.34,.40,0,.36,0,red);box(g,.34,.12,.33,0,.59,0,red);box(g,.40,.10,.35,0,.19,0,shade);
  box(g,.51,.14,.065,0,.41,.23,black);box(g,.17,.07,.015,-.13,.42,.269,eye);box(g,.17,.07,.015,.13,.42,.269,eye);box(g,.06,.05,.035,0,.41,.277,dark);
 }else if(unit.kind==='firewall'){
  box(g,.78,.12,.60,0,.11,0,dark);box(g,.63,.66,.24,0,.47,0,dark);
  for(const x of [-.22,0,.22])box(g,.10,.49,.04,x,.47,.145,accent);
 }else if(unit.kind==='hunter'){
  box(g,.42,.28,.54,0,.30,0,dark);box(g,.30,.22,.29,0,.54,.17,dark);box(g,.32,.07,.04,0,.57,.33,accent);
  for(const x of [-.28,.28])for(const z of [-.22,.22])box(g,.14,.22,.17,x,.17,z,accent);
 }else if(unit.kind==='sentry'){
  box(g,.56,.16,.56,0,.14,0,dark);box(g,.32,.34,.32,0,.38,0,dark);box(g,.60,.23,.42,0,.62,0,dark);box(g,.42,.07,.04,0,.64,.23,accent);box(g,.12,.11,.30,0,.62,.33,black);
 }else{
  box(g,.49,.15,.49,0,.12,0,dark);box(g,.34,.44,.34,0,.39,0,dark);box(g,.18,.14,.18,0,.68,0,accent);
  box(g,.11,.24,.04,0,.42,.19,accent);box(g,.26,.09,.04,0,.42,.20,accent);
 }
 const ring=new T.Mesh(new T.RingGeometry(.37,.43,32),new T.MeshBasicMaterial({color:COLORS[unit.side],side:T.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.072;g.add(ring);
 return g;
}
export function disposeObject(object:T.Object3D){object.traverse(o=>{if(o instanceof T.Mesh||o instanceof T.Line){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});}
