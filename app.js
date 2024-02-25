const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const databasePath = path.join(__dirname, 'twitterClone.db')

const app = express()

app.use(express.json())

let database = null

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database
    })

    app.listen(3000, () =>
      console.log('Server Running at http://localhost:3000/'),
    )
  } catch (error) {
    console.log(`DB Error: ${error.message}`)
    process.exit(1)
  }
}

initializeDbAndServer()

const convertUserDbObjectToResponseObject = dbObject => {
  return {
    userName: dbObject.user_name,
    tweet: dbObject.tweet,
    dateTime: dbObject.date_Time
  }
}

const convertFollowerDbObjectToResponseObject = dbObject => {
  return {
    followerId: dbObject.follower_id,
    followerUserId: dbObject.follower_user_id,
    followingUserId: dbObject.following_user_id
  }
}

const convertTweetDbObjectToResponseObject = dbObject => {
  return {
    tweetId: dbObject.tweet_id,
    tweet: dbObject.tweet,
    userId: dbObject.user_id,
    dateTime: dbObject.date_time
  }
}

const convertReplyDbObjectToResponseObject = dbObject => {
  return {
    replyId: dbObject.reply_id,
    tweetId: dbObject.tweet_id,
    reply: dbObject.reply,
    userId: dbObject.user_id,
    dateTime: dbObject.date_time
  }
}

const convertLikeDbObjectToResponseObject = dbObject => {
  return {
    likeId: dbObject.like_id,
    tweetId: dbObject.tweet_id,
    userId: dbObject.user_id,
    dateTime: dbObject.dateTime
  }
}
const validatePassword = password => {
  return password.length > 5
}

app.post('/register/', async (request, response) => {
  const {username, name, password, gender} = request.body
  const hashedPassword = await bcrypt.hash(password, 10)
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`
  const databaseUser = await database.get(selectUserQuery)

  if (databaseUser === undefined) {
    const createUserQuery = `
     INSERT INTO
      user (username, name, password, gender)
     VALUES
      (
       '${username}',
       '${name}',
       '${hashedPassword}',
       '${gender}'
      );`
    if (validatePassword(password)) {
      await database.run(createUserQuery)
      response.status(200)
      response.send('User created successfully')
    } else {
      response.status(400)
      response.send('Password is too short')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

app.post('/login/', async (request, response) => {
  const {username, password} = request.body
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`
  const databaseUser = await database.get(selectUserQuery)

  if (databaseUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordMatched = await bcrypt.compare(
      password,
      databaseUser.password,
    )
    if (isPasswordMatched === true) {
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

function authenticateToken(request, response, next) {
  let jwtToken
  const authHeader = request.headers['authorization']
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(' ')[1]
  }
  if (jwtToken === undefined) {
    response.status(401)
    response.send('Invalid JWT Token')
  } else {
    jwt.verify(jwtToken, 'MY_SECRET_TOKEN', async (error, payload) => {
      if (error) {
        response.status(401)
        response.send('Invalid JWT Token')
      } else {
        next()
      }
    })
  }
}

app.get('/user/tweets/feed/', async (request, response) => {
  const {username, tweet, dateTime} = request.body
  const selectUserQuery = `
  SELECT 
  * 
  FROM 
  follower
  WHERE 
  username='${username}';,
  tweet='${tweet}';,
  datetime='${dateTime}';`
  const tweetarray = await database.get(selectUserQuery)
  response.send(convertUserDbObjectToResponseObject(tweetarray))
})

app.get('/user/following/', async (request, response) => {
  const {name} = request.params
  const selectUserQuery = `
  SELECT 
  * 
  FROM 
  user 
  WHERE 
  name='${name}';`
  const userArray = await database.all(selectUserQuery)
  response.send(convertUserDbObjectToResponseObject(userArray))
})

app.get('/user/followers/', async (request, response) => {
  const {name} = request.params
  const selectUserQuery = `
  SELECT *
  FROM 
  user 
  WHERE 
  name ='${name}';`
  const userArray = await database.all(selectUserQuery)
  response.send(convertUserDbObjectToResponseObject(userArray))
})

app.get('/tweets/:tweetId/', async (request, response) => {
  response.status(400)
  response.send('Invalid Request')
  const getTweetsQuery = `
  SELECT
  * 
  FROM 
  tweet 
  WHERE 
  tweet="${'T 3859 - do something wonderful, people may imitate it..,'}",
  likes="${3}",
  replies="${1}",
  dateTime="${'2021-04-07 14:50:19'}";`
  const selectweet = await database.all(getTweetsQuery)
  response.send(selectweet)
})

app.get('/tweets/:tweedId/likes/', async (request, response) => {
  response.status(401)
  response.send('Invalid Request')
  const getTweetsDetails = `
  SELECT *
  FROM 
  tweet
  WHERE 
  likes ="${likes}";`
  const tweet = await database.get(getTweetsDetails)
  request.send(tweet)
})

app.get('/tweets/:tweetId/replies/', async (request, response) => {
  response.status(401)
  response.send('Invalid Request')
  const getRepliesQuery = `
  SELECT *
  FROM 
reply
WHERE 
replies="${replies}",
name="${name}",
reply="${reply}";`
  const replyArray = await database.get(getRepliesQuery)
  response.send(replyArray)
})

app.get('/user/tweets/', async (response, request) => {
  const {tweet, likes, replies, dateTime} = request.body
  const slectTweetsQuery = ` 
  SELECT 
  * 
  FROM 
  user 
  WHERE
  tweet="${tweet}",
likes="${likes}",
replies="${replies}",
date_time="${dateTime}";`
  const tweetsArray = await database.all(selectTweetsQuery)
  response.send(convertUserDbObjectToResponseObject(tweetsArray))
})

app.post('/user/tweets/', async (request, response) => {
  const {tweet} = request.params
  const slectTweetQuery = ` 
  SELECT *
  FROM 
  tweet 
  WHERE 
  tweet="${tweet}";`
  await database.get(slectTweetQuery)
  reposnse.send('Created a Tweet')
})

app.delete('/tweets/:tweetId/', async (request, response) => {
  const {tweetId} = request.params
  const deleteTweetQuery = `
  DELETE FROM
    tweet
  WHERE
    tweet_id = "${tweetId} ";`

  await database.run(deleteTweetQuery)
  response.send('Tweet Removed')
})

module.exports = app
console.log(app)
