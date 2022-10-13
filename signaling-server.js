"use strict";

const {createServer} = require('https');
const {readFileSync} = require('fs');
// const WebSocketServer = require('ws').Server;
const {Server} =require('socket.io');
const port = 3000;

const httpsServer = createServer({
  key: readFileSync(__dirname + '/ssl/server.key'),
  cert: readFileSync(__dirname + '/ssl/server.crt'),
})

// const wssServer = new WebSocketServer({server});
const io = new Server({httpsServer})
httpsServer.listen(port);

io.on('connection', (socket) => {

  socket.on('enter', (roomname) => {
      socket.join(roomname);
      console.log('id=' + socket.id + ' enter room=' + roomname);
      setRoomname(roomname);
  });

  function setRoomname(room) {
    socket.roomname = room;
  }

  function getRoomname() {
    let room = socket.roomname;
    return room;
  }

  socket.on('message', (msg) => {

    console.log("echo > " + msg);
    msg.from = socket.id;

    // 送信先の指定
    let target = msg.sendto;
    if(target) {
      socket.to(target).emit('message', msg);
      return;
    }
    // 指定が無ければブロードキャスト
    emitMessage('message', msg);
  })

  socket.on('disconnect', () => {
    emitMessage('user disconnected', {id: socket.id});
    let roomname = getRoomname();
    if (roomname) {
      socket.leave(roomname);
    }
  })

  function emitMessage(type, message) {
    // ----- multi room ----
    var roomname = getRoomname();

    if (roomname) {
      console.log('===== message broadcast to room -->' + roomname);
      socket.broadcast.to(roomname).emit(type, message);
    }
    else {
      console.log('===== message broadcast all');
      socket.broadcast.emit(type, message);
    }
  }
})