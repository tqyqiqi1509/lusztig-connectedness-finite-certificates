const {d,tableaux,neighbors,rsinfo,adjCache,rsCache}=require('./boxed459_finite_ops.cjs'),fs=require('fs');
const cases=[
 {shape:[3,3,1,1],residue:2,source:[4,1,3,1],target:[4,2,2,0]},
 {shape:[3,3,1,1],residue:2,source:[4,2,2,0],target:[4,3,1,1]},
 {shape:[3,3,2,2],residue:3,source:[5,1,3,1],target:[5,3,2,1]},
 {shape:[5,5,3,1],residue:0,source:[7,3,2,0],target:[7,2,4,0]},
 {shape:[3,3,3,3,1,1],residue:3,source:[7,4,2,0],target:[7,3,3,1]}
];
const total={started_utc:new Date().toISOString(),scope:'Exhaustive all insertion tableaux at source corner and required nv residue, all recording tableaux, both signed-permutation parity branches. No inductive normalization or fixed-position fiber reduction is used in this finite certificate.',cases:[]};
const filename=__dirname+'/boxed459_finite_complete.json';
for(const c of cases){adjCache.clear();rsCache.clear();const ts=tableaux(c.shape),ps=ts.filter(a=>JSON.stringify(a.at(-1))===JSON.stringify(c.source)&&a.filter(x=>x[3]).length%4===c.residue);
 const co={...c,all_shape_tableaux:ts.length,insertion_count:ps.length,recording_count:ts.length,pair_count:ps.length*ts.length,traces:[],failures:[],max_search:0,max_path:0,parity_counts:{even:0,odd:0}};
 let pi=0;for(const p of ps){for(const q of ts){const qt=d.fromList(q),qkey=d.key(qt),w=d.invrs(new d.TableauPair({left:d.fromList(p),right:qt}));co.parity_counts[w.filter(x=>x<0).length%2?'odd':'even']++;const start=w.join(),queue=[w],pred=new Map([[start,null]]);let final=null,k=0;
 for(;k<queue.length;k++){const u=queue[k],ukey=u.join(),r=rsinfo(u);if(r.q===qkey&&JSON.stringify(r.last)===JSON.stringify(c.target)){final=ukey;break;}
  for(const {w:v,op}of neighbors(u)){const vk=v.join();if(pred.has(vk))continue;pred.set(vk,{previous:ukey,op});queue.push(v);}if(queue.length>150000)throw Error('Unexpected large component');}
 co.max_search=Math.max(co.max_search,k+1);if(final===null)co.failures.push({p,q,w,component_size:queue.length});else{let at=final,path=[];while(pred.get(at)!==null){const z=pred.get(at);path.push({...z.op,output:at.split(',').map(Number)});at=z.previous;}path.reverse();co.max_path=Math.max(co.max_path,path.length);co.traces.push({initial:w,search_states:k+1,path,final:final.split(',').map(Number)});}}
 pi++;console.log(new Date().toISOString(),'shape',c.shape.join(','),'P',pi,'/',ps.length,'Qeach',ts.length,'maxpath',co.max_path,'fail',co.failures.length,'cachedRS',rsCache.size);}
 total.cases.push(co);fs.writeFileSync(filename,JSON.stringify(total));console.log('CASE COMPLETE',c.shape,'pairs',co.pair_count,'parity',co.parity_counts,'fails',co.failures.length,'maxpath',co.max_path);}
total.completed_utc=new Date().toISOString();fs.writeFileSync(filename,JSON.stringify(total));console.log('FINISHED',total.completed_utc);
