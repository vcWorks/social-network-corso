const User = require('../models/User');

exports.login = function() {
    
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
    res.render('home-guest');
}


