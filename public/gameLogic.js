"use strict";
var ctx, canvas;
var tileLength = 20, 
    stepSize = 25,  
    myPosition = {xPosition: 0, yPosition: 0, radius: 0},
    mySocketID,
    gridWidth,
    gridHeight,
    activePlayer = false;


// Setup gameboard
document.addEventListener("keydown", keyDownHandler, false);
document.getElementById("myCanvas").style.border = "thick solid #0000FF";
canvas = document.getElementById('myCanvas');
ctx = myCanvas.getContext('2d');
canvas.width = 500;
canvas.height = 500; 
ctx.font = "10px Helvetica";
ctx.lineWidth = 1;


// Create socket connection
var socket = io.connect('http://localhost:4000');

socket.on('connected', (data) => {
    mySocketID = data.socketID;
    gridWidth = data.gridWidth;
    gridHeight = data.gridHeight;
    activePlayer = true;
    console.log('connected with socketID ', mySocketID);
});

socket.on('tick', (data) => {
    handleTick(data);
});

socket.on('youLose', (data) => {
    activePlayer = false;
    document.getElementById("myCanvas").style.border = "thick solid #ff0000";
});


function handleTick(data) {
    var myIndex = data.playerArray.findIndex(x => x.socketID == mySocketID);

    if (myIndex == -1) {
        var upperLeftX = myPosition.xPosition - canvas.width/2;
        var upperLeftY = myPosition.yPosition - canvas.height/2;
        drawGridSection(upperLeftX, upperLeftY, data.playerArray, data.tokenArray);
        return;
    }

    myPosition = {
        xPosition: data.playerArray[myIndex].xPosition, 
        yPosition: data.playerArray[myIndex].yPosition, 
        radius: data.playerArray[myIndex].radius
    };

    var upperLeftX = myPosition.xPosition - canvas.width/2;
    var upperLeftY = myPosition.yPosition- canvas.height/2;

    if (upperLeftX < 0) {
        upperLeftX = 0;
    }
    if (upperLeftX > gridWidth - canvas.width) {
        upperLeftX = gridWidth - canvas.width;
    }
    if (upperLeftY < 0) {
        upperLeftY = 0;
    }
    if (upperLeftY > gridHeight - canvas.height) {
        upperLeftY = gridHeight - canvas.height;
    }

    drawGridSection(upperLeftX, upperLeftY, data.playerArray, data.tokenArray);
}

function drawGridSection(upperLeftX, upperLeftY, playerArray, tokenArray) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawLines(upperLeftX, upperLeftY);
    drawTokensInSection(upperLeftX, upperLeftY, tokenArray);
    drawPlayersInSection(upperLeftX, upperLeftY, playerArray);
}

function drawLines(upperLeftX, upperLeftY) {
    var xOffset = tileLength - ( upperLeftX % tileLength );
    var yOffset = tileLength - ( upperLeftY % tileLength );

    for (var i = xOffset; i < canvas.width + xOffset; i += tileLength) {
        drawLine(i, 0, i, canvas.height);
    }
    for (var i = yOffset; i < canvas.height + yOffset; i += tileLength) {
        drawLine(0, i, canvas.width, i);
    }
}

function drawTokensInSection(upperLeftX, upperLeftY, tokenArray) {
    tokenArray.forEach(t => {
        var posX = t.xPosition;
        var posY = t.yPosition;

        if ( upperLeftX <= (posX + t.radius) && (upperLeftX + canvas.width) >= (posX - t.radius) &&
             upperLeftY <= (posY + t.radius) && (upperLeftY + canvas.height) >= (posY - t.radius) ) {
            drawMark(posX - upperLeftX, posY - upperLeftY, t.radius, false);
        }
    });
}

function drawPlayersInSection(upperLeftX, upperLeftY, playerArray) {
    playerArray.forEach(p => {
        var posX = p.xPosition;
        var posY = p.yPosition;

        if ( upperLeftX <= (posX + p.radius) && (upperLeftX + canvas.width) >= (posX - p.radius) &&
             upperLeftY <= (posY + p.radius) && (upperLeftY + canvas.height) >= (posY - p.radius) ) {
            if (p.socketID == mySocketID) {
                drawMark(posX - upperLeftX, posY - upperLeftY, p.radius, true);
            } else {
                drawMark(posX - upperLeftX, posY - upperLeftY, p.radius, false);
            }
        }
    });
}

function keyDownHandler(e) {
    if (!activePlayer)
        return;

    switch(e.keyCode) {
        case 37:
            var position = myPosition.xPosition - myPosition.radius;
            if (position > 0) {
                var nextMoveSize = Math.min(stepSize, position);
                socket.emit('move', { direction: 'left', distance: nextMoveSize });
            }
            break;
        case 38:
            var position = myPosition.yPosition - myPosition.radius;
            if (position > 0) {
                var nextMoveSize = Math.min(stepSize, position);
                socket.emit('move', { direction: 'up', distance: nextMoveSize });
            }
            break;
        case 39: 
            var position = myPosition.xPosition + myPosition.radius;
            if (position < gridWidth) {
                var nextMoveSize = Math.min(stepSize, gridWidth - position);
                socket.emit('move', { direction: 'right', distance: nextMoveSize });
            }
            break;
        case 40:
            var position = myPosition.yPosition + myPosition.radius;
            if (position < gridHeight) {
                var nextMoveSize = Math.min(stepSize, gridHeight - position);
                socket.emit('move', { direction: 'down', distance: nextMoveSize });
            }
            break;
        default:
            break;
    }
}

function drawLine(xStart, yStart, xEnd, yEnd) {
    ctx.strokeStyle = "black";
    ctx.beginPath();
    ctx.moveTo(xStart, yStart);
    ctx.lineTo(xEnd, yEnd);
    ctx.stroke();   
}

function drawMark(positionX, positionY, radius, isMe) {
    if (isMe) {
        ctx.strokeStyle = "red";
        ctx.fillStyle = "red";
    } else {
        ctx.strokeStyle = "black";
        ctx.fillStyle = "black";
    }

    ctx.beginPath();
    ctx.arc(positionX, positionY, radius, 0, 2*Math.PI);
    ctx.stroke();
    ctx.fill();
}