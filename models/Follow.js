const usersCollection = require("../db").db().collection("users");
const followsCollection = require("../db").db().collection("follows");
const ObjectId = require("mongodb").ObjectId;

class Follow {
    constructor(followedUsername, authorId) {
        this.followedUsername = followedUsername;
        this.authorId = authorId;
        this.followedId;
        this.errors = [];
    }


    cleanUp() {
        if(typeof(this.followedUsername) != "string") {
            this.followedUsername = '';
        }
    }

    async validate(action) {
        //controllo nel DB l'username da seguire se esiste
        let followedAccount = await usersCollection.findOne({
            username: this.followedUsername
        });
        if(followedAccount) {
            this.followedId = followedAccount._id;
        } else {
            this.errors.push("il nome utente selezionato non esiste");
        }

        let doesFollowAlreadyExist = await followsCollection.findOne({
            followedId: this.followedId, authorId: new ObjectId(this.authorId)
        });
        if(action == "create") {
            if(doesFollowAlreadyExist) {
                this.errors.push("Segui già questa creatura");
            }
        }
        if(action == "delete") {
            if(!doesFollowAlreadyExist) {
                this.errors.push("Già non segui questa creatura");
            }
        }
        // controllo per non seguirsi
        if(this.followedId.equals(this.authorId)) {
            this.errors.push("Non ti puoi seguire da solo");
        }
    }

    create() {
        return new Promise( async (resolve, reject) => {
            this.cleanUp();
            await this.validate("create");
            if(!this.errors.length) {
                await followsCollection.insertOne({
                    followedId: this.followedId,
                    authorId: new ObjectId(this.authorId)
                });
                resolve();
            } else {
                reject(this.errors);
            }
        });
    }

    delete() {
        return new Promise( async (resolve, reject) => {
            this.cleanUp();
            await this.validate("delete");
            if(!this.errors.length) {
                await followsCollection.deleteOne({
                    followedId: this.followedId,
                    authorId: new ObjectId(this.authorId)
                });
                resolve();
            } else {
                reject(this.errors);
            }
        });
    }
}

Follow.isVisitorFollowing = async function(followedId, visitorId) {
    let followDoc = await followsCollection.findOne({
        followedId: followedId,
        authorId: new ObjectId(visitorId)
    });
    if(followDoc) {
        return true;
    } else {
        return false;
    }
}

module.exports = Follow;