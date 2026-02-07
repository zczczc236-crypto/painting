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
let activeLayer = 0;

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
  const layerCanvas = document.createElement("canvas");
  layerCanvas.width = canvas.width;
  layerCanvas.height = canvas.height;
  const layerCtx = layerCanvas.getContext("2d");
  layerCtx.lineCap = "round";
  layerCtx.lineJoin = "round";

  layers.unshift({
    name,
    canvas: layerCanvas,
    ctx: layerCtx,
    opacity: 1
  });

  activeLayer = 0;
  updateLayersUI();
}

createLayer("Layer 1");
resizeCanvas();

function updateLayersUI() {
  layersPanel.innerHTML = "";
  layers.forEach((layer, i) => {
    const div = document.createElement("div");
    div.className = "layer" + (i === activeLayer ? " active" : "");
    div.textContent = layer.name;

    div.onclick = () => {
      activeLayer = i;
      updateLayersUI();
    };

    const controls = document.createElement("div");
    controls.className = "layer-controls";

    const up = document.createElement("button");
    up.textContent = "▲";
    up.onclick = e => {
      e.stopPropagation();
      if (i > 0) {
        [layers[i], layers[i - 1]] = [layers[i - 1], layers[i]];
        activeLayer = i - 1;
        updateLayersUI();
      }
    };

    const down = document.createElement("button");
    down.textContent = "▼";
    down.onclick = e => {
      e.stopPropagation();
      if (i < layers.length - 1) {
        [layers[i], layers[i + 1]] = [layers[i + 1], layers[i]];
        activeLayer = i + 1;
        updateLayersUI();
      }
    };

    const del = document.createElement("button");
    del.textContent = "🗑";
    del.onclick = e => {
      e.stopPropagation();
      if (layers.length > 1) {
        layers.splice(i, 1);
        activeLayer = 0;
        updateLayersUI();
        redraw();
      }
    };

    controls.append(up, down, del);

    const opacity = document.createElement("input");
    opacity.type = "range";
    opacity.min = 0;
    opacity.max = 1;
    opacity.step = 0.01;
    opacity.value = layer.opacity;
    opacity.oninput = e => {
      layer.opacity = e.target.value;
      redraw();
    };

    div.append(controls, opacity);
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
  const layer = layers[activeLayer];
  const ctxL = layer.ctx;

  let pos = transformPoint(getPos(e));

  if (smoothEnabled) {
    const s = smoothSlider.value;
    pos.x = lastPoint.x + (pos.x - lastPoint.x) / s;
    pos.y = lastPoint.y + (pos.y - lastPoint.y) / s;
  }

  ctxL.beginPath();
  ctxL.moveTo(lastPoint.x, lastPoint.y);
  ctxL.lineTo(pos.x, pos.y);
  ctxL.lineWidth = sizePicker.value;
  ctxL.strokeStyle = colorPicker.value;
  ctxL.globalCompositeOperation =
    tool === "eraser" ? "destination-out" : "source-over";
  ctxL.stroke();

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

  layers.slice().reverse().forEach(layer => {
    ctx.globalAlpha = layer.opacity;
    ctx.drawImage(layer.canvas, 0, 0);
  });

  ctx.globalAlpha = 1;
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
document.getElementById("zoomIn").onclick = () => { scale *= 1.1; redraw(); };
document.getElementById("zoomOut").onclick = () => { scale /= 1.1; redraw(); };
document.getElementById("rotate").onclick = () => { rotation += Math.PI/12; redraw(); };
document.getElementById("stabilizer").onclick = () => smoothEnabled = !smoothEnabled;
document.getElementById("addLayer").onclick = () => createLayer(`Layer ${layers.length+1}`);
