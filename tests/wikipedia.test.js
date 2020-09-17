const fs = require('fs')
const path = require('path')
const process = require('process')
const rootDir = path.join(__dirname, "..")
const localEnv = path.join(rootDir,"local.env")
const serverEnv = path.join(rootDir, "server.env")
const commonEnv = path.join(rootDir,"common.env")


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

const sampleApiCalls = require('./sample-api-calls.js')
const {wikipediaSearch} = require('../src/api/wikipedia.js')

                    describe("Wikipedia test", ()=>{
    let sampleCalls = require('./sample-api-calls.js')
    let byQuery = sampleCalls.reduce((p,n) => {
        p[n.query]=n
        return p;
    },{})
 
    let callsTable = sampleCalls.map((sample)=>[sample.query,sample.lang, sample.result])

    test.each(callsTable)(`wikipediaSearch(%s,%s)`, async (query,lang,expected)=>{
        let result = await wikipediaSearch(query,lang)
        expect(result).toEqual(expected)
    })
    
    test('handle undefined results',async ()=>{
        result  = await wikipediaSearch("giididid","de")
        expect(result.error!=undefined).toBe(true)
    })
   
})
