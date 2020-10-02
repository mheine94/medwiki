const express = require('express')
const bodyParser = require('body-parser');
const app = express()

app.use(express.static('public'))
app.use(bodyParser.json());
app.use(bodyParser.text());
app.use(bodyParser.urlencoded({extended:false}))

app.listen(8080,'127.0.0.1', () => console.log(`Wikipedia-medication-extractor listening at ${'127.0.0.1'}:${8080}`))
