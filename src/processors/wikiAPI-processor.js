const {wikiApi} = require('../api/wikiAPI')
module.exports = async function(job){
    console.log("wikiApi:",job.data)
    const lang = job.data.lang
    const querySplit = job.data.querySplit
    let res = await wikiApi(querySplit,lang)
    return res
  }