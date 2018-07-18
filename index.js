var express = require('express');
var socket = require('socket.io');

var fps = 60;
var gameInterval;
var gameStarted = false;
var totalMass = 0,
    initialPlayerRadius = 20,
    initialTokenRadius = 5;
var playerArray = [],
    tokenArray = [];
var gridWidth = 1000, 
    gridHeight = 1000;

// App setup
var app = express();
var server = app.listen(4000, () => {
    console.log('listening to requests on port 4000');
});

// Static files
app.use(express.static('public'));

// Socket setup
var io = socket(server);

io.on('connection', (socket) => {
    console.log('made socket connection', socket.id);
    socket.emit('connected', {socketID: socket.id, gridWidth: gridWidth, gridHeight: gridHeight} );

    if (!gameStarted) {
        console.log("Game loop starting");
        gameStarted = true;
        populateTokens();
        gameInterval = setInterval(Tick, 1000 / fps);
    }

    totalMass += Math.PI * Math.pow(initialPlayerRadius, 2);
    playerArray.push({
        socketID: socket.id,
        xDisplacement: 0,
        yDisplacement: 0,
        radius: initialPlayerRadius
    });

    socket.on('move', (data) => {
        movePlayer(data.direction, data.distance, socket.id);
    });

    socket.on('disconnect', () => {
        console.log('lost socket connection', socket.id);
        for (var i = playerArray.length - 1; i >= 0; --i) {
            if (playerArray[i].socketID == socket.id) {
                totalMass -= Math.PI * Math.pow(playerArray[i].radius, 2);
                playerArray.splice(i, 1);
            }
        }

        if (playerArray.length == 0) {
            console.log("Game loop ended");
            clearInterval(gameInterval);
            gameStarted = false;
            totalMass = 0;
        }
    });
});

// Game loop
function Tick() {
    checkForCollectedTokens();
    io.sockets.emit('tick', {
        playerArray: playerArray, 
        tokenArray: tokenArray
    });
}

function movePlayer(direction, distance, socketID) {
    var playerIndex = playerArray.findIndex(x => x.socketID == socketID);
    var playerMass = Math.PI * Math.pow(playerArray[playerIndex].radius, 2);
    var moveSpeed = distance - ( distance * ( playerMass / totalMass ) );

    switch (direction) {
        case 'left':
            playerArray[playerIndex].xDisplacement -= moveSpeed;
            break;
        case 'up':
            playerArray[playerIndex].yDisplacement -= moveSpeed;
            break;
        case 'right':
            playerArray[playerIndex].xDisplacement += moveSpeed;
            break;
        case 'down':
            playerArray[playerIndex].yDisplacement += moveSpeed;
            break;
        default:
            break;
    }
}

function populateTokens() {
    tokenArray = [];
    var minTokens = 250;
    var maxTokens = 500;
    var numberOfTokens = Math.floor(Math.random() * (maxTokens - minTokens)) + minTokens;
    totalMass += numberOfTokens * (Math.PI * Math.pow(initialTokenRadius, 2));
    for (var i = 0; i < numberOfTokens; i++) {
        tokenArray.push({
            xPosition: Math.floor(Math.random() * gridWidth),
            yPosition: Math.floor(Math.random() * gridHeight),
            radius: initialTokenRadius
        });
    }
}

function checkForCollectedTokens() {
    for (var i = playerArray.length - 1; i >= 0; --i) {
        var tokensToSplice = [];
        for (var j = 0; j < tokenArray.length; j ++) {
            var playerX = playerArray[i].xDisplacement + gridWidth/2;
            var playerY = playerArray[i].yDisplacement + gridHeight/2;
            var distance = distanceBetween(playerX, playerY, tokenArray[j].xPosition, tokenArray[j].yPosition);
            if (distance + tokenArray[j].radius <= playerArray[i].radius) {
                tokensToSplice.push(j);
                playerArray[i].radius = getNewRadius(playerArray[i].radius, tokenArray[j].radius);
            }
        }
        tokensToSplice.forEach(i => tokenArray.splice(i, 1));
    }
}

function distanceBetween(xOne, yOne, xTwo, yTwo) {
    return Math.pow(Math.pow((xTwo - xOne), 2) + Math.pow((yTwo - yOne), 2), 0.5);
}

function getNewRadius(oldRadius, radiusOfCapture) {
    var oldArea = Math.PI * Math.pow(oldRadius, 2);
    var additionalArea = Math.PI * Math.pow(radiusOfCapture, 2);
    var newArea = oldArea + additionalArea;
    var newRadius = Math.pow((newArea / Math.PI), 0.5);
    return newRadius;
}