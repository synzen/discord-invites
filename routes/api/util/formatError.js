
// Format response objects for errors. Follows Discord's standard API response

module.exports = (status, message) => {
  return {
    status,
    message
  }
}
