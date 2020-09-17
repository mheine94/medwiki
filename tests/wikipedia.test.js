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
