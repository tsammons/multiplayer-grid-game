var express = require('express');
var socket = require('socket.io');

var gameInterval;
var gameStarted = false;
var playerArray = [];
var tokenArray = [];
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
        gameInterval = setInterval(Tick, 20);
    }

    playerArray.push({
        socketID: socket.id,
        xDisplacement: 0,
        yDisplacement: 0,
        radius: 20
    });

    socket.on('move', (data) => {
        movePlayer(data.direction, data.distance, socket.id);
    });

    socket.on('disconnect', () => {
        console.log('lost socket connection', socket.id);
        for (var i = playerArray.length - 1; i >= 0; --i) {
            if (playerArray[i].socketID == socket.id) {
                playerArray.splice(i, 1);
            }
        }

        if (playerArray.length == 0) {
            console.log("Game loop ended");
            clearInterval(gameInterval);
            gameStarted = false;
        }
    });
});

// Game loop
function Tick() {
    io.sockets.emit('tick', {
        playerArray: playerArray, 
        tokenArray: tokenArray
    });
}

function movePlayer(direction, distance, socketID) {
    switch (direction) {
        case 'left':
            playerArray.find(x => x.socketID == socketID).xDisplacement -= distance;
            break;
        case 'up':
            playerArray.find(x => x.socketID == socketID).yDisplacement -= distance;
            break;
        case 'right':
            playerArray.find(x => x.socketID == socketID).xDisplacement += distance;
            break;
        case 'down':
            playerArray.find(x => x.socketID == socketID).yDisplacement += distance;
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
    for (var i = 0; i < numberOfTokens; i++) {
        tokenArray.push({
            xPosition: Math.floor(Math.random() * gridWidth),
            yPosition: Math.floor(Math.random() * gridHeight),
            radius: 5
        });
    }
}