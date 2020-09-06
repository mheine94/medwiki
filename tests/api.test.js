const sampleApiCalls = require('./sample-api-calls.js')
const wikipediaSearch = require('../src/wikipedia.js')

describe("API Test", ()=>{
    let sampleCalls = require('./sample-api-calls.js')
    let byQuery = sampleCalls.reduce((p,n) => {
        p[n.query]=n
        return p;
    },{})
  
    for (sample of sampleCalls){
        test(`query:"${sample.query}" lang:"${sample.lang}" output as exprected`, async () =>{
            let expected = byQuery[sample.query]
            let result = await wikipediaSearch(sample.query, sample.lang);
            expect(result).toEqual(expected.result)
        })
    }
   
})

test("Should fail", ()=> expect(false).toBe(true))