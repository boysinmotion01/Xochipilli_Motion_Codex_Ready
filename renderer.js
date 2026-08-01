"use strict";
class GrowthRenderer{
  constructor(canvas){
    this.canvas=canvas;this.ctx=canvas.getContext("2d",{alpha:false});
    this.trail=document.createElement("canvas");this.tctx=this.trail.getContext("2d",{alpha:false});
    this.dpr=1;this.width=1;this.height=1;this.colors={a:[217,164,65],b:[255,240,186]};this.image=null;this.glowScale=1
  }
  resize(cssW,cssH,dpr){
    const old=document.createElement("canvas");old.width=this.trail.width;old.height=this.trail.height;
    if(old.width&&old.height)old.getContext("2d").drawImage(this.trail,0,0);
    this.dpr=dpr;this.width=Math.floor(cssW*dpr);this.height=Math.floor(cssH*dpr);
    this.canvas.width=this.trail.width=this.width;this.canvas.height=this.trail.height=this.height;
    this.tctx.fillStyle="#000";this.tctx.fillRect(0,0,this.width,this.height);
    if(old.width&&old.height)this.tctx.drawImage(old,0,0,this.width,this.height)
  }
  parse(hex){return[parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)]}
  setColors(a,b){this.colors.a=this.parse(a);this.colors.b=this.parse(b)}
  color(t,alpha=.6){const a=this.colors.a,b=this.colors.b;return`rgba(${Math.round(a[0]+(b[0]-a[0])*t)},${Math.round(a[1]+(b[1]-a[1])*t)},${Math.round(a[2]+(b[2]-a[2])*t)},${alpha})`}
  fade(persistence,dt){this.tctx.globalCompositeOperation="source-over";this.tctx.fillStyle=`rgba(0,0,0,${Math.min(.2,(1-persistence)*dt)})`;this.tctx.fillRect(0,0,this.width,this.height)}
  draw(a,s,r){
    const c=this.color(a.t,.5),ctx=this.tctx,d=this.dpr,mode=s.mode;
    ctx.globalCompositeOperation="lighter";ctx.shadowBlur=s.glow*d*this.glowScale;ctx.shadowColor=c;
    const event=Math.floor(a.age/13);
    if(mode==="flowers"){
      const interval=34+(a.seed|0)%28,bloomEvent=Math.floor(a.age/interval);
      if(bloomEvent!==a.lastEvent&&bloomEvent>0){
        a.lastEvent=bloomEvent;
        const petals=5+(a.seed|0)%5,rad=(2.8+r()*4.6)*d*s.scale;
        ctx.save();ctx.translate(a.x,a.y);ctx.rotate(a.angle+r()*.7-.35);
        for(let i=0;i<petals;i++){
          const petalColor=this.color((a.t+i/petals*.22)%1,.38+r()*.2);
          ctx.rotate(Math.PI*2/petals);ctx.fillStyle=petalColor;ctx.beginPath();
          ctx.ellipse(rad*.82,0,rad*(.68+r()*.18),rad*(.18+r()*.13),0,0,Math.PI*2);ctx.fill()
        }
        ctx.fillStyle=this.color(1-a.t,.82);ctx.beginPath();ctx.arc(0,0,Math.max(1.1*d,rad*.2),0,Math.PI*2);ctx.fill();
        ctx.restore()
      }
    }
    if(mode==="particles"){ctx.fillStyle=c;ctx.beginPath();ctx.arc(a.x,a.y,(.7+r()*2.5)*d*s.scale,0,Math.PI*2);ctx.fill();return}
    if(mode==="image"){
      if(!this.image)return;
      const interval=22+(a.seed|0)%24,imageEvent=Math.floor(a.age/interval);
      if(imageEvent!==a.lastEvent&&imageEvent>0){
        a.lastEvent=imageEvent;
        const iw=this.image.naturalWidth||this.image.width,ih=this.image.naturalHeight||this.image.height;
        const unit=Math.abs(Math.sin(a.seed*12.9898+imageEvent*78.233));
        const sw=Math.max(24,iw*(.12+unit*.16)),sh=Math.max(24,ih*(.12+(1-unit)*.16));
        const sx=Math.max(0,(iw-sw)*Math.abs(Math.sin(a.seed*.071+imageEvent*.91)));
        const sy=Math.max(0,(ih-sh)*Math.abs(Math.cos(a.seed*.053+imageEvent*1.17)));
        const dw=(24+r()*54)*d*s.scale,dh=dw*(sh/sw);
        ctx.save();ctx.globalCompositeOperation="source-over";ctx.globalAlpha=.2+r()*.22;
        ctx.translate(a.x,a.y);ctx.rotate(a.angle+(r()-.5)*.7);ctx.beginPath();
        ctx.ellipse(0,0,dw*.5,dh*.5,0,0,Math.PI*2);ctx.clip();
        ctx.drawImage(this.image,sx,sy,sw,sh,-dw/2,-dh/2,dw,dh);ctx.restore()
      }
      return
    }
    if(mode==="grid"){
      const z=Math.max(7*d,12*d*s.scale),x=Math.round(a.x/z)*z,y=Math.round(a.y/z)*z;
      ctx.strokeStyle=c;ctx.lineWidth=Math.max(.6*d,a.width*d*.5);ctx.beginPath();ctx.moveTo(x-z*.5,y);ctx.lineTo(x+z*.5,y);ctx.moveTo(x,y-z*.5);ctx.lineTo(x,y+z*.5);ctx.stroke();return
    }
    if(mode==="cracks"&&r()<.12)a.angle+=(r()<.5?-1:1)*(.4+r()*.9);
    ctx.strokeStyle=c;ctx.lineCap="round";ctx.lineWidth=Math.max(.4*d,a.width*d*(mode==="lines"?1.25:.8));ctx.beginPath();ctx.moveTo(a.px,a.py);ctx.lineTo(a.x,a.y);ctx.stroke()
  }
  present(){this.ctx.globalCompositeOperation="source-over";this.ctx.drawImage(this.trail,0,0)}
  clear(){this.tctx.globalCompositeOperation="source-over";this.tctx.fillStyle="#000";this.tctx.fillRect(0,0,this.width,this.height);this.present()}
}
window.GrowthRenderer=GrowthRenderer;
