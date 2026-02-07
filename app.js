const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let drawing = false;
let tool = "pen";
let lastPoint = null;

let scale = 1;
let rotation = 0;
let smoothEnabled = false;

const colorPicker = document.getElementById("color");
const sizePicker = document.getElementById("size");
const smoothSlider = document.getElementById("smooth");

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  redraw();
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

ctx.lineCap = "round";
ctx.lineJoin = "round";

let paths = [];

function getPos(e) {
  if (e.touches) {
    return {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  }
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
  const pos = transformPoint(getPos(e));
  lastPoint = pos;

  paths.push({
    tool,
    color: colorPicker.value,
    size: sizePicker.value,
    points: [pos]
  });
}

function draw(e) {
  if (!drawing) return;

  const pos = transformPoint(getPos(e));
  const currentPath = paths[paths.length - 1];

  if (smoothEnabled) {
    const s = smoothSlider.value;
    pos.x = lastPoint.x + (pos.x - lastPoint.x) / s;
    pos.y = lastPoint.y + (pos.y - lastPoint.y) / s;
  }

  currentPath.points.push(pos);
  lastPoint = pos;

  redraw();
}

function endDraw() {
  drawing = false;
  lastPoint = null;
}

function redraw() {
  ctx.setTransform(1,0,0,1,0,0);
  ctx.clearRect(0,0,canvas.width,canvas.height);

  ctx.translate(canvas.width/2, canvas.height/2);
  ctx.scale(scale, scale);
  ctx.rotate(rotation);
  ctx.translate(-canvas.width/2, -canvas.height/2);

  for (const path of paths) {
    ctx.beginPath();
    ctx.lineWidth = path.size;
    ctx.strokeStyle = path.color;
    ctx.globalCompositeOperation =
      path.tool === "eraser" ? "destination-out" : "source-over";

    path.points.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });

    ctx.stroke();
  }
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
document.getElementById("rotate").onclick = () => { rotation += Math.PI / 12; redraw(); };

document.getElementById("stabilizer").onclick = () => {
  smoothEnabled = !smoothEnabled;
};
