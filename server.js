const express = require('express')
const path = require('path')
const config = require('./config.json')
const mongoose = require('mongoose')
const app = express()
const session = require('express-session')
const fetch = require('node-fetch')
const MongoStore = require('connect-mongo')(session)
const discordAPIConstants = require('./constants/discordAPI.js')
const discordAPIHeaders = require('./constants/discordAPIHeaders')
const fetchUser = require('./util/fetchUser.js')
const dbOps = require('./util/dbOps.js')
const requestIp = require('request-ip')
const SCOPES = 'identify guilds guilds.join'
const tokenConfig = code => { return { code, redirect_uri: config.redirectURI, scope: SCOPES } }
const apiRoutes = require('./routes/api/index.js')

const credentials = {
  client: {
    id: config.clientID,
    secret: config.clientSecret
  },
  auth: {
    tokenHost: discordAPIConstants.apiHost,
    tokenPath: '/oauth2/token',
    revokePath: '/oauth2/token/revoke',
    authorizePath: '/oauth2/authorize'
  }
}
const oauth2 = require('simple-oauth2').create(credentials)
const pendingUserInvites = new Map() // by session IDs of users who tried to get invited but was not initially logged in. They get invited after they're authorized through this map

async function putUserInGuild (session, guild) {
  const discordRes = await fetch(`${discordAPIConstants.apiHost}/guilds/${guild}/members/${session.identity.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...discordAPIHeaders.bot().headers }, // The bot headers are in the format of "Bot <token>"
    body: JSON.stringify({ access_token: session.token.access_token }) })
  let jsonBody
  try {
    jsonBody = await discordRes.json()
  } catch {}
  return {
    status: discordRes.status,
    message: jsonBody && jsonBody.message ? jsonBody.message : null, // Discord usually sends their json response with the error message
    originalResponse: jsonBody
  }
}

app.set('trust proxy', true)
app.use(express.json())
app.use(session({
  secret: 'session secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }, // Set secure to true for HTTPS - otherwise sessions will not be saved
  maxAge: 1 * 24 * 60 * 60, // 1 day
  store: new MongoStore({ mongooseConnection: mongoose.connection })
}))

app.use(express.static(path.join(__dirname, 'client/build'))) // Set your own front end paths
app.use('/api', apiRoutes)
app.get('/login', (req, res) => {
  const authorizationUri = oauth2.authorizationCode.authorizeURL({
    redirect_uri: config.redirectURI,
    scope: SCOPES
  })
  res.redirect(authorizationUri)
})

app.get('/authorize', async (req, res) => {
  try {
    const result = await oauth2.authorizationCode.getToken(tokenConfig(req.query.code))
    const accessTokenObject = oauth2.accessToken.create(result) // class with properties access_token, token_type = 'Bearer', expires_in, refresh_token, scope, expires_at
    req.session.token = accessTokenObject.token
    // console.log('auth object', req.session.token)

    req.session.identity = await fetchUser.info(req.session.identity ? req.session.identity.id : null, req.session.token.access_token) // Uses the /users/@me discord API route
    const pendingInviteCode = pendingUserInvites.get(requestIp.getClientIp(req))
    let pendingInvite
    if (pendingInviteCode) pendingInvite = await dbOps.pendingInvites.get(pendingInviteCode)
    if (pendingInviteCode && pendingInvite) {
      const { status, message, originalResponse } = await putUserInGuild(req.session, pendingInvite.guild)

      // Check discord's response
      if (status === 204) return res.send('You are already in that guild.')
      else if (status !== 201) {
        console.log('Error trying to invite user to guild, discord response\n', originalResponse)
        return res.status(500).json({ status, message: message || 'Unknown error' })
      }

      // 200 response code, use the invite then
      console.log(`User ${req.session.identity.id} has been added to guild ${pendingInvite.guild} through invite ${pendingInviteCode}`)
      await dbOps.pendingInvites.use(pendingInviteCode, req.session.identity.id)
      return res.send('Successfully invited to guild')
    }
    res.redirect('/')
  } catch (err) {
    console.error(`Failed to authorize Discord`, err)
    res.redirect('/')
  }
})

// User enters this in the browser to get added to the guild attached to the invite
app.get('/invite/:code', async (req, res, next) => {
  try {
    // Check if code is in parameters
    const params = req.params
    if (!params.code) return res.status(400).send('Code was not specified in parameters')
    const pendingInvite = await dbOps.pendingInvites.get(params.code)

    // Check if the invite code exists. If not, redirect to login
    if (!pendingInvite) return res.status(400).send('No such invite')
    if (!req.session.identity) {
      const clientIP = requestIp.getClientIp(req)
      if (clientIP) pendingUserInvites.set(clientIP, params.code)
      return res.redirect('/login')
    }
    
    // Use the invite
    const { status, message, originalResponse } = await putUserInGuild(req.session, pendingInvite.guild)

    // Check discord's response
    if (status === 204) return res.send('You are already in that guild.')
    else if (status !== 201) {
      console.log('Error trying to invite user to guild, discord response\n', originalResponse)
      return res.status(500).json({ status, message: message || 'Unknown error' })
    }

    // 200 response code, Use the invite
    console.log(`User ${req.session.identity.id} has been added to guild ${pendingInvite.guild} through invite ${params.code}`)
    dbOps.pendingInvites.use(pendingInvite.code, req.session.identity.id)
    res.send('Successfully invited to guild')
  } catch (err) {
    console.log('Failed to handle invite route\n', err)
    next(err)
  }
})

app.get('/session', (req, res) => {
  // ONLY FOR TESTING THE API TO BYPASS API AUTHENTICATION
  req.session.identity = {
    id: '12345'
  }
  res.send('OK')
})

app.get('*', (req, res) => {
  res.send('Hello World!')
})

mongoose.connect(config.database, { useNewUrlParser: true, useCreateIndex: true })

mongoose.connection.once('open', () => {
  console.log('Database connection opened')
  app.listen(config.port, () => console.log(`Example app listening on port ${config.port}!`))
})
