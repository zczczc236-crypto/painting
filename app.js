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

const imageInput = document.getElementById("imageInput");
const imgBtn = document.getElementById("imgBtn");
const imgControls = document.getElementById("imageControls");
const imgOk = document.getElementById("imgOk");
const imgCancel = document.getElementById("imgCancel");

let layers = [];
let activeLayer = 1;
let selectionLayer;

let tempImage = null;

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

function createSelectionLayer() {
  const c = document.createElement("canvas");
  c.width = canvas.width;
  c.height = canvas.height;
  selectionLayer = {
    name: "선택 영역",
    canvas: c,
    ctx: c.getContext("2d"),
    opacity: 0.7,
    selectable: false
  };
  layers.push(selectionLayer);
}

function createLayer(name) {
  const c = document.createElement("canvas");
  c.width = canvas.width;
  c.height = canvas.height;
  layers.push({
    name,
    canvas: c,
    ctx: c.getContext("2d"),
    opacity: 1,
    selectable: true
  });
  activeLayer = layers.length - 1;
  updateLayersUI();
}

createSelectionLayer();
createLayer("Layer 1");
resizeCanvas();

function updateLayersUI() {
  layersPanel.innerHTML = "";
  layers.forEach((l, i) => {
    const d = document.createElement("div");
    d.className = "layer" +
      (i === activeLayer ? " active" : "") +
      (!l.selectable ? " special" : "");
    d.textContent = l.name;
    if (l.selectable) {
      d.onclick = () => { activeLayer = i; updateLayersUI(); };
    }
    layersPanel.appendChild(d);
  });
}

function redraw() {
  ctx.setTransform(1,0,0,1,0,0);
  ctx.clearRect(0,0,canvas.width,canvas.height);

  ctx.translate(canvas.width/2, canvas.height/2);
  ctx.scale(scale, scale);
  ctx.rotate(rotation);
  ctx.translate(-canvas.width/2, -canvas.height/2);

  layers.forEach((l,i) => {
    if (i !== 0) {
      ctx.globalAlpha = l.opacity;
      ctx.drawImage(l.canvas, 0, 0);
    }
  });

  ctx.globalCompositeOperation = "destination-in";
  ctx.drawImage(selectionLayer.canvas, 0, 0);
  ctx.globalCompositeOperation = "source-over";

  ctx.globalAlpha = selectionLayer.opacity;
  ctx.drawImage(selectionLayer.canvas, 0, 0);

  if (tempImage) {
    ctx.save();
    ctx.translate(tempImage.x, tempImage.y);
    ctx.rotate(tempImage.rot);
    ctx.scale(tempImage.scale, tempImage.scale);
    ctx.drawImage(tempImage.img, -tempImage.w/2, -tempImage.h/2);
    ctx.restore();
  }
}

imgBtn.onclick = () => imageInput.click();

imageInput.onchange = e => {
  const file = e.target.files[0];
  if (!file) return;
  const img = new Image();
  img.onload = () => {
    tempImage = {
      img,
      x: canvas.width/2,
      y: canvas.height/2,
      w: img.width,
      h: img.height,
      scale: 0.5,
      rot: 0
    };
    imgControls.classList.remove("hidden");
    redraw();
  };
  img.src = URL.createObjectURL(file);
};

canvas.addEventListener("wheel", e => {
  if (!tempImage) return;
  e.preventDefault();
  tempImage.scale *= e.deltaY < 0 ? 1.05 : 0.95;
  redraw();
});

canvas.addEventListener("pointerdown", e => {
  if (!tempImage) return;
  tempImage.drag = true;
  tempImage.ox = e.clientX;
  tempImage.oy = e.clientY;
});

canvas.addEventListener("pointermove", e => {
  if (!tempImage || !tempImage.drag) return;
  tempImage.x += e.clientX - tempImage.ox;
  tempImage.y += e.clientY - tempImage.oy;
  tempImage.ox = e.clientX;
  tempImage.oy = e.clientY;
  redraw();
});

canvas.addEventListener("pointerup", () => {
  if (tempImage) tempImage.drag = false;
});

imgOk.onclick = () => {
  const l = layers[activeLayer];
  l.ctx.drawImage(
    tempImage.img,
    tempImage.x - tempImage.w/2,
    tempImage.y - tempImage.h/2,
    tempImage.w * tempImage.scale,
    tempImage.h * tempImage.scale
  );
  tempImage = null;
  imgControls.classList.add("hidden");
  redraw();
};

imgCancel.onclick = () => {
  tempImage = null;
  imgControls.classList.add("hidden");
  redraw();
};

document.getElementById("pen").onclick = () => tool = "pen";
document.getElementById("eraser").onclick = () => tool = "eraser";
document.getElementById("select").onclick = () => tool = "select";
document.getElementById("zoomIn").onclick = () => { scale *= 1.1; redraw(); };
document.getElementById("zoomOut").onclick = () => { scale /= 1.1; redraw(); };
document.getElementById("rotate").onclick = () => { rotation += Math.PI/12; redraw(); };
document.getElementById("stabilizer").onclick = () => smoothEnabled = !smoothEnabled;
document.getElementById("addLayer").onclick = () => createLayer(`Layer ${layers.length}`);
