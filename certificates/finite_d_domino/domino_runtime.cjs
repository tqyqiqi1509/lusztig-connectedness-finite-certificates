// Thin research wrapper around the MIT-licensed author implementation.
const fs=require('fs');
const vm=require('vm');
vm.runInThisContext(fs.readFileSync(__dirname+'/sources/Tableau.js','utf8')+
  '\nglobalThis.dominoAPI={Square,Domino,Tableau,TableauWithGrid,TableauPair,TableauPairGrid,ParameterDominoRS};');
const {Square,Domino,Tableau,TableauWithGrid,TableauPair,ParameterDominoRS}=globalThis.dominoAPI;
function rs(w){return TableauPair.RobinsonSchenstedGrid(new ParameterDominoRS({array:[0,...w]}),'D');}
function invrs(p){return p.getParameter().parameter.slice(1);}
function list(t){return t.dominoList.map(d=>[d.n,d.y+1,d.x+1,d.horizontal?0:1]);}
function key(t){return JSON.stringify(list(t));}
function vcount(t){return t.dominoList.filter(d=>!d.horizontal).length;}
function shape(t){
  const s=[];
  for(const d of t.dominoList){s[d.y]=Math.max(s[d.y]||0,d.x+(d.horizontal?2:1));if(!d.horizontal)s[d.y+1]=Math.max(s[d.y+1]||0,d.x+1);}
  return s;
}
function isSpecialShape(s){return s.length%2===0&&s.every((a,i)=>i%2===1||a===s[i+1]||(a%2===1&&s[i+1]%2===1));}
function special(t){
  const q=new TableauWithGrid({type:'D',dominoList:t.dominoList.map(d=>new Domino({...d}))});
  let steps=0;
  while(true){
    const s=shape(q);let corner=null;
    for(let y=0;y<s.length;y++)if(y%2===0&&s[y]%2===0&&(s[y+1]||0)<s[y]){corner=new Square({x:s[y]-1,y});break;}
    if(!corner){if(!isSpecialShape(s))throw Error('Special algorithm stuck '+JSON.stringify(s));return q;}
    q.moveOpenCycle(corner);if(++steps>2*t.dominoList.length+2)throw Error('Special loop');
  }
}
function fromList(a){return new TableauWithGrid({type:'D',dominoList:a.map(([n,r,c,d])=>new Domino({n,y:r-1,x:c-1,horizontal:!d}))});}
function inverse(w){const x=[];w.forEach((a,i)=>x[Math.abs(a)-1]=Math.sign(a)*(i+1));return x;}
function left(w,s){
  return w.map(a=>{
    const z=Math.abs(a),sg=Math.sign(a);
    if(s===0)return z===1?-2*sg:z===2?-sg:a;
    return z===s?(s+1)*sg:z===s+1?s*sg:a;
  });
}
function desc(w){const z=inverse(w);return [z[0]+z[1]<0,...Array.from({length:w.length-1},(_,i)=>z[i]>z[i+1])];}
function star(w,a,b){
  const d=desc(w);if(d[a]||!d[b])throw Error('Star domain '+[a,b]+' '+w);
  const candidates=[left(w,a),left(w,b)].filter(x=>{let e=desc(x);return e[a]&&!e[b];});
  if(candidates.length!==1)throw Error('Star value '+[a,b]+' '+w);
  return candidates[0];
}
function sign1(w){return w.map(a=>Math.abs(a)===1?-a:a);}
function removeLargest(w){let i=w.findIndex(a=>Math.abs(a)===w.length);return {w:w.filter((a,j)=>i!==j),index:i,value:w[i]};}
function addLargest(w,datum){const v=w.slice();v.splice(datum.index,0,datum.value);return v;}
module.exports={...globalThis.dominoAPI,rs,invrs,list,key,shape,vcount,isSpecialShape,special,fromList,inverse,left,desc,star,sign1,removeLargest,addLargest};
