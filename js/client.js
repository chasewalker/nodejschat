var CHAT_SERVER = "http://localhost:7000"
var socket;
$(document).ready(function(){
  socket = io.connect(CHAT_SERVER, {
'sync disconnect on unload': true });  
  socket.on('connected', showSystemInfo);
  socket.on('firstEntry', createMessageRooms);
  socket.on('message', showIncomingMessage);
  socket.on('info', showSystemInfo);
  socket.on('userList', showUserList);
  socket.on('privatemessage', showPrivateMessage);
  socket.on('updateRoomLengths', function(rooms){
  
	$.each(rooms, function(key, value) {
		var keyString = key.toString();
		var id = keyString.replace(/\s+/g, '') + 'Badge';
		$('#' + id).text(value);
	
	});
  });
  socket.on('updaterooms', function (rooms, current_room) {
    $('#rooms').empty();
    $.each(rooms, function(key, value) {
		var keyString = key.toString();
		var id = keyString.replace(/\s+/g, '');
        if(key == current_room){
            $('#rooms').append('<a href="#" class="label label-success padding-5 margin-5" onclick="switchRoom(\''+key+'\')">' + key + ' <span id="' + key + 'Badge" class="badge">' + value + '</span></a>');
			$('#' + id).show();
        }
        else {
            $('#rooms').append('<a href="#" class="label label-default padding-5 margin-5" onclick="switchRoom(\''+key+'\')">' + key + ' <span id="' + key + 'Badge" class="badge alert-info">' + value + '</span></a>');
			$('#' + id).hide();
        }
    });
});
  addWaterMark();
  sendButtonOnClick();
  changeButtonOnClick();
  
  function showConnectedSuccess(msg){
	showUsernameChange(msg['greetings']);
    $("#pre-connect").text(msg['greetings']);
  }
  
  function createMessageRooms(rooms, current_room){
	$('#messageBody').empty();
    $.each(rooms, function(key, value) {
		var keyString = key.toString();
		var id = keyString.replace(/\s+/g, '');
        if(key == current_room){
            $('#messageBody').append('<div class="panel-body messages" id="' + id + '"></div>');
        }
        else {
            $('#messageBody').append('<div class="panel-body messages" style="display:none;" id="' + id + '"></div>');
        }
    });
  }

 
  function showIncomingMessage(msg){
	if(socket.socket.sessionid == msg['sessionID']){
		$("#" + msg['roomID']).append("<div class='out-message'>(" + msg['timeStamp'] + ") " + "Me" + ": " + msg['msgContent'] + "</div>"); 
	}
	else{
		$("#" + msg['roomID']).append("<div class='in-message'>(" + msg['timeStamp'] + ") " + msg['msgOwner'] + ": " + msg['msgContent'] + "</div>"); 
	}
    
	updateScroll();
  }
  
  function showUserList(userList, userRemovedId){
	$("#userList").empty();
	  $.each(userList, function(key, value){
		$("#userList").append("<span class='label label-default padding-5 margin-5'>" + key + " (" + value.room + ")" +"</span>");
	  });
	  //$("#userListModal").empty();
	  if(userRemovedId){
		$('#privateWindowUser' + userRemovedId).remove();
		$('#' + userRemovedId + '.sendPrivateMessage').remove();
	  }
	  $.each(userList, function(key, value){
		  if(value.id != socket.socket.sessionid)
		  {
				var userNameLabel = $('#usernameLabel' + value.id);
				
				var privateMessageWindow = $('#privateWindowUser' + value.id);
				
				if(privateMessageWindow.length == 0){
					$('#modalMessages').append('<div class="privateWindowUser" id="privateWindowUser' + value.id + '"><div class="panel panel-primary"><div class="panel-heading"><h3 class="panel-title">Message to <span id="userNameHolder' + value.id +'">' +  key +'</span></h3></div><div class="panel-body privateMessageWindowSize" id="privateMessageWindowLog' + value.id +'"></div><div id="sendPrivateMessageDiv' + value.id +'" style="" class="margin-5 padding-5"><textarea rows="5" cols="50" id="outgoing-private-message' + value.id +'" name="outgoing-private-message' + value.id +'" autofocus="autofocus" placeholder="Enter your message here"></textarea><br><button type="button" id="sendPrivate' + value.id + '" name="' + value.id + '" value="send" class="btn btn-success padding-5 margin-5 sendPrivateMessageSend">Send</button><br /></div></div></div>');										
					$('#privateWindowUser' + value.id).hide();
				}
				else if(key != $('#userNameHolder' + value.id).text())
				{
					$('#userNameHolder' + value.id).text(key);
				}
				
				if(userNameLabel.length == 0){
					$("#userListModal").append("<span class='btn btn-sm btn-success padding-5 margin-5 sendPrivateMessage' id='" + value.id + "'><span id='usernameLabel" + value.id + "'>" + key + "</span> <span id='modalUserNameLabelMessageCount" + value.id + "' class='badge alert-info modalUserNameLabelMessageCount'>0</span></span>");
				}
				else if(key != userNameLabel.text()){
					userNameLabel.text(key);
				}
			}
	  });
	updateScroll();
  }

  function addWaterMark(){
    $("#outgoing-message").watermark("Enter your message here");
  }
  
  function updateScroll(){
  // $(".messages").animate({ scrollTop: $(".messages")[0].scrollHeight}, 1000);
  }

  function sendButtonOnClick(){
    $("#send").click(function(){
      var msg = $("#outgoing-message").val();
      // showOutgoingMessage(msg);
      $("#outgoing-message").val('');
      socket.emit('message', msg);
    });
  }

  // function showOutgoingMessage(msg){
	// var timestamp = getDate();
    // $("#messages").append("<div class='out-message'>(" + timestamp + ") Me: " + msg + "</div>");
	// updateScroll();
  // }
  
  function showUsernameChange(msg){
    $("#messages").append("<div class='out-message'>System: " + msg + "</div>");
  }

  function showSystemInfo(msg){
  if(msg['usernameRegistration'] == "successful"){ 
	$('#usernameEntry').hide();
	socket.emit('system-message', msg['username'] + ' has joined the chat room');
	$('#sendMessageDiv').show();
  }
    $("#" + msg['roomID']).append("<div class='info-message'>(" + msg['timeStamp'] + ") " + msg['msgOwner'] + ": " + msg['msgContent'] + "</div>"); 
	updateScroll();
  }

  function changeButtonOnClick(){
    $("#change").click(function(){
      var username = $("#username").val();
      $("#username").val('');
      registerUsername(username);
    });
  }

  function registerUsername(username, message){
    socket.emit('user-join', username);
	updateScroll();
  }
  
  function showPrivateMessage(data){ 
	var pmNumber = parseInt($('#privateMessageNumber').text());
	
	if(!$('#pmModal').is(':visible')){		
		$('#privateMessageNumber').text((pmNumber + 1))
	}
	
	var pmModalLabelCount = parseInt($('#modalUserNameLabelMessageCount' + data.from).text());
	
	if(!$('#privateWindowUser' + data.from).is(':visible')){		
		$('#modalUserNameLabelMessageCount' + data.from).text((pmModalLabelCount + 1))
	}
		
	var windowToShowMessageIn = $('#privateMessageWindowLog' + data.from);
	
	if(socket.socket.sessionid == data.from){
		windowToShowMessageIn = $('#privateMessageWindowLog' + data.to);
		windowToShowMessageIn.append("<div class='out-message'>(" + data.timeStamp + ") " + "Me" + ": " + data.msg + "</div>");
	}
	else{
		windowToShowMessageIn.append("<div class='in-message'>(" + data.timeStamp + ") " + data.msgOwner + ": " + data.msg + "</div>");
	}
  }
  
  function getDate(){
	var a_p = "";
	var d = new Date();
	var curr_hour = d.getHours();
	if (curr_hour < 12)
	   {
	   a_p = "AM";
	   }
	else
	   {
	   a_p = "PM";
	   }
	if (curr_hour == 0)
	   {
	   curr_hour = 12;
	   }
	if (curr_hour > 12)
	   {
	   curr_hour = curr_hour - 12;
	   }

	var curr_min = d.getMinutes();

	curr_min = curr_min + "";

	if (curr_min.length == 1)
	   {
	   curr_min = "0" + curr_min;
	   }
	   
	   var curr_sec = d.getSeconds();

	curr_sec = curr_sec + "";

	if (curr_sec.length == 1)
	   {
	   curr_sec = "0" + curr_sec;
	   }
	   
	   var curr_date = d.getDate();
		var curr_month = d.getMonth();
		curr_month++;
		var curr_year = d.getFullYear();
	   

	return (curr_month + "/" + curr_date + "/" + curr_year + " " + curr_hour + ":" + curr_min + ":" + curr_sec + " " + a_p);
  }
	
	$(document).on('click', '#privateMessages', function(){
	  $('#privateMessageNumber').text(0)
	});
  
	$(document).on('click', '.sendPrivateMessage', function(){
		$(this).find('.modalUserNameLabelMessageCount').text(0)
		var userToMessageId = $(this).attr('id');
		$('.privateWindowUser').each(function(index){
			$(this).hide();
		});
		$('#privateWindowUser' + userToMessageId).show();
	});
	
	$(document).on('click', '#closeModal', function(){
		//var userToMessageId = $(this).attr('id');
		//$('#userListModal').show();
		//$('#introMessage').show();
		//$('#modalMessages').hide();
	});
	
	$(document).on('click', '.sendPrivateMessageSend', function(){
		var userSessionId = $(this).attr('name');
		var msg = $("#outgoing-private-message" + userSessionId).val();   
		$("#outgoing-private-message" + userSessionId).val('');
		socket.emit('privatemessage', { msg: msg, to: userSessionId});
	});
});
$('#pmModal').modal();

      function switchRoom(room){
    socket.emit('switchRoom', room);
}