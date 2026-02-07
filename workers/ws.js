export default {
  async fetch(request) {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response(null, { status: 400 });
    }
    const [client, server] = Object.values(new WebSocketPair());
    handleSession(server);
    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  },
};

const rooms = {};

async function handleSession(socket) {
  socket.accept();

  let roomId;
  let nickname;

  socket.addEventListener("message", (event) => {
    const msg = JSON.parse(event.data);

    if (msg.type === "join") {
      roomId = msg.room;
      nickname = msg.name;

      if (!rooms[roomId]) rooms[roomId] = [];

      // 닉네임 중복 체크
      const exists = rooms[roomId].some(p => p.name === nickname);
      if (exists) {
        socket.send(JSON.stringify({ type: "error", text: "duplicate name" }));
        return;
      }

      rooms[roomId].push({ socket, name: nickname });

      socket.send(JSON.stringify({
        type: "joined",
        players: rooms[roomId].map(p => p.name),
      }));
    }

    if (msg.type === "draw") {
      // 그린 데이터 모두에게 전송
      rooms[roomId].forEach(p => {
        if (p.socket !== socket) {
          p.socket.send(event.data);
        }
      });
    }
  });

  socket.addEventListener("close", () => {
    if (!roomId) return;
    rooms[roomId] = rooms[roomId].filter(p => p.socket !== socket);

    rooms[roomId].forEach(p => {
      p.socket.send(JSON.stringify({
        type: "leave",
        name: nickname,
      }));
    });
  });
}
