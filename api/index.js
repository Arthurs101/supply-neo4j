var express = require('express') //llamamos a Express
var bodyParser = require('body-parser');

var app = express()               
const cors = require('cors');
require('dotenv').config();

var port = process.env.PORT || 8080  // establecemos nuestro puerto

const DB = require('./databaseDriver');

// Enable CORS with specific options
app.use(cors({
    origin: 'http://localhost:4200', // Allow requests only from this origin
    methods: 'GET,POST,PUT,DELETE', // Allow only GET and POST requests
    credentials: true // Allow cookies to be sent with the requests
  }));
  


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())

//impor the routes of the moduels
const userR= require('./routes/userR');
const gameR= require('./routes/gamesR');
const storesR= require('./routes/storesR');
const tagsR= require('./routes/tagsR');
const genreR= require('./routes/genreR');
app.use('/user',userR);
app.use('/game',gameR);
app.use('/store',storesR);
app.use('/tag',tagsR);
app.use('/genre',genreR);

app.listen(port)
console.log('API escuchando en el puerto ' + port)