
var $input = $("#inp").keypress(function(e){
    if(e.which == 13){
        socket.send($input.val());
        $input.val("");
    }
});
var socket = new WebSocket("ws://" + location.host + ":4242/", "node-irc");

function formatFrom(from, to) {
    if(to == "#mozilla-hispano" || from == "[Serv]"){
        return from;
    }
    return from + " → " + to + " ";
}

socket.onmessage = function(event){
    var objs = JSON.parse(event.data);
    console.log(objs);
    var scroll = window.scrollY == window.scrollMaxY;

    objs.forEach(function(data){
        $("<div/>")
            .addClass(data.from=="[Serv]"?"server-msg":"no-server-msg")
            .append(
                $("<span/>").text(formatFrom(data.from, data.to) + " ").addClass("irc-from")
            ).append(
                $("<span/>").text(data.message).addClass("irc-msg")
            ).appendTo(".msg-log");
    });

    if(scroll){
        window.scrollTo(window.scrollX, window.scrollMaxY);
    }
};
