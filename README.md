# discord-invites

This project preserves the history of who gets invited for a particular server by recording the inviter and invitee of every invite into a database.

## Instructions

1. `npm install`
2. Add related info to config.json. The not-so-obvious configs are explained below
  * `token` - Bot token
  * `database` - mongodb database uri
  * `sessionSecret` - express session secret (see [here](https://stackoverflow.com/questions/5343131/what-is-the-sessions-secret-option))
  * `redirectURI` - OAuth2 redirect URI that you must set in the bot application's OAuth2 page on Discord Developers
  * `clientID` - Bot's client ID found on Discord Developers
  * `clientSecret` Bot's client secret found on Discord Developers
  * `inviteExpirationDays` - Number of days before a created invite will expire
3. Run `node server`
4. Go to http://localhost:port/login (replace port with your config port). If you go to the main page without logging in, it will be mostly empty because you are unauthorized. Log in first.
5. Access API features on http://localhost:port


The idea for this (which is an interesting one) is credited to https://github.com/shikhir-arora.
