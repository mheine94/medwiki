const Queue = require('bull');

function unique(arr) {
  return arr.filter(function (value, index, self) {
    return self.indexOf(value) === index;
  });
};

module.exports ={
 wikiApiRequestHandler:wikiApiRequestHandler,
mapToResult:mapToResult,
wikiApi:wikiApi,
createInnDict:createInnDict  
}

function createInnDict(data){
   return data.reduce((previousValue, currentValue)=>{
     let {result,query} = currentValue
     let innDict = previousValue
      if(!result){
        console.log("Undefined result!")
        console.log(JSON.stringify(currentValue, null, 4))
        return innDict
      }
      if (result.error || !result.inn) {
        if (innDict["unknown"] == null || innDict["unknown"] == undefined) {
          innDict["unknown"] = []
        }
        innDict["unknown"].push(query)
      } else {
        if (result.inn && innDict[result.inn.toLowerCase()]) {
          if (result.ingredientClass) {
            Array.prototype.push.apply(innDict[result.inn.toLowerCase()].ingredientClass, result.ingredientClass)
            innDict[result.inn.toLowerCase()].ingredientClass = unique(innDict[result.inn.toLowerCase()].ingredientClass)
          }
          if (result.formula) {
            Array.prototype.push.apply(innDict[result.inn.toLowerCase()].formula, result.formula)
            innDict[result.inn.toLowerCase()].formula = unique(innDict[result.inn.toLowerCase()].formula)
          }
          if (result.tradenames) {
            Array.prototype.push.apply(innDict[result.inn.toLowerCase()].tradenames, result.tradenames)
            innDict[result.inn.toLowerCase()].tradenames = unique(innDict[result.inn.toLowerCase()].tradenames)
          }
          if (result.cas) {
            Array.prototype.push.apply(innDict[result.inn.toLowerCase()].cas, result.cas)
            innDict[result.inn.toLowerCase()].cas = unique(innDict[result.inn.toLowerCase()].cas)
          }
          if (result.atc) {
            Array.prototype.push.apply(innDict[result.inn.toLowerCase()].atc, result.atc)
            innDict[result.inn.toLowerCase()].atc = unique(innDict[result.inn.toLowerCase()].atc)
          }
        } else {
          if (result.inn) {
            let entry =
            {
              "inn": result.inn.toLowerCase(),
              "ingredientClass": [],
              "tradenames": [],
              "formula": [],
              "cas": [],
              "atc": []
            }
            if (result.ingredientClass) {
              Array.prototype.push.apply(entry.ingredientClass, result.ingredientClass)
              entry.ingredientClass = unique(entry.ingredientClass)
            }
            if (result.formula) {
              Array.prototype.push.apply(entry.formula, result.formula)
              entry.formula = unique(entry.formula)
            }
            if (result.cas) {
              Array.prototype.push.apply(entry.cas, result.cas)
              entry.cas = unique(entry.cas)
            }
            if (result.atc) {
              Array.prototype.push.apply(entry.atc, result.atc)
              entry.atc = unique(entry.atc)
            }
            if (result.tradenames) {
              Array.prototype.push.apply(entry.tradenames, result.tradenames)
              entry.tradenames = unique(entry.tradenames)
            }
            innDict[result.inn.toLowerCase()] = entry
          }
        }
      }
      return innDict
   }, new Object())
}
/**
 * Searches every medication name in the medicationNames array with 
 * the wikipediaSearch function. It aggregates the results so that two medications
 * with the same inn are grouped together in one object in the result.
 *
 * @param {Array<string>} medicationNames Array of medicationNames that will be searched on wikipedia.
 * @param {string} lang ("en" | "de") The language in wich wikipedia will be queried.
 * @returns {object} innDict Object containing one object per inn and an unknown array containing not found medications.
 */
async function wikiApi(medicationNames,lang){
  
  let queryPromises = module.exports.mapToResult(medicationNames,lang)
  let queryResults = await Promise.all(queryPromises)
  let innDict = module.exports.createInnDict(queryResults)
  return innDict 
}
function mapToResult(medicationNames, lang){
  let wikiQ = new Queue("wikiQ")
  let queryPromises = medicationNames.map(q => new Promise(async (resolve) => {
      let job = await  wikiQ.add({word:q,lang:lang})
      let res = await job.finished()
      resolve({ query: q, result: res })
    }))
  return queryPromises
}
/**
 * Handles the http requests to the wikipediaApi
 *
 * @param {*} req {@link express} the express request object
 * @param {*} res the express result object
 */
async function wikiApiRequestHandler (req, res){
  try {
    let query = req.query.query ? req.query.query : req.params.query? req.params.query :undefined
    let lang = req.query.lang ? req.query.lang : req.params.lang? req.params.lang : 'en'
    let body = req.body

    res.setHeader("Content-Type", 'application/json')
    if ((query == undefined || query == null)&&Object.keys(body).length<1) {
      res.status(501)
      throw new Error("No query.")
    }

    let result;
    let wikiQ = new Queue('wikiQ')
    let wikiApiQ = new Queue("wikiApiQ")

    if (!(Object.keys(body).length === 0 && body.constructor === Object)) {
      let queryWords;
      if (body.query) {
        console.log("Post body query:", body.query)
        console.log("Post lang:", body.lang)
        queryWords = body.query;
        lang = body.lang
      } else {
        queryWords = body.replace(/\r/g, '').split(/\n/)
      }
      console.log("Post body query list", queryWords)
      let apiJob = await wikiApiQ.add({querySplit:queryWords,lang:lang})
      result = await apiJob.finished()
    } else {
      let queryWords = query.split(',');
      console.log("Get query list", queryWords)
      if (queryWords.length > 1) {
        let apiJob = await wikiApiQ.add({querySplit:queryWords,lang:lang})
        result = await apiJob.finished()
      } else {
        let wikiJob = await wikiQ.add({word:query,lang:lang})
        result = await wikiJob.finished()
      }
    }
    
    res.status(result.error?400:200)
    try {
      let jsonpretty = JSON.stringify(result, null, 4)
      res.send(jsonpretty)
    } catch (exjson) {
      res.json(result)
    }
  } catch (ex) {
    res.json({
      error: ex,
      query: req.query.query ? req.query.query : ''
    })
  }
}