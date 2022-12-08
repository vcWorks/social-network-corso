const User = require('../models/User');

exports.login = function(req, res) {
    let user = new User(req.body);
    user.login().then(function(result) {
        req.session.user = {
            username: user.data.usermae
        }
        res.send(result);
    }).catch(function(err) {
        res.send(err);
    });
}


exports.logout = function() {

}


exports.register = function(req, res) {
    let user = new User(req.body);
    user.register();
    if(user.errors.length > 0) {
        res.send(user.errors);
    } else {
        res.send("Tutto ok");
    }
}

exports.home = function(req, res) {
    if(req.session.user) {
        res.send("Benvenuto sul portale!");
    } else {
        res.render('home-guest');
    } 
}


