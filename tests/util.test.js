const {html, expectedDict} = require('./util-test-data')
const cheerio = require('cheerio')
const fetch = require('node-fetch')
jest.mock('node-fetch')
const {getHtml , getErrorResponse, createTableDict} = require('../src/util')
describe('Utility function tests',()=>{
    test('Tabledict parses table as exprected', ()=>{
        let $ = cheerio.load(html)
        let dict = createTableDict($,'.infobox, wikitable')
        expect(JSON.stringify([... dict])).toBe(expectedDict)
    })
    test('getErrorResponse error object as expected',()=>{
        let r = getErrorResponse("message", "query")
        expect(r.error).toEqual("message")
        expect(r.query).toEqual("query")
    })
    test('getHtml', async ()=>{
        fetch.mockImplementation((url)=>Promise.resolve({text:jest.fn(()=>Promise.resolve(url))}))
        let html = await getHtml("url")
        expect(html).toEqual("url")
        expect(fetch).toHaveBeenCalledTimes(1)
    })
})