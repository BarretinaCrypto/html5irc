

var connect = require('connect');
var irc = require('irc');
var http = require('http');
var fs = require('fs');
var WebSocketServer = require('websocket').server;


var msgLog = [];
var clients = [];
var client_id = 0;

function addLogMessage(from, to, message){
    var logobj = {
        time: +new Date(),
        from: from,
        to: to,
        message: message
    };
    msgLog.push(logobj);
    for (var i = 0; i < clients.length; i++) {
        clients[i].sendUTF(JSON.stringify([logobj]));
    }
}


function log(s){
    console.log(s);
    addLogMessage("[Serv]","Me",s);
}

var client = new irc.Client('irc.mozilla.org', 'Bengoa', {
    channels: ['#mozilla-hispano'],
    showErrors: true,
    debug: true
    //secure: true,
});

client.addListener('registered',function(){
    log("Irc Connected");
});

client.addListener('error', function(message) {
        log('error: ' + message);
});

client.addListener('motd', function(motd) {
        log('motd: ' + motd);
});

client.addListener('topic', function(channel, topic, nick, message) {
        log('topic for ' + channel + ": " + topic + " (set by " + nick + ")");
});

client.addListener('part', function(channel, nick, reason, message) {
        log(nick + ' has left channel ' + channel + " (" + reason + ")");
});

client.addListener('quit', function(nick, reason, channels, message) {
        log(nick + ' has quit (' + reason + ')');
});

client.addListener('kick', function(channel, nick, by, reason, message) {
        log(nick + ' has been kicked from ' + channel + " by " + by + " (" + reason + ")");
});

client.addListener('kill', function(nick, reason, channels, message) {
        log(nick + ' has been killed from ' + channel + " (" + reason + ")");
});

client.addListener('nick', function(oldnick, newnick, channels, message) {
        log(oldnick + ' is now known as ' + newnick);
});

client.addListener('+mode', function(channel, by, mode, argument, message) {
        log(by + ' sets mode of ' + argument + ' +' + mode + ' in channel ' + channel);
});

client.addListener('-mode', function(channel, by, mode, argument, message) {
        log(by + ' sets mode of ' + argument + ' -' + mode + ' in channel ' + channel);
});

client.addListener('message', addLogMessage);

var server = http.createServer(connect.static(__dirname+ "/static"));
//var server = http.createServer(function(request, response) {
//    fs.readFile(__dirname + "/static/index.html", "binary", function(err, file) {
//        if(err) {
//            response.writeHead(500, {"Content-Type": "text/plain"});
//            response.write(err + "\n");
//        }else{
//            response.writeHead(200, {"Content-Type": "text/html"});
//            response.write(file, "binary");
//        }
//        response.end();
//    });
//});

server.listen(4242, function() {
    log("Server running");
});

wsServer = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: false
});

function originIsAllowed(origin) {
  return true;
}

wsServer.on('request', function(request) {
    if (!originIsAllowed(request.origin)) {
      request.reject();
      console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }

    var connection = request.accept('node-irc', request.origin);
    log("Websocket connection accepted");
    clients.push(connection);

    connection.sendUTF(JSON.stringify(msgLog));

    connection.on('message', function(message) {
        if (message.type === 'utf8') {

            log('Received Message: ' + message.utf8Data);
            client.say("#mozilla-hispano", message.utf8Data);
        }else{
            log("Received non-utf8 msg");
        }
    });

    connection.on('close', function(reasonCode, description) {
        log(' Peer ' + connection.remoteAddress + ' disconnected.');
        for (var i=0; i<clients.length; i++){
            if(clients[i] == connection){
                clients.splice(i);
                return;
            }
        }
    });
});

