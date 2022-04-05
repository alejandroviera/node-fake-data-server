const express = require('express')
const fs = require('fs')
const jwt = require('jsonwebtoken')
const cors = require('cors')
const bodyParser = require('body-parser')
const events = require('./db/events.json')

const my_secret_key = 'the_very_secret_key'

const app = express()
app.use(
  cors({
    exposedHeaders: ['X-Total-Count'],
    credentials: true,
  })
)
app.use(bodyParser.json())

process.on('uncaughtException', (err) => {
  console.error('There was an uncaught error', err)
})

app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the API',
  })
})

app.get('/events', verifyToken, (req, res) => {
  jwt.verify(req.token, my_secret_key, (err) => {
    if (err) {
      res.sendStatus(401)
    } else {
      const limit = req.query._limit ? parseInt(req.query._limit) : 5
      const page = req.query._page ? parseInt(req.query._page) : 1

      pageEvents = events.slice((page - 1) * limit, page * limit)

      res.set('X-Total-Count', events.length)
      res.json({
        events: pageEvents,
      })
    }
  })
})

app.get('/events/:id', verifyToken, (req, res) => {
  jwt.verify(req.token, my_secret_key, (err) => {
    if (err) {
      res.sendStatus(401)
    } else {
      var result = null
      if (req.params.id !== undefined) {
        var all = events.filter((obj) => {
          return obj.id == req.params.id
        })
        if (all.length > 0) {
          result = all[0]
        }
      }
      res.json({
        ...result,
      })
    }
  })
})

app.post('/events', verifyToken, (req, res) => {
  jwt.verify(req.token, my_secret_key, (err) => {
    if (err) {
      res.sendStatus(401)
    } else {
      events.push(req.body)
      const stringData = JSON.stringify(events, null, 2)
      fs.writeFile('./db/events.json', stringData, (err) => {
        if (err) {
          console.log(err + data)
          res.status(400).json({ error: err })
        } else {
          res.sendStatus(200)
        }
      })
    }
  })
})

app.post('/register', (req, res) => {
  if (req.body) {
    const user = {
      name: req.body.name,
      email: req.body.email,
      password: req.body.password, // don't forget to encrypt it / hash it
      id: 'abc123',
    }

    const data = JSON.stringify(user, null, 2)
    var dbUser = require('./db/user.json')
    var errorsToSend = []
    if (dbUser.email === user.email) {
      errorsToSend.push('An account with this email already exists.')
    }
    if (user.password.length < 10) {
      errorsToSend.push('Password too short.')
    }

    if (errorsToSend.length > 0) {
      res.status(400).json({ errors: errorsToSend })
    } else {
      fs.writeFile('./db/user.json', data, (err) => {
        if (err) {
          console.log(err + data)
        } else {
          const token = jwt.sign({ user }, my_secret_key)
          res.json({
            token,
            email: user.email,
            name: user.name,
            id: user.id,
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
    const token = jwt.sign({ userInfo }, my_secret_key)
    res.json({
      token,
      email: userInfo.email,
      name: userInfo.name,
      id: userInfo.id,
    })
  } else {
    res.status(401).json({ error: 'Invalid login. Please try again.' })
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
