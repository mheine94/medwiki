const mappingApi = require('./mappingAPI')
const Queue = require('bull')
const path = require('path')
const fetch = require("node-fetch")

const express = require('express')
const bodyParser = require('body-parser');
const app = express()
const port = 3000

app.use(express.static('formSearch_oldVersion'))
app.use(bodyParser.json());
app.use(bodyParser.text());
app.use(bodyParser.urlencoded({extended:false}))
app.get('/api', (req, res) => res.send("hallo api user"))
app.post('/api/v2', wikiApiRequestHandler)
app.get('/api/v2', wikiApiRequestHandler)
app.get('/api/sheet/:documentId', mappingApi)


app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))

var wikiQ = new Queue('wikiQ')
var wikiApiQ = new Queue("wikiApiQ")
//var sheetApiQ = new Queue("sheetApi")



// You can use concurrency as well:
wikiQ.process(200,path.join(__dirname,'wikipedia-processor.js'));
wikiApiQ.process(10,path.join(__dirname,'wikiAPI-processor.js'));

Array.prototype.unique = function () {
    return this.filter(function (value, index, self) {
      return self.indexOf(value) === index;
    });
}


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
    
    res.statusCode = 200
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
