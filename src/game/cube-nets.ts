import type {Coord} from "./types";
// Exact geometry and marked origins extracted from the canonical repository SVG.
export const NETS:{id:string;cells:Coord[]}[] = [
  {
    "id": "NET-01",
    "cells": [
      {
        "x": -1,
        "y": -2
      },
      {
        "x": -1,
        "y": -1
      },
      {
        "x": 0,
        "y": -1
      },
      {
        "x": 0,
        "y": 0
      },
      {
        "x": 0,
        "y": 1
      },
      {
        "x": 1,
        "y": 0
      }
    ]
  },
  {
    "id": "NET-02",
    "cells": [
      {
        "x": -1,
        "y": -2
      },
      {
        "x": -1,
        "y": -1
      },
      {
        "x": 0,
        "y": -1
      },
      {
        "x": 0,
        "y": 0
      },
      {
        "x": 0,
        "y": 1
      },
      {
        "x": 1,
        "y": 1
      }
    ]
  },
  {
    "id": "NET-03",
    "cells": [
      {
        "x": -1,
        "y": -1
      },
      {
        "x": -1,
        "y": 0
      },
      {
        "x": 0,
        "y": 0
      },
      {
        "x": 0,
        "y": 1
      },
      {
        "x": 1,
        "y": 1
      },
      {
        "x": 1,
        "y": 2
      }
    ]
  },
  {
    "id": "NET-04",
    "cells": [
      {
        "x": -1,
        "y": 0
      },
      {
        "x": 0,
        "y": 0
      },
      {
        "x": 0,
        "y": 1
      },
      {
        "x": 0,
        "y": 2
      },
      {
        "x": 0,
        "y": 3
      },
      {
        "x": 1,
        "y": 0
      }
    ]
  },
  {
    "id": "NET-05",
    "cells": [
      {
        "x": -1,
        "y": -1
      },
      {
        "x": 0,
        "y": -1
      },
      {
        "x": 0,
        "y": 0
      },
      {
        "x": 0,
        "y": 1
      },
      {
        "x": 0,
        "y": 2
      },
      {
        "x": 1,
        "y": 0
      }
    ]
  },
  {
    "id": "NET-06",
    "cells": [
      {
        "x": -1,
        "y": -2
      },
      {
        "x": 0,
        "y": -2
      },
      {
        "x": 0,
        "y": -1
      },
      {
        "x": 0,
        "y": 0
      },
      {
        "x": 0,
        "y": 1
      },
      {
        "x": 1,
        "y": 0
      }
    ]
  },
  {
    "id": "NET-07",
    "cells": [
      {
        "x": -1,
        "y": -1
      },
      {
        "x": 0,
        "y": -1
      },
      {
        "x": 0,
        "y": 0
      },
      {
        "x": 0,
        "y": 1
      },
      {
        "x": 0,
        "y": 2
      },
      {
        "x": 1,
        "y": 2
      }
    ]
  },
  {
    "id": "NET-08",
    "cells": [
      {
        "x": -1,
        "y": 0
      },
      {
        "x": 0,
        "y": -1
      },
      {
        "x": 0,
        "y": 0
      },
      {
        "x": 0,
        "y": 1
      },
      {
        "x": 0,
        "y": 2
      },
      {
        "x": 1,
        "y": 0
      }
    ]
  },
  {
    "id": "NET-09",
    "cells": [
      {
        "x": -1,
        "y": 0
      },
      {
        "x": 0,
        "y": -1
      },
      {
        "x": 0,
        "y": 0
      },
      {
        "x": 0,
        "y": 1
      },
      {
        "x": 0,
        "y": 2
      },
      {
        "x": 1,
        "y": 1
      }
    ]
  },
  {
    "id": "NET-10",
    "cells": [
      {
        "x": -1,
        "y": 0
      },
      {
        "x": 0,
        "y": 0
      },
      {
        "x": 0,
        "y": 1
      },
      {
        "x": 0,
        "y": 2
      },
      {
        "x": 1,
        "y": -1
      },
      {
        "x": 1,
        "y": 0
      }
    ]
  },
  {
    "id": "NET-11",
    "cells": [
      {
        "x": 0,
        "y": -2
      },
      {
        "x": 0,
        "y": -1
      },
      {
        "x": 0,
        "y": 0
      },
      {
        "x": 1,
        "y": 0
      },
      {
        "x": 1,
        "y": 1
      },
      {
        "x": 1,
        "y": 2
      }
    ]
  }
];
export function rotatedNet(id:string,rotation:number,mirror=false):Coord[]{
 if(mirror||!Number.isInteger(rotation)||rotation<0||rotation>3)throw Error('Invalid net transform');
 const net=NETS.find(n=>n.id===id);if(!net)throw Error('Unknown net');
 return net.cells.map(c=>{let {x,y}=c;for(let r=0;r<rotation;r++)[x,y]=[-y,x];return {x:x||0,y:y||0};});
}
type V=[number,number,number];
const neg=(v:V):V=>[-v[0],-v[1],-v[2]];
export function foldsToCube(cells:Coord[]):boolean{
 if(cells.length!==6||new Set(cells.map(c=>`${c.x},${c.y}`)).size!==6)return false;
 const frames=new Map<string,{n:V;u:V;v:V}>();const key=(p:Coord)=>`${p.x},${p.y}`;
 frames.set(key(cells[0]),{n:[0,0,1],u:[1,0,0],v:[0,1,0]});const queue=[cells[0]];
 while(queue.length){const p=queue.shift()!,f=frames.get(key(p))!;
  for(const q of cells){const dx=q.x-p.x,dy=q.y-p.y;if(Math.abs(dx)+Math.abs(dy)!==1)continue;
   const frame=dx===1?{n:f.u,u:neg(f.n),v:f.v}:dx===-1?{n:neg(f.u),u:f.n,v:f.v}:dy===1?{n:f.v,u:f.u,v:neg(f.n)}:{n:neg(f.v),u:f.u,v:f.n};
   const previous=frames.get(key(q));if(previous){if(JSON.stringify(previous)!==JSON.stringify(frame))return false;continue;}
   frames.set(key(q),frame);queue.push(q);
  }
 }
 return frames.size===6&&new Set([...frames.values()].map(f=>f.n.join(','))).size===6;
}
