var express = require('express') //llamamos a Express
var bodyParser = require('body-parser');

var app = express()               
const cors = require('cors');
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

app.listen(port)
console.log('API escuchando en el puerto ' + port)