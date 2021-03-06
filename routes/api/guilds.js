const express = require('express')
const dbOps = require('../../util/dbOps.js')
const formatError = require('./util/formatError.js')
const guilds = express.Router({ mergeParams: true })
const fetchUser = require('../../util/fetchUser.js')

// Middleware
guilds.use((req, res, next) => {
  if (!/^\d+$/.test(req.params.guild)) return res.status(400).json(formatError(400, 'Invalid guild ID. Must be all numbers'))
  next()
})

guilds.post('/invites', async (req, res, next) => {
  try {
    // Creates an invite URL for the guild specified in url params
    const guildId = req.params.guild

    // Check if the user is in this guild
    const userGuilds = await fetchUser.guilds(req.session.identity.id, req.session.token.access_token)
    if (userGuilds.filter(guild => guild.id === guildId).length === 0) return res.status(403).json(formatError(403, 'Unauthorized guild'))

    // Returns a JSON response with the new invite url
    const newInvite = await dbOps.pendingInvites.create(req.session.identity.id, guildId)

    // The url is only for the front-end's convenience
    res.json({ ...newInvite, url: `${req.protocol}://${req.get('host')}/invite/${newInvite.code}` })
  } catch (err) {
    next(err)
  }
})

guilds.get('/invites', async (req, res, next) => {
  try {
    // Gets all the invites of this user for the guild specified in url params
    // Returns an array of invite objects
    const invites = await dbOps.pendingInvites.ofCreator(req.session.identity.id, req.params.guild)

    // The urls are only for the front-end's convenience
    const invitesWithURL = invites.map(inviteDetails => ({ ...inviteDetails, url: `${req.protocol}://${req.get('host')}/invite/${inviteDetails.code}` }))

    res.json(invitesWithURL)
  } catch (err) {
    next(err)
  }
})

module.exports = guilds
