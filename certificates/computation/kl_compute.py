#!/usr/bin/env python3
"""Exact equal-parameter KL polynomials and left cell geometry.
Convention left multiplication s*w acts on values in the permutation.
P_{x,w} = q^(1-c)P_{sx,sw}+q^c P_{x,sw}
           - sum_{x<=z<sw, sz<z} mu(z,sw) q^((l(w)-l(z))/2) P_{x,z}.
Polynomial tuples contain integer coefficients in ascending powers of q.
"""
import argparse, collections, functools, itertools, json, time, os, hashlib

def padd(*terms):
    n=max((len(a)+shift for a,shift,mult in terms if a and mult), default=0)
    r=[0]*n
    for a,shift,mult in terms:
        for i,v in enumerate(a):r[i+shift]+=mult*v
    while r and not r[-1]:r.pop()
    return tuple(r)

def bits(m):
    while m:
        b=m&-m;yield b.bit_length()-1;m-=b

class Coxeter:
    def __init__(self,typ,n):
        self.typ,self.n=typ,n
        self.rank=n-1 if typ=='A' else n
        identity=tuple(range(1,n+1))
        def simple(w,s):
            if typ=='A':
                a,b=s+1,s+2
                return tuple(b if x==a else a if x==b else x for x in w)
            if typ=='D' and s==0:
                return tuple(-2 if x==1 else -1 if x==2 else 2 if x==-1 else 1 if x==-2 else x for x in w)
            if s==0:return tuple(-x if abs(x)==1 else x for x in w)
            a,b=s,s+1
            return tuple((b if x>0 else -b) if abs(x)==a else (a if x>0 else -a) if abs(x)==b else x for x in w)
        self.simple=simple
        elems=[identity];index={identity:0};lengths=[0];words=[()]
        for w in elems:
            wi=index[w]
            for s in range(self.rank):
                sw=simple(w,s)
                if sw not in index:
                    index[sw]=len(elems);elems.append(sw);lengths.append(lengths[wi]+1);words.append((s,)+words[wi])
        self.elems,self.index,self.lengths,self.words=elems,index,lengths,words
        self.N=len(elems)
        self.left=[[index[simple(w,s)] for w in elems] for s in range(self.rank)]
        self.descent=[sum(1<<s for s in range(self.rank) if lengths[self.left[s][w]]<lengths[w]) for w in range(self.N)]
        self.lower=[0]*self.N;self.lower[0]=1
        if self.N>6000:
            # Involutive permutation of a bitset, vectorized; same subword recurrence.
            import numpy as np
            nbytes=(self.N+7)//8
            perms=[np.asarray(row,dtype=np.int32) for row in self.left]
            for y in range(1,self.N):
                s=(self.descent[y]&-self.descent[y]).bit_length()-1
                sy=self.left[s][y];m=self.lower[sy]
                arr=np.unpackbits(np.frombuffer(m.to_bytes(nbytes,'little'),dtype=np.uint8),bitorder='little')[:self.N]
                packed=np.packbits(arr|arr[perms[s]],bitorder='little').tobytes()
                self.lower[y]=int.from_bytes(packed,'little')
        else:
            for y in range(1,self.N):
                s=(self.descent[y]&-self.descent[y]).bit_length()-1
                sy=self.left[s][y];m=self.lower[sy]
                self.lower[y]=m|sum(1<<self.left[s][z] for z in bits(m))
        self.inverse=[]
        for w in elems:
            v=[0]*n
            for k,x in enumerate(w):v[abs(x)-1]=(k+1)*(1 if x>0 else -1)
            self.inverse.append(index[tuple(v)])
        self.polys=[{} for _ in elems]
        self.mu=[[] for _ in elems]
    def kl(self, verbose=True):
        t=time.monotonic();self.polys[0][0]=(1,)
        for y in range(1,self.N):
            s=(self.descent[y]&-self.descent[y]).bit_length()-1;sy=self.left[s][y];ly=self.lengths[y]
            subtract=[(z,c,(ly-self.lengths[z])//2) for z,c in self.mu[sy] if self.descent[z]>>s&1]
            d=self.polys[y]
            for x in bits(self.lower[y]):
                if x==y:d[x]=(1,);continue
                c=int(self.descent[x]>>s&1)
                sx=self.left[s][x]
                terms=[(self.polys[sy].get(sx,()),1-c,1),(self.polys[sy].get(x,()),c,1)]
                terms.extend((self.polys[z].get(x,()),sh,-mu) for z,mu,sh in subtract)
                p=padd(*terms)
                assert p and p[0]==1,(x,y,p)
                assert 2*(len(p)-1)<=ly-self.lengths[x]-1,(x,y,p)
                assert all(a>=0 for a in p),(x,y,p)
                d[x]=p
                diff=ly-self.lengths[x]
                if diff%2 and len(p)==(diff+1)//2:self.mu[y].append((x,p[-1]))
            if verbose and y%500==0:print('KL',y,'/',self.N,'elapsed',round(time.monotonic()-t,2),flush=True)
        self.elapsed=time.monotonic()-t
