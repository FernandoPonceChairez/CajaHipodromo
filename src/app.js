const express = require('express');
///////Edú
const path = require('path');
const mime = require('mime');
const tailwindcss = require('tailwindcss');
const postcss = require('postcss');
const hbs = require('hbs');
/////////////
const myconnection = require('express-myconnection');
const mysql = require('mysql');
const session = require('express-session');
const bodyParser = require('body-parser');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const loginRoutes = require('./routes/login');

app.set('port', 3000);

//Utilizar hbs como engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
/////////////////////////////

//Tailwind
const tailwindConfig = require('../tailwind.config.js');
const compiledStyles = postcss([tailwindcss(tailwindConfig)]).process('@tailwind base; @tailwind components; @tailwind utilities;').css;
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
//////////


hbs.registerPartials(__dirname + '/views/partials');

//Cargar la hoja de estilos en formato text/css
app.use(express.static('public'));
app.get('/public/styles/styles.css', (req, res) => {
  res.type('text/css');
  res.sendFile(__dirname + '/public/styles/styles.css');
});

////Modifiqué la contra para que funcionara en mi base de datos, modifica eso y también la configuración de config.js
app.use(myconnection(mysql, {
  host: '127.0.0.1',
  user: 'root',
  password: '1234',
  port: 3306,
  database: 'hipodromo2'
}));

app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true
}));

server.listen(app.get('port'), () => {
  console.log('Listening on port ', app.get('port'));
});

app.use('/', loginRoutes);

app.get('/', (req, res) => {
  if (req.session.loggedin == true) {
    res.render('home', { name: req.session.name, role1: req.session.role1, role2: req.session.role2,role3: req.session.role3, email: req.session.email});
  } else {
    res.redirect('/login');
  }
});

// Socket.IO integration for chat
io.on('connection', (socket) => {
  console.log('A user connected');

  // Listen for joining the chat
  socket.on('join', (username) => {
    console.log(username + ' joined the chat');
    socket.username = username; // Store the username in the socket object
    io.emit('userJoined', username);
  });

  // Listen for leaving the chat
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });

  // Listen for chat messages from the client
  socket.on('message', (message) => {
    console.log('Message received:', message);
    // Broadcast the message to all connected clients
    io.emit('message', { username: socket.username, text: message });
  });
});


// Loan estimator route