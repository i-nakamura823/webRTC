# webRTC

## httpsサーバーの起動
```
http-server -c-1 . --ssl --key .\ssl\server.key --cert .\ssl\server.crt
```

## シグナルサーバの起動
```
nodemon server.js
```

### wssサーバへ接続（シグナルサーバへ接続）
```
wscat -c wss://localhost:3000 -no-check
```

## 参考文献
[kurodakazumichi/youtube](https://github.com/kurodakazumichi/youtube/tree/main/IntruductionToWebRTC)
