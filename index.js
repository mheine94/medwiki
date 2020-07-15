const wikiApi = require('./v2')
const mappingApi = require('./mappingAPI')
const express = require('express')
const app = express()
const port = 3000
var path = require('path');
app.use(express.static('formSearch_oldVersion'))

app.get('/api', (req, res) => res.send("hallo api user"))
app.post('/api/v2', wikiApi)
app.get('/api/v2', wikiApi)
app.get('/api/sheet/:documentId', mappingApi)


app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))
