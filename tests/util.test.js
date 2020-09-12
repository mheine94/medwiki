const {html, expectedDict} = require('./util-test-data')
const cheerio = require('cheerio')
const {createTableDict} = require('../src/util')
describe('Utility function tests',()=>{
    test('Tabledict parses table as exprected', ()=>{
        let $ = cheerio.load(html)
        let dict = createTableDict($,'.infobox, wikitable')
        expect(JSON.stringify([... dict])).toBe(expectedDict)
    })
})