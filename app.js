const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let scale = 1;
let rotation = 0;
let drawing = false;
let tool = "pen";
let lastPoint = null;
let smoothEnabled = false;

const colorPicker = document.getElementById("color");
const sizePicker = document.getElementById("size");
const smoothSlider = document.getElementById("smooth");
const layersPanel = document.getElementById("layersPanel");

let layers = [];
let activeLayer = 1; // 0번은 선택 레이어
let selectionLayer;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  layers.forEach(l => {
    l.canvas.width = canvas.width;
    l.canvas.height = canvas.height;
  });
  redraw();
}
window.addEventListener("resize", resizeCanvas);

function createLayer(name) {
  const c = document.createElement("canvas");
  c.width = canvas.width;
  c.height = canvas.height;
  const cctx = c.getContext("2d");
  cctx.lineCap = "round";
  cctx.lineJoin = "round";

  layers.push({
    name,
    canvas: c,
    ctx: cctx,
    opacity: 1,
    selectable: true
  });

  activeLayer = layers.length - 1;
  updateLayersUI();
}

function createSelectionLayer() {
  const c = document.createElement("canvas");
  c.width = canvas.width;
  c.height = canvas.height;
  const cctx = c.getContext("2d");

  selectionLayer = {
    name: "선택 영역",
    canvas: c,
    ctx: cctx,
    opacity: 0.7,
    selectable: false
  };

  layers.unshift(selectionLayer);
}

createSelectionLayer();
createLayer("Layer 1");
resizeCanvas();

function updateLayersUI() {
  layersPanel.innerHTML = "";
  layers.forEach((layer, i) => {
    const div = document.createElement("div");
    div.className = "layer" +
      (i === activeLayer ? " active" : "") +
      (i === 0 ? " special" : "");
    div.textContent = layer.name;

    div.onclick = () => {
      if (layer.selectable) {
        activeLayer = i;
        updateLayersUI();
      }
    };

    layersPanel.appendChild(div);
  });
}

function getPos(e) {
  if (e.touches) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  return { x: e.clientX, y: e.clientY };
}

function transformPoint(p) {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  let x = (p.x - cx) / scale;
  let y = (p.y - cy) / scale;
  const cos = Math.cos(-rotation);
  const sin = Math.sin(-rotation);
  return {
    x: x * cos - y * sin + cx,
    y: x * sin + y * cos + cy
  };
}

function startDraw(e) {
  drawing = true;
  lastPoint = transformPoint(getPos(e));
}

function draw(e) {
  if (!drawing) return;

  let targetLayer =
    tool === "select" ? layers[0] : layers[activeLayer];

  let pos = transformPoint(getPos(e));

  if (smoothEnabled) {
    const s = smoothSlider.value;
    pos.x = lastPoint.x + (pos.x - lastPoint.x) / s;
    pos.y = lastPoint.y + (pos.y - lastPoint.y) / s;
  }

  const tctx = targetLayer.ctx;

  tctx.beginPath();
  tctx.moveTo(lastPoint.x, lastPoint.y);
  tctx.lineTo(pos.x, pos.y);
  tctx.lineWidth = sizePicker.value;

  if (tool === "select") {
    tctx.strokeStyle = "rgba(180, 100, 255, 0.7)";
    tctx.globalCompositeOperation = "source-over";
  } else {
    tctx.strokeStyle = colorPicker.value;
    tctx.globalCompositeOperation =
      tool === "eraser" ? "destination-out" : "source-over";
  }

  tctx.stroke();
  lastPoint = pos;
  redraw();
}

function endDraw() {
  drawing = false;
}

function redraw() {
  ctx.setTransform(1,0,0,1,0,0);
  ctx.clearRect(0,0,canvas.width,canvas.height);

  ctx.translate(canvas.width/2, canvas.height/2);
  ctx.scale(scale, scale);
  ctx.rotate(rotation);
  ctx.translate(-canvas.width/2, -canvas.height/2);

  layers.forEach((layer, i) => {
    if (i !== 0) {
      ctx.save();
      ctx.globalAlpha = layer.opacity;
      ctx.globalCompositeOperation = "source-over";
      ctx.drawImage(layer.canvas, 0, 0);
      ctx.restore();
    }
  });

  // 선택 영역 마스크
  ctx.save();
  ctx.globalCompositeOperation = "destination-in";
  ctx.drawImage(selectionLayer.canvas, 0, 0);
  ctx.restore();

  // 선택 영역 표시
  ctx.save();
  ctx.globalAlpha = selectionLayer.opacity;
  ctx.drawImage(selectionLayer.canvas, 0, 0);
  ctx.restore();
}

canvas.addEventListener("mousedown", startDraw);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("mouseup", endDraw);
canvas.addEventListener("mouseleave", endDraw);

canvas.addEventListener("touchstart", startDraw);
canvas.addEventListener("touchmove", draw);
canvas.addEventListener("touchend", endDraw);

document.getElementById("pen").onclick = () => tool = "pen";
document.getElementById("eraser").onclick = () => tool = "eraser";
document.getElementById("select").onclick = () => tool = "select";
document.getElementById("zoomIn").onclick = () => { scale *= 1.1; redraw(); };
document.getElementById("zoomOut").onclick = () => { scale /= 1.1; redraw(); };
document.getElementById("rotate").onclick = () => { rotation += Math.PI/12; redraw(); };
document.getElementById("stabilizer").onclick = () => smoothEnabled = !smoothEnabled;
document.getElementById("addLayer").onclick = () => createLayer(`Layer ${layers.length}`);
