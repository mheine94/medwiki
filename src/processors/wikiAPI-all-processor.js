const {allMedsExtracted} = require('../api/wikiAPI-all')
module.exports = async function(job){
    console.log("Wikiapi-All:",job.data)
    const lang = job.data.lang
    let res = await allMedsExtracted(lang)
    return res
}

