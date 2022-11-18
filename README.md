# webRTC

## new!! サーバ起動
```
nodemon index.js
```

## TODO
- create or join のメッセージ後の処理がうまく動いていない
↑ 配列の構造を変更して解消

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
httpsの通信
[kurodakazumichi/youtube](https://github.com/kurodakazumichi/youtube/tree/main/IntruductionToWebRTC)
複数人でのwebRTC通信
[WebRTCを使って複数人がビデオチャットできるデモを作った。](https://qiita.com/h-nasu/items/908439f2fed3cda7913fhttps://qiita.com/h-nasu/items/908439f2fed3cda7913f)
