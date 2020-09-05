const Queue = require('bull')
module.exports = async function wikiAllRequestHandler(req,res){
  try{
    let lang = req.query.lang ? req.query.lang : 'en'
    var wikiAllQ = new Queue("wikiAll")
    let job = await wikiAllQ.add({lang:lang})
    let result = await job.finished()
    res.statusCode = result.error?400:200
    res.setHeader("Content-Type", 'application/json')
    try {

      let jsonpretty = JSON.stringify(result, null, 4)
      res.setHeader("Content-Type", 'application/json')
      res.send(jsonpretty)
    } catch (exjson) {
      res.json(result)
    }
  } catch (ex) {
    console.log(ex)
    res.json({
      error: ex,
      query: query
    })
  }

}

