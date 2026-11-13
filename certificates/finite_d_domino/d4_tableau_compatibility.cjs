// Definition 4.4.10, transcribed from the visually checked tableau list on p.13.
const d=require('./domino_runtime.cjs'),cy=require('./domino_cycles.cjs'),fs=require('fs');
const {checkTableauDomain}=require('./tableau_domain_check.cjs');
const C={
 1:[[1,1,1,1],[2,3,1,1],[3,1,2,0],[4,2,2,0]],
 2:[[1,1,1,0],[2,2,1,1],[3,1,3,0],[4,2,2,1]],
 3:[[1,1,1,1],[2,3,1,1],[3,1,2,0],[4,2,2,1]],
 4:[[1,1,1,0],[2,2,1,1],[3,1,3,0],[4,2,2,0]]
};
const B={
 0:{1:[[1,1,1,0],[2,2,1,0],[3,1,3,1],[4,3,1,1]],2:[[1,1,1,0],[2,2,1,0],[3,1,3,0],[4,3,1,0]]},
 1:{1:[[1,1,1,1],[2,1,2,1],[3,1,3,1],[4,3,1,1]],2:[[1,1,1,1],[2,1,2,1],[3,1,3,0],[4,3,1,0]]},
 3:{1:[[1,1,1,1],[2,3,1,1],[3,1,2,1],[4,1,3,1]],2:[[1,1,1,0],[2,2,1,1],[3,2,2,1],[4,1,3,0]]}
};
const v=a=>a.filter(x=>x[3]).length;
function replace(pair,b,j){let L=d.list(pair.left),re=B[b][j];return new d.TableauPair({left:d.fromList([...re,...L.slice(4)]),right:pair.right});}
function CtoB(pair,b){
 const first=d.list(pair.left).slice(0,4),j=+[1,2,3,4].find(j=>JSON.stringify(C[j])===JSON.stringify(first));
 if(!j)throw Error('Not type C tableau');
 const together=cy.extended(pair,3).left.includes(4);
 if(j<=2){
  const p=replace(pair,b,j),same=v(C[j])===v(B[b][j]);
  if(together){
   if(cy.extended(p,3).left.includes(4))throw Error('Replacement failed split');
   if(same)return [p,cy.E(cy.E(p,3),4)];
   return [cy.E(p,3),cy.E(p,4)];
  }
  return [same?p:cy.E(p,3)];
 }
 if(together)throw Error('Case j=3/4 cannot have connected 3,4');
 const k=[1,2].find(k=>v(C[k])!==v(B[b][k]));
 const l=[3,4].find(l=>d.key(cy.move(d.fromList(C[j]),cy.cycleData(d.fromList(C[j])).cycles.find(c=>c.labels.includes(l)).labels))===d.key(d.fromList(C[k])));
 if(!l)throw Error('No preliminary single cycle');
 return [replace(cy.E(pair,l),b,k)];
}
function perms(a){if(!a.length)return[[]];return a.flatMap((v,i)=>perms(a.filter((_,j)=>j!==i)).map(p=>[v,...p]));}
function type(w){let D=d.desc(w),c=2,o=[0,1,3];
 for(let b of o){let[g,e]=o.filter(x=>x!==b);if(D[b]&&D[c]&&!D[g]&&!D[e]&&d.star(w,g,c).join()!=d.star(w,e,c).join())return['A',b];if(D[g]&&D[e]&&!D[b]&&!D[c]&&d.star(w,c,g).join()!=d.star(w,c,e).join())return['B',b];}
 if(o.every(b=>D[b])&&!D[c]&&new Set(o.map(b=>d.star(w,c,b).join())).size===1)return['C',null];
 if(D[c]&&o.every(b=>!D[b])&&new Set(o.map(b=>d.star(w,b,c).join())).size===1)return['D',null];return null;
}
function mul(w,word){for(const s of word.slice().reverse())w=d.left(w,s);return w;}
function groupCtoB(w,b){let[g,e]=[0,1,3].filter(x=>x!==b);return[[b],[g,e,2],[2,e,2],[2,g,2]].map(a=>mul(w,a)).filter(z=>JSON.stringify(type(z))===JSON.stringify(['B',b]));}
function pkey(p){return d.key(p.left)+'|'+d.key(p.right);}
const failures=[],records=[];let signCycleChecks=0,descentValues=0,transposePairs=0;
for(const p of perms([1,2,3,4]))for(let bit=0;bit<16;bit++){
 const w=p.map((v,i)=>bit>>i&1?-v:v),r=d.rs(w);
 try{const checked=checkTableauDomain(d,w,r);descentValues+=checked.descentValues;transposePairs+=checked.transposePairs;}
 catch(e){failures.push({w,error:String(e)});}
 try{const q=cy.E(r,1),expected=d.rs(d.sign1(w));signCycleChecks++;if(pkey(q)!==pkey(expected))throw Error('sign1 cycle mismatch');}catch(e){failures.push({w,error:String(e)});}
 if(type(w)?.[0]!=='C')continue;
 for(const b of [0,1,3]){try{
  const actual=CtoB(r,b).map(pkey).sort(),expected=groupCtoB(w,b).map(d.rs).map(pkey).sort();
  if(JSON.stringify(actual)!==JSON.stringify(expected))throw Error('operator output mismatch');
  records.push({w,outer:b,shape:d.shape(r.left),outputs:groupCtoB(w,b),number:actual.length});
 }catch(e){failures.push({w,b,error:String(e),left:d.list(r.left),right:d.list(r.right)});}}
}
const out={signCycleChecks,descentValues,transposePairs,operatorInputs:records.length,operatorArrows:records.reduce((a,r)=>a+r.number,0),failures,records};
fs.writeFileSync(__dirname+'/d4_tableau_compatibility.json',JSON.stringify(out,null,2));console.log({signCycleChecks,descentValues,transposePairs,operatorInputs:records.length,operatorArrows:out.operatorArrows,failures});
if(failures.length)process.exitCode=1;
module.exports={CtoB,groupCtoB,type,replace,C,B};
