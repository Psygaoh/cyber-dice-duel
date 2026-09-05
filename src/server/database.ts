export interface Statement {bind(...values:any[]):Statement;first<T>():Promise<T|null>;run():Promise<{meta:{changes:number}}>}
export interface Database {prepare(sql:string):Statement}
export interface RoomRow {id:string;runner_token:string|null;corp_token:string|null;runner_name:string|null;corp_name:string|null;state:string;version:number;last_request:string|null;created_at:number;updated_at:number}
export const getRoom=(db:Database,id:string)=>db.prepare('SELECT * FROM rooms WHERE id = ?').bind(id).first<RoomRow>();
