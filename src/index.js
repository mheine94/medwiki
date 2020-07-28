const os = require('os')
let cpuCount = os.cpus().length

const mappingApi = require('./mappingAPI')
const Queue = require('bull')
const path = require('path')
const fetch = require("node-fetch")

const express = require('express')
const bodyParser = require('body-parser');
const app = express()
const port = 3000

app.use(express.static('public'))
app.use(bodyParser.json());
app.use(bodyParser.text());
app.use(bodyParser.urlencoded({extended:false}))

app.post('/api', wikiApiRequestHandler)
app.get('/api', wikiApiRequestHandler)
app.get('/api/sheet/:documentId/:sheetId?', mappingApi)
app.post('/api/sheet/:documentId/:sheetId?', mappingApi)

app.listen(port, () => console.log(`Wikipedia-medication-extractor listening at http://localhost:${port}`))

var wikiQ = new Queue('wikiQ')
var wikiApiQ = new Queue("wikiApiQ")


// You can use concurrency as well:
wikiQ.process(cpuCount*10,path.join(__dirname,'wikipedia-processor.js'));
wikiApiQ.process(cpuCount*2,path.join(__dirname,'wikiAPI-processor.js'));


/**
 * Handles the http requests to the wikipediaApi
 *
 * @param {*} req {@link express} the express request object
 * @param {*} res the express result object
 */
async function wikiApiRequestHandler(req, res){
  try {
    let query = req.query.query ? req.query.query : ''
    let lang = req.query.lang ? req.query.lang : 'en'
    let body = req.body

    if (query == undefined | query == null) {
      res.status(501)
    }
    res.status(200)

    let result;
    let wikiQ = new Queue('wikiQ')
    let wikiApiQ = new Queue("wikiApiQ")

    if (!(Object.keys(body).length === 0 && body.constructor === Object)) {
      let queryWords;
      if (body.query) {
        console.log("Post body query:", body.query)
        console.log("Post lang:", body.lang)
        queryWords = body.query;
        lang = body.lang
      } else {
        queryWords = body.replace(/\r/g, '').split(/\n/)
      }
      console.log("Post body query list", queryWords)
      let apiJob = await wikiApiQ.add({querySplit:queryWords,lang:lang})
      result = await apiJob.finished()
    } else {
      let queryWords = query.split(',');
      console.log("Get query list", queryWords)
      if (queryWords.length > 1) {
        let apiJob = await wikiApiQ.add({querySplit:queryWords,lang:lang})
        result = await apiJob.finished()
      } else {
        let wikiJob = await wikiQ.add({word:query,lang:lang})
        result = await wikiJob.finished()
      }
    }
    
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
