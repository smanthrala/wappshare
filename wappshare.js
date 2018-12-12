$(function () {
  "use strict";

  var input = $('.show-data');
  var chk = $('.get-data');
  var btn = $('.btnContent');
  chk.hide();
  btn.hide();
  $(document.head).append('<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css">');
  $(document.head).append('<link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.5.0/css/all.css">');
  $(document.head).append('<script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.3/umd/popper.min.js"></script>');
  $(document.head).append('<script src="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/js/bootstrap.min.js"></script>');
  $(document.head).append('<script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.2.0/socket.io.js"></script>');
  $(document.head).append('<link rel="stylesheet" href="./wappshare.css">');


  $(document.body).prepend('<div style="position: absolute;z-index: 9999;width:100%;" id="mydiv" >' +
    '<span id="mydivheader" class="float-left" style="z-index: 10;background-color: #2196F3;cursor: move;padding:10px;color: #fff;;"><i class="fas fa-arrows-alt"></i></span><span id="controlPanel">&nbsp;</span><div id="banner"></div><div>');

  var clientNum = -1;
  var socket = null;


  var showStartSession = function () {
    $($("#controlPanel").parent()[0]).removeClass("alert alert-warning");
    $("#controlPanel").html(
      //'<div class="col-sm-6 mb-3">&nbsp;</div>'+
      '<div class="col-sm-6 mb-3 float-right">' +
      '<div class="btn-group float-right" >' +
      '<button id="btnStart" type="button" class="btn btn-warning" >' +
      'Start Session Sharing' +
      '</button>' +
      '</div>' +
      '</div>'
    );

  }
  var showSessionInProgress = function () {
    $($("#controlPanel").parent()[0]).addClass("alert alert-warning");
    $("#controlPanel").html(
      '<span id="uid"></span>' +
      '<div class="btn-group float-right" id="btnEndGrp">' +
      '<button type="button" class="btn btn-outline-secondary faicon-secondary" id="btnPause">' +
      '<i class="fas fa-pause"></i>' +
      '</button>' +
      '<button type="button" class="btn btn-outline-danger faicon-danger" id="btnEnd">' +
      '<i class="fas fa-stop"></i>' +
      '</button>' +
      '<button type="button" class="btn btn-outline-primary faicon-primary" id="btnEmail" data-toggle="dropdown" >' +
      '<i class="fas fa-share-alt"></i>' +
      '</button>' +
      '<div class="dropdown-menu dropdown-menu-right" style="width:245px;padding:4px;background-color:paleturquoise">' +
      '<div>' +
      '<div class="float-left">' +
      '<input type="text" class="form-control form-control-sm" id="shareLink" size="25" readonly>' +
      '</div>' +
      '<div class="float-right tooltip1">' +
      '<button type="button" class="btn btn-outline-info faicon-info float-right" id="btnCopy" style="font-size:16px;padding:0px;width:28px;height:28px;">' +
      '<span class="tooltiptext1" id="myTooltip">Copy link and share</span>' +
      '<i class="fas fa-copy"></i>' +
      '</button>' +
      '</div>' +
      '</div>' +
      '<div>' +
      '<div class="float-left">' +
      '<input type="text" class="form-control form-control-sm" id="custEmail" placeholder="Enter E-mail" size="25">' +
      '</div>' +
      '<div class="float-right  tooltip1">' +
      '<button type="button" class="btn btn-outline-info faicon-info float-right" id="btnSend" style="font-size:16px;padding:0px;width:28px;height:28px;">' +
      '<span class="tooltiptext1" id="myTooltip">Share link in Email</span>' +
      '<i class="fas fa-paper-plane" alt="Send Email"></i>' +
      '</button>' +
      '</div>' +
      '</div>' +
      '<div>' +
      '<div class="float-left">' +
      'Key: <span id="key"></span>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '</div>'
    );
  }
  showStartSession();

  var uid = '';
  var key = '';
  var sessionStatus = "not-started";
  var shareLink = "/view#";
  $("#banner").hide(0);
  $("#endRow").hide(0);

  var clearSessionStyles = function () {
    $("#endRow").removeClass('alert alert-warning');
    input.removeClass('shared-field');
  }
  var showSessionStyles = function () {
    $("#endRow").addClass('alert alert-warning');
    input.addClass('shared-field');
  }

  var showStatusMsg = function (msg) {
    var msg = '';
    if (sessionStatus === 'in-progress') {
      msg = "Session sharing in progress.";
    } else if (sessionStatus === 'paused') {
      msg = "Session sharing paused.";
    } else if (sessionStatus === 'terminated') {
      msg = "Session sharing terminated.";
      clearSessionStyles();
    }
    if (clientNum === 0) {
      msg += " No Customer connected.";
      clearSessionStyles();
    } else if (clientNum === 1) {
      msg += " Customer connected.";
      showSessionStyles();
    } else if (clientNum > 1) {
      msg += " " + clientNum + " Customers connected.";
      showSessionStyles();
    }
    $("#uid").html(msg);
  }

  $(document).on('click', '#btnPause', function (e) {
    if (sessionStatus === 'in-progress') {
      sessionStatus = "paused";
      $("#btnPause").addClass('btn-outline-success faicon-success');
      $("#btnPause").removeClass('btn-outline-secondary faicon-secondary');
      $($("#btnPause").children()[0]).removeClass('fa-pause');
      $($("#btnPause").children()[0]).addClass('fa-play');
    } else if (sessionStatus === 'paused') {
      sessionStatus = "in-progress";
      $("#btnPause").addClass('btn-outline-secondary  faicon-secondary');
      $("#btnPause").removeClass('btn-outline-success  faicon-success');
      $($("#btnPause").children()[0]).removeClass('fa-play');
      $($("#btnPause").children()[0]).addClass('fa-pause');
    }
    showStatusMsg();

  });

  $(document).on('click', '#btnEnd', function (e) {
    clientNum = -1;
    sessionStatus = "terminated";
    $("#btnEndGrp").hide();
    showStatusMsg();
    socket.emit('server', JSON.stringify({ role: 'server', type: 'server-terminated', uid }));
    //showStartSession();
  });

  $(document).on('click', '#btnSend', function (e) {
    var to = $("#custEmail").val();
    if (to !== '' && to !== undefined) {
      socket.emit('server', JSON.stringify({ role: 'server', type: 'email', uid, to, link: shareLink }));
    }
  });

  $("#btnStart").click(() => {

    showSessionInProgress();
    clientNum = 0;
    sessionStatus = "in-progress";
    $("#startRow").hide(0);
    $("#endRow").show(0);

    showStatusMsg();

    socket=io();
    socket.emit('server', JSON.stringify({ role: 'server', type: 'register', uid }));

    chk.show();
    btn.show();

    socket.on('chat message', function (msg) {
      $('#messages').append($('<li>').text(msg));
    });

    socket.on('server', function (message) {
      try {
        var json = JSON.parse(message);
      } catch (e) {
        console.log('Invalid JSON: ', message);
        return;
      }

      if (json.type === 'client-update') {
        console.log(json);
        var val = json.data.eleVal;
        if ($("#chk-" + json.data.eleName).attr('data-mask') && $("#chk-" + json.data.eleName).attr('data-mask') === 'true') {
          val = "*******";
        }
        $("#" + json.data.eleName).val(val);
        $("#" + json.data.eleName).addClass("focus-field");
        setTimeout(() => { $("#" + json.data.eleName).removeClass("focus-field"); }, 1000);
        $("#banner").html(getElementLabel(json.data.eleName) + " updated by customer.");
        $("#banner").fadeIn(100);
        $("#banner").fadeOut(4000);
      } else if (json.type === 'client-init') {
        clientNum++;
        showStatusMsg();
      } else if (json.type === 'client-disconnected') {
        clientNum--;
        showStatusMsg();
      } else if (json.type === 'server-key') {
        key = json.data;
        uid = json.uid;
        shareLink += uid;
        $("#shareLink").val(shareLink);
        $("#key").html(key);
      }
    });
  });

  $(document).on('click', '#btnCopy', function (e) {
    //$("#btnCopy").click(()=>{
    var copyText = document.getElementById("shareLink");
    copyText.select();
    document.execCommand("copy");
  });

  var getElementValue = function (e) {
    var eleType = e.target.type.toLowerCase();
    if (eleType === "checkbox")
      return e.target.checked;
    else if (eleType === "text")
      return e.target.value;
    else if (eleType === "select-one")
      return e.target.selectedOptions[0].text;
    else if (eleType === "radio")
      return e.target.value;
    else
      return "";
  }

  var getElementName = function (e) {
    var eleType = e.target.type.toLowerCase();
    if (eleType === "radio")
      return e.target.name;
    else
      return e.target.id;
  }

  var getElementLabel = function (id) {
    var label = id;
    var tempLabel = $('label[for="' + id + '"]').html();

    if (tempLabel && tempLabel !== '') {
      label = tempLabel;
    } else if ($("#" + id).attr('data-label'))
      label = $("#" + id).attr('data-label');
    else if ($("#" + id) && $("#" + id).length > 0 &&
      $("#" + id)[0].labels && $("#" + id)[0].labels.length > 0 && $("#" + id)[0].labels[0].innerHTML && $("#" + id)[0].labels[0].innerHTML !== '') {
      label = $("#" + id)[0].labels[0].innerHTML;
    }
    return label;
  }

  var sendData = function (eleName, eleVal, eleType, evtType, eleLabel, allowInput, type) {
    var evtData = { role: 'server', uid, eleName, eleVal, eleType, evtType, eleLabel, "allow-data-input": !!allowInput, type };
    if (sessionStatus = "in-progress")
      socket.emit('server', JSON.stringify(evtData));
  }

  var publishEvent = function (e) {
    var eleType = e.target.type.toLowerCase();
    var evtType = e.type;

    var eleLabel = getElementLabel(e.target.id);
    var eleVal = getElementValue(e);
    var eleName = getElementName(e);
    sendData(eleName, eleVal, eleType, evtType, eleLabel);
  }

  var publishGetDataEvent = function (e) {
    var evtType = e.type;
    var eleVal = getElementValue(e);

    var targetId = e.target.id.replace('chk-', '');
    var targetLabel = getElementLabel(targetId);
    var targetType = $('#' + targetId).attr('type');
    var targetVal = $('#' + targetId).val();
    var eleMask = $(this).attr('data-mask');

    var eleName = getElementName(e);
    sendData(targetId, targetVal, targetType, evtType, targetLabel, eleVal, "delegate");
  }

  var publishGetActionEvent = function (e) {
    var evtType = e.type;
    var contentId = $(this).attr('data-content-id');
    var targetId = $(this).attr('data-target-id');
    var targetInitials = $(this).attr('data-target-initials');

    var content = $('#' + contentId).html();

    var eleName = getElementName(e);
    //(eleName, eleVal, eleType, evtType, eleLabel, allowInput, type) 
    sendData(targetId, '', 'button', evtType, content, true, "action");
  }


  function dragElement(elmnt) {
    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    function elementDrag(e) {
      e = e || window.event;
      e.preventDefault();
      // calculate the new cursor position:
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      // set the element's new position:
      $("#mydiv").css('top', ($("#mydiv").offset().top - pos2) + "px");
      $("#mydiv").css('left', ($("#mydiv").offset().left - pos1) + "px");
      //elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
      //elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
      /* stop moving when mouse button is released:*/
      document.onmouseup = null;
      document.onmousemove = null;
    }

    function dragMouseDown(e) {
      e = e || window.event;
      e.preventDefault();
      // get the mouse cursor position at startup:
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      // call a function whenever the cursor moves:
      document.onmousemove = elementDrag;
    }

    if ($("#" + elmnt + "header").length > 0) {
      $(document).on('mousedown', "#" + elmnt + "header", dragMouseDown);
    } else {
      $(document).on('mousedown', "#" + elmnt, dragMouseDown);
    }
  }


  //Make the DIV element draggagle:
  dragElement("mydiv");


  $(document).on('blur', '.c-form-field__input', publishEvent);
  $(document).on('keyup', '.c-form-field__input', publishEvent);
  $(document).on('click', '.c-form-field__input', publishEvent);
  $(document).on('focus', '.c-form-field__input', publishEvent);

  $(document).on('blur', '.c-dropdown__menu', publishEvent);
  $(document).on('keyup', '.c-dropdown__menu', publishEvent);
  $(document).on('click', '.c-dropdown__menu', publishEvent);
  $(document).on('focus', '.c-dropdown__menu', publishEvent);

  $(document).on('blur', '.c-option__label__input', publishEvent);
  $(document).on('keyup', '.c-option__label__input', publishEvent);
  $(document).on('click', '.c-option__label__input', publishEvent);
  $(document).on('focus', '.c-option__label__input', publishEvent);

  $(document).on('blur', '.c-button-group__item__input', publishEvent);
  $(document).on('keyup', '.c-button-group__item__input', publishEvent);
  $(document).on('click', '.c-button-group__item__input', publishEvent);
  $(document).on('focus', '.c-button-group__item__input', publishEvent);

  $(document).on('blur', '.c-button-group__item__input', publishEvent);
  $(document).on('keyup', '.c-button-group__item__input', publishEvent);
  $(document).on('click', '.c-button-group__item__input', publishEvent);
  $(document).on('focus', '.c-button-group__item__input', publishEvent);

  $(document).on('blur', '.c-button-group__item__input', publishEvent);
  $(document).on('keyup', '.c-button-group__item__input', publishEvent);
  $(document).on('click', '.c-button-group__item__input', publishEvent);
  $(document).on('focus', '.c-button-group__item__input', publishEvent);





  input.blur(publishEvent);
  input.keyup(publishEvent);
  input.click(publishEvent);
  input.focus(publishEvent);

  chk.click(publishGetDataEvent);
  btn.click(publishGetActionEvent);



});


