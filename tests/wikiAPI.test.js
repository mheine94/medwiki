const {createInnDict, mapToResult} = require('../src/api/wikiAPI')
const {data} = require('./wikiApi-test-data')
const Queue = require('bull')
jest.mock('bull')

describe('INNDict tests', ()=>{
    test('ceate INNDict with two mediactions of the same inn', ()=>{
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

describe('mapToResult tests',()=>{
   test('queue functionss are called and awaited and result as expected', async ()=>{
        let mockFinish =  jest.fn(()=>{return Promise.resolve("success")})
        let mockAdd =  jest.fn(function() {  let res = Promise.resolve(
                    {
                        finished:()=> mockFinish()
                    })
                return res
        })
       Queue.mockImplementation(()=>
       {
        return  {
            add : ()=>{return mockAdd()}
        }
       })
      let promises = mapToResult(["Amoxicillin","Nurofen"], "de")
      let result = await Promise.all(promises)
      expect(result).toEqual([{query:"Amoxicillin",result:"success"},{query:"Nurofen",result:"success"}])
      expect(Queue).toHaveBeenCalledTimes(1);   
      expect(mockAdd).toHaveBeenCalledTimes(2);
      expect(mockFinish).toHaveBeenCalledTimes(2);
   }) 
})