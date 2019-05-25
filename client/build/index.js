async function getUser () {
  // Fetch from the API
  const identity = await (await fetch('/api/users/@me')).json()  
  
  // Populate the user info
  document.getElementById('userId').innerText = identity.id
  document.getElementById('username').innerText = identity.username
  await getInvites()
}

async function getInvites() {
  // Fetch from the API
  const invites = await (await fetch('/api/users/@me/invites')).json() // Returns an array
  console.log(invites)

  // Populate the list
  const inviteList = document.getElementById('inviteList')
  for (const invite of invites) {
    const li = document.createElement('li')
    li.appendChild(document.createTextNode(invite.url + ` (guild id: ${invite.guild})`))
    inviteList.appendChild(li)
  }
}

async function createInvite () {
  // Get the guild ID
  const guildId = document.getElementById('newInviteGuildID').value
  if (!guildId) return alert('no guild id specified')

  // Fetch from the API
  const res = await fetch(`/api/guilds/${guildId}/invites`, { method: 'POST' })

  // Check the response
  if (res.status !== 200) {
    console.log('Not OK')
    alert("non-200 status code, maybe check console")
    console.log(await res.json())
  } else {
    console.log('OK')
    const invite = await res.json()
    console.log(invite)

    // Add to the list
    const li = document.createElement('li')
    li.appendChild(document.createTextNode(invite.url + ` (guild id: ${invite.guild})`))
    document.getElementById('inviteList').appendChild(li)
  }
  return false
}

async function getInvitesByGuild() {
  // Get the guild ID
  const guildId = document.getElementById('invitesListGuildID').value
  if (!guildId) return alert('no guild id specified')

  // Fetch from API
  const invites = await (await fetch(`/api/guilds/${guildId}/invites`)).json()
  
  // Clear the previous list
  const inviteListByGuild = document.getElementById('inviteListByGuild')
  while (inviteListByGuild.firstChild) {
    inviteListByGuild.removeChild(inviteListByGuild.firstChild)
  }

  // Populate the list
  document.getElementById('selectedGuild').innerText = `Selected Guild: ${guildId}`
  for (const invite of invites) {
    const li = document.createElement('li')
    li.appendChild(document.createTextNode(invite.url + ` (guild id: ${invite.guild})`))
    document.getElementById('inviteListByGuild').appendChild(li)
  }
}

getUser().catch(console.error)
