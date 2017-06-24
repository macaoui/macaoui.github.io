// Timer web worker

var gameTimerStep = 10;

function timedCount(timer,gameTimer) {
    tt= parseInt(timer)
    tt=Math.max(0,tt-1)
    current_score = Math.ceil(tt / gameTimer);
    postMessage(current_score);
    setTimeout("timedCount("+tt+","+gameTimer+")", 1000);
}

onmessage = function (e) {
    gameTimer = parseInt(e.data);
    init_time=gameTimer * gameTimerStep + 1;
    timedCount(init_time,gameTimer);

}
