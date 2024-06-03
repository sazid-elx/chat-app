const express = require("express");
const socket = require("socket.io");
const http = require("http");
const path = require("path");
const app = express();
const server = http.createServer(app);
const io = socket(server);
const formatMessage = require('./utils/messages');
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users');

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
    socket.on('joinRoom', ({ username, room }) => {
        const user = userJoin(socket.id, username, room);
        socket.join(user.room);

        // Welcome current user
        socket.emit('message', formatMessage('Admin', 'Welcome to the chat'));

        // Broadcast when a user connects
        socket.broadcast.to(user.room).emit('message', formatMessage('Admin', `${user.username} has joined the chat`));

        // Listen for chatMessage
        socket.on('chatMessage', (msg) => {
            const user = getCurrentUser(socket.id);
            io.to(user.room).emit('chatMessage', formatMessage(user.username, msg));
        });

        // Runs when client disconnects
        socket.on('disconnect', () => {
            const user = userLeave(socket.id);
            if (user) {
                io.to(user.room).emit('message', formatMessage('Admin', `${user.username} has left the chat`));
            }
        });
    });
});

const port = 8000;
server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
