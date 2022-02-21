import http from "http";
//import WebSocket from "ws";
import { Server } from "socket.io";
import express from "express";
import { parse } from "path";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));

const handleListen = () => console.log(`Listening on https://localhost:3000`);
// app.listen(3000, handleListen);port 3000을 listen

const httpServer = http.createServer(app);
const wsServer = new Server(httpServer);
// const wss = new WebSocket.Server({ server }); // websocket server를 만든다.

function publicRooms() {
  const {
    sockets: {
      adapter: { sids, rooms },
    },
  } = wsServer;
  const publicRooms = [];
  rooms.forEach((_, key) => {
    if (sids.get(key) === undefined) {
      publicRooms.push(key);
    }
  });
  return publicRooms;
}

wsServer.on("connection", (socket) => {
  socket["nickname"] = "Anon";
  socket.onAny((event) => {
    console.log(`Socket Event: ${event}`);
  });
  socket.on("enter_room", (roomName, done) => {
    socket.join(roomName);
    done();
    socket.to(roomName).emit("welcome", socket.nickname);
    wsServer.sockets.emit("room_change", publicRooms());
  });
  socket.on("disconnecting", () => {
    socket.rooms.forEach((room) =>
      socket.to(room).emit("bye", socket.nickname)
    );
  });

  socket.on("disconnect", () => {
    wsServer.sockets.emit("room_change", publicRooms());
  });

  socket.on("new_message", (msg, room, done) => {
    socket.to(room).emit("new_message", `${socket.nickname}: ${msg}`);
    done(); //백엔드에서 실행하지 않음. 여기서 done을 호출하면 프론트엔드에서 실행
  });
  socket.on("nickname", (nickname) => (socket["nickname"] = nickname));
});

/* const sockets = [];

// connection 이벤트가 생기면 반응을 한다.
wss.on("connection", (socket) => {
  sockets.push(socket);
  socket["nickname"] = "Anon";
  console.log("Connected to Browser ✅"); // 브라우저가 연결되면 해당 메시지가 터미널에 출력
  socket.on("close", () => console.log("Disconnected from Server ❌")); // 브라우저 창이 닫히면 연결이 끊기면서 해당 메시지 출력
  socket.on("message", (msg) => {
    const message = JSON.parse(msg);

    switch (message.type) {
      case "new_message":
        sockets.forEach((aSocket) =>
          aSocket.send(`${socket.nickname}: ${message.payload}`)
        );
        break; //break 안하면 계속 nickname이 바뀜 ㅠㅠ
      case "nickname":
        socket["nickname"] = message.payload;
        break;
    }
    /* if~else if~ else if 보다 switch가 나음!
    if (parsed.type === "new_message") {
      sockets.forEach((aSocket) => aSocket.send(parsed.payload));
    } else if (parsed.type === "nickname") {
      console.log(parsed.payload);
    }
    
  }); // 브라우저가 서버에 메시지를 보냈을 때를 위한 listener 등록
  // socket.send("hello!!");  브라우저에 메시지 보냄 (back->front)
}); */

httpServer.listen(3000, handleListen);
