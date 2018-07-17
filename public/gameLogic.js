"use strict";
var ctx, canvas;
var gridWidth = 1000, gridHeight = 1000, myRadius = 20, tileLength = 20, stepSize = 25,  myPosition = {X: 0, Y: 0};
var worldX, worldY;
var mySocketID;

var socket = io.connect('http://localhost:4000');

socket.on('connected', (data) => {
    mySocketID = data;
    console.log('connected with socketID ', mySocketID);
});

socket.on('tick', (data) => {
    handleTick(data);
});

function init() {
    document.addEventListener("keydown", keyDownHandler, false);
    document.getElementById("myCanvas").style.border = "thick solid #0000FF";
    canvas = document.getElementById('myCanvas');
    ctx = myCanvas.getContext('2d');
    canvas.width = 500;
    canvas.height = 500; 
    ctx.font = "10px Helvetica";
    ctx.lineWidth = 1;
}

function keyDownHandler(e) {
    switch(e.keyCode) {
        case 37:
            var position = myPosition.X + gridWidth/2 - myRadius;
            if (position > 0) {
                var nextMove = Math.min(stepSize, position);
                socket.emit('move', {direction: 'left', distance: nextMove});
            }
            break;
        case 38:
            var position = myPosition.Y + gridHeight/2 - myRadius;
            if (position > 0) {
                var nextMove = Math.min(stepSize, position);
                socket.emit('move', {direction: 'up', distance: nextMove});
            }
            break;
        case 39: 
            var position = myPosition.X + gridWidth/2 + myRadius;
            if (position < gridWidth) {
                var nextMove = Math.min(stepSize, gridWidth - position);
                socket.emit('move', {direction: 'right', distance: nextMove});
            }
            break;
        case 40:
            var position = myPosition.Y + gridHeight/2 + myRadius;
            if (position < gridHeight) {
                var nextMove = Math.min(stepSize, gridHeight - position);
                socket.emit('move', {direction: 'down', distance: nextMove});
            }
            break;
        default:
            break;
    }
}

function handleTick(data) {
    var myPlayer = data.find(x => x.socketID == mySocketID);

    myPosition = {X: myPlayer.positionX, Y: myPlayer.positionY};

    var myPositionX = myPlayer.positionX + gridWidth/2;
    var myPositionY = myPlayer.positionY + gridHeight/2;

    worldX = myPositionX - canvas.width/2;
    worldY = myPositionY - canvas.height/2;

    if (worldX < 0) {
        worldX = 0;
    }
    if (worldX > gridWidth - canvas.width) {
        worldX = gridWidth - canvas.width;
    }
    if (worldY < 0) {
        worldY = 0;
    }
    if (worldY > gridHeight - canvas.height) {
        worldY = gridHeight - canvas.height;
    }

    drawGridSection(worldX, worldY, data);
}

function drawGridSection(upperLeftX, upperLeftY, playerList) {
    var xOffset = tileLength - ( upperLeftX % tileLength );
    var yOffset = tileLength - ( upperLeftY % tileLength );

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // vertical lines
    for (var i = xOffset; i < canvas.width + xOffset; i += tileLength) {
        drawLine(i, 0, i, canvas.height);
    }

    // horizontal lines
    for (var i = yOffset; i < canvas.height + yOffset; i += tileLength) {
        drawLine(0, i, canvas.width, i);
    }

    playerList.forEach(p => {
        var posX = p.positionX + gridWidth/2;
        var posY = p.positionY + gridHeight/2;

        if ( upperLeftX <= (posX + myRadius) && (upperLeftX + canvas.width) >= (posX - myRadius) && upperLeftY <= (posY + myRadius) && (upperLeftY + canvas.height) >= (posY - myRadius) ) {
            if (p.socketID == mySocketID) {
                drawMark(posX - upperLeftX, posY - upperLeftY, true);
            } else {
                drawMark(posX - upperLeftX, posY - upperLeftY, false);
            }
        }
    });
}

function drawLine(xStart, yStart, xEnd, yEnd) {
    ctx.strokeStyle = "black";
    ctx.beginPath();
    ctx.moveTo(xStart, yStart);
    ctx.lineTo(xEnd, yEnd);
    ctx.stroke();   
}

function drawMark(positionX, positionY, isMe) {
    if (isMe) {
        ctx.strokeStyle = "red";
        ctx.fillStyle = "red";
    } else {
        ctx.strokeStyle = "black";
        ctx.fillStyle = "black";
    }

    ctx.beginPath();
    ctx.arc(positionX, positionY, myRadius, 0, 2*Math.PI);
    ctx.stroke();
    ctx.fill();
}

init();