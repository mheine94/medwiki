const {createInnDict} = require('../src/api/wikiAPI')
const {data} = require('./wikiApi-test-data')

describe('WikiAPI tests', ()=>{
    test('ceate INNDict with two mediactions of the same inn', ()=>{
        console.log("Bongpo")
        expect(createInnDict(data.sameInn.input)).toEqual(data.sameInn.output)        
    })
    test('create INNDict with two medication of different inns', ()=>{
        expect(createInnDict(data.diffrentInn.input)).toEqual(data.diffrentInn.output)
    })
    test('create INNDict with unknown value should create unknown array', ()=>{
        expect(createInnDict(data.unknownInn.input)).toEqual(data.unknownInn.output)
    })
    test('create INNDict with known and unknow inn entries', ()=>{
        expect(createInnDict(data.unknownInnAndKnown.input)).toEqual(data.unknownInnAndKnown.output)
    })
})