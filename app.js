// CANVAS SETUP
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  redraw();
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// TOOL CONTROLS
const colorPicker = document.getElementById("color");
const sizePicker = document.getElementById("size");
const smoothSlider = document.getElementById("smooth");
let tool = "pen";
let smoothEnabled = false;
document.getElementById("pen").onclick = () => tool="pen";
document.getElementById("eraser").onclick = () => tool="eraser";
document.getElementById("select").onclick = () => tool="select";
document.getElementById("stabilizer").onclick = () => smoothEnabled = !smoothEnabled;

// ZOOM / ROTATE
let scale=1, rotation=0;
document.getElementById("zoomIn").onclick = () => { scale*=1.1; redraw(); }
document.getElementById("zoomOut").onclick = () => { scale/=1.1; redraw(); }
document.getElementById("rotate").onclick = () => { rotation+=Math.PI/12; redraw(); }

// IMAGE IMPORT
const imageBtn = document.getElementById("imgBtn");
const imageInput = document.getElementById("imageInput");
const imageControls = document.getElementById("imageControls");
let tempImage=null;
imageBtn.onclick = ()=> imageInput.click();
imageInput.onchange = e=>{
  const f=e.target.files[0]; if(!f) return;
  const img = new Image();
  img.onload = ()=> {
    tempImage={img, x:canvas.width/2, y:canvas.height/2, scale:0.5, rot:0, w:img.width, h:img.height};
    imageControls.classList.remove("hidden");
    redraw();
  };
  img.src = URL.createObjectURL(f);
};
canvas.addEventListener("pointerdown", e=>{ if(tempImage) {tempImage.drag=true; tempImage.ox=e.clientX; tempImage.oy=e.clientY;} });
canvas.addEventListener("pointermove", e=>{ if(tempImage && tempImage.drag){ tempImage.x+=e.clientX-tempImage.ox; tempImage.y+=e.clientY-tempImage.oy; tempImage.ox=e.clientX; tempImage.oy=e.clientY; redraw(); }} );
canvas.addEventListener("pointerup", ()=>{ if(tempImage) tempImage.drag=false; });
canvas.addEventListener("wheel", e=>{ if(tempImage){ e.preventDefault(); tempImage.scale*= e.deltaY<0?1.05:0.95; redraw(); } });

document.getElementById("imgOk").onclick = ()=>{
  currentFrame.layers[currentLayer].ctx.drawImage(
    tempImage.img,
    tempImage.x-tempImage.w/2,
    tempImage.y-tempImage.h/2,
    tempImage.w*tempImage.scale,
    tempImage.h*tempImage.scale
  );
  tempImage=null;
  imageControls.classList.add("hidden");
  redraw();
};
document.getElementById("imgCancel").onclick = ()=>{
  tempImage=null;
  imageControls.classList.add("hidden");
  redraw();
};

// LAYERS + SELECTION
let frames=[{layers:[]}];
let currentFrameIdx=0;
let currentLayer=0;

function createLayer(name) {
  const c=document.createElement("canvas");
  c.width=canvas.width; c.height=canvas.height;
  frames[currentFrameIdx].layers.push({name, canvas:c, ctx:c.getContext("2d"), opacity:1});
  currentLayer = frames[currentFrameIdx].layers.length-1;
  updateLayersUI();
  redraw();
}

function createSelectionLayer() {
  const c=document.createElement("canvas");
  c.width=canvas.width; c.height=canvas.height;
  frames[currentFrameIdx].layers.unshift({name:"선택 영역", canvas:c, ctx:c.getContext("2d"), opacity:0.7, selectable:false});
}
createSelectionLayer();
createLayer("Layer 1");

// UPDATE UI
const layersPanel = document.getElementById("layersPanel");
function updateLayersUI(){
  layersPanel.innerHTML="";
  frames[currentFrameIdx].layers.forEach((l,i)=>{
    const d=document.createElement("div");
    d.className="layer"+(i===currentLayer?" active":"")+(i===0?" special":"");
    d.textContent=l.name;
    if(l.selectable!==false) d.onclick=()=>{currentLayer=i;updateLayersUI();};
    layersPanel.appendChild(d);
  });
}

// DRAWING
let drawing=false, lastPoint=null;
function getPos(e){ return {x:e.clientX, y:e.clientY}; }
function startDraw(e){ drawing=true; lastPoint=getPos(e); }
function draw(e){
  if(!drawing) return;
  const pos=getPos(e);
  const layer=frames[currentFrameIdx].layers[currentLayer];
  const ctxL=layer.ctx;
  ctxL.beginPath();
  ctxL.moveTo(lastPoint.x,lastPoint.y);
  ctxL.lineTo(pos.x,pos.y);
  ctxL.lineWidth=sizePicker.value;
  ctxL.strokeStyle=colorPicker.value;
  ctxL.globalCompositeOperation = tool==="eraser"?"destination-out":"source-over";
  ctxL.stroke();
  lastPoint=pos;
  redraw();
}
function endDraw(){ drawing=false; }
canvas.addEventListener("mousedown", startDraw);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("mouseup", endDraw);

// REDRAW ALL
function redraw(){
  ctx.setTransform(1,0,0,1,0,0);
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.translate(canvas.width/2,canvas.height/2);
  ctx.scale(scale,scale);
  ctx.rotate(rotation);
  ctx.translate(-canvas.width/2,-canvas.height/2);

  frames[currentFrameIdx].layers.forEach((l,i)=>{
    if(i!==0){
      ctx.globalAlpha=l.opacity;
      ctx.drawImage(l.canvas,0,0);
    }
  });
}

// ANIMATION CONTROLS
const addFrame = document.getElementById("addFrame");
const delFrame = document.getElementById("delFrame");
const prevFrame = document.getElementById("prevFrame");
const nextFrame = document.getElementById("nextFrame");
const playAnim = document.getElementById("playAnim");
const fpsInput = document.getElementById("fps");

addFrame.onclick=()=>{
  frames.push({layers:[]});
  currentFrameIdx = frames.length-1;
  frames[currentFrameIdx].layers=[];
  createSelectionLayer();
  createLayer(`Layer 1`);
};
delFrame.onclick=()=>{
  if(frames.length>1){
    frames.splice(currentFrameIdx,1);
    currentFrameIdx=Math.max(0, currentFrameIdx-1);
  }
};
prevFrame.onclick=()=>{
  if(currentFrameIdx>0) currentFrameIdx--;
  redraw();
};
nextFrame.onclick=()=>{
  if(currentFrameIdx<frames.length-1) currentFrameIdx++;
  redraw();
};

let animInterval=null;
playAnim.onclick=()=>{
  if(animInterval){
    clearInterval(animInterval);
    animInterval=null;
    playAnim.textContent="▶▶";
  } else {
    let fps= parseInt(fpsInput.value)||12;
    animInterval = setInterval(()=>{
      currentFrameIdx = (currentFrameIdx+1)%frames.length;
      redraw();
    },1000/fps);
    playAnim.textContent="⏸";
  }
};
