var DEFAULT_USERNAME = 'Guest';
var express = require('express');
var app = express();
var server = require('http').createServer(app).listen(7000);
var io = require('socket.io').listen(server);
var rooms = {'Lobby' : 0, 'IT' : 0, 'For Sale' : 0};


io.sockets.on('connection', function(client){
	var d = new Date();
	var timestamp = getDate();
	updateUserList();
	var generatedUser = DEFAULT_USERNAME + Math.floor((Math.random()*10000)+1)
	client.username = generatedUser;
	client.room = 'Lobby';
	client.join('Lobby');
	client.emit('connected', {msgOwner: 'System', msgContent: 'Successfully Connected to Lobby as ' + generatedUser + '. Enter a username to begin sending messages.', timeStamp: timestamp, room: 'Lobby'});
	
	Object.keys(rooms).forEach(function(key){
		rooms[key] = getRoomLength(key);
	});
	
	client.emit('updaterooms', rooms, 'Lobby');
	client.emit('firstEntry', rooms, 'Lobby');
	client.on('message', broadcastMessage);
	client.on('user-join', registerUsername);
	client.on('system-message', systemMessage);
	client.on('disconnect', function(){
	
		var timestamp = getDate();
		
		Object.keys(rooms).forEach(function(key){
			var systemInfo = {
		  msgOwner:'System',
		  msgContent: client.username + ' has been disconnected.',
		  usernameRegistration: 'unsuccessful',
		  timeStamp: timestamp,
		  roomID: key.replace(/\s+/g, '')
		};
		
		io.sockets.emit('info', systemInfo);
		})
		updateUserList(client);
		updateRoomLengthsOnDisconnect(client.room);
  });
	updateUserList();
	updateRoomLengths();
  
  client.on('switchRoom', function(newroom) {
		var d = new Date();
		var timestamp = getDate();
        var oldroom;
		
        oldroom = client.room;
		var oldRoomString = oldroom.toString();
		var oldRoomId = oldRoomString.replace(/\s+/g, '');
		
		var newRoomString = newroom.toString();
		var newRoomId = newRoomString.replace(/\s+/g, '');
		
        client.leave(client.room);
        client.join(newroom);
        client.emit('connected', {msgOwner: 'System', msgContent: 'Successfully Connected to ' + newroom + '.', timeStamp: timestamp, room: newroom, roomID: newRoomId});
        client.broadcast.to(oldroom).emit('info', {msgOwner: 'System', msgContent: client.username + ' has left the ' + oldroom + ' room.', timeStamp: timestamp, roomID: oldRoomId});
        client.room = newroom;
        client.broadcast.to(newroom).emit('info', {msgOwner: 'System', msgContent: client.username + ' has joined the ' + newroom + ' room.', timeStamp: timestamp, roomID: newRoomId});
		updateRoomLengths();
		
        client.emit('updaterooms', rooms, newroom);
		updateUserList();
		
    });
  
  client.on('privatemessage', function(data) {      
		var timestamp = getDate();  
		
        io.sockets.sockets[data.to].emit('privatemessage', { 
		from: client.id, 
		to: data.to, 
		msg: data.msg, 
		msgOwner: client.username,
		timeStamp: timestamp });
		
		io.sockets.sockets[client.id].emit('privatemessage', { 
		from: client.id, 
		to: data.to, 
		msg: data.msg, 
		msgOwner: client.username,
		timeStamp: timestamp});
   });
  
  function updateUserList(userToRemove){
	var userToRemoveId = null;
	 var userList = new Object();
	 var clients = io.sockets.clients();
	clients.forEach(function(s){
    // s.get('username', function(err, un){
	if(s.username != null){
	 userList[s.username] = {room: s.room, id: s.id};
	}
	// });	
  });
  if(userToRemove){	
	userToRemoveId = userToRemove.id;
	delete userList[userToRemove.username];
  }
  io.sockets.emit('userList', userList, userToRemoveId);
  }
  
  function broadcastMessage(msg){
	var roomString = client.room.toString();
	var roomId = roomString.replace(/\s+/g, '');
	var timestamp = getDate();
    // client.get('username', function(err, username){
      if(client.username == null)
        username = DEFAULT_USERNAME;
      var broadcastMsg = {
		msgOwner: client.username,
        msgContent:msg,
		timeStamp: timestamp,
		roomID: roomId,
		sessionID: client.id
      };
      io.sockets.emit('message', broadcastMsg);
    // });
  }

  function systemMessage(message){
	var roomString = client.room.toString();
	var roomId = roomString.replace(/\s+/g, '');
	var timestamp = getDate();
	  var systemInfo = {
		  msgOwner:'System',
		  msgContent: message,
		  timeStamp: timestamp,
		  roomID: roomId
		};
    client.broadcast.emit('info', systemInfo);
  }
  
  function registerUsername(username){
  var roomString = client.room.toString();
	var roomId = roomString.replace(/\s+/g, '');
	var timestamp = getDate();
  var clients = io.sockets.clients();
  var usernameCount = 0;
  clients.forEach(function(s){
    // s.get('username', function(err, un){
	if(s.username != null){
	if(username == s.username){
	 usernameCount++;
	 }
	}
	// });	
  });
  if(usernameCount < 1){
    client.username = username;
    var systemInfo = {
      msgOwner:'System',
      msgContent:'Your current username is ' + username,
	  timeStamp: timestamp,
	  usernameRegistration: 'successful',
	  username: username,
	  roomID: roomId
    };
    client.emit('info', systemInfo);
	updateUserList();
	}
	else{
	var systemInfo = {
      msgOwner:'System',
      msgContent:'The username ' + username + ' has been taken already. Please choose another.',
	  timeStamp: timestamp,
	  usernameRegistration: 'unsuccessful',
	  roomID: roomId
    };
    client.emit('info', systemInfo);
	}
  }
  
  function getRoomLength(room){
	var timestamp = getDate();
	var clientLength = io.sockets.clients(room).length;
    return clientLength;
	}
	
	
	function updateRoomLengths(){
	Object.keys(rooms).forEach(function(key){
		rooms[key] = getRoomLength(key);
	});
	
	io.sockets.emit('updateRoomLengths', rooms);	
	}
	
	function updateRoomLengthsOnDisconnect(room){
	Object.keys(rooms).forEach(function(key){
		// rooms[key] = getRoomLength(key);
		if(key == room){
			rooms[key] = rooms[key] - 1;
			}
	});
	
	io.sockets.emit('updateRoomLengths', rooms);
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
});
