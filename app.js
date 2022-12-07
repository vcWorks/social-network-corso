const express = require('express');
const app = express();
const router = require("./router");

app.use(express.urlencoded({extended: false}));
app.use(express.json());

app.use(express.static('public'));
app.set('views', 'views'); // il primo parametro è obbligatorio views perché parola proprietaria di express; il secondo paremetro è il nome della cartella che abbiamo creato
app.set('view engine', 'ejs');


app.use('/', router);

app.listen(3000);