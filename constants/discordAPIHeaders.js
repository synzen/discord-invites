const config = require('../config.json')

exports.user = accessToken => {
  return {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  }
}

exports.bot = () => ({ headers: { 'Authorization': `Bot ${config.token}` } })
