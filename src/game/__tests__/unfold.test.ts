import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {NETS,rotatedNet} from '../cube-nets';
import {unfolding} from '../../render/unfold';
import {disposeObject} from '../../render/miniatures';

test('each rendered net begins as six cube faces and finishes at its canonical board cells',()=>{
 for(const net of NETS)for(let rotation=0;rotation<4;rotation++){
  const effect=unfolding({id:'test',side:'runner',netId:net.id,origin:{x:7,y:5},rotation});
  const faces:T.Mesh[]=[];effect.group.traverse(o=>{if(o instanceof T.Mesh&&o.geometry instanceof T.BoxGeometry&&o.geometry.parameters.depth===.055)faces.push(o);});assert.equal(faces.length,6);
  effect.update(0);effect.group.updateMatrixWorld(true);
  const centers=faces.map(f=>f.getWorldPosition(new T.Vector3()));
  const round=(x:number)=>Math.round(x*1000)/1000;
  const unique=new Set(centers.map(v=>[round(v.x),round(v.y),round(v.z)].join(',')));assert.equal(unique.size,6,net.id);
  for(const c of centers){assert.ok(Math.abs(c.x)<=.50001&&Math.abs(c.z)<=.50001&&c.y>=.05499&&c.y<=1.05501,`${net.id}: folded face outside cube`);}
  assert.equal(effect.update(2000),true);effect.group.updateMatrixWorld(true);
  const unfolded=faces.map(f=>f.getWorldPosition(new T.Vector3())).map(v=>({x:round(v.x),y:round(v.z)}));
  const expected=rotatedNet(net.id,rotation);const key=(v:{x:number;y:number})=>`${v.x},${v.y}`;
  assert.deepEqual(unfolded.map(key).sort(),expected.map(key).sort(),net.id);
  disposeObject(effect.group);
 }
});
