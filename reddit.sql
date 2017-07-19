DROP DATABASE IF EXISTS reddit;

CREATE DATABASE reddit;

use reddit;
-- This creates the users table. The username field is constrained to unique
-- values only, by using a UNIQUE KEY on that column
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  password VARCHAR(60) NOT NULL, -- why 60??? ASk me :) (recall we are encrypting our passwords and bcrypt usually needs ~60 chars)
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  UNIQUE KEY username (username)
);

-- This creates the posts table. The userId column references the id column of
-- users. If a user is deleted, the corresponding posts' userIds will be set NULL.
CREATE TABLE posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR (2000) DEFAULT NULL,
  url VARCHAR(2000) DEFAULT NULL,
  userId INT DEFAULT NULL,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  KEY userId (userId), -- why did we add this here? ASk me :) (the 'KEY' keyword indexes by this column allowing efficienct searching)
  CONSTRAINT validUser FOREIGN KEY (userId) REFERENCES users (id) ON DELETE SET NULL
);

/* This creates the subreddits table. The first step will be to create a subreddits table. Each subreddit should have a unique, auto incrementing id
that is also the primary key, a name anywhere from 1 to 30 characters, and an optional description of up to 200 characters.
Each sub should also have createdAt and updatedAt DATETIME fields. To guarantee the integrity of our data,
we should make sure that the name column is unique by using a UNIQUE INDEX. There should never be two subreddits with the same name. */
CREATE TABLE subreddits (
   id INT AUTO_INCREMENT PRIMARY KEY,
   name VARCHAR(30) NOT NULL,
   description VARCHAR(200) DEFAULT NULL,
   createdAt DATETIME NOT NULL,
   updatedAt DATETIME NOT NULL,
   UNIQUE INDEX nameIndex (name)
);

-- CREATE UNIQUE INDEX nameIndex ON subreddits (name);

/*
Add a subredditId column to the posts table, because now each post will be related to a subreddit. Write an ALTER TABLE query that will add a subredditId
INT column to the posts table, AS well AS a foreign key constraining its values to valid ids in the subreddits table you just created.
 */
ALTER TABLE posts ADD subredditId INT, ADD FOREIGN KEY (subredditId) REFERENCES subreddits(id); --TODO: Should we add ON DELETE CASCADE here?

CREATE TABLE votes (
  userId INT,
  postId INT,
  voteDirection TINYINT,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  PRIMARY KEY (userId, postId), -- this is called a composite key because it spans multiple columns. the combination userId/postId must be unique and uniquely identifies each row of this table.
  KEY userId (userId), -- this is required for the foreign key
  KEY postId (postId), -- this is required for the foreign key
  FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE, -- CASCADE means also delete the votes when a user is deleted
  FOREIGN KEY (postId) REFERENCES posts (id) ON DELETE CASCADE -- CASCADE means also delete the votes when a post is deleted
);

-- NOTE: beloe is needed to include emoji titles which use a slightly different character encoding
alter database reddit character set utf8mb4 collate utf8mb4_unicode_ci; -- will still need to change tables that were created before
alter table db_name.table_name convert to character set utf8mb4 collate utf8mb4_unicode_ci;
alter table reddit.posts convert to character set utf8mb4 collate utf8mb4_unicode_ci;
alter table reddit.votes convert to character set utf8mb4 collate utf8mb4_unicode_ci;
alter table reddit.subreddits convert to character set utf8mb4 collate utf8mb4_unicode_ci;
