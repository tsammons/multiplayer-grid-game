var express = require('express');
var socket = require('socket.io');

var gameInterval;
var gameStarted = false;
var playerArray = [];

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
    socket.emit('connected', socket.id);

    if (!gameStarted) {
        console.log("Game loop starting");
        gameStarted = true;
        gameInterval = setInterval(Tick, 20);
    }

    playerArray.push({
        socketID: socket.id,
        positionX: 0,
        positionY: 0
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
    io.sockets.emit('tick', playerArray);
}

function movePlayer(direction, distance, socketID) {
    switch (direction) {
        case 'left':
            playerArray.find(x => x.socketID == socketID).positionX -= distance;
            break;
        case 'up':
            playerArray.find(x => x.socketID == socketID).positionY -= distance;
            break;
        case 'right':
            playerArray.find(x => x.socketID == socketID).positionX += distance;
            break;
        case 'down':
            playerArray.find(x => x.socketID == socketID).positionY += distance;
            break;
        default:
            break;
    }
}