// Timer web worker

var gameTimer = 10;
var gameTimerStep = 10;
var tt = gameTimer * gameTimerStep + 1;

function timedCount() {
    tt=Math.max(0,tt-1)
    current_score = Math.ceil(tt / gameTimerStep);
    postMessage(current_score);
    setTimeout("timedCount()", 1000);
}

timedCount();
