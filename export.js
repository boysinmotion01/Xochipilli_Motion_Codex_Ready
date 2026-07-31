"use strict";
class CaptureManager{
  constructor(canvas,message){this.canvas=canvas;this.message=message;this.recorder=null;this.timer=null;this.stream=null;this.chunks=[]}
  download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000)}
  still(){this.canvas.toBlob(b=>b?this.download(b,"living-growth.png"):this.message("Still export failed."),"image/png")}
  supported(){return typeof MediaRecorder!=="undefined"&&typeof this.canvas.captureStream==="function"}
  start({fps,duration,onState,onReset}){
    if(!this.supported()){this.message("Direct video is unavailable here. Enter fullscreen and use your device screen recorder.");return false}
    try{
      onReset();this.chunks=[];this.stream=this.canvas.captureStream(fps);
      const types=["video/webm;codecs=vp9","video/webm;codecs=vp8","video/webm"];
      const mimeType=types.find(t=>MediaRecorder.isTypeSupported(t))||"";
      this.recorder=new MediaRecorder(this.stream,mimeType?{mimeType,videoBitsPerSecond:fps===60?10e6:6e6}:{});
      this.recorder.ondataavailable=e=>{if(e.data?.size)this.chunks.push(e.data)};
      this.recorder.onerror=()=>{this.message("Recording stopped unexpectedly. Use the device screen recorder.");this.stopTracks();onState(false)};
      this.recorder.onstop=()=>{
        if(this.chunks.length)this.download(new Blob(this.chunks,{type:mimeType||"video/webm"}),"living-growth-loop.webm");
        else this.message("No video data was produced.");
        this.stopTracks();onState(false)
      };
      this.recorder.start(250);this.timer=setTimeout(()=>this.stop(),duration*1000);onState(true);return true
    }catch(e){this.message("Recording could not start. Use the device screen recorder.");this.stopTracks();onState(false);return false}
  }
  stop(){clearTimeout(this.timer);if(this.recorder?.state==="recording")this.recorder.stop()}
  stopTracks(){this.stream?.getTracks().forEach(t=>t.stop());this.stream=null}
}
window.CaptureManager=CaptureManager;
