import http from "http";
import WebSocket from "ws";
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

const server = http.createServer(app);
const wss = new WebSocket.Server({ server }); // websocket server를 만든다.

const sockets = [];

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
    */
  }); // 브라우저가 서버에 메시지를 보냈을 때를 위한 listener 등록
  // socket.send("hello!!");  브라우저에 메시지 보냄 (back->front)
});

server.listen(3000, handleListen);
