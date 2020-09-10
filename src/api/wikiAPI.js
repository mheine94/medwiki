const Queue = require('bull');

function unique(arr) {
  return arr.filter(function (value, index, self) {
    return self.indexOf(value) === index;
  });
};

module.exports ={
/**
 * Handles the http requests to the wikipediaApi
 *
 * @param {*} req {@link express} the express request object
 * @param {*} res the express result object
 */
wikiApiRequestHandler : async function (req, res){
  try {
    let query = req.query.query ? req.query.query : req.params.query? req.params.query :''
    let lang = req.query.lang ? req.query.lang : req.params.lang? req.params.lang : 'en'
    let body = req.body

    if (query == undefined | query == null) {
      res.status(501)
    }
    res.status(200)

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
    
    res.statusCode = result.error?400:200
    res.setHeader("Content-Type", 'application/json')
    try {

      let jsonpretty = JSON.stringify(result, null, 4)
      res.setHeader("Content-Type", 'application/json')
      res.send(jsonpretty)
    } catch (exjson) {
      res.json(result)
    }
  } catch (ex) {
    console.log(ex)
    res.json({
      error: ex,
      query: req.query.query ? req.query.query : ''
    })
  }
},

mapToResult : function (medicationNames, lang){
  let wikiQ = new Queue("wikiQ")
  let queryPromises = medicationNames.map(q => new Promise(async (resolve) => {
      let job = await  wikiQ.add({word:q,lang:lang})
      let res = await job.finished()
      resolve({ query: q, result: res })
    }))
  return queryPromises
},

/**
 * Searches every medication name in the medicationNames array with 
 * the wikipediaSearch function. It aggregates the results so that two medications
 * with the same inn are grouped together in one object in the result.
 *
 * @param {Array<string>} medicationNames Array of medicationNames that will be searched on wikipedia.
 * @param {string} lang ("en" | "de") The language in wich wikipedia will be queried.
 * @returns {object} innDict Object containing one object per inn and an unknown array containing not found medications.
 */
wikiApi : async function (medicationNames,lang){
  
  let queryPromises = module.exports.mapToResult(medicationNames,lang)
  let queryResults = await Promise.all(queryPromises)
   return module.exports.createInnDict(queryResults)
},
createInnDict : function(data){
   let innDict = new Object();

    data.forEach((res) => {
      let v = res.result
  
      if(!v){
        console.log("Undefined result!")
        console.log(JSON.stringify(res, null, 4))
        return
      }

      if (v.error || !v.inn) {
        if (innDict["unknown"] == null || innDict["unknown"] == undefined) {
          innDict["unknown"] = []
        }
        innDict["unknown"].push(res.query)
      } else {
        if (v.inn && innDict[v.inn.toLowerCase()]) {
          if (v.ingredientClass) {
            Array.prototype.push.apply(innDict[v.inn.toLowerCase()].ingredientClass, v.ingredientClass)
            innDict[v.inn.toLowerCase()].ingredientClass = unique(innDict[v.inn.toLowerCase()].ingredientClass)
          }
          if (v.formula) {
            Array.prototype.push.apply(innDict[v.inn.toLowerCase()].formula, v.formula)
            innDict[v.inn.toLowerCase()].formula = unique(innDict[v.inn.toLowerCase()].formula)
          }
          if (v.tradenames) {
            Array.prototype.push.apply(innDict[v.inn.toLowerCase()].tradenames, v.tradenames)
            innDict[v.inn.toLowerCase()].tradenames = unique(innDict[v.inn.toLowerCase()].tradenames)
          }
          if (v.cas) {
            Array.prototype.push.apply(innDict[v.inn.toLowerCase()].cas, v.cas)
            innDict[v.inn.toLowerCase()].cas = unique(innDict[v.inn.toLowerCase()].cas)
          }
          if (v.atc) {
            Array.prototype.push.apply(innDict[v.inn.toLowerCase()].atc, v.atc)
            innDict[v.inn.toLowerCase()].atc = unique(innDict[v.inn.toLowerCase()].atc)
          }
        } else {
          if (v.inn) {
            let entry =
            {
              "inn": v.inn.toLowerCase(),
              "ingredientClass": [],
              "tradenames": [],
              "formula": [],
              "cas": [],
              "atc": []
            }
            if (v.ingredientClass) {
              Array.prototype.push.apply(entry.ingredientClass, v.ingredientClass)
              entry.ingredientClass = unique(entry.ingredientClass)
            }
            if (v.formula) {
              Array.prototype.push.apply(entry.formula, v.formula)
              entry.formula = unique(entry.formula)
            }
            if (v.cas) {
              Array.prototype.push.apply(entry.cas, v.cas)
              entry.cas = unique(entry.cas)
            }
            if (v.atc) {
              Array.prototype.push.apply(entry.atc, v.atc)
              entry.atc = unique(entry.atc)
            }
            if (v.tradenames) {
              Array.prototype.push.apply(entry.tradenames, v.tradenames)
              entry.tradenames = unique(entry.tradenames)
            }
            innDict[v.inn.toLowerCase()] = entry
          }
        }
      }
  
    })
    return innDict
  
}
}
