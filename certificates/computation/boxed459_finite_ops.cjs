// Exhaustive finite certificates for the four residual boxed-transfer shapes.
// All transitions are actual signed-permutation stars or explicit D4 words.
const d=require('../finite_d_domino/domino_runtime.cjs'),fs=require('fs');
const memo=new Map();
function tableaux(s){const key=JSON.stringify(s);if(memo.has(key))return memo.get(key);if(!s.length)return [[]];const n=s.reduce((a,b)=>a+b,0)/2,out=[];for(let i=0;i<s.length;i++){if(s[i]-(s[i+1]||0)>=2){let t=s.slice();t[i]-=2;while(t.length&&!t.at(-1))t.pop();for(const a of tableaux(t))out.push([...a,[n,i+1,s[i]-1,0]]);}if(i+1<s.length&&s[i]===s[i+1]&&(s[i+2]||0)<s[i]){let t=s.slice();t[i]--;t[i+1]--;while(t.length&&!t.at(-1))t.pop();for(const a of tableaux(t))out.push([...a,[n,i+1,s[i],1]]);}}memo.set(key,out);return out;}
function type(w){const D=d.desc(w),c=2,outer=[0,1,3];for(const b of outer){const[g,e]=outer.filter(x=>x!==b);if(D[b]&&D[c]&&!D[g]&&!D[e]&&d.star(w,g,c).join()!=d.star(w,e,c).join())return ['A',b];if(D[g]&&D[e]&&!D[b]&&!D[c]&&d.star(w,c,g).join()!=d.star(w,c,e).join())return ['B',b];}if(outer.every(b=>D[b])&&!D[c]&&new Set(outer.map(b=>d.star(w,c,b).join())).size===1)return ['C',null];if(D[c]&&outer.every(b=>!D[b])&&new Set(outer.map(b=>d.star(w,b,c).join())).size===1)return ['D',null];return null;}
function mul(w,word){for(const s of word.slice().reverse())w=d.left(w,s);return w;}
function d4outputs(w){const tx=type(w);if(!tx)return[];const[t,b0]=tx,c=2,outer=[0,1,3],out=[];for(const b of ['A','B'].includes(t)?[b0]:outer){const[g,e]=outer.filter(x=>x!==b);const words=[[b],['C','D'].includes(t)?[g,e,c]:[c,g,e],[c,e,c],[c,g,c]];const target=t==='A'?['D',null]:t==='B'?['C',null]:t==='C'?['B',b]:['A',b];for(const word of words){const v=mul(w,word);if(JSON.stringify(type(v))===JSON.stringify(target))out.push({w:v,op:{kind:'D4',source:tx,target,word}});}}return out;}
const adjCache=new Map(),rsCache=new Map();
function neighbors(w){const key=w.join();if(adjCache.has(key))return adjCache.get(key);const n=w.length,D=d.desc(w),pairs=[[0,2],[1,2],...Array.from({length:n-3},(_,i)=>[i+2,i+3])],out=[];for(let[a,b]of pairs){if(D[a]===D[b])continue;if(D[a])[a,b]=[b,a];out.push({w:d.star(w,a,b),op:{kind:'star',a,b}});}out.push(...d4outputs(w));adjCache.set(key,out);return out;}
function rsinfo(w){const key=w.join();if(rsCache.has(key))return rsCache.get(key);const r=d.rs(w),info={q:d.key(r.right),last:d.list(r.left).at(-1)};rsCache.set(key,info);return info;}

module.exports={d,tableaux,type,mul,neighbors,rsinfo,adjCache,rsCache};
