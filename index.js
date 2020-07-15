const wikiApi = require('./v2')
const mappingApi = require('./mappingAPI')

const Queue = require('bull')

const express = require('express')
const app = express()
const port = 3000

app.use(express.static('formSearch_oldVersion'))

app.get('/api', (req, res) => res.send("hallo api user"))
app.post('/api/v2', wikiApi)
app.get('/api/v2', wikiApi)
app.get('/api/sheet/:documentId', mappingApi)


app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))

var wikiQueryQ = new Queue('wikiQuery')
var wikiApiQ = new Queue("wikiApi")
var sheetApiQ = new Queue("sheetApi")



// You can use concurrency as well:
wikiQueryQ.process(1,'./wikipedia-processor.js');
wikiApiQ.process(1,'./wikiAPI-processor.js');

Array.prototype.unique = function () {
    return this.filter(function (value, index, self) {
      return self.indexOf(value) === index;
    });
}

wikiApiQ.add({querySplit:[],lang:"en",logo:"bong"}).then(job=> {
    console.log("posted Job in wikiApiQ")
    job.finished().then(res=>{
    console.log(JSON.stringify(res,null,4))
    })
})