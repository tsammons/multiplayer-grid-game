"use strict";
var ctx, canvas;
var gridWidth = 1000, 
    gridHeight = 1000, 
    tileLength = 20, 
    stepSize = 25,  
    myPosition = {xDisplacement: 0, yDisplacement: 0, radius: 0},
    mySocketID;


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
    mySocketID = data;
    console.log('connected with socketID ', mySocketID);
});

socket.on('tick', (data) => {
    handleTick(data);
});

function handleTick(data) {
    var myPlayer = data.find(x => x.socketID == mySocketID);

    myPosition = {
        xDisplacement: myPlayer.xDisplacement, 
        yDisplacement: myPlayer.yDisplacement, 
        radius: myPlayer.radius
    };

    var upperLeftX = myPosition.xDisplacement + gridWidth/2 - canvas.width/2;
    var upperLeftY = myPosition.yDisplacement + gridHeight/2 - canvas.height/2;

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

    drawGridSection(upperLeftX, upperLeftY, data);
}

function drawGridSection(upperLeftX, upperLeftY, playerList) {
    var xOffset = tileLength - ( upperLeftX % tileLength );
    var yOffset = tileLength - ( upperLeftY % tileLength );

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (var i = xOffset; i < canvas.width + xOffset; i += tileLength) {
        drawLine(i, 0, i, canvas.height);
    }

    for (var i = yOffset; i < canvas.height + yOffset; i += tileLength) {
        drawLine(0, i, canvas.width, i);
    }

    playerList.forEach(p => {
        var posX = p.xDisplacement + gridWidth/2;
        var posY = p.yDisplacement + gridHeight/2;

        if ( upperLeftX <= (posX + p.radius) && (upperLeftX + canvas.width) >= (posX - p.radius) && upperLeftY <= (posY + p.radius) && (upperLeftY + canvas.height) >= (posY - p.radius) ) {
            if (p.socketID == mySocketID) {
                drawMark(posX - upperLeftX, posY - upperLeftY, p.radius, true);
            } else {
                drawMark(posX - upperLeftX, posY - upperLeftY, p.radius, false);
            }
        }
    });
}

function keyDownHandler(e) {
    switch(e.keyCode) {
        case 37:
            var position = myPosition.xDisplacement + gridWidth/2 - myPosition.radius;
            if (position > 0) {
                var nextMoveSize = Math.min(stepSize, position);
                socket.emit('move', { direction: 'left', distance: nextMoveSize });
            }
            break;
        case 38:
            var position = myPosition.yDisplacement + gridHeight/2 - myPosition.radius;
            if (position > 0) {
                var nextMoveSize = Math.min(stepSize, position);
                socket.emit('move', { direction: 'up', distance: nextMoveSize });
            }
            break;
        case 39: 
            var position = myPosition.xDisplacement + gridWidth/2 + myPosition.radius;
            if (position < gridWidth) {
                var nextMoveSize = Math.min(stepSize, gridWidth - position);
                socket.emit('move', { direction: 'right', distance: nextMoveSize });
            }
            break;
        case 40:
            var position = myPosition.yDisplacement + gridHeight/2 + myPosition.radius;
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