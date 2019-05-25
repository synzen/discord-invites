const express = require('express')
const user = require('./user.js')
const guilds = require('./guilds.js')
const formatError = require('./util/formatError.js')
const api = express.Router()

function userAuthCheck(req, res, next) {
  // API authorization is done here. For now, it's just checking if the usre is logged in via OAuth2.
  // thus these routes can typically only be accessed throguh the browser after they logged in.
  if (!req.session.identity) return res.status(401).send('You do not have authorization.')
  next()
}

api.use(userAuthCheck)
api.use('/users/:user', user)
api.use('/guilds/:guild', guilds)

api.use((req, res) => {
  res.status(404).json(formatError(404, 'Invalid API route'))
})

api.use((err, req, res, next) => {
  console.error(err)
  // Custom defined in routes that want to give a custom error json body
  if (req.status && req.message) res.status(req.status).json(formatError(req.status, req.message))
  else res.status(500).json(formatError(500, 'Internal server error'))
})

module.exports = api
