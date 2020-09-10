const {createInnDict} = require('../src/api/wikiAPI')
const {data} = require('./wikiApi-test-data')

describe('WikiAPI tests', ()=>{
    test('ceate INNDict with two entries', ()=>{
        console.log("Bongpo")
        expect(createInnDict(data.sameInn.input)).toEqual(data.sameInn.output)        
    })
})