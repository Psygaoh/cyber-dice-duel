import {useEffect,useRef,useState} from 'react';
import type {Coord,GameState} from '../game/types';
import {BoardScene,type BoardView} from '../render/BoardScene';
import {equal} from '../game/board';
type Props={state:GameState;view:BoardView;onPick:(p:Coord)=>void;onHover:(p:Coord|null)=>void};
export default function Board({state,view,onPick,onHover}:Props){
 const canvas=useRef<HTMLCanvasElement>(null),scene=useRef<BoardScene|null>(null),callbacks=useRef({onPick,onHover});callbacks.current={onPick,onHover};
 const [flat,setFlat]=useState(false),[failed,setFailed]=useState(false);const cursor=useRef({x:7,y:5});
 useEffect(()=>{if(flat||!canvas.current)return;let renderer:BoardScene;try{renderer=new BoardScene(canvas.current,p=>callbacks.current.onPick(p),p=>callbacks.current.onHover(p));scene.current=renderer;renderer.updateState(state);renderer.updateView(view);}catch{setFailed(true);setFlat(true);return;}return()=>{renderer.dispose();scene.current=null;};},[flat]);
 useEffect(()=>scene.current?.updateState(state),[state]);useEffect(()=>scene.current?.updateView(view),[view]);
 return <div className="board-surface">
  {flat?<div className="flat-grid" role="grid" aria-label="Network board">{state.board.map((owner,i)=>{const p={x:i%15,y:Math.floor(i/15)},unit=state.units.find(u=>equal(u,p)),data=state.data.find(d=>equal(d,p)),ghost=view.preview.some(c=>equal(c,p)),highlight=view.highlights.some(c=>equal(c,p));return <button role="gridcell" key={i} className={`${owner??'empty'} ${ghost?(view.valid?'legal':'illegal'):''} ${highlight?'reachable':''}`} title={`Cell ${p.x+1}, ${p.y+1}${unit?' · '+unit.name:''}${data?' · Data '+data.id:''}`} aria-label={`Cell ${p.x+1}, ${p.y+1}, ${owner??'empty'}${unit?', '+unit.name:''}${data?', Data '+data.id:''}`} onFocus={()=>onHover(p)} onMouseEnter={()=>onHover(p)} onClick={()=>onPick(p)}>{unit?(unit.side==='runner'?'R':unit.kind.slice(0,2).toUpperCase()):data?(data.breached?'✓':data.id):(i===75?'G':i===89?'C':'')}</button>;})}</div>:<canvas ref={canvas} tabIndex={0} role="application" aria-label="3D network board. Arrow keys choose a cell; Enter activates it. Use Accessible grid for cell labels." onKeyDown={e=>{const k=e.key;if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(k)){e.preventDefault();cursor.current={x:Math.max(0,Math.min(14,cursor.current.x+(k==='ArrowLeft'?-1:k==='ArrowRight'?1:0))),y:Math.max(0,Math.min(10,cursor.current.y+(k==='ArrowUp'?-1:k==='ArrowDown'?1:0)))};onHover(cursor.current);}if(k==='Enter'||k===' '){e.preventDefault();onPick(cursor.current);}}}/>}
  <button className="board-access small quiet" onClick={()=>setFlat(v=>!v)} disabled={failed&&flat}>{flat?(failed?'2D mode · WebGL unavailable':'3D board'):'Accessible grid'}</button>
 </div>;
}
