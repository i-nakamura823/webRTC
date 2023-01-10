# webRTC

## new!! サーバ起動
```
nodemon index.js
```

## TODO
- create or join のメッセージ後の処理がうまく動いていない

↑ 配列の構造を変更して解消

- 十分なビットレートが出ないのは使用しているデバイスの問題っぽい
- contentHintの導入

## httpsサーバーの起動
```
http-server -c-1 . --ssl --key .\ssl\server.key --cert .\ssl\server.crt
```
鍵はローカルに保存

## シグナリングサーバの起動
```
nodemon server.js
```

### wssサーバへ接続（シグナルサーバへ接続）
```
wscat -c wss://localhost:3000 -no-check
```

## 参考文献
- httpsの通信 
[kurodakazumichi/youtube](https://github.com/kurodakazumichi/youtube/tree/main/IntruductionToWebRTC)
- 複数人でのwebRTC通信 
[WebRTCを使って複数人がビデオチャットできるデモを作った。](https://qiita.com/h-nasu/items/908439f2fed3cda7913fhttps://qiita.com/h-nasu/items/908439f2fed3cda7913f)
- WebRTCに関する分かりやすい記事 
[WebRTC徹底解説](https://zenn.dev/yuki_uchida/books/c0946d19352af5/viewer/320c67)
- WebRTCのパラメータいじれるやつ 
[WebRTC samples Constraints & statistics](https://webrtc.github.io/samples/src/content/peerconnection/constraints/)
- 動的な解像度・フレームレート制御 
[WebRTCでビデオ通話中に映像の解像度やフレームレートを動的に変更する方法](https://qiita.com/yusuke84/items/35750017a6b12199aa39)

