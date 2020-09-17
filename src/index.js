const path = require('path')
const fs = require('fs')
const os = require('os')
const process = require('process')

const redis = require('redis')

const express = require('express')
const bodyParser = require('body-parser');
const apicache = require('apicache')
const app = express()
let cacheWithRedis = apicache.options({ redisClient: redis.createClient() }).middleware

const mappingApi = require('./api/mappingAPI')
let  wikiApiRequestHandler = require('./api/wikiAPI').wikiApiRequestHandler
let  wikiAllRequestHandler = require('./api/wikiAPI-all').wikiAllRequestHandler
const Queue = require('bull')

const rootDir = path.join(__dirname, "..")
const localEnv = path.join(rootDir,"local.env")
const serverEnv = path.join(rootDir, "server.env")
const commonEnv = path.join(rootDir,"common.env")
let cpuCount = os.cpus().length


if(fs.existsSync(localEnv)){
  console.log("Using local environment...")
  require('dotenv').config({path: localEnv})
} else if(fs.existsSync(serverEnv)) {
  console.log("Using server environment...")
  console.log(require('dotenv').config({path: serverEnv}))
}else{
  console.log("Environmen could not be loaded.\nPlease put either a loca.env or prod.env file in the main direcotry.\n The file should contain APP_NAME and PORT")
  exit();
}
if(fs.existsSync(commonEnv)){
  console.log("Loading common environment variables")
  require('dotenv').config({path:commonEnv})
}
//console.log(process.env.PAGE_URL)
//console.log(process.env.SEARCH_URL)
//console.log(process.env.MEDS_CATEGORY_DE)
//console.log(process.env.ALL_MEDS_URL)
//console.log(process.env.USER_AGENT_CONTACT)
//console.log(process.env.APP_NAME)

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
app.get('/api/all',cacheWithRedis(process.env.CACHE_EXPIRE), wikiAllRequestHandler)
app.get('/api/sheet/:documentId/:sheetId?', mappingApi)
app.post('/api/sheet/:documentId/:sheetId?', mappingApi)

//Pretty urls
app.get('/:lang/:query',
    cacheWithRedis(process.env.CACHE_EXPIRE),
    (req, res)=>{
      req.params.query === 'all'?wikiAllRequestHandler(req,res):wikiApiRequestHandler(req,res)
    }
)
app.post('/:lang/:query',cacheWithRedis(process.env.CACHE_EXPIRE), wikiApiRequestHandler)


// routes are automatically added to index, but may be further added
// to groups for quick deleting of collections
app.get('/api/:collection/:item?', (req, res) => {
  req.apicacheGroup = req.params.collection
  res.json({ success: true })
})
 
// add route to display cache performance (courtesy of @killdash9)
app.get('/api/cache/performance', (req, res) => {
  res.json(apicache.getPerformance())
})
 
// add route to display cache index
app.get('/api/cache/index', (req, res) => {
  res.json(apicache.getIndex())
})
 
// add route to manually clear target/group
app.get('/api/cache/clear/:target?', (req, res) => {
  res.json(apicache.clear(req.params.target))
})


app.listen(process.env.PORT,process.env.ADRESS, () => console.log(`Wikipedia-medication-extractor listening at ${process.env.ADRESS}:${process.env.PORT}`))
if(process.env.HTTPS_PORT){
  app.listen(process.env.HTTPS_PORT,process.env.ADRESS, () => console.log(`Wikipedia-medication-extractor listening at https ${process.env.ADRESS}:${process.env.HTTPS_PORT}`) )
}

var wikiQ = new Queue('wikiQ')
var wikiApiQ = new Queue("wikiApiQ")
var wikiAllQ = new Queue("wikiAll")


// You can use concurrency as well:
wikiQ.process(cpuCount*10,path.join(__dirname,'./processors/wikipedia-processor.js'));
wikiApiQ.process(cpuCount*2,path.join(__dirname,'./processors/wikiAPI-processor.js'));
wikiAllQ.process(cpuCount*2,path.join(__dirname,'./processors/wikiAPI-all-processor.js'));

