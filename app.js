const express = require('express');
const app = express();

app.use(express.static('public'));
app.set('views', 'views'); // il primo parametro è obbligatorio views perché parola proprietaria di express; il secondo paremetro è il nome della cartella che abbiamo creato
app.set('view engine', 'ejs');


app.get('/', function(req, res) {
    res.render('home-guest');
});

app.listen(3000);