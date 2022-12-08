const usersCollection = require("../db").db().collection("users");
const validator = require("validator");
const bcrypt = require("bcryptjs");
let User = function(data) {
    this.data = data;
    this.errors = [];
}

User.prototype.cleanUp = function() {
    if(typeof(this.data.username) != "string") {
        this.data.username = '';
    }
    if(typeof(this.data.email) != "string") {
        this.data.email = '';
    }
    if(typeof(this.data.password) != "string") {
        this.data.password = '';
    }

    // riscrivo l'oggetto che mi aspetto per eliminare qualsiasi elemento non utile o inserito in modo malevolo
    this.data = {
        username: this.data.username.trim().toLowerCase(),
        email: this.data.email.trim().toLowerCase(),
        password: this.data.password
    }
}

User.prototype.validate = function() {
    //username
    if(this.data.username == '') {
        this.errors.push("Devi inserire un username.");
    }else {
        if(!validator.isAlphanumeric(this.data.username)) {
            this.errors.push("L'username può contenere solo lettere e numeri");
        }
        if(this.data.username.length > 0 && this.data.username.length < 3) {
            this.errors.push("username minima da 3 caratteri");
        } else if(this.data.username.length > 30) {
            this.errors.push("Username troppo lunga, max 30 caratteri");
        }
    }
    //mail
    if(!validator.isEmail(this.data.email)) {
        this.errors.push("Devi inserire una email valida.");
    }
    //password
    if(this.data.password == '') {
        this.errors.push("Devi inserire una password.");
    }else if(this.data.password.length > 0 && this.data.password.length < 12) {
        this.errors.push("Password minima da 12 caratteri");
    } else if(this.data.password.length > 50) {
        this.errors.push("Password troppo lunga, max 50 caratteri");
    }

}

User.prototype.login = function() {
    return new Promise((resolve, reject) => {
        this.cleanUp();
        usersCollection.findOne({username: this.data.username}).then((attemptedUser) => {
            if(attemptedUser && bcrypt.compareSync(this.data.password, attemptedUser.password)) {
                resolve("ottimo!");
            } else {
                reject("dati scorretti");
            }
        }).catch(function() {
            reject("Riprova più tardi");
        });
    });
}

User.prototype.register = function() {
    // Step 1: Validazione dati
    this.cleanUp();
    this.validate();

    // Step 2: nel caso in cui non ci siano errori salviamo i dati nel DB
    if(!this.errors.length) {
        //hash password dell'utente
        let salt = bcrypt.genSaltSync(10);
        this.data.password = bcrypt.hashSync(this.data.password, salt);
        usersCollection.insertOne(this.data);
    }

}


module.exports = User;