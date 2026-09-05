import {useCallback,useEffect,useRef,useState} from 'react';
import type {Command,GameState,Side} from '../game/types';
import {command,createGame} from '../game/engine';
export type Room={id:string;version:number;side:Side;ready:boolean;players:Record<Side,string|null>;state:GameState};
type JoinInfo={ready:boolean;openSide:Side;hostName:string};
export function useRoom(){
 const initialId=new URLSearchParams(location.search).get('room');
 const [id,setId]=useState<string|null>(initialId),[room,setRoom]=useState<Room|null>(null),[joinInfo,setJoinInfo]=useState<JoinInfo|null>(null),[loading,setLoading]=useState(!!initialId),[busy,setBusy]=useState(false),[error,setError]=useState(''),[online,setOnline]=useState(true),[local,setLocal]=useState(false);
 const current=useRef(room),busyRef=useRef(false);current.current=room;
 const accept=useCallback((r:Room)=>{setRoom(old=>old&&old.id===r.id&&old.version>=r.version?old:r);setJoinInfo(null);setOnline(true);},[]);
 const refresh=useCallback(async()=>{
  if(!id||local)return;
  try{const res=await fetch(`/api/rooms/${id}`,{credentials:'same-origin',signal:AbortSignal.timeout(10000)});const data=await res.json();
   if(res.ok){accept(data);setError('');}
   else if(res.status===401){setJoinInfo(data.room);setRoom(null);setError('');}
   else{setError(data.error??'Unable to open this duel.');}
   setOnline(res.status<500);
  }catch{setOnline(false);setError('Connection interrupted. Trying to reconnect…');}
  finally{setLoading(false);}
 },[id,local,accept]);
 useEffect(()=>{if(!id||local)return;let stopped=false,timer:ReturnType<typeof setTimeout>;const poll=async()=>{if(!document.hidden&&!busyRef.current)await refresh();if(!stopped)timer=setTimeout(poll,document.hidden?8000:1800);};void poll();const visible=()=>{if(!document.hidden)void refresh();};document.addEventListener('visibilitychange',visible);return()=>{stopped=true;clearTimeout(timer);document.removeEventListener('visibilitychange',visible);};},[id,local,refresh]);
 async function enter(kind:'create'|'join',name:string,side:Side='runner'){
  if(busyRef.current)return;busyRef.current=true;setBusy(true);setError('');
  try{const res=await fetch(kind==='create'?'/api/rooms':`/api/rooms/${id}/join`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,side}),signal:AbortSignal.timeout(15000)});const data=await res.json();if(!res.ok)throw Error(data.error);accept(data);setId(data.id);history.replaceState(null,'',`?room=${data.id}`);localStorage.setItem('cdd:last-room',data.id);localStorage.setItem('cdd:name',name);setOnline(true);}
  catch(e){setError(e instanceof Error?e.message:'Unable to join. Please try again.');}finally{setBusy(false);busyRef.current=false;setLoading(false);}
 }
 async function execute(c:Command){
  if(busyRef.current||!current.current)return false;const r=current.current;
  if(local){const side=r.state.pending?.defender??r.state.activeSide;const result=command(r.state,side,c);if(!result.ok){setError(result.message);return false;}setRoom({...r,version:r.version+1,side:result.state.pending?.defender??result.state.activeSide,state:result.state});setError('');return true;}
  busyRef.current=true;setBusy(true);setError('');const requestId=crypto.randomUUID();
  try{const res=await fetch(`/api/rooms/${r.id}/command`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({version:r.version,requestId,command:c}),signal:AbortSignal.timeout(12000)});const data=await res.json();if(data.room)accept(data.room);if(!res.ok){setError(data.error);return false;}accept(data);return true;}
  catch{setError('Connection interrupted. Refreshing the saved duel before your next action.');setOnline(false);await refresh();return false;}
  finally{busyRef.current=false;setBusy(false);}
 }
 function practice(){setOnline(true);const state=createGame(crypto.randomUUID());setLocal(true);setId(null);history.replaceState(null,'',location.pathname);setRoom({id:'local',version:0,side:'runner',ready:true,players:{runner:'Runner',corp:'Corp'},state});setJoinInfo(null);setError('');setLoading(false);}
 return {id,room,joinInfo,loading,busy,error,online,local,enter,execute,practice,refresh,clearError:()=>setError('')};
}
