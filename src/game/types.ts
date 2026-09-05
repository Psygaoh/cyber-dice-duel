export type Side = 'runner' | 'corp';
export type Coord = { x:number; y:number };
export type Symbol = 'deploy'|'move'|'attack'|'guard'|'code'|'ability';
export type Resource = Exclude<Symbol,'deploy'>;
export type Pools = Record<Resource,number>;
export type Die = {id:string;side:Side;template:string;faces:Symbol[];netId:string;compiled:boolean};
export type RolledDie = {id:string;face:Symbol};
export type Unit = Coord & {id:string;side:Side;kind:string;name:string;hp:number;maxHp:number;power:number;moveCap:number;shield:number};
export type Program = {id:string;template:string};
export type Payload = Coord & {id:string;kind:'mine'|'restore'};
export type Command =
 | {type:'roll';dice:string[]}
 | {type:'reroll';dieId:string}
 | {type:'lock'}
 | {type:'compile';dieId:string;origin:Coord;rotation:number;mirror?:boolean;discardDaemon?:string}
 | {type:'chargeMove'}
 | {type:'move';unitId:string;to:Coord}
 | {type:'attack';unitId:string;targetId:string}
 | {type:'defend';guard:number}
 | {type:'flip';to:Coord}
 | {type:'ability';unitId:string;to:Coord}
 | {type:'breach'} | {type:'end'} | {type:'resign'};
export type GameEvent = {index:number;side:Side;command:Command;random:RolledDie[]|null;hash:string;text:string};
export type GameState = {
 seed:string;rng:number;round:number;phase:'recon'|'intrusion';activeSide:Side;stage:'choose'|'rolled'|'actions';
 board:(Side|null)[];resources:Record<Side,Pools>;loadouts:Record<Side,Die[]>;rolled:RolledDie[];
 rerolled:boolean;compiledThisTurn:boolean;compilationOpen:boolean;movement:{points:number;moved:Record<string,number>};attacked:string[];
 units:Unit[];daemons:Program[];payloads:Payload[];data:(Coord & {id:string;breached:boolean})[];
 timer:number;intrusionRound:number;pending:{attacker:string;target:string;damage:number;defender:Side}|null;
 winner:Side|null;winReason:string|null;eventLog:GameEvent[];
 metrics:{deploys:number;compilations:number;rerolls:number;gained:number;spent:number;flipped:number;damage:number;breached:number;reconRounds:number};
 lastDeployment:{id:string;side:Side;netId:string;origin:Coord;rotation:number}|null;
};
export type Result = {ok:true;state:GameState}|{ok:false;code:string;message:string};
