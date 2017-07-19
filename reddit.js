var bcrypt = require('bcrypt-as-promised');
var HASH_ROUNDS = 10; //TODO: Should I close db connection each call?

class RedditAPI {
   constructor(conn) {
      this.conn = conn;
   }

   createUser(user) {
      /*
      first we have to hash the password. we will learn about hashing next week.
      the goal of hashing is to store a digested version of the password from which
      it is infeasible to recover the original password, but which can still be used
      to assess with great confidence whether a provided password is the correct one or not
       */
      return bcrypt.hash(user.password, HASH_ROUNDS)
         .then(hashedPassword => {
            return this.conn.query('INSERT INTO users (username,password, createdAt, updatedAt) VALUES (?, ?, NOW(), NOW())', [user.username, hashedPassword]);
         })
         .then(result => {
            return result.insertId;
         })
         .catch(error => {
            // Special error handling for duplicate entry
            if (error.code === 'ER_DUP_ENTRY') {
               throw new Error('A user with this username already exists');
            } else {
               throw error;
            }
         });
   }

   createPost(post) {

      if (!post.subredditId) {
         throw new Error("Post object does not have subreddit ID (i.e. where are you posting?)") //TODO: ask if to 'throw' or 'return'
      }

      return this.conn.query(
            `
            INSERT INTO posts (userId, title, url, createdAt, updatedAt, subredditId)
            VALUES (?, ?, ?, NOW(), NOW(), ?)
            `, [post.userId, post.title, post.url, post.subredditId]
         )
         .then(result => {
            return result.insertId;
         });
   }

   getAllPosts() {
      /*
      strings delimited with ` are an ES2015 feature called "template strings".
      they are more powerful than what we are using them for here. one feature of
      template strings is that you can write them on multiple lines. if you try to
      skip a line in a single- or double-quoted string, you would get a syntax error.

      therefore template strings make it very easy to write SQL queries that span multiple
      lines without having to manually split the string line by line.
       */
      return this.conn.query( //NB: Since there are some shared column names in the below query if we do NOT use an alias it will NOT show in the terminal but it will in the SQL shell
            `
            SELECT posts.id AS postsID, posts.title AS title, posts.url AS url, posts.createdAt AS postsCreatedAt, posts.updatedAt AS postsUpdatedAt, users.id AS usersID, users.username AS usersUsername, users.createdAt AS usersCreatedAt, users.updatedAt AS usersUpdatedAt, subreddits.id AS subredditID, subreddits.name AS subredditName, subreddits.description AS subredditsDesc, subreddits.createdAt AS subredditsCreatedAt, subreddits.updatedAt AS subredditsUpdatedAt, COALESCE(SUM(votes.voteDirection), 0) AS voteScore
            FROM posts
            JOIN users ON posts.userId = users.id
            JOIN subreddits ON posts.subredditId = subreddits.id
            LEFT JOIN votes ON votes.postId = posts.id
            GROUP BY postsID
            ORDER BY voteScore DESC
            LIMIT 25;
            `
         )
         .then(result => {
            var returnArray = result.map((rowObject) => { //NB: essentially this is kind of like a foreach loop instead of assigning this mapping to another variable
               // NOTE: BE VERY VERY careful when using caps or lower case when accessing property fields!! Fields are case sensitive!
               // rowObjec.user = {};
               // var stringCheck = "users";
               //
               // for (var propKey in rowObject) { //NOTE: METHOD 1 - iterate over each object property to check if substring matches our alias we gave to users table
               //    var truncatedKey = propKey.substr(0, (stringCheck.length));
               //    if (truncatedKey === stringCheck) { //could also use propKey.matches(REGEX)
               //       rowObject["user"][propKey] = rowObject[propKey];
               //       delete rowObject[propKey];
               //    }
               // }

               // rowObject.user.id = rowObject.usersID; //NOTE: METHOD 2 - just manually assign and delete the properties
               // rowObject.user.username = rowObject.usersUsername;
               // rowObject.user.createdAt = rowObject.usersCreatedAt;
               // rowObject.user.updatedAt = rowObject.usersUpdatedAt;
               // //delete the now assigned properties
               // delete rowObject.usersCreatedAt;
               // delete rowObject.usersUpdatedAt;
               // delete rowObject.usersID;
               // delete rowObject.Usersname;
               //
               // NB: Third way without mutating passed in object

               return {
                  postsID: rowObject.postsID,
                  title: rowObject.title,
                  url: rowObject.url,
                  CreatedAt: rowObject.postsCreatedAt,
                  UpdatedAt: rowObject.postsUpdatedAt,
                  voteScore: rowObject.voteScore,
                  user: {
                     id: rowObject.usersID,
                     username: rowObject.usersUsername,
                     createdAt: rowObject.usersCreatedAt,
                     updatedAt: rowObject.usersUpdatedAt
                  },
                  subreddit : {
                     id : rowObject.subredditID,
                     name : rowObject.subredditName,
                     description : rowObject.subredditsDesc,
                     createdAt : rowObject.subredditsCreatedAt,
                     updatedAt : rowObject.subredditsUpdatedAt
                  }
               };

            });

            return returnArray;

         });
   }

   createSubreddit(subreddit) {
      if (!subreddit.name) {
         throw new Error("your subreddit object does not have the proper name property!");
      }
      return this.conn.query(`
      INSERT INTO subreddits (name, description, createdAt, updatedAt)
      VALUES (?, ?, NOW(), NOW())
      `, [subreddit.name, subreddit.description])
         .then(result => {
            return result.insertId;
         })
         .catch(error => {
            if (error.code === 'ER_DUP_ENTRY') {
               throw new Error('A subreddit with this name already exists, join it or use another name!');
            } else {
               throw error;
            }
         });
   }

   getAllSubreddits() {
      return this.conn.query( // we use DESC as newer ones have the most 'value'
            `
         SELECT * FROM subreddits ORDER BY createdAt DESC
         `
         )
         .then(result => {
            return result;
         });
   }

   createVote(vote) { //TODO: Make a throw error if vote object does not have postId, userId?
      if (! (vote.voteDirection === 0 || vote.voteDirection === 1 || vote.voteDirection === -1 ) ) {
         throw new Error("Vote direction is NOT 1, -1 or 0");
      }

      return this.conn.query(`
      INSERT INTO votes SET postId=?, userId=?, voteDirection=?, createdAt = NOW(), updatedAt = NOW() ON DUPLICATE KEY UPDATE voteDirection=?, updatedAt=NOW();
      `, [ vote.postId, vote.userId, vote.voteDirection, vote.voteDirection ]) // NOTE we have updatedAt to be on duplicate key updated as NOW() which has been tested to be working
      .then( result => {
         return result.insertId;
      });

   }

}

module.exports = RedditAPI;
