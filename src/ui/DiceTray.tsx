import type {Die,GameState,Side} from '../game/types';
import {template} from '../game/content';
import {Icon,Net,title} from './components';
type Props={state:GameState;side:Side;selected:string[];onSelect:(id:string)=>void;onReroll:(id:string)=>void;onCompile:(id:string)=>void;active:boolean;busy:boolean;compileDie:string|null;onInspect:(die:Die)=>void};
export default function DiceTray({state:s,side,selected,onSelect,onReroll,onCompile,active,busy,compileDie,onInspect}:Props){
 const available=s.loadouts[side].filter(d=>!d.compiled),rolling=s.stage==='choose'&&active;
 return <section className="dice-tray"><div className="tray-heading"><div><span className="eyebrow">{s.stage==='choose'?'01 / SELECT YOUR DICE':s.stage==='rolled'?'02 / RESOLVE THE ROLL':'03 / BUILD YOUR ADVANTAGE'}</span><h2>{rolling?'Choose your approach':s.stage==='rolled'?'Keep it. Or rewrite it.':'Your loadout'}</h2></div><div className="muted mono">{rolling?`${selected.length} / ${Math.min(3,available.length)} selected`:`${available.length} / 12 dice remaining`}</div></div>
 <div className="dice-cards">{s.loadouts[side].map(d=>{const t=template(d.template),rolled=s.rolled.find(r=>r.id===d.id),chosen=selected.includes(d.id),canCompile=active&&s.stage==='actions'&&s.compilationOpen&&!s.compiledThisTurn&&rolled?.face==='deploy'&&s.rolled.filter(r=>r.face==='deploy').length>=2;
  return <div key={d.id} className={`die-card ${d.compiled?'compiled':''} ${chosen&&rolling?'selected':''} ${compileDie===d.id?'compiling':''}`}>
   <button className="die-main" disabled={d.compiled||busy} aria-pressed={rolling?chosen:undefined} onClick={()=>rolling?onSelect(d.id):onInspect(d)} title={t.description}>
    <div className="die-top"><span className="die-category">{t.category}</span><span className="die-copy">{d.id.endsWith('-1')?'I':'II'}</span></div>
    <div className="die-middle"><div><strong>{t.name}</strong><small>{d.compiled?'COMPILED':d.netId}</small></div><Net id={d.netId}/></div>
    <div className="faces">{d.faces.map((face,i)=><Icon name={face} size={20} key={i}/>)}{rolling&&chosen&&<span className="selected-check">✓</span>}</div>
   </button>
   {rolled&&!d.compiled&&<div className="rolled-result"><Icon name={rolled.face} size={23}/><b>{title(rolled.face)}</b>{active&&s.stage==='rolled'&&<button className="reroll" onClick={()=>onReroll(d.id)} disabled={busy||s.rerolled||s.resources[side].code<1} aria-label={`Reroll ${t.name} for one Code`} title="Reroll · 1 saved Code">↻</button>}{canCompile&&<button className="small compile-link" disabled={busy} onClick={()=>onCompile(d.id)}>Unfold</button>}</div>}
  </div>;
 })}</div></section>;
}
