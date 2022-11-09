
import Webrtc from '/js/modules/Webrtc.js'
const webrtc = new Webrtc()

let testChatCount = 0

let chatList = document.getElementById('chatList')
for (var i = 0; i < testChatCount; i++) {
  let li = document.createElement("li")
  li.innerHTML = `<span>Name${i}:</span>testestestsetetstsets`
  chatList.appendChild(li)
}


// Logs an action (text) and the time when it happened on the console.
function trace(text) {
  text = text.trim()
  const now = (window.performance.now() / 1000).toFixed(3)

  console.log(now, text)
}

function randomToken() {
  return Math.floor((1 + Math.random()) * 1e16).toString(16).substring(1);
}


const urlElm = document.getElementById('url')
var room = window.location.hash.substring(1);
if (!room) {
  room = window.location.hash = randomToken();
}
urlElm.innerText = window.location.href


// Connect to the signaling server
var socket = io.connect();

const sendCandidate = (message) => {
  socket.emit('send candidate', message, room, socket.id)
}

socket.on('created', function(room, clientId) {
  console.log('Created room', room, '- my client ID is', clientId)
});

socket.on('joined', function(room, clientId, socketIds) {
  console.log('This peer has joined room with client ID', clientId)
  socketIds.forEach((socketId) => {
    if (socket.id == socketId) return;
    webrtc.createConnection(false, socketId, sendCandidate, null, stream, onDataChannelCreated);
  });
});

socket.on('ready', function(socketId) {
  console.log('Socket is ready');
  let sendMessageOffer = (message) => {
    socket.emit('message', message, room, socketId, socket.id)
  }
  webrtc.createConnection(true, socketId, sendCandidate, sendMessageOffer, stream, onDataChannelCreated);
});

socket.on('message', function(message, room, senderId) {
  if (message.type === 'offer') {
    let sendAnswer = (localDescription) => {
      socket.emit('message', localDescription, room, senderId, socket.id)
    }
    webrtc.getOffer(message, senderId, sendAnswer)
  } else if (message.type === 'answer') {
    webrtc.getAnswer(message, senderId)
  }
});

socket.on('receive candidate', function(message, senderId) {
  webrtc.getCandidate(message, senderId)
});

// Leaving rooms and disconnecting from peers.
socket.on('disconnect', function(reason) {
  console.log(`Disconnected: ${reason}.`)
});

// Left socket
socket.on('bye', function(socketId) {
  console.log(`Peer leaving room ${socketId}.`)
  webrtc.closeConnection(socketId)
});

const mediaStreamConstraints = {
  // video: true
  // video: {
  //   width: {ideal: 3840},
  //   height: {ideal: 2160},
  //   frameRate: {ideal: 60},
  // },
  video: {
    width: {min : 3840},
    height: {min: 2160},
    frameRate: {min : 60},
  },
}

const localVideo = document.getElementById('localVideo')
const remoteVideos = document.getElementById('remoteVideos')


// Handles remote MediaStream success by adding it as the remoteVideo src.
function gotRemoteMediaStream(event) {
  const video = document.createElement("video")
  const autoplay = document.createAttribute("autoplay")
  video.setAttributeNode(autoplay)
  const playsinline = document.createAttribute("playsinline")
  video.setAttributeNode(playsinline)

  const mediaStream = event.stream
  video.srcObject = mediaStream
  remoteVideos.appendChild(video)
  trace('Remote peer connection received remote stream.')
}

let localStream
let stream = {}
stream.gotRemoteMediaStream = gotRemoteMediaStream

// TODO 
// stream = navigate...に変更する
// そうするとhintの適用が簡単になる？

