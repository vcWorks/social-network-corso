const express = require('express');
const session = require('express-session');
const app = express();

// configurazione della sessione
let sessionOptions = session({
    secret: "Brad è molto polite",
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24, // vale 1gg
        httpOnly: true
    }
});
//express adesso utilizza la sessione
app.use(sessionOptions);

const router = require("./router");

app.use(express.urlencoded({extended: false}));
app.use(express.json());

app.use(express.static('public'));
app.set('views', 'views'); // il primo parametro è obbligatorio views perché parola proprietaria di express; il secondo paremetro è il nome della cartella che abbiamo creato
app.set('view engine', 'ejs');


app.use('/', router);

module.exports = app;