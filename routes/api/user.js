const express = require('express')
const dbOps = require('../../util/dbOps.js')
const formatError = require('./util/formatError.js')
const user = express.Router({ mergeParams: true })

user.use((req, res, next) => {
  if (req.params.user !== '@me') return res.status(400).json(formatError(400, 'Invalid user param. Must be @me'))
  next()
})

user.get('/', async (req, res) => {
  res.json(req.session.identity)
})

user.get('/invites', async (req, res, next) => {
  try {
    // Returns an array of invite objects. This assumes that the user specified in the params is @me, as indicated in the previous middleware
    const invites = await dbOps.pendingInvites.ofCreator(req.session.identity.id)

    // The urls are only for the front-end's convenience
    const invitesWithURL = invites.map(inviteDetails => ({ ...inviteDetails, url: `${req.protocol}://${req.get('host')}/invite/${inviteDetails.code}` }))

    res.json(invitesWithURL)
  } catch (err) {
    next(err)
  }
})

module.exports = user
