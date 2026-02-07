const joinUI = document.getElementById("joinUI");
const partyUI = document.getElementById("partyUI");
const statusDiv = document.getElementById("status");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let ws;
let room;
let name;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

document.getElementById("joinBtn").onclick = () => {
  room = document.getElementById("roomId").value.trim();
  name = document.getElementById("nameInput").value.trim();
  if (!room || !name) return;

  ws = new WebSocket("wss://party-draw-ws.YOUR_DOMAIN.workers.dev");

  ws.onopen = () => {
    ws.send(JSON.stringify({ type: "join", room, name }));
  };

  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);

    if (msg.type === "joined") {
      joinUI.classList.add("hidden");
      partyUI.classList.remove("hidden");
      statusDiv.textContent = `방: ${room} | 접속자: ${msg.players.join(", ")}`;
    }

    if (msg.type === "draw") {
      drawFromServer(msg);
    }

    if (msg.type === "leave") {
      statusDiv.textContent = `접속자: 누군가 나감`;
    }
  };
};

let drawing = false;
function drawFromServer(msg) {
  ctx.beginPath();
  ctx.moveTo(msg.prev.x, msg.prev.y);
  ctx.lineTo(msg.curr.x, msg.curr.y);
  ctx.strokeStyle = msg.color;
  ctx.lineWidth = msg.size;
  ctx.stroke();
}

canvas.onmousedown = (e) => {
  drawing = true;
  prevPos = { x: e.clientX, y: e.clientY };
};

canvas.onmousemove = (e) => {
  if (!drawing) return;
  const currPos = { x: e.clientX, y: e.clientY };

  ctx.beginPath();
  ctx.moveTo(prevPos.x, prevPos.y);
  ctx.lineTo(currPos.x, currPos.y);
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 2;
  ctx.stroke();

  ws.send(JSON.stringify({
    type: "draw",
    prev: prevPos,
    curr: currPos,
    color: "#000",
    size: 2
  }));

  prevPos = currPos;
};

canvas.onmouseup = () => {
  drawing = false;
};
