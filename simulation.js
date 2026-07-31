"use strict";
class SeededRandom{
  constructor(seed=1){this.seed=seed>>>0}
  reset(seed){this.seed=seed>>>0}
  next(){let t=this.seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}
}
class GrowthSimulation{
  constructor(){this.agents=[];this.pool=[];this.random=new SeededRandom(24051987);this.width=1;this.height=1;this.budget=2600;this.settings={};this.mirror=false}
  configure(width,height,budget,settings){this.width=width;this.height=height;this.budget=budget;this.settings=settings}
  setSeed(seed){this.random.reset(seed)}
  clear(){while(this.agents.length)this.pool.push(this.agents.pop())}
  make(x,y,angle,energy){
    const r=this.random.next.bind(this.random),a=this.pool.pop()||{};
    a.x=x;a.y=y;a.px=x;a.py=y;a.angle=angle??r()*Math.PI*2;a.energy=energy??110+r()*220;a.age=0;a.lastEvent=-1;a.width=.6+r()*1.5;a.seed=r()*9999;a.t=r();return a
  }
  add(x,y,count=this.settings.density){
    const room=this.budget-this.agents.length,n=Math.min(room,Math.max(1,Math.floor(count)));
    for(let i=0;i<n;i++)this.agents.push(this.make(x,y));
    if(this.mirror){const mx=this.width-x,m=Math.min(this.budget-this.agents.length,n);for(let i=0;i<m;i++)this.agents.push(this.make(mx,y))}
  }
  step(dt,draw){
    const s=this.settings,r=this.random.next.bind(this.random),load=this.agents.length/this.budget;
    const spawned=[];let write=0,initialLength=this.agents.length;
    for(let i=0;i<initialLength;i++){
      const a=this.agents[i];a.px=a.x;a.py=a.y;
      const flow=Math.sin(a.x*.003+a.seed)+Math.cos(a.y*.003-a.seed);
      a.angle+=(r()-.5)*s.wildness*.24*dt+flow*.012*dt;
      a.x+=Math.cos(a.angle)*s.speed*dt;a.y+=Math.sin(a.angle)*s.speed*dt;
      a.energy-=(.35+r()*.7)*dt;a.age+=dt;
      draw(a,s,r);
      const branchChance=s.branching*.024*dt*Math.max(0,1-load*1.15);
      if(r()<branchChance&&initialLength+spawned.length<this.budget){
        const angle=a.angle+(r()<.5?-1:1)*(.35+r()*1.05);
        spawned.push(this.make(a.x,a.y,angle,a.energy*(.5+r()*.32)));
      }
      if(a.energy>0&&a.x>-70&&a.x<this.width+70&&a.y>-70&&a.y<this.height+70)this.agents[write++]=a;
      else this.pool.push(a);
    }
    this.agents.length=write;
    for(let i=0;i<spawned.length&&this.agents.length<this.budget;i++)this.agents.push(spawned[i])
  }
}
window.GrowthSimulation=GrowthSimulation;
