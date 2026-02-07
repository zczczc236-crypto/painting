const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let drawing = false;
let currentTool = "pen";

let colorPicker = document.getElementById("color");
let sizePicker = document.getElementById("size");

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

ctx.lineCap = "round";
ctx.lineJoin = "round";

function getPos(e) {
  if (e.touches) {
    return {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  }
  return { x: e.clientX, y: e.clientY };
}

function startDraw(e) {
  drawing = true;
  const pos = getPos(e);
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
}

function draw(e) {
  if (!drawing) return;

  const pos = getPos(e);
  ctx.strokeStyle = currentTool === "eraser" ? "#ffffff" : colorPicker.value;
  ctx.lineWidth = sizePicker.value;
  ctx.globalCompositeOperation =
    currentTool === "eraser" ? "destination-out" : "source-over";

  ctx.lineTo(pos.x, pos.y);
  ctx.stroke();
}

function endDraw() {
  drawing = false;
  ctx.closePath();
}

canvas.addEventListener("mousedown", startDraw);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("mouseup", endDraw);
canvas.addEventListener("mouseleave", endDraw);

canvas.addEventListener("touchstart", startDraw);
canvas.addEventListener("touchmove", draw);
canvas.addEventListener("touchend", endDraw);

document.getElementById("pen").onclick = () => currentTool = "pen";
document.getElementById("eraser").onclick = () => currentTool = "eraser";
