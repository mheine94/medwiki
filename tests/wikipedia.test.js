jest.mock('../src/util')
const util = require('../src/util')
const actualUtil = jest.requireActual('../src/util')
util.getErrorResponse.mockImplementation(actualUtil.getErrorResponse)
util.createTableDict.mockImplementation(actualUtil.createTableDict)
util.getHtml.mockImplementation(actualUtil.getHtml)
const {getErrorResponse,getHtml} = util

const sampleApiCalls = require('./sample-api-calls.js')
const {wikipediaSearch} = require('../src/api/wikipedia.js')

                    describe("Wikipedia test", ()=>{
    let sampleCalls = require('./sample-api-calls.js')
    let byQuery = sampleCalls.reduce((p,n) => {
        p[n.query]=n
        return p;
    },{})
 
    let callsTable = sampleCalls.map((sample)=>[sample.query,sample.lang, sample.result])
    let emptyQueries = [
      [undefined,"de", getErrorResponse("Empty query", )],
      [null,"de", getErrorResponse("Empty query",null)],
      ["","de", getErrorResponse("Empty query","")],
    ]
    callsTable = callsTable.concat(emptyQueries)
    test.each(callsTable)(`wikipediaSearch(%s,%s)`, async (query,lang,expected)=>{
        let result = await wikipediaSearch(query,lang)
        expect(result).toEqual(expected)
    })
    
    test('handle undefined results',async ()=>{
        let  result  = await wikipediaSearch("giididid","de")
        expect(result.error!=undefined).toBe(true)
    })
    test('handle unparsable wikipedia api response',async ()=>{
      getHtml.mockImplementationOnce(()=>"<notjson>")
      let result = await wikipediaSearch("bongo","de")
      expect(result).toEqual(getErrorResponse("Cant parse wikipedia api response!","bongo"))
    })
})
