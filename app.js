"use strict";

process.title = 'wappshare';

const express = require('express');
const app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var port = process.env.PORT || 2018;

app.get('/app', function(req, res){
  res.sendFile(__dirname + '/static/app.html');
});

app.get('/view', function(req, res){
  res.sendFile(__dirname + '/static/client.html');
});

http.listen(port, function(){
  console.log('listening on *:'+port);
});

var guid = function () {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + s4() + s4() + s4() + s4();
}

var data = {};
var uidClientConns = {};
var uidServerConns = {};
var conns = {};

var copyData = function (payload, obj) {
  if (!obj) {
    return payload;
  }
  obj.eleVal = payload.eleVal;
  obj.role = payload.role;
  if (payload.type === 'delegate')
    obj['allow-data-input'] = payload['allow-data-input'];
  else
    payload['allow-data-input'] = obj['allow-data-input'];

  obj.eleName = payload.eleName;
  obj.eleType = payload.eleType;
  obj.evtType = payload.evtType;
  obj.type = payload.type;
  obj.eleLabel = payload.eleLabel;
}

var sendDataToApp = function (uid, data) {
  if (uidServerConns[uid])
    uidServerConns[uid].conn.emit(JSON.stringify(data));
}
var sendDataToClient = function (uid, data) {
  if (uidClientConns[uid])
    uidClientConns[uid].emit(JSON.stringify(data));
}

io.on('connection', function (socket) {
  console.log('connection established with socketId:'+socket.id);

  socket.on('message', function (message) {
      var payload = JSON.parse(message);

      if (payload.role === 'client') {
        if (payload.type === 'register') {
          if (uidServerConns[payload.uid]) {
            var servConn = uidServerConns[payload.uid];
            console.log(uidServerConns);
            if (servConn.key === payload.key) {
              uidClientConns[payload.uid] = socket;
              sendDataToClient(payload.uid, { type: 'init', data: data[payload.uid] });
              sendDataToApp(payload.uid, { type: 'client-init' });
              conns[socket.id] = { uid: payload.uid, connType: "client", conn: socket };

              return;
            }
          }
          socket.emit(JSON.stringify({ type: 'error', data: "unauthorized" }));
          return;

        } else if (payload.type === 'data-input' && uidClientConns[payload.uid]) {
          sendDataToApp(payload.uid, { type: 'client-update', data: payload });
        } else if (payload.type === 'data-action' && uidClientConns[payload.uid]) {
         sendDataToApp(payload.uid, { type: 'client-update', data: payload });
          data[payload.uid].forEach((obj, idx) => {
            if (obj.eleName === payload.eleName) {
              data[payload.uid].splice(idx,1);
              return;
            }
          });
         }

      } else if (payload.role === 'server') {
        if (payload.type === 'register') {
          const uid = guid();
          payload.uid=uid;
          var rkey = (Math.random() * Math.random() * Math.random() * new Date().getTime()) + "" + new Date().getTime();
          var finalKey = "" + (parseInt(rkey.substr(0, 8)) + parseInt(rkey.substr((rkey.length - 8), 8)));
          uidServerConns[payload.uid] = { conn: socket, key: finalKey };
          conns[socket.id] = { uid: payload.uid, connType: "server", conn: socket };
          sendDataToApp(payload.uid, { type: 'server-key', data: finalKey , uid});
          return;
        } else if (payload.type === 'server-terminated') {
          //cleanupAfterServerSession(payload.uid, 'server-terminated');
          return;
        } else if (payload.type === 'email') {
          emailLink(payload.to, payload.link);
          return;
        }

        if (!data[payload.uid]) {
          data[payload.uid] = [];
        }
        var foundIdx = -1;
        data[payload.uid].forEach((obj, idx) => {
          if (obj.eleName === payload.eleName) {
            copyData(payload, obj)
            foundIdx = idx;
          }
        });
        if (foundIdx === -1) {
          data[payload.uid].push(copyData(payload));
        }

        var action = "update";
        if ((payload.evtType === 'blur' ||
          (payload.type === 'delegate' && !payload['allow-data-input']))
          && payload.eleVal === '') {
          data[payload.uid].splice(foundIdx, 1);
          action = "remove";
        }
        if (uidClientConns[payload.uid]) {
          sendDataToClient(payload.uid, Object.assign(payload, { action }));
        }

      }

  });

});
