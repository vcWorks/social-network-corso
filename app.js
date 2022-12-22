const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const app = express();

// configurazione della sessione
let sessionOptions = session({
    secret: "Brad è molto polite",
    store: MongoStore.create({
        client: require('./db')
    }),
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24, // vale 1gg
        httpOnly: true
    }
});
//express adesso utilizza la sessione
app.use(sessionOptions);
//messaggi in pagina - chiamati anche messaggi flash
app.use(flash());

app.use(function(req, res, next) {
    //qua rendiamo disponibili le informazioni dell'untente nell'oggetto req
    if(req.session.user) {
        req.visitorId = req.session.user._id;
    }  else {
        req.visitorId = 0;
    }

    // qua rendiamo le informazioni di sessione dell'utente disponibili
    res.locals.user = req.session.user;
    next();
});

const router = require("./router");

app.use(express.urlencoded({extended: false}));
app.use(express.json());

app.use(express.static('public'));
app.set('views', 'views'); // il primo parametro è obbligatorio views perché parola proprietaria di express; il secondo paremetro è il nome della cartella che abbiamo creato
app.set('view engine', 'ejs');


app.use('/', router);

module.exports = app;