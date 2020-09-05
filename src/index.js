const path = require('path')
const fs = require('fs')
const os = require('os')
const process = require('process')

const express = require('express')
const bodyParser = require('body-parser');
const app = express()


const mappingApi = require('./mappingAPI')
const Queue = require('bull')

const rootDir = path.join(__dirname, "..")
const localEnv = path.join(rootDir,"local.env")
const serverEnv = path.join(rootDir, "server.env")
let cpuCount = os.cpus().length


if(fs.existsSync(localEnv)){
  console.log("Using local environment...")
  require('dotenv').config({path: localEnv})
} else if(fs.existsSync(serverEnv)) {
  console.log("Using server environment...")
  require('dotenv').config({paht: serverEnv})
}else{
  console.log("Environmen could not be loaded.\nPlease put either a loca.env or server.env file in the main direcotry.\n The file should contain APP_NAME and PORT")
  exit();
}

//need custom useragent to prevent errors with wikipedia
//https://meta.wikimedia.org/wiki/User-Agent_policy
const userAgent = `${process.env.APP_Name}_bot/${process.env.npm_package_version} (${process.env.USER_AGENT_CONTACT})`
process.env.USER_AGENT = userAgent;


app.use(express.static('public'))
app.use(bodyParser.json());
app.use(bodyParser.text());
app.use(bodyParser.urlencoded({extended:false}))

app.post('/api', wikiApiRequestHandler)
app.get('/api', wikiApiRequestHandler)
app.get('/api/all', wikiAllRequestHandler)
app.get('/api/sheet/:documentId/:sheetId?', mappingApi)
app.post('/api/sheet/:documentId/:sheetId?', mappingApi)


app.get('/:lang/:query', wikiApiRequestHandler)
app.get('/:lang', wikiAllRequestHandler)
app.post('/:lang/:query', wikiApiRequestHandler)

app.listen(process.env.PORT,process.env.ADRESS, () => console.log(`Wikipedia-medication-extractor listening at ${process.env.ADRESS}:${process.env.PORT}`))
if(process.env.HTTPS_PORT){
  app.listen(process.env.HTTPS_PORT,process.env.ADRESS, () => console.log(`Wikipedia-medication-extractor listening at https ${process.env.ADRESS}:${process.env.HTTPS_PORT}`) )
}

var wikiQ = new Queue('wikiQ')
var wikiApiQ = new Queue("wikiApiQ")
var wikiAllQ = new Queue("wikiAll")


// You can use concurrency as well:
wikiQ.process(cpuCount*10,path.join(__dirname,'wikipedia-processor.js'));
wikiApiQ.process(cpuCount*2,path.join(__dirname,'wikiAPI-processor.js'));
wikiAllQ.process(cpuCount*2,path.join(__dirname,'wikiAPI-all-processor.js'));

async function wikiAllRequestHandler(req,res){
  try{
    let lang = req.query.lang ? req.query.lang : 'en'
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

/**
 * Handles the http requests to the wikipediaApi
 *
 * @param {*} req {@link express} the express request object
 * @param {*} res the express result object
 */
async function wikiApiRequestHandler(req, res){
  try {
    let query = req.query.query ? req.query.query : req.params.query? req.params.query :''
    let lang = req.query.lang ? req.query.lang : req.params.lang? req.params.lang : 'en'
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
      query: req.query.query ? req.query.query : ''
    })
  }
}
