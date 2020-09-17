const {createInnDict, mapToResult,wikiApiRequestHandler, wikiApi} = require('../src/api/wikiAPI')
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
    test('unknown result in data', ()=>{
        expect(createInnDict(data.unknowResults.input)).toEqual(data.unknowResults)
    })
})

describe('mapToResult tests',()=>{
     let mockFinish =  jest.fn(()=>{return Promise.resolve("success")})
        let mockAdd =  jest.fn(function(jobObj) {  let res = Promise.resolve(
                    {
                        jobObj : jobObj,
                        finished:()=> mockFinish()
                    })
                return res
        })
    beforeAll(() => {
        Queue.mockImplementation(()=>
        {
         return  {
             add : (jobObj)=>{return mockAdd(jobObj)}
         }
        })
    });
    beforeEach(() => {
  // Clear all instances and calls to constructor and all methods:
  Queue.mockClear();
  mockAdd.mockClear();
  mockFinish.mockClear();
});

   test('queue functionss are called and awaited and result as expected', async ()=>{

      let promises = mapToResult(["Amoxicillin","Nurofen"], "de")
      let result = await Promise.all(promises)
      expect(result).toEqual([{query:"Amoxicillin",result:"success"},{query:"Nurofen",result:"success"}])
      expect(Queue).toHaveBeenCalledTimes(1);   
      expect(mockAdd).toHaveBeenCalledTimes(2);
      expect(mockFinish).toHaveBeenCalledTimes(2);
   }) 

   test('wikiAPI test', ()=>{
       let r = wikiApi(data.wikiApi.input.medicationNames, data.wikiApi.input.lang)
       expect(Queue).toHaveBeenCalledTimes(1)
       expect(mockAdd).toHaveBeenCalledTimes(data.wikiApi.input.medicationNames.length)
       for(i=0; i< data.wikiApi.input.medicationNames.length;i++){
            expect(mockAdd.mock.calls[i][0]).toEqual({lang:data.wikiApi.input.lang,word:data.wikiApi.input.medicationNames[i]})
       }
   })

   describe('wikiAPI request handler tests',()=>{
            let req = {
               body:{},
               query:{
                   lang:undefined,
                   query:undefined
               },
               params:{
                   lang:data.requestHandler.input.lang,
                   query:data.requestHandler.input.query
               }
           }
           let res = {
               status: jest.fn((status)=>status),
               send: jest.fn((data)=>data),
               setHeader: jest.fn((name,value)=>[name,value]),
               json: jest.fn((data)=>data)
           }
           beforeEach(()=>{
               res.status.mockClear()
               res.send.mockClear()
               res.setHeader.mockClear()
               res.json.mockClear()
           })

       test('get request url params', async ()=>{
            let r = await wikiApiRequestHandler(req, res)
            expect(Queue).toHaveBeenCalledTimes(2)
            expect(mockAdd).toHaveBeenCalledTimes(1)
            let querySplit = data.requestHandler.input.query.split(/,/g)
            expect(mockAdd.mock.calls[0][0]).toEqual({lang:data.requestHandler.input.lang,querySplit:querySplit})
            expect(querySplit.length).toBe(2)
            expect(mockFinish).toHaveBeenCalledTimes(1)
            let r2 = await mockFinish.mock.results[0].value
            expect(res.send).toHaveBeenCalledTimes(1)
            expect(res.json).toHaveBeenCalledTimes(0)
            expect(res.send.mock.calls[0][0]).toEqual(JSON.stringify(r2,null,4));
       })

       test('undefined query returns error responese with status 501', async ()=>{
           let p_old = req.params.query
           req.params.query = undefined
           let r = await wikiApiRequestHandler(req,res)
           expect(res.status).toHaveBeenCalledTimes(1)
           expect(res.status.mock.calls[0][0]).toBe(501)
           expect(res.json).toHaveBeenCalledTimes(1)
           expect(res.json.mock.calls[0][0].error!=undefined).toBe(true)
           req.params.query= p_old
       })
       test('request query params', async ()=> {
            req.query.query = data.requestHandler.input.query
            req.query.lang = data.requestHandler.input.lang
            let r = await wikiApiRequestHandler(req,res)
            expect(Queue).toHaveBeenCalledTimes(2)
            expect(mockAdd).toHaveBeenCalledTimes(1)
            let querySplit = data.requestHandler.input.query.split(/,/g)
            expect(mockAdd.mock.calls[0][0]).toEqual({lang:data.requestHandler.input.lang,querySplit:querySplit})
            expect(querySplit.length).toBe(2)
            expect(mockFinish).toHaveBeenCalledTimes(1)
            let r2 = await mockFinish.mock.results[0].value
            expect(res.send).toHaveBeenCalledTimes(1)
            expect(res.json).toHaveBeenCalledTimes(0)
            expect(res.send.mock.calls[0][0]).toEqual(JSON.stringify(r2,null,4));
       })
        test('request query params', async ()=> {
            req.query.query = data.requestHandler.input.query
            req.query.lang = undefined 
            req.params.lang = undefined
            let r = await wikiApiRequestHandler(req,res)
            expect(Queue).toHaveBeenCalledTimes(2)
            expect(mockAdd).toHaveBeenCalledTimes(1)
            let querySplit = data.requestHandler.input.query.split(/,/g)
            expect(mockAdd.mock.calls[0][0]).toEqual({lang:'en',querySplit:querySplit})
            expect(querySplit.length).toBe(2)
            expect(mockFinish).toHaveBeenCalledTimes(1)
            let r2 = await mockFinish.mock.results[0].value
            expect(res.send).toHaveBeenCalledTimes(1)
            expect(res.json).toHaveBeenCalledTimes(0)
            expect(res.send.mock.calls[0][0]).toEqual(JSON.stringify(r2,null,4));
       })
   })
})