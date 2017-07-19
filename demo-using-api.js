// load the mysql library
var mysql = require('promise-mysql');

// create a connection to our Cloud9 server
var connection = mysql.createPool({
    host     : 'localhost',
    user     : 'root', // CHANGE THIS :)
    password : 'root',
    database: 'reddit',
    connectionLimit: 10
});

// load our API and pass it the connection
var RedditAPI = require('./reddit');

var myReddit = new RedditAPI(connection);

// We call this function to create a new user to test our API
// The function will return the newly created user's ID in the callback
myReddit.createUser({
    username: 'PM_ME_DOGGIFS',
    password: 'abc123'
})
    .then(newUserId => {
        // Now that we have a user ID, we can use it to create a new post
        // Each post should be associated with a user ID
        console.log('New user created! ID=' + newUserId);

        return myReddit.createPost({
            title: 'Hi Reddit! My first post',
            url: 'http://www.digg.ca',
            userId: newUserId,
            subredditId : 3
        });
    })
    .then(newPostId => {
        // If we reach that part of the code, then we have a new post. We can print the ID
        console.log('New post created! ID=' + newPostId);
    })
    .catch(error => {
        console.log(error.stack);
    });



// myReddit.getAllPosts().then(console.log)
// .catch(err => {
//    console.log("error !" + err);
//    return err;
// });
// myReddit.createSubreddit({ name : "windsor", description : "wds stuff"})
// .then( newSubredditID => { console.log( "new subreddit! ID is" + newSubredditID ); }); //works, checked in mySQL server
// myReddit.getAllSubreddits()
// .then(console.log); //works
// myReddit.createVote({ postId: 2, userId: 3, voteDirection: 1});
// myReddit.createVote({ postId: 33, userId: 21, voteDirection: -1}); //NB: updating works! with udpated timestamp and voteDirection!
// myReddit.createVote({ postId: 34, userId: 3, voteDirection: 1});
