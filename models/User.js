const validator = require("validator");
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
    } else if(this.data.password.length > 100) {
        this.errors.push("Password troppo lunga, max 100 caratteri");
    }

}

User.prototype.register = function() {
    // Step 1: Validazione dati
    this.cleanUp();
    this.validate();

    // Step 2: nel caso in cui non ci siano errori
    // salvataggio nel DB
}


module.exports = User;