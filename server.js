const express = require('express')
const fs = require('fs')
const jwt = require('jsonwebtoken')
const cors = require('cors')
const events = require('./db/events.json')

const app = express()
app.use(
  cors({
    exposedHeaders: ['X-Total-Count'],
    credentials: true,
  })
)

process.on('uncaughtException', (err) => {
  console.error('There was an uncaught error', err)
})

app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the API',
  })
})

app.get('/events', (req, res) => {
  const limit = req.query._limit ? parseInt(req.query._limit) : 5
  const page = req.query._page ? parseInt(req.query._page) : 1

  pageEvents = events.slice((page - 1) * limit, page * limit)

  res.set('X-Total-Count', events.length)
  res.json({
    events: pageEvents,
  })
})

app.post('/register', (req, res) => {
  if (req.body) {
    const user = {
      name: req.body.name,
      email: req.body.email,
      password: req.body.password, // don't forget to encrypt it / hash it
    }

    const data = JSON.stringify(user, null, 2)
    var dbUser = require('./db/user.json')
    if (dbUser.email === user.email) {
      res.sendStatus(400)
    } else {
      fs.writeFile('./db/user.json', data, (err) => {
        if (err) {
          console.log(err + data)
        } else {
          const token = jwt.sign({ user }, 'the_very_secret_key')
          res.json({
            token,
            email: user.email,
            name: user.name,
          })
        }
      })
    }
  } else {
    res.sendStatus(400)
  }
})

app.post('/login', (req, res) => {
  const userDB = fs.readFileSync('./db/user.json')
  const userInfo = JSON.parse(userDB)
  if (
    req.body &&
    req.body.email === userInfo.email &&
    req.body.password === userInfo.password
  ) {
    const token = jwt.sign({ userInfo }, 'the_very_secret_key')
    res.json({
      token,
      email: userInfo.email,
      name: userInfo.name,
    })
  } else {
    res.sendStatus(400)
  }
})

// MIDDLEWARE
function verifyToken(req, res, next) {
  const bearerHeader = req.headers['authorization']
  if (typeof bearerHeader !== 'undefined') {
    const bearer = bearerHeader.split(' ')
    const bearerToken = bearer[1]
    req.token = bearerToken
    next()
  } else {
    res.sendStatus(401)
  }
}

app.listen(3000, () => {
  console.log('Server started on port 3000')
})
