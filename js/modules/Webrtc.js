
export default class Webrtc {

  config = {
    'iceServers': [{
      'urls': 'stun:stun.l.google.com:19302'
    }]
  }

  peerConns = {}
  dataChannels = {}

  constructor(config = null){
    if (config) {
      this.config = config
    }
  }

  createConnection(isInitiator, socketId, sendCandidate, sendMessageOffer = null, stream = null, onDataChannelCreated = null) {

    this.peerConns[socketId] = new RTCPeerConnection(this.config);
    let self = this

    // send any ice candidates to the other peer
    this.peerConns[socketId].onicecandidate = function(event) {
      console.log('icecandidate event:', event);
      if (event.candidate) {
        sendCandidate({
          type: 'candidate',
          label: event.candidate.sdpMLineIndex,
          id: event.candidate.sdpMid,
          candidate: event.candidate.candidate
        });
      } else {
        console.log('End of candidates.');
      }
    };

    
    // TODO
    // addStreamは現在非推奨
    // addTrack() or addTransceiver()に変更するべし

    if (stream) {
      stream.localStream.getTracks().forEach(track => {
        console.log('check!!!!!');
        if('contentHint' in track){
          track.contentHint = stream.contentHint;
          if(track.contentHint !== stream.contentHint){
            console.log(stream.contentHint + ' : Invalid video track contentHint');
          }
          console.log('ヒント : ' + track.contentHint);
        }else{
          console.log('MediaStreamTrack contentHint attribute not supported.');
        }
        this.peerConns[socketId].addTrack(track, stream.localStream);
        // this.peerConns[socketId].addTransceiver(track, {
        //   streams : [stream.localStream],
        // });
      });
      // this.peerConns[socketId].addStream(stream.localStream);
      this.peerConns[socketId].addEventListener('addstream', stream.gotRemoteMediaStream);
    }

    if (isInitiator) {
      console.log('Creating Data Channel');
      this.dataChannels[socketId] = this.peerConns[socketId].createDataChannel('message');
      if (typeof onDataChannelCreated === "function") {
        onDataChannelCreated(this.dataChannels[socketId]);
      }


      console.log('Creating an offer');
      this.peerConns[socketId].createOffer(function (desc) {
        // 帯域の制限？
        desc.sdp = setMediaBitrates(desc.sdp, 120000);
        console.log('local session created:', desc);
        self.peerConns[socketId].setLocalDescription(desc, function() {
          console.log('sending local desc:', self.peerConns[socketId].localDescription);
          sendMessageOffer(self.peerConns[socketId].localDescription);
        }, self.logError);
      }, this.logError);
    } else {
      this.peerConns[socketId].ondatachannel = function(event) {
        console.log('ondatachannel:', event.channel);
        self.dataChannels[socketId] = event.channel;
        if (typeof onDataChannelCreated === "function") {
          onDataChannelCreated(self.dataChannels[socketId]);
        }
      };
    }
  }

  getOffer(message, senderId, sendAnswer) {
    let self = this
    console.log('Got offer. Sending answer to peer.');
    this.peerConns[senderId].setRemoteDescription(new RTCSessionDescription(message), function() {},this.logError);

    this.peerConns[senderId].createAnswer(function (desc) {
      desc.sdp = setMediaBitrates(desc.sdp, 120000);
      console.log('local session created:', desc);
      self.peerConns[senderId].setLocalDescription(desc, function() {
        console.log('sending local desc:', self.peerConns[senderId].localDescription);
        sendAnswer(self.peerConns[senderId].localDescription);
      }, self.logError);
    }, this.logError);
  }

  getAnswer(message, senderId) {
    console.log('Got answer.');
    this.peerConns[senderId].setRemoteDescription(new RTCSessionDescription(message), function() {}, this.logError);
  }

  getCandidate(message, senderId) {
    console.log('Got Candidate.');
    this.peerConns[senderId].addIceCandidate(new RTCIceCandidate({
      sdpMLineIndex: message.label,
      candidate: message.candidate
    }));
  }

  closeConnection(socketId) {
    if (this.peerConns[socketId]) {
      this.peerConns[socketId].close()
      delete this.peerConns[socketId]
      this.dataChannels[socketId].close()
      delete this.dataChannels[socketId]
    }
  }

  closeAllConnections() {
    for (let socketId in this.peerConns) {
      this.peerConns[socketId].close()
      this.dataChannels[socketId].close()
    }
    this.peerConns = {}
    this.dataChannels = {}
  }

  sendToAllDataChannels(data) {
    for (let socketId in this.dataChannels) {
      this.dataChannels[socketId].send(data)
    }
  }

  logError(err) {
    if (!err) return;
    if (typeof err === 'string') {
      console.warn(err);
    } else {
      console.warn(err.toString(), err);
    }
  }
}



  // 自作関数
  // sdpとbitrateを受け取って帯域を指定する
  const setMediaBitrates = (sdp, bitrate) => {
    // console.log('ここでSDPの登場だ！\n'+sdp);
    let lines = sdp.split('\n');
    let line = -1;
    for (let i = 0; i < lines.length; i++) {
      if(lines[i].indexOf('m=video')===0){
        line = i;
        break;
      }
    }
    if(line === -1){
      console.log('Could not find the m line for video');
      return sdp;
    }

    console.log('Found the m line for video at line : ' + line);
    line ++;
    while(lines[line].indexOf('i=') === 0 || lines[line].indexOf('c=')===0){
      line++;
    }
    // ビットレート設定を挿入するlineを発見
    if(lines[line].indexOf('b') === 0){
      console.log('Replace b line at line ' + line);
      lines[line] = 'b=AS:'+ bitrate;
      return lines.join('\n');
    }
    
    console.log('Adding new b line before line ' + line);
    let newLines = lines.slice(0,line);
    newLines.push('b=AS:' + bitrate);
    newLines = newLines.concat(lines.slice(line, lines.length));
    return  newLines.join('\n');
  }