const usersCollection = require("../db").db().collection("users");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const md5 = require("md5");

class User {
    constructor(data, getAvatar = false) {
        this.data = data;
        this.errors = [];
        if(getAvatar) {
            this.getAvatar();
        }
    }

    cleanUp() {
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


    validate() {
        return new Promise(async (resolve, reject) => {
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
                    if(this.data.username.length > 2 && this.data.username.length < 31 && validator.isAlphanumeric(this.data.username)) {
                        let usernameExists = await usersCollection.findOne({username: this.data.username});
                        if(usernameExists){
                            this.errors.push("username già utilizzato");
                        }
                    }
                }
                //mail
                if(!validator.isEmail(this.data.email)) {
                    this.errors.push("Devi inserire una email valida.");
                } else {
                    let emailExists = await usersCollection.findOne({email: this.data.email});
                    if(emailExists){
                        this.errors.push("email già utilizzata");
                    }
                }
                //password
                if(this.data.password == '') {
                    this.errors.push("Devi inserire una password.");
                }else if(this.data.password.length > 0 && this.data.password.length < 12) {
                    this.errors.push("Password minima da 12 caratteri");
                } else if(this.data.password.length > 50) {
                    this.errors.push("Password troppo lunga, max 50 caratteri");
                }
                resolve();
            }
        )
    }

    login() {
        return new Promise((resolve, reject) => {
            this.cleanUp();
            usersCollection.findOne({username: this.data.username}).then((attemptedUser) => {
                if(attemptedUser && bcrypt.compareSync(this.data.password, attemptedUser.password)) {
                    this.data = attemptedUser;
                    this.getAvatar();
                    resolve("ottimo!");
                } else {
                    reject("dati scorretti");
                }
            }).catch(function() {
                reject("Riprova più tardi");
            });
        });
    }
    
    register() {
        return new Promise(async (resolve, reject) => {
                // Step 1: Validazione dati
                this.cleanUp();
                await this.validate();
            
                // Step 2: nel caso in cui non ci siano errori salviamo i dati nel DB
                if(!this.errors.length) {
                    //hash password dell'utente
                    let salt = bcrypt.genSaltSync(10);
                    this.data.password = bcrypt.hashSync(this.data.password, salt);
                    await usersCollection.insertOne(this.data);
                    this.getAvatar();
                    resolve();
                } else {
                    reject(this.errors);
                }
            
            }
        )
    }
    
    getAvatar() {
        this.avatar = `https://gravatar.com/avatar/${md5(this.data.email)}?s=128`;
    }

}

User.findByUsername = function(username) {
    return new Promise(function(resolve, reject) {
        if(typeof(username) != "string") {
            reject();
            return;
        }
        usersCollection.findOne({
            username: username
        }).then(function(userDoc) {
            if(userDoc) {
                userDoc = new User(userDoc, true);
                userDoc = {
                    _id: userDoc.data._id,
                    username: userDoc.data.username,
                    avatar: userDoc.avatar,
                    email: userDoc.data.email
                };
                resolve(userDoc);
            } else {
                reject();
            }
        }).catch(function() {
            reject();
        });
    });
}

User.doesEmailExist = function(email) {
    return new Promise(async function(resolve, reject) {
        if(typeof(email) != "string") {
            resolve(false);
            return;
        }
        let user = await usersCollection.findOne({ email: email });
        if(user) {
            resolve(true);
        } else {
            resolve(false);
        }
    });
}

module.exports = User;
