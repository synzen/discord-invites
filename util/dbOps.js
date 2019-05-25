const mongoose = require('mongoose')
const config = require('../config.json')

function expireDate () {
  return () => {
    const date = new Date()
    date.setDate(date.getDate() + config.inviteExpirationDays) // Add days
    return date
  }
}

const schemas = {
  guild: String,
  pendingInvite: mongoose.Schema({
    code: {
      type: String,
      unique: true
    },
    creator: String,
    guild: String,
    date: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      default: expireDate('article'),
      index: { expires: 0 }
    }
  }),
  usedInvite: mongoose.Schema({
    guild: String,
    code: {
      type: String,
      unique: true
    },
    creator: String,
    date: {
      type: Date,
      default: Date.now
    },
    user: String
  })
}

const models = {
  PendingInvite: mongoose.model('pending_invites', schemas.pendingInvite),
  UsedInvite: mongoose.model('used_invites', schemas.usedInvite)
}


exports.pendingInvites = {
  create: async (creator, guild) => {
    if (typeof creator !== 'string') throw new TypeError('creator is not a string')
    if (typeof guild !== 'string') throw new TypeError('guild is not a string')
    const newInvite = new models.PendingInvite({
      code: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      guild,
      creator
    })
    const doc = await newInvite.save()
    return doc.toJSON()
  },
  ofCreator: async (creator, guild) => {
    // Get all invites for a specific creator. The guild parameter is optional.
    if (typeof creator !== 'string') throw new TypeError('creator is not a string')
    if (guild && typeof guild !== 'string') throw new TypeError('guild is defined but not a string')
    const invites = await models.PendingInvite.find(guild ? { creator, guild } : { creator }).lean().exec()
    return invites
  },
  get: async code => {
    if (typeof code !== 'string') throw new TypeError('code is not a string')
    return models.PendingInvite.findOne({ code }).lean().exec()
  },
  use: async (code, user) => {
    // Use an invite by removing it from the pending collection, and adding it to the used collection
    if (typeof code !== 'string') throw new TypeError('code is not a string')
    if (typeof user !== 'string') throw new TypeError('user is not a string')

    // Check if the pending invite exists
    const pendingInvite = await exports.pendingInvites.get(code)
    if (!pendingInvite) throw new Error('No such invite exists')

    // Check if deletion was successful
    const result = await models.PendingInvite.deleteOne({ code })
    if (result.deletedCount === 0) throw new Error('Pending invite could not be deleted')

    // Make a used invite
    const usedInvite = new models.UsedInvite({
      code,
      creator: pendingInvite.creator,
      guild: pendingInvite.guild,
      user
    })
    await usedInvite.save()
  }
}