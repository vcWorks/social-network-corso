const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const markdown = require('marked');
const app = express();
const sanitizeHTML = require("sanitize-html");

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
    //markdown disponibile per tutti i template
    res.locals.filterUserHTML = function(content) {
        return sanitizeHTML(markdown.parse(content), {
            allowedTags: ["p", "br", "ul", "li", "strong", "bold", "i", "h1", "h2", "h3", "h4", "h5", "h6", "em"],
            allowedAttributes: []
        });
    }

    //rendiamo disponibili tutti i messaggi flash base disponibili per ogni template, così da non richiamarli ogni volta che si fa render
    res.locals.errors = req.flash('errors');
    res.locals.success = req.flash('success');

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

const server = require('http').createServer(app);
const io = require("socket.io")(server);

io.use(function(socket, next) {
    sessionOptions(socket.request, socket.request.res, next);
});

io.on("connection", function(socket) {
    if(socket.request.session.user) {
        let user = socket.request.session.user;
        socket.emit("welcome", {
            username: user.username,
            avatar: user.avatar
        });
        socket.on("chatMessageFromBrowser", function(data) {
            socket.broadcast.emit("chatMessageFromServer", {
                message: sanitizeHTML(data.message, {allowedTags: [], allowedAttributes: []}),
                username: user.username,
                avatar: user.avatar
            });
        });
    }
});

module.exports = server;