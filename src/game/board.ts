import type {Coord,GameState,Side} from './types';
import {WIDTH,HEIGHT} from './content';
import {rotatedNet} from './cube-nets';
export const equal=(a:Coord,b:Coord)=>a.x===b.x&&a.y===b.y;
export const distance=(a:Coord,b:Coord)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
export const inBounds=(p:Coord)=>Number.isInteger(p.x)&&Number.isInteger(p.y)&&p.x>=0&&p.x<WIDTH&&p.y>=0&&p.y<HEIGHT;
export const index=(p:Coord)=>p.y*WIDTH+p.x;
export const neighbors=(p:Coord)=>[{x:p.x-1,y:p.y},{x:p.x+1,y:p.y},{x:p.x,y:p.y-1},{x:p.x,y:p.y+1}].filter(inBounds);
export function placementCells(netId:string,origin:Coord,rotation:number){return rotatedNet(netId,rotation).map(c=>({x:c.x+origin.x,y:c.y+origin.y}));}
export function legalPlacement(s:GameState,side:Side,netId:string,origin:Coord,rotation:number){
 try {const cells=placementCells(netId,origin,rotation);return cells.every(c=>inBounds(c)&&!s.board[index(c)])&&cells.some(c=>neighbors(c).some(n=>s.board[index(n)]===side));}catch{return false;}
}
export function findPlacement(s:GameState,side:Side,netId:string){for(let rotation=0;rotation<4;rotation++)for(let x=0;x<WIDTH;x++)for(let y=0;y<HEIGHT;y++){const origin={x,y};if(legalPlacement(s,side,netId,origin,rotation))return {origin,rotation};}return null;}