// Sets the MediaStream as the video element src.
function gotLocalMediaStream(mediaStream, hint) {
  // console.log('check!!!!!');
  // const tracks = mediaStream.getVideoTracks();
  // tracks.forEach(track => {
  //   if('contentHint' in track){
  //     track.contentHint = 'motion';
  //     if(track.contentHint !== 'motion'){
  //       console.log('motion : Invalid video track contentHint');
  //     }
  //     console.log('ヒント : ' + track.contentHint);
  //   }else{
  //     console.log('MediaStreamTrack contentHint attribute not supported.');
  //   }
  // })
  localVideo.srcObject = mediaStream
  localStream = mediaStream
  trace('Received local stream.')
  callButton.disabled = false  // Enable call button.

  stream.localStream = localStream
  // stream.contentHint = 'motion';  // streamにヒントを渡す
}

// Handles error by logging a message to the console.
function handleLocalMediaStreamError(error) {
  trace(`navigator.getUserMedia error: ${error.toString()}.`)
}

function addToChatBox(msg) {
  let li = document.createElement("li")
  li.innerHTML = `<span>${msg.name}:</span>${msg.message}`
  chatList.appendChild(li)
}

// data channel created callback
function onDataChannelCreated(dataChannel) {
  trace('Data channel created')
  dataChannel.onmessage = (event) => {
    trace('Received Message')
    const msg = JSON.parse(event.data)
    console.log(msg)
    addToChatBox(msg)

  }
  dataChannel.onopen = () => {
    sendButton.disabled = false
  }
  dataChannel.onclose =  () => {
    sendButton.disabled = true
  }
}


// Handles start button action: creates local MediaStream.
async function startAction(hint) {
  // contentHintを受け取るように修正
  startButton.disabled = true
  try{
    const sss = await navigator.mediaDevices.getUserMedia(mediaStreamConstraints);
    gotLocalMediaStream(sss, hint);
  } catch (error){
    handleLocalMediaStreamError(error);
  }
  // try-catch文に書き換え
  // → 引数を分かりやすくするため
  // navigator.mediaDevices.getUserMedia(mediaStreamConstraints)
  //   .then(gotLocalMediaStream).catch(handleLocalMediaStreamError)
  trace('Requesting local stream.')
}

function callAction() {
  hangupButton.disabled = false
  socket.emit('create or join', room)
}

// Handles hangup action: ends up call, closes connections and resets peers.
function hangupAction() {
  webrtc.closeAllConnections()
  socket.close()
  hangupButton.disabled = true
  callButton.disabled = false
  remoteVideos.innerHTML = ''
  trace('Ending call.');
}

function sendAction() {
  trace('Will send message')
  const nickName = document.getElementById('nickName')
  const dataChannelSend = document.getElementById('dataChannelSend')
  const msg = {
    name: nickName.value,
    message: dataChannelSend.value
  }
  webrtc.sendToAllDataChannels(JSON.stringify(msg))
  addToChatBox(msg)
  dataChannelSend.value = ''
}

// Define action buttons.
const startButton = document.getElementById('startButton')
const callButton = document.getElementById('callButton')
const hangupButton = document.getElementById('hangupButton')
const sendButton = document.getElementById('sendButton')

callButton.disabled = true
hangupButton.disabled = true
sendButton.disabled = true

// Add click event handlers for buttons.
startButton.addEventListener('click', startAction)
callButton.addEventListener('click', callAction)
hangupButton.addEventListener('click', hangupAction)
sendButton.addEventListener('click', sendAction)



// -----------------------------
// my extension
// -----------------------------

const copyButton = document.getElementById('copyButton');
copyButton.addEventListener('click', copyURL);

function copyURL() {
  console.log(window.location.href);
  navigator.clipboard.writeText(window.location.href);
}

const motionButton = document.getElementById('motionButton');
const detailButton = document.getElementById('detailButton');
const noButton = document.getElementById('noButton');
// motionButton.disabled = true;
// detailButton.disabled = true;
// noButton.disabled = true;
motionButton.addEventListener('click', startActuionMotion);
detailButton.addEventListener('click', startActuionDetail);
noButton.addEventListener('click', startActuionNohint);

function startActuionMotion() {
  console.log('motion で startSction を呼びます');
  startAction('motion');
}
function startActuionDetail() {
  console.log('detail で startSction を呼びます');
  startAction('detail');
}
function startActuionNohint() {
  console.log('nohint で startSction を呼びます');
  startAction('');
}
