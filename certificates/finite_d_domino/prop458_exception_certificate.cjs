/* Finite exceptional branches of an all-rank induction, using author domino RS.
 * This is not an additional low-rank KL conjecture test. Each possible recording
 * tableau in the two exceptional shape configurations is checked exhaustively.
 */
const d=require('./domino_runtime.cjs');const fs=require('fs');
const memo=new Map();
function tableaux(s){
  const k=JSON.stringify(s);if(memo.has(k))return memo.get(k);
  if(!s.length)return [[]];
  const n=s.reduce((a,b)=>a+b,0)/2,out=[];
  for(let i=0;i<s.length;i++){
    if(s[i]-(s[i+1]||0)>=2){let t=s.slice();t[i]-=2;while(t.length&&!t.at(-1))t.pop();for(const a of tableaux(t))out.push([...a,[n,i+1,s[i]-1,0]]);}
    if(i+1<s.length&&s[i]===s[i+1]&&(s[i+2]||0)<s[i]){let t=s.slice();t[i]--;t[i+1]--;while(t.length&&!t.at(-1))t.pop();for(const a of tableaux(t))out.push([...a,[n,i+1,s[i],1]]);}
  }
  memo.set(k,out);return out;
}
function pair(p,q){return new d.TableauPair({left:p,right:q});}
function equal(a,b){return JSON.stringify(a)===JSON.stringify(b);}
function normalizeReduced(w){
  const r=d.rs(w),Q=d.special(r.right),res=(d.vcount(r.left)+d.vcount(r.right))%4;
  const a=tableaux(d.shape(Q)).find(a=>(a.filter(x=>x[3]).length+d.vcount(Q))%4===res);
  if(!a)throw Error('No normalization tableau '+d.shape(Q)+' residue '+res);
  return d.invrs(pair(d.fromList(a),Q));
}
const cases=[
  {name:'3prime_a',shape:[5,4,4,1],bar:[5,3,3,1],largest:[7,2,4,1],
   auxiliary:[[1,1,1,1],[2,1,2,0],[3,3,1,1],[4,1,4,0],[5,2,2,0],[6,3,2,0]],
   star:[6,5],afterStar:[7,3,3,0],normalizedReducedShape:[5,5,1,1],finalLargest:[7,3,2,0]},
  {name:'6prime_a',shape:[3,3,3,2,2,1],bar:[3,3,3,1,1,1],largest:[7,4,2,1],
   auxiliary:[[1,1,1,1],[2,3,1,1],[3,1,2,0],[4,5,1,1],[5,2,2,1],[6,2,3,1]],
   star:[5,6],afterStar:[7,2,3,1],normalizedReducedShape:[3,3,2,2,1,1],finalLargest:[7,3,3,1]}
];
const results=[];
for(const c of cases){
  let tested=0,flipped=0;const fail=[],states=new Map(),intermediate=new Map();
  const T=d.fromList(c.auxiliary);
  for(const ap of tableaux(c.bar))for(const aq of tableaux(c.shape)){
    tested++;
    const input=pair(d.fromList([...ap,c.largest]),d.fromList(aq));
    const w=d.invrs(input),datum=d.removeLargest(w),r=d.rs(datum.w);
    try{
      if(!equal(d.list(r.left),ap))throw Error('Removal mismatch');
      let aux=d.invrs(pair(T,r.right));
      if((d.vcount(r.left)-d.vcount(T))%4!==0){aux=d.sign1(aux);flipped++;}
      const ar=d.rs(aux);
      if((d.vcount(ar.left)+d.vcount(ar.right)-d.vcount(r.left)-d.vcount(r.right))%4!==0)throw Error('Auxiliary parity mismatch');
      if(d.key(d.special(ar.right))!==d.key(d.special(r.right)))throw Error('Auxiliary S mismatch');
      const u=d.addLargest(aux,datum);
      const v=d.star(u,...c.star);
      const mid=d.removeLargest(v);
      const trace={auxiliaryShape:d.shape(ar.left),beforeStar:d.list(d.rs(u).left).at(-1),afterStar:d.list(d.rs(v).left).at(-1),normalizedReducedShape:d.shape(d.special(d.rs(mid.w).right))};
      if(!equal(trace.beforeStar,c.largest))throw Error('Unexpected largest position before high star');
      if(!equal(trace.afterStar,c.afterStar))throw Error('Unexpected largest position after high star');
      if(!equal(trace.normalizedReducedShape,c.normalizedReducedShape))throw Error('Unexpected reduced special shape');
      intermediate.set(JSON.stringify(trace),(intermediate.get(JSON.stringify(trace))||0)+1);
      const final=d.rs(d.addLargest(normalizeReduced(mid.w),mid));
      const z={shape:d.shape(final.left),largest:d.list(final.left).at(-1)};
      states.set(JSON.stringify(z),(states.get(JSON.stringify(z))||0)+1);
      if(!d.isSpecialShape(z.shape))throw Error('Final shape not special');
      if(d.key(final.right)!==d.key(d.special(input.right)))throw Error('Final Q not original S(Q)');
      if(!equal(z.largest,c.finalLargest))throw Error('Unexpected final largest '+z.largest);
    }catch(e){if(fail.length<30)fail.push({inputLeft:d.list(input.left),inputRight:d.list(input.right),w,error:String(e)});}
  }
  results.push({name:c.name,tested,flipped,failures:fail,states:[...states].map(([k,count])=>({...JSON.parse(k),count})),intermediate:[...intermediate].map(([k,count])=>({...JSON.parse(k),count}))});
}
const out={source:'Part IV 4.5.8, two exceptional rank-7 branches',results};
fs.writeFileSync(__dirname+'/prop458_exception_certificate.json',JSON.stringify(out,null,2));console.log(JSON.stringify(out,null,2));
if(results.some(r=>r.failures.length))process.exitCode=1;
module.exports={tableaux,pair,normalizeReduced};
