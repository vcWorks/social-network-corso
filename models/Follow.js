const usersCollection = require("../db").db().collection("users");
const followsCollection = require("../db").db().collection("follows");
const ObjectId = require("mongodb").ObjectId;
const User = require("./User");

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

Follow.getFollowersById = async function(id) {
    return new Promise( async (resolve, reject) => {
        try {
            let followers = await followsCollection.aggregate( [
                {
                    $match: {followedId: id}
                },
                {
                    $lookup: {from: "users", localField: "authorId", foreignField: "_id", as: "userDoc"}
                },
                {
                    $project: {
                        username: {$arrayElemAt: ["$userDoc.username", 0]},
                        email: {$arrayElemAt: ["$userDoc.email", 0]}
                    }
                }   
            ]).toArray();
            followers = followers.map(function(follower) {
                let user = new User(follower, true)
                return {username: follower.username, avatar: user.avatar}
            });
            resolve(followers);
        } catch {
            reject();
        }
        
    });
}

Follow.getFollowingById = async function(id) {
    return new Promise( async (resolve, reject) => {
        try {
            let following = await followsCollection.aggregate( [
                {
                    $match: {authorId: id}
                },
                {
                    $lookup: {from: "users", localField: "followedId", foreignField: "_id", as: "userDoc"}
                },
                {
                    $project: {
                        username: {$arrayElemAt: ["$userDoc.username", 0]},
                        email: {$arrayElemAt: ["$userDoc.email", 0]}
                    }
                }   
            ]).toArray();
            following = following.map(function(follower) {
                let user = new User(follower, true)
                return {username: follower.username, avatar: user.avatar}
            });
            resolve(following);
        } catch {
            reject();
        }
        
    });
}

Follow.countFollowersById = function(id) {
    return new Promise( async (resolve, reject) => {
        let followerCount = await followsCollection.countDocuments({
            followedId: id
        });
        resolve(followerCount);
    });
}

Follow.countFollowingById = function(id) {
    return new Promise( async (resolve, reject) => {
        let followingCount = await followsCollection.countDocuments({
            authorId: id
        });
        resolve(followingCount);
    });
}

module.exports = Follow;