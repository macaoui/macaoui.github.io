﻿var num_container = $('#numbers_container');
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
        var operation_text = lev.ops.length === 1 ? "Operation only " + lev.ops : "Operations " + lev.ops.split("").join(", ");
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


// Wait till the browser is ready to render the game.
$(document).ready(function () {

    // Chrono
    function startChrono() {
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

    function stopChrono() {
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
        var hint_b = $('#hint_sol');
        hint_b.fadeIn(1500);
    }

    //Score management
    function updateScore() {
        stopChrono();
        totalScore = totalScore + parseInt($('#current_score').text())
        $('#total_score').text(totalScore);
    }

    function getHighScore(gameLevel) {
        key = "hs_" + gameLevel.lname;
        if (localStorage.getItem(key)) {
            value = localStorage.getItem(key);
        } else {
            value = 0;
            localStorage.setItem(key,value);
        }
        return value;
    }

    function setHighScore(gameLevel, score) {
        key = "hs_" + gameLevel.lname;
        localStorage.setItem(key,score);
    }

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
            stopChrono();
            startChrono();
            $('#play_icon').hide();
            $('#skip_btn').show();
        } else {
            $('#skip_btn').hide();
            $('#play_icon').show();
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
                                sLevel.tgt_min, sLevel.tgt_max, sLevel.tgt_step, sLevel.hasExactSol, sLevel.mustUseAll, sLevel.CGTarget);
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
        highScore = parseInt(getHighScore(sLevel));
        $('#high_score').text(highScore);
        $('#total_score').text(totalScore);

    }

    function endChallenge() {
        challengeStatus = false;
        stopChrono();
        gamesPlayed = 0;
        beatHS="";
        // update high score
        if (totalScore > highScore) {
            setHighScore(sLevel, totalScore);
            highScore = totalScore;
            beatHS="Best Score!";
        }
        // alert("You got "+totalScore +" points" + beatHS);
        msg = totalScore + " points. " + beatHS;
        $('#tt_end').attr('data-original-title', msg);
        $('#tt_end').tooltip("show");
        setTimeout(function () {
            $('#tt_end').tooltip("hide");
        }, 10000);
        totalScore = 0;
        $('#high_score').text(highScore);
        $('#total_score').text('-');
        $('#current_score').text('-');
        var ctn_play = $('#play_icon_container');
        ctn_play.empty();
        ctn_play.append('<span id="play_icon" class="glyphicon glyphicon-expand center-block"></span>')
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
        highScore = parseInt(getHighScore(sLevel));
        $('#high_score').text(highScore);
    }

    var very_easyLevel = new GameLevel("Add and hop", 4, 0, 9, "+", 1, 9, 1, true, false, false,5);
    var very_easyadvancedLevel = new GameLevel("Add more", 5, 0, 9, "+", 1, 20, 1, true, false, false,5);
    var easyLevel = new GameLevel("Plus and minus", 4, 0, 9, "+-", 1, 9, 1, true, false, false,5);
    var minusLevel = new GameLevel("The Strange Mr Minus", 6, 0, 9, "-", 0, 9, 1, true, true, true,5);
    var easyadvancedLevel = new GameLevel("Plus and minus - Advanced", 6, 0, 9, "+-", 1, 9, 1, true, true, true,5);
    var mediumLevel = new GameLevel("Medium", 4, 1, 9, "+-x", 4, 48, 4, true, true, true,10);
    var mediumadvancedLevel = new GameLevel("Medium Challenging", 5, 1, 9, "+-x", 3, 99, 3, false, true, true,10);
    var twentyfourLevel = new GameLevel("Make 24", 4, 1, 10, "+-x/", 24, 24, 1, true, true, true,10);
    var hardLevel = new GameLevel("Challenging", 4, 1, 10, "+-x/", 6, 72, 6, false, true, true,10);
    var very_hardLevel = new GameLevel("Ultimate", 5, 1, 10, "+-x/", 12, 240, 2, false, true, true,10);
    var allLevels = [];
    allLevels.push(very_easyLevel, very_easyadvancedLevel, easyLevel, minusLevel, easyadvancedLevel, mediumLevel, mediumadvancedLevel,
                    twentyfourLevel, hardLevel, very_hardLevel);
    var level = 2;
    var sLevel = allLevels[level];
    var gameHandler = new GameHandler(sLevel.size, sLevel.min_number, sLevel.max_number, sLevel.ops,
                        sLevel.tgt_min, sLevel.tgt_max, sLevel.tgt_step, sLevel.hasExactSol, sLevel.mustUseAll, sLevel.CGTarget);
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
                            sLevel.tgt_min, sLevel.tgt_max, sLevel.tgt_step, sLevel.hasExactSol, sLevel.mustUseAll, sLevel.CGTarget);
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

    $(document).on('click', '#play_icon', function () {
        $('#playModal').modal('show');
    })

    $(document).on('click', '#start_challenge', function () {
        $('#playModal').modal('hide');
        level = $('.level_btn.selected').attr('value');
        sLevel = allLevels[level];
        gameHandler = new GameHandler(sLevel.size, sLevel.min_number, sLevel.max_number, sLevel.ops,
                            sLevel.tgt_min, sLevel.tgt_max, sLevel.tgt_step, sLevel.hasExactSol, sLevel.mustUseAll, sLevel.CGTarget);
        startChallenge();
        initGame(gameHandler);
    })

    $('#info_display').on('hidden.bs.popover', function (e) {
        $(e.target).data("bs.popover").inState = { click: false, hover: false, focus: false }
    });

});


