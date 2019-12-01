const args = require('yargs').argv;

global.createjs = require('./js/DummyCreateJS.js');
global.Menu = require('./js/Menu');

const gInputEngine = require('./js/InputEngine');
const gGameEngine = require('./js/GameEngine');

gGameEngine.load()

const express = require('express')
var bodyParser = require("body-parser");

const app = express()
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/observation', (req, res) => {
    gGameEngine._observation();
    res.end('observation')
})
app.post('/step', (req, res) => {
    console.log(req.body);
    gGameEngine._step(req.body.actions);
    res.end('step')
})
app.post('/reset', (req, res) => {
    gGameEngine._reset();
    res.end('reset')
})


var port = (args.port ? args.port : 3000)
app.listen(port, () => console.log(`Server running on port http://localhost:${port}`))
