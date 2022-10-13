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

io.sockets.on('connection', (socket) => {
  socket.on('enter', (roomname) => {
    socket.set('roomname', roomname);
    socket.join(roomname);
  });

  cosket.on('message', (msg) => {
    msg.from = socket.id;

    // 送信先の指定
    const target = msg.sendto;
    if(target) {
      io.sockets.socket(target).emit('message', message);
      return;
    }
    // 指定が無ければブロードキャスト
    emitMessage('message', msg);
  })

  socket.on('disconnect', () => {
    emitMessage('user disconnected');
  })

  function emitMessage(type, msg){
    let roomname;
    socket.get('roomname', (err, _room) => {
      roomname = _room;
    })
    if(roomname){
      socket.broadcast.to(roomname).emit(type, msg);
    }else{
      socket.broadcast.emit(type, msg);
    }
  }
})