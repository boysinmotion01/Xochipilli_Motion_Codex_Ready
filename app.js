"use strict";
(()=>{
  const $=id=>document.getElementById(id),canvas=$("stage"),renderer=new GrowthRenderer(canvas),sim=new GrowthSimulation();
  const message=text=>$("message").textContent=text,capture=new CaptureManager(canvas,message);
  const qualityProfiles={mobile:{dpr:1,budget:1200},balanced:{dpr:1.25,budget:2800},projection:{dpr:1.5,budget:4500}};
  let presetName="roots",settings={},auto=false,paused=false,pointer=false,seed=24051987,last=performance.now(),autoElapsed=0;
  let frames=0,fps=60,fpsStamp=last,lowFrames=0,hiddenPause=false,recording=false,objectUrl=null,adaptiveDpr=null;

  function chosenProfile(){
    const q=$("quality").value;
    if(q!=="auto")return qualityProfiles[q];
    return innerWidth<700||navigator.maxTouchPoints>1&&innerWidth<1000?qualityProfiles.mobile:qualityProfiles.balanced
  }
  function resize(){const p=chosenProfile(),dpr=adaptiveDpr??p.dpr;renderer.resize(innerWidth,innerHeight,dpr);sim.configure(renderer.width,renderer.height,p.budget,settings)}
  function updateLabels(){
    $("speedVal").value=Number(settings.speed).toFixed(1);$("densityVal").value=settings.density;
    $("wildnessVal").value=Number(settings.wildness).toFixed(2);$("glowVal").value=settings.glow
  }
  function applyPreset(name){
    presetName=name;settings={...GROWTH_PRESETS[name]};
    ["speed","density","wildness","glow"].forEach(k=>$(k).value=settings[k]);
    document.querySelectorAll(".world").forEach(b=>b.classList.toggle("active",b.dataset.preset===name));
    renderer.setColors(settings.colorA,settings.colorB);sim.settings=settings;updateLabels();
    $("uploadWrap").style.display=name==="image"?"flex":"none";
    $("invitation").textContent=name==="image"?"Choose an image, then touch the dark to let fragments gather.":`Touch the dark, or let ${settings.label.toLowerCase()} find their own path.`;
    message(`${settings.label} ready`)
  }
  ["speed","density","wildness","glow"].forEach(k=>$(k).addEventListener("input",e=>{settings[k]=+e.target.value;updateLabels()}));
  document.querySelectorAll(".world").forEach(b=>b.onclick=()=>applyPreset(b.dataset.preset));
  function newVariation(clear=true){seed=$("repeatable").checked?(seed+2654435761)>>>0:(Math.random()*4294967295)>>>0;sim.setSeed(seed);if(clear){sim.clear();renderer.clear()}message("A new variation is ready")}
  function setAuto(value){auto=value;$("auto").classList.toggle("active",auto);$("auto").textContent=auto?"Growing":"Grow";message(auto?"Automatic growth is active":"Automatic growth rests")}
  $("auto").onclick=()=>setAuto(!auto);$("variation").onclick=()=>newVariation(true);
  $("clear").onclick=()=>{sim.clear();renderer.clear();message("The field is clear")};
  $("pause").onclick=()=>{paused=!paused;$("pause").classList.toggle("active",paused);$("pause").textContent=paused?"Resume":"Pause";message(paused?"Movement paused":"Movement resumed")};
  $("mirror").onclick=()=>{sim.mirror=!sim.mirror;$("mirror").classList.toggle("active",sim.mirror);message(sim.mirror?"Mirror is active":"Mirror is off")};
  $("controlsToggle").onclick=()=>{const hidden=$("panel").classList.toggle("hidden");$("controlsToggle").textContent=hidden?"Controls":"Hide";$("controlsToggle").setAttribute("aria-expanded",String(!hidden))};
  $("fullscreen").onclick=async()=>{try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen();else await document.exitFullscreen()}catch(e){message("Fullscreen is unavailable. Hide controls and use your device screen recorder.")}};
  $("save").onclick=()=>capture.still();
  $("record").onclick=()=>{
    if(recording){capture.stop();return}
    const size=$("recordSize").value;
    if(size!=="current"){
      const [w,h]=size.split("x").map(Number),p=chosenProfile(),dpr=Math.min(p.dpr,1920/w);
      renderer.resize(w,h,dpr);sim.configure(renderer.width,renderer.height,p.budget,settings)
    }
    capture.start({fps:+$("recordFps").value,duration:+$("duration").value,onReset:()=>newVariation(true),onState:live=>{
      recording=live;$("recDot").classList.toggle("live",live);$("record").classList.toggle("active",live);$("recordLabel").textContent=live?"Stop & save":"Record loop";
      if(!live)resize();
      message(live?`Recording a ${$("duration").value}-second repeatable loop`:"Loop exported")
    }})
  };
  $("quality").onchange=()=>{adaptiveDpr=null;resize();message(`${$("quality").selectedOptions[0].text} performance selected`)};
  $("diagnostics").onchange=e=>$("diagnostic").hidden=!e.target.checked;
  $("imageUpload").onchange=e=>{
    const file=e.target.files?.[0];if(!file)return;
    if(!/^image\/(png|jpeg|webp|gif)$/.test(file.type)){message("Choose a PNG, JPEG, WebP, or GIF image.");e.target.value="";return}
    if(objectUrl)URL.revokeObjectURL(objectUrl);objectUrl=URL.createObjectURL(file);const image=new Image();
    image.onload=()=>{renderer.image=image;message("Image ready. Touch the dark to grow with it.")};
    image.onerror=()=>{URL.revokeObjectURL(objectUrl);objectUrl=null;message("That image could not be opened. Try a PNG or JPEG.")};image.src=objectUrl
  };
  function point(e){const rect=canvas.getBoundingClientRect();return{x:(e.clientX-rect.left)*renderer.dpr,y:(e.clientY-rect.top)*renderer.dpr}}
  canvas.onpointerdown=e=>{pointer=true;canvas.setPointerCapture(e.pointerId);const p=point(e);sim.add(p.x,p.y)};
  canvas.onpointermove=e=>{if(pointer){const p=point(e);sim.add(p.x,p.y,Math.max(1,settings.density*.35))}};
  canvas.onpointerup=canvas.onpointercancel=()=>pointer=false;
  document.addEventListener("visibilitychange",()=>{hiddenPause=document.hidden;if(hiddenPause)message("Paused while this tab is hidden");last=performance.now()});
  addEventListener("resize",resize,{passive:true});addEventListener("beforeunload",()=>{if(objectUrl)URL.revokeObjectURL(objectUrl);capture.stopTracks()});

  function loop(now){
    requestAnimationFrame(loop);
    const raw=(now-last)/16.6667;last=now;if(paused||hiddenPause)return;
    const dt=Math.min(2.2,Math.max(.15,raw));renderer.fade(settings.persistence,dt);
    autoElapsed+=now-fpsStamp<1000?16.6667:16.6667;
    if(auto&&autoElapsed>Math.max(70,220-settings.density*10)){autoElapsed=0;const t=now*.00025;sim.add(renderer.width*.5+Math.sin(t*1.4)*renderer.width*.3,renderer.height*.5+Math.cos(t*.9)*renderer.height*.26)}
    sim.step(dt,(a,s,r)=>renderer.draw(a,s,r));renderer.present();
    frames++;if(now-fpsStamp>=1000){fps=frames*1000/(now-fpsStamp);frames=0;fpsStamp=now;
      lowFrames=fps<42?lowFrames+1:Math.max(0,lowFrames-1);renderer.glowScale=lowFrames>1?.35:1;
      const p=chosenProfile();if($("quality").value==="auto"&&lowFrames>3){
        sim.budget=Math.max(900,Math.floor(p.budget*.72));
        if(renderer.dpr>1){adaptiveDpr=1;resize();message("Performance adjusted automatically")}
      }
      $("pulse").className=`pulse ${fps<30?"hot":fps<45?"warm":""}`;$("diagnostic").textContent=`${Math.round(fps)} fps · ${sim.agents.length} forms · ${sim.budget} max`
    }
  }
  applyPreset("roots");newVariation(false);resize();renderer.clear();
  if(!capture.supported())message("Ready. Use fullscreen with your device screen recorder for video.");
  requestAnimationFrame(loop)
})();
