const wikipediaSearch = require('./wikipedia')

module.exports = async function (job) {
  console.log(`wikiSearch:`, job.data)
  let res = await wikipediaSearch(job.data.word, job.data.lang)
  return res
}