$(function () {
  "use strict";

  var data = [];
  var lastEle = null;
  var uid = '';
  var popupId = '';
  var socket = null;


  var populateData = function (payload, obj) {
    if (!obj) {
      return payload;
    }
    obj.eleVal = payload.eleVal;
    obj.role = payload.role;
    obj['allow-data-input'] = payload['allow-data-input'];
    obj.eleName = payload.eleName;
    obj.eleType = payload.eleType;
    obj.evtType = payload.evtType;
    obj.type = payload.type;
    obj.uid = payload.uid;
    obj.eleLabel = payload.eleLabel;
  }

  var renderContent = function () {
    var content = "";

    if (data.length > 0) {
      content += '<form>';

      data.forEach(obj => {

        var focusClassName = "", readonly = "readonly", enableClassName = "";
        if (obj.eleName === lastEle)
          focusClassName = "focus-field";
        if (obj['allow-data-input']) {
          readonly = "";
          enableClassName = "allow-input"
        }
        if(obj.type==='action'){
          $(".modal-body").html(obj.eleLabel);
          popupId = obj.eleName;
          $("#exampleModal").modal({show:true});
        }else{
          content += '<div class="form-group row">' +
            '<label for="input-' + obj.eleName + '" class="col-sm-3  col-form-label">' + obj.eleLabel + '</label>' +
            '<div class="col-sm-9">' +
            '<input type="text" class="form-control ' + focusClassName + ' ' + enableClassName + '" id="input-' + obj.eleName + '" value="' + obj.eleVal + '" ' + readonly + '/> ' +
            '</div></div>';
        }
      });
      content += '</form>';
      $("#content").html(content);
      $("#" + lastEle).focus();
    } else {
      $("#content").html('Session established, Stay tuned for updates!!!');
    }
  }


  var connectToServer = function (uid, key) {
    if (uid !== '' && key!= '') {
      var evtData = { role: 'client', type: 'register', uid , key};
      $("#register").hide(); 

      window.WebSocket = window.WebSocket || window.MozWebSocket;
      if (!window.WebSocket) {
        content.html($('<p>',
          { text: 'Sorry, but your browser doesn\'t support WebSocket.' }
        ));
        return;
      }

      socket=io();
      socket.emit( JSON.stringify(evtData));

     socket.on('server', function (message) {
        try {
          var json = JSON.parse(message);
        } catch (e) {
          console.log('Invalid JSON: ', message);
          return;
        }

        if (json.type === 'init') {
          if (json.data)
            data = json.data;
        } else if (json.type === 'error' && json.data === 'unauthorized') {
          $("#content").html("<div class='alert alert-danger'>Error occured, Unauthorized access.</div>");
          //connection.close();
          return;

        } else if (json.type === 'server-disconnected') {
          $("#content").html("<div class='alert alert-danger'>Agent disconnected. Please contact the agent to get access again.</div>");
          //connection.close();
          return;
        } else if (json.type === 'server-terminated') {
          $("#content").html("<div class='alert alert-danger'>Agent terminated the session.</div>");
          //connection.close();
          return;
        } else {
          lastEle = json.eleName;
          var foundIdx = -1;
          data.forEach((obj, idx) => {
            if (obj.eleName === json.eleName) {
              if (json.eleVal === "" && json.action === "remove")
                data.splice(idx, 1);
              else
                populateData(json, obj);
              foundIdx = idx;
            }
          });
          if (foundIdx === -1) {
            data.push(populateData(json));
          }
        }
        renderContent();
      });

    }
  };

 
    if(window.location.hash.indexOf("#")===-1){
      
    }else{
      uid = window.location.hash.replace('#', '');
      $("#uid").val(uid);
      $("#uid").attr('disabled', 'disabled');
    }
  


  $("#btnView").click(function (e) {
    connectToServer($("#uid").val(), $("#key").val());
  });

  $(document).on('blur', '.allow-input', function (e) {
    console.log(this);
    if (!$(this).hasClass('allow-input'))
      return;

    var id = $(this).attr('id').replace('input-', '');
    var currentObjArr = data.filter(obj => obj.eleName === id);
    if (currentObjArr && currentObjArr.length > 0) {
      var currentObj = currentObjArr[0];
      var evtData = {
        role: 'client',
        uid: currentObj.uid,
        eleName: currentObj.eleName,
        eleVal: $(this).val(),
        eleType: currentObj.eleType,
        "allow-data-input": currentObj["allow-data-input"],
        type: 'data-input'
      };
      socket.emit(JSON.stringify(evtData));
    }
  });

  $(document).on('click', '.btnPopup', function (e) {
    console.log(this);
    if (!$(this).hasClass('btnPopup'))
      return;

    var consent = $(this).hasClass("btnYes");

    var currentObjIdx = data.findIndex(obj => obj.eleName === popupId);
    if(currentObjIdx>-1){
      var currentObj = data[currentObjIdx];
      data.splice(currentObjIdx,1);
      var evtData = {
        role: 'client',
        uid: currentObj.uid,
        eleName: currentObj.eleName,
        eleVal: consent,
        eleType: currentObj.eleType,
        "allow-data-input": currentObj["allow-data-input"],
        type: 'data-action'
      };
      socket.emit(JSON.stringify(evtData));
    }
  });

  


});
