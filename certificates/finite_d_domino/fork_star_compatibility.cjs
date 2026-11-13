const d=require('./domino_runtime.cjs'),cy=require('./domino_cycles.cjs'),fs=require('fs');
const {checkTableauDomain}=require('./tableau_domain_check.cjs');
function perms(a){if(!a.length)return[[]];return a.flatMap((v,i)=>perms(a.filter((_,j)=>j!==i)).map(p=>[v,...p]));}
function changeSquares(t,p,q){
 const L=d.list(t),grid=new Map();for(const x of L)for(const c of cy.cells(x))grid.set(c.join(),x[0]);
 const a=grid.get(p.join()),b=grid.get(q.join());grid.set(p.join(),b);grid.set(q.join(),a);
 const out=[];for(let n=1;n<=L.length;n++){let ss=[...grid].filter(([k,v])=>v===n).map(([k,v])=>k.split(',').map(Number));const[r,c]=ss[0],[u,v]=ss[1];if(Math.abs(r-u)+Math.abs(c-v)!==1)throw Error('Disconnected domino');out.push([n,Math.min(r,u),Math.min(c,v),c===v?1:0]);}return d.fromList(out);
}
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b),relation=new Set(),records=[],failures=[];let domains=0,descentValues=0,transposePairs=0;
function add(w,z,kind){relation.add(w.join()+'|'+z.join());relation.add(z.join()+'|'+w.join());relation.add(w.map(x=>-x).join()+'|'+z.map(x=>-x).join());relation.add(z.map(x=>-x).join()+'|'+w.map(x=>-x).join());records.push({w,z,kind});}
const all=perms([1,2,3]).flatMap(p=>Array.from({length:8},(_,bit)=>p.map((v,i)=>bit>>i&1?-v:v)));
for(const w of all){
 const p=d.rs(w);
 try{const checked=checkTableauDomain(d,w,p);descentValues+=checked.descentValues;transposePairs+=checked.transposePairs;}
 catch(e){failures.push({w,error:String(e)});}
 let de=d.desc(w);if(de[0]===de[2])continue;domains++;const L=d.list(p.left),P=L.slice(1).flatMap(cy.cells);let q=null,kind=null;
 try{
 if(!P.some(x=>eq(x,[2,2]))){q=new d.TableauPair({left:d.fromList(L.map(x=>[x[0]===2?3:x[0]===3?2:x[0],...x.slice(1)]).sort((a,b)=>a[0]-b[0])),right:p.right});kind='1';}
 else if(eq(L,[[1,1,1,1],[2,1,2,1],[3,1,3,0]])){let x=cy.E(p,3);q=new d.TableauPair({left:changeSquares(x.left,[2,2],[1,3]),right:x.right});kind='2';}
 else if(eq(L,[[1,1,1,1],[2,1,2,1],[3,1,3,1]])){let x=new d.TableauPair({left:changeSquares(p.left,[2,2],[1,3]),right:p.right});q=cy.E(x,3);kind='3';}
 if(q){const z=d.invrs(q),expected=d.star(w,de[0]?2:0,de[0]?0:2);if(!eq(z,expected))throw Error('Base formula mismatch');add(w,z,kind);}
 }catch(e){failures.push({w,kind,error:String(e)});}}
for(const w of all){let de=d.desc(w);if(de[0]===de[2])continue;const z=d.star(w,de[0]?2:0,de[0]?0:2);if(!relation.has(w.join()+'|'+z.join()))failures.push({w,error:'Inverse/transpose closure fails cover'});}
const out={rank:3,elements:all.length,descentValues,transposePairs,domainElements:domains,directCases:records.length,closureArrows:relation.size,failures,records};
fs.writeFileSync(__dirname+'/fork_star_compatibility.json',JSON.stringify(out,null,2));console.log({rank:3,elements:all.length,descentValues,transposePairs,domainElements:domains,directCases:records.length,closureArrows:relation.size,failures});
if(failures.length)process.exitCode=1;
