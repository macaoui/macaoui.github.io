var num_container = $('#numbers_container');
var ope_container = $('#operands_container');

// create an number object with order attribute
function NumberObject(value, order, selected) {
    this.value = parseInt(value);
    this.order = order;
    this.selected = selected;
};

function initSet(numbers) {
    numSet = []
    for (i = 0; i < numbers.length; i++) {
        newN = new NumberObject(numbers[i], i, false)
        numSet.push(newN)
    }
    return numSet;
};

function actuateScreen(nSet) {
    ctn = $('#numbers_container');
    ctn.empty();
    nSet.sort(function (a,b) {
        return parseInt(a.order) -parseInt(b.order);
    });
    for (i = 0; i < nSet.length; i++) {
        nSet[i].order = i;
        if (nSet[i].selected) {
            ctn.append('<button type="button" class="number btn round raised btn-primary n_selected outline" order="' +
                nSet[i].order + '">' + nSet[i].value + '</button>');
        } else {
            ctn.append('<button type="button" class="number btn round raised btn-primary" order="' +
                nSet[i].order + '">' + nSet[i].value + '</button>');
        }
    }
};

function actuateOperands(nOper) {
    ctnO = $('#operands_container');
    ctnO.empty();
    for (i = 0; i < nOper.length; i++) {
        ctnO.append('<button type="button" class="operand btn btn-info">' + nOper[i] + '</button>');
    }
}

function createLevelBar(ctn,allLevels,level, start_index) {
    ctn.empty();
    for (i = start_index; i < start_index+5; i++) {
        lev = allLevels[i];
        var selected_text= i===level? 'selected':'';
        var operation_text = lev.ops.length === 1 ? "Operation: only " + lev.ops : "Operations: " + string2readable(lev.ops,", ","and");
        var allnum_text = lev.mustUseAll ? 'Must use all numbers ' : 'Do not have to use all numbers ';
        var sol_text = lev.hasExactSol ? 'Always a solution ' : 'Not always a solution ';
        text = '<div class="btn-group" role="group">' +
                                '<button type="button" class="level_btn btn round btn-default '+ selected_text+'"' +
                                        'value=' + parseInt(i) + ' info="' +
                                         operation_text + ' <br>' +
                                        allnum_text + '<br>' +
                                        sol_text +
                                        '" title="' + lev.lname +'"></button>' +
                                        '</div>';
        ctn.append(text);
    }
}

function operate(a, b, oper) {
    switch (oper) {
        case "+":
            return (a + b);
            break;
        case "-":
            return (a - b);
            break;
        case "x":
            return (a * b);
        case "/":
            if (b === 0) {
                return -1;
            }
            else {
                return a / b;
            }
            break;
        default:
    }

};

function isValid(c) {
    return (c >= 0 && Math.abs(c - Math.round(c)) < 0.000001);
};

// Convert time in milliseconds in a text string with minutes and seconds.
function display_time(t) {
    minutes = Math.floor(t / 1000 / 60);
    secondes = Math.floor(t / 1000 - 60 * minutes);
    minutesMsg = (minutes > 0) ? (minutes + "m") : "";
    return (minutesMsg + secondes + "s");
}

// To compare score and time and rank high_score
function f_s(score, time) {
    return parseInt(score) + (1 - parseInt(time) / 1800000);
}

