const fetch = require('node-fetch')
const moment = require('moment')
const discordAPIConstants = require('../constants/discordAPI.js')
const discordAPIHeaders = require('../constants/discordAPIHeaders.js')
const CACHE_TIME_MINUTES = 10
const CACHED_USERS = {}
const CACHED_USERS_GUILDS = {}

function timeDiffMinutes (start) {
  const duration = moment.duration(moment().diff(start))
  return duration.asMinutes()
}

async function info (id, accessToken, skipCache) {
  const cachedUser = id && !skipCache ? CACHED_USERS[id] : null
  if (cachedUser && timeDiffMinutes(cachedUser.lastUpdated) <= CACHE_TIME_MINUTES) return cachedUser.data
  console.log('API request made (GET /api/users/@me)')
  const res = await fetch(`${discordAPIConstants.apiHost}/users/@me`, discordAPIHeaders.user(accessToken))
  if (res.status !== 200) {
    console.log(await res.json())
    throw new Error(`Non-200 status code (${res.status})`)
  }
  const data = await res.json()
  CACHED_USERS[id] = {
    data,
    lastUpdated: moment()
  }
  return data
}

async function guilds (id, accessToken, skipCache) {
  const cachedUserGuilds = id && !skipCache ? CACHED_USERS_GUILDS[id] : null
  if (cachedUserGuilds && timeDiffMinutes(cachedUserGuilds.lastUpdated) <= CACHE_TIME_MINUTES) return cachedUserGuilds.data
  console.log('API request made (GET /api/users/@me/guilds)')
  const res = await fetch(`${discordAPIConstants.apiHost}/users/@me/guilds`, discordAPIHeaders.user(accessToken))
  if (res.status !== 200) {
    console.log(await res.json())
    throw new Error(`Non-200 status code (${res.status})`)
  }
  const data = await res.json()
  CACHED_USERS_GUILDS[id] = {
    data,
    lastUpdated: moment()
  }
  return data
}

module.exports = { info, guilds }