// Wait till the browser is ready to render the game.
$(document).ready(function () {

    // Game Timer
    function startGameTimer() {
        if (typeof (Worker) !== "undefined") {
            if (typeof (w) == "undefined") {
                w = new Worker("./js/timer.js");
                w.postMessage(sLevel.timer);
            }
            w.onmessage = function (event) {
                $('#current_score').text(event.data);
            };
        } else {
            $('#current_score').text("NA");
        }
    }

    function stopGameTimer() {
        if (typeof (w) !== "undefined") {
            w.terminate();
            w = undefined;
        }
    }

    //Hint timer
    function hintShow(hintTimer) {
        var hint_b = $('#hint_sol');
        hint_b.fadeOut();
        clearTimeout(hintTimeout);
        hintTimeout=setTimeout(displayHint, hintTimer)
    };

    function displayHint() {
        $('#display_hint').text("  ");
        var hint_b = $('#hint_sol');
        hint_b.fadeIn(1500);
    }

    //Score management
    function updateScore() {
        stopGameTimer();
        totalScore = totalScore + parseInt($('#current_score').text())
        $('#total_score').text(totalScore);
    }

    //f(gameLevel, ranking, key). Key can be score, time, player_name
    function getStorage(lname, rank,k) {
        var key = lname +"_" +rank+"_" +k;
        if (localStorage.getItem(key)) {
            var value = localStorage.getItem(key);
        } else {
            var value = 0;
            localStorage.setItem(key,value);
        }
        return value;
    }

    //f(gameLevel, ranking, key, value). Key would be score, time, player_name
    function setStorage(lname, rank, k,v) {
        var key = lname + "_" + rank + "_" + k;
        localStorage.setItem(key, v);
    }

    //Score object
    function Score(lname, rank, score, time, player_name) {
        this.lname = lname;
        this.rank = rank;
        this.score = (typeof score === 'undefined') ? 0 : score;
        this.time = (typeof time === 'undefined') ? 3599000 : time;
        this.player_name = (typeof player_name === 'undefined') ? 'None' : player_name;
    };

    Score.prototype.getScore = function () {
        for (var j = 0; j < scoreFields.length; j++) {
            var key = scoreFields[j];
            this[key] = getStorage(this.lname, this.rank, key);
        }
    };

    Score.prototype.setScore = function () {
        var lname = this.lname;
        var rank = this.rank;
        for (var i = 0; i < scoreFields.length; i++) {
            var key = scoreFields[i];
            setStorage(lname, rank, key, this[key]);
        }
    }

    //High score table object
    function ScoreTable(size, lname) {
        this.size = size;
        this.lname = lname;
    };

    ScoreTable.prototype.getTable = function () {
        this.all_scores = [];
        for (var i = 0; i < this.size; i++) {
            this.all_scores.push(new Score(this.lname, i+1));
            this.all_scores[i].getScore();
        }
    };

    ScoreTable.prototype.setTable = function () {
        for (var i = 0; i < this.all_scores.length; i++) {
            this.all_scores[i].setScore();
        }
    };

    ScoreTable.prototype.update = function (scoreObj) {
        //test if score shall be inserted in score table
        var ranking = this.size;
        var rankFound = false;
        var newScore = f_s(scoreObj.score, scoreObj.time);
        var lastScoreObj = this.all_scores[ranking-1];
        var lastScore = f_s(lastScoreObj.score, lastScoreObj.time);
        var update_hs = false;
        if (newScore > lastScore) {
            update_hs = true;
            ranking--;
            this.all_scores.pop();
            //find the ranking of the new score within the table and update score ranks.
            do {
                var checkScore = this.all_scores[ranking - 1];
                if (newScore > f_s(checkScore.score, checkScore.time)) {
                    ranking--;
                    checkScore.rank++;
                    if (ranking == 0) {
                        rankFound = true;
                        scoreObj.rank = ranking + 1;
                        this.all_scores.splice(ranking, 0, scoreObj);
                    }
                }
                else {
                    rankFound = true;
                    scoreObj.rank = ranking + 1;
                    this.all_scores.splice(ranking, 0, scoreObj);
                }
            }
            while (ranking > 0 && !rankFound);
            this.setTable();
        }
        return ranking+1;
    };

    //Individual game
    function initGame(gameHandler) {
        numbers = gameHandler.Numbers;
        target = gameHandler.target;
        ops = gameHandler.operations;
        hintList = gameHandler.hintList;
        bestSolution = gameHandler.bestSolution;
        mustUseAll = gameHandler.mustUseAll;

        numSet = initSet(numbers);
        $('#display_target').text("Make " + target);
        actuateScreen(numSet);
        actuateOperands(ops);
        var ctn_play = $('#play_icon_container');
        ctn_play.empty();
        if (challengeStatus) {
            stopGameTimer();
            startGameTimer();
            $('#new_game_btn').hide();
            $('#skip_btn').show();
        } else {
            $('#skip_btn').hide();
            $('#new_game_btn').show();
        }
        updateInfo();
        hintsGiven = 0;
        $('#display_hint').text("  ");
        hintTimer = sLevel.timer * 1000 *2;
        hintShow(hintTimer);
    };

    function endGameChallenge() {
        currentScore=parseInt($('#current_score').text());
        updateScore();
        gamesPlayed++;
        // alert("Game "+gamesPlayed+" solved! +"+currentScore+" points");
        msg = "+" + currentScore;
        $('#tt_success').attr('data-original-title', msg);
        $('#tt_success').tooltip("show");
        setTimeout(function () {
            $('#tt_success').tooltip("hide");
        }, 1000);
        //and update score
        if (gamesPlayed >= numGamesChallenge) {
            endChallenge(); // update highscore and back to casual game state
        }
        else {
            gameHandler = new GameHandler(sLevel.size, sLevel.min_number, sLevel.max_number, sLevel.ops,
                                sLevel.tgt_min, sLevel.tgt_max, sLevel.tgt_step, sLevel.hasExactSol,
                                sLevel.mustUseAll, sLevel.CGTarget, sLevel.last_ops);
            initGame(gameHandler);
        }
    }

    function testEndGame(nSet, currentValue, mustUseAll, bestSolution) {
        if (nSet.length === 1) {
            if (nSet[0].value === bestSolution[0] || nSet[0].value === bestSolution[1]) {
                if (challengeStatus) {
                    endGameChallenge();
                }
                else {
                    $('#winModal').modal('show');
                }
            }
            else {
                $('#loseModal').modal('show');
            }
        }
        else {
            if (!mustUseAll && (currentValue === bestSolution[0] || currentValue === bestSolution[1])) {
                if (challengeStatus) {
                    endGameChallenge();
                }
                else {
                    $('#winModal').modal('show');
                }
            }
        }
    };

    //Challenge
    function startChallenge() {
        challengeStatus = true;
        gamesPlayed = 0;
        totalScore = 0;
        highScore = parseInt(getStorage(sLevel.lname,1,'score'));
        $('#high_score').text(highScore);
        $('#total_score').text(totalScore);
        timeStart = Date.now();
    }

    function endChallenge() {
        stopGameTimer();
        timeChrono = Date.now() - timeStart;
        challengeStatus = false;
        gamesPlayed = 0;
        var gameScore = new Score(sLevel.lname, 999, totalScore, timeChrono, 'NEW');
        msg = "<small> You just got " + totalScore + " points in " + display_time(timeChrono) + "</small><br>";
        totalScore = 0;
        $('#high_score').text(highScore);
        $('#total_score').text('_');
        $('#current_score').text('_');
        $('#skip_btn').hide();
        $('#new_game_btn').show();
        $('#hs_text').empty();
        $('#hs_text').append(msg);
        // update high score
        var hsTable = new ScoreTable(hs_size, sLevel.lname);
        hsTable.getTable();
        var gameRanking=hsTable.update(gameScore);
        if (gameRanking <= hs_size) {
            show_input_name_modal(gameRanking);
        }
        else {
            show_hs_modal();
        }
    }

    //Show input_name_modal if the player enter in the high scores
    function show_input_name_modal(ranking) {
        $('#input_name_text').text('Congratulations, you have reached rank no ' + ranking+ ' !');
        $('#name_input').attr('ranking', ranking);
        document.getElementById("name_input").value='';
        $('#inputNameModal').modal('show');
    }

    //Show high-score at end of a challenge or when requested 
    function show_hs_modal() {
        $('#hs_text').append('High Score - ' + sLevel.lname);
        var header = "<table class='table table-striped'>" +
            "<tr><th>#</th><th>Name</th><th>Score</th><th>Time</th></tr>";
        var footer = "</table>";
        var table_body = "";
        for (i = 1; i <= hs_size; i++) {
            var time_txt = display_time(parseInt(getStorage(sLevel.lname, i,'time')));
            table_body += "<tr><td>" + i + "</td><td>" + getStorage(sLevel.lname, i,'player_name') +
                        "</td><td>" + getStorage(sLevel.lname,i, 'score') + "</td><td>" + time_txt + "</td></tr>"
        }
        $('#hs_table').empty();
        $('#hs_table').append(header + table_body + footer);
        $('#hsModal').modal('show');
    }

    function updateInfo() {
        ctn = $('.level_btn.selected');
        level = ctn.attr('value');
        lev_info = ctn.attr('info');
        lev_title = ctn.attr('title');
        $('#info_display').attr('data-content', lev_info);
        $('#info_display').attr('data-original-title', lev_title);
        $('#display_level').text('Level: ' + lev_title + ' ');
        sLevel = allLevels[level];
        highScore = parseInt(getStorage(sLevel.lname,1,'score'));
        $('#high_score').text(highScore);
    }

    var scoreFields = ['score', 'time', 'player_name'];
    var hs_size = 10;
    var addLevel = new GameLevel("Easy Add", 4, 1, 9, "+", 1, 9, 1, true, false, false,5,"");
    var easyLevel = new GameLevel("Plus and Minus", 5, 1, 9, "+-", 4, 20, 1, true, false, false,5,"");
 //   var easyadvancedLevel = new GameLevel("Add and Subtract", 6, 0, 9, "+-", 1, 9, 1, true, true, true, 5);
    var plusmultLevel = new GameLevel("Multiply Master", 3, 2, 9, "+-x", 10, 81, 1, true, true, true, 5, "x");
    var minusLevel = new GameLevel("The Mysterious Mister Minus", 6, 1, 9, "-", 0, 9, 1, true, true, true, 5, "");
    var minusmultLevel = new GameLevel("Mister Minus and Multiply", 4, 1, 9, "-x", 2, 36, 2, true, true, true, 5,"x");

    var mediumLevel = new GameLevel("The Standard", 4, 1, 9, "+-x", 4, 48, 4, true, true, true, 10,"");
    var divideLevel = new GameLevel("The Divide Dandy", 5, 1, 9, "+x/", 1, 9, 1, true, true, true, 10,"");
 //   var mediumadvancedLevel = new GameLevel("Medium Challenging", 5, 1, 9, "+-x", 3, 99, 3, false, true, true,10);
    var twentyfourLevel = new GameLevel("Make 24", 4, 1, 10, "+-x/", 24, 24, 1, true, true, true,10,"");
    var challengingLevel = new GameLevel("The Challenge", 4, 1, 10, "+-x/", 1, 99, 1, false, true, true,10,"");
    var ultimateLevel = new GameLevel("The Ultimate", 5, 1, 10, "+-x/", 1, 199, 1, false, true, true,12,"");
    var allLevels = [];
    allLevels.push(addLevel, easyLevel, plusmultLevel, minusLevel, minusmultLevel,
        mediumLevel, divideLevel, twentyfourLevel, challengingLevel, ultimateLevel);
    var level = 2;
    var sLevel = allLevels[level];
    var gameHandler = new GameHandler(sLevel.size, sLevel.min_number, sLevel.max_number, sLevel.ops,
                        sLevel.tgt_min, sLevel.tgt_max, sLevel.tgt_step, sLevel.hasExactSol,
                        sLevel.mustUseAll, sLevel.CGTarget, sLevel.last_ops);
    var level_container1 = $('#select_container');
    var level_container2 = $('#select_container2');
    createLevelBar(level_container1, allLevels, level, 0);
    createLevelBar(level_container2, allLevels, level, 5);
    var challengeStatus = false;
    var gamesPlayed = 0;
    var numGamesChallenge = 10;
    var totalScore = 0;
    var highScore = 0;
    var w;
    var hintTimeout;
    var timeStart=Date.now();
    var timeChrono;

    initGame(gameHandler);

    $('[data-toggle="popover"]').popover();
    $('[data-toggle="tooltip"]').tooltip();

    //click on number
    $(document).on('click', '.number', function () {
        //if no operation has been selected, the number is selected (1st part of the operation).
        if ($('.operand.op_selected').length === 0) {
            $(this).toggleClass('n_selected outline');
            $(this).siblings().removeClass('n_selected outline');
        }
            // otherwise, perform the operation on the two selected numbers
        else {
            if ($(this).hasClass('n_selected')) {
                //nothing
            }
            else {
                var numA = $('.number.n_selected')
                var numB= $(this)
                var a = parseInt(numA.text());
                var b = parseInt(numB.text());
                var order_a = parseInt(numA.attr('order'))
                var order_b = parseInt(numB.attr('order'))
                $(this).addClass('n_selected outline');
                var oper = $('.operand.op_selected').text();
                var c = operate(a, b, oper);
                if (isValid(c)) {
                    for (var i = numSet.length-1; i >=0; i--) {
                        if (numSet[i].order=== order_a || numSet[i].order===order_b) {
                            numSet.splice(i,1);
                        }
                        else {
                            numSet[i].selected = false;
                        }
                    }
                    var newNum = new NumberObject(c,  order_b, true);
                    numSet.push(newNum);
                    actuateScreen(numSet);      // update screen and manage game end.
                    testEndGame(numSet, c, mustUseAll,bestSolution);
                    $('.operand.op_selected').removeClass('op_selected outline');                     //unselect operand

                }
                else {  //(operation not valid)
                    $('.operand.op_selected').removeClass('op_selected outline');                     //unselect all
                    $('.number.n_selected').removeClass('n_selected outline');
                }
            }
        }
    });
    $(document).on('click', '.operand', function () {
        if ($('.number.n_selected').length > 0) {
            $(this).toggleClass('op_selected outline');
            $(this).siblings().removeClass('op_selected outline');
        }
    });

    $(document).on('click', '.level_btn', function () {
        if (!challengeStatus) {
            $('.level_btn').removeClass('selected');
            $(this).addClass('selected');
            updateInfo();
        }
    });

    $(document).on('click', '.retry', function () {
        $('.operand.op_selected').removeClass('op_selected outline');
        numSet=initSet(numbers)
        actuateScreen(numSet);
        $('#display_hint').text("  ");
        hintShow(hintTimer);
    });

    $(document).on('click', '.btn-new', function () {
        $('#playModal').modal('hide');
        level = $('.level_btn.selected').attr('value');
        sLevel = allLevels[level];
        gameHandler = new GameHandler(sLevel.size, sLevel.min_number, sLevel.max_number, sLevel.ops,
                            sLevel.tgt_min, sLevel.tgt_max, sLevel.tgt_step, sLevel.hasExactSol,
                            sLevel.mustUseAll, sLevel.CGTarget, sLevel.last_ops);
        if (challengeStatus) {
            gamesPlayed++;
           // alert("Game skipped.");
            $('#tt_skip').tooltip("show");
            setTimeout(function () {
                $('#tt_skip').tooltip("hide");
            }, 1000);
            if (gamesPlayed >= numGamesChallenge) {
                endChallenge(); // update highscore and back to casual game state
            }
        }
        initGame(gameHandler);
    });

    $(document).on('click', '#hint', function () {
        hintShow(hintTimer);
        var myHint = hintList[hintsGiven % hintList.length];
        $('#display_hint').text(myHint);
        hintsGiven++;
    });

    $(document).on('click','#solverLaunch', function() {
        $('#solverModal').modal('show');
})

    $(document).on('click','#info_display', function() {
        setTimeout(function () {
            $('#info_display').popover("hide");
        }, 5000);
    })

    $(document).on('click', '#new_game_btn', function () {
        $('#playModal').modal('show');
    })

    $(document).on('click', '#start_challenge', function () {
        $('#playModal').modal('hide');
        level = $('.level_btn.selected').attr('value');
        sLevel = allLevels[level];
        gameHandler = new GameHandler(sLevel.size, sLevel.min_number, sLevel.max_number, sLevel.ops,
                            sLevel.tgt_min, sLevel.tgt_max, sLevel.tgt_step, sLevel.hasExactSol,
                            sLevel.mustUseAll, sLevel.CGTarget, sLevel.last_ops);
        startChallenge();
        initGame(gameHandler);
    })

    $(document).on('click', '.score', function () {
        if (!challengeStatus) {
            $('#hs_text').empty();
            show_hs_modal();
        }
    })

    $(document).on('click', '#input_name_btn', function () {
        $('#inputNameModal').modal('hide');
        ranking = $('#name_input').attr('ranking');
        nameValue = document.getElementById("name_input").value;
        setStorage(sLevel.lname, ranking, 'player_name', nameValue);
        show_hs_modal();
    })

    //correct bug on popover which needed to be clicked twice
    $('#info_display').on('hidden.bs.popover', function (e) {
        $(e.target).data("bs.popover").inState = { click: false, hover: false, focus: false }
    });

});


