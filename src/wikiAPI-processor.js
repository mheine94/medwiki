const Queue = require('bull')

Array.prototype.unique = function () {
  return this.filter(function (value, index, self) {
    return self.indexOf(value) === index;
  });
}

module.exports = async function(job){
    console.log("wikiApi:",job.data)
    const lang = job.data.lang
    const querySplit = job.data.querySplit
    let res = await wikiApi(querySplit,lang)
    return res
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
   * Searches every medication name in the medicationNames array with 
   * the wikipediaSearch function. It aggregates the results so that two medications
   * with the same inn are grouped together in one object in the result.
   *
   * @param {Array<string>} medicationNames Array of medicationNames that will be searched on wikipedia.
   * @param {string} lang ("en" | "de") The language in wich wikipedia will be queried.
   * @returns {object} innDict Object containing one object per inn and an unknown array containing not found medications.
   */
  async function wikiApi(medicationNames,lang){
    
    let queryPromises = mapToResult(medicationNames,lang)
    let queryResults = await Promise.all(queryPromises)
    let innDict = new Object();

      queryResults.forEach((res) => {
        let v = res.result
    
        if(!v){
          console.log("Undefined result!")
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
              innDict[v.inn.toLowerCase()].ingredientClass = innDict[v.inn.toLowerCase()].ingredientClass.unique()
            }
            if (v.formula) {
              Array.prototype.push.apply(innDict[v.inn.toLowerCase()].formula, v.formula)
              innDict[v.inn.toLowerCase()].formula = innDict[v.inn.toLowerCase()].formula.unique()
            }
            if (v.tradenames) {
              Array.prototype.push.apply(innDict[v.inn.toLowerCase()].tradenames, v.tradenames)
              innDict[v.inn.toLowerCase()].tradenames = innDict[v.inn.toLowerCase()].tradenames.unique()
            }
            if (v.cas) {
              Array.prototype.push.apply(innDict[v.inn.toLowerCase()].cas, v.cas)
              innDict[v.inn.toLowerCase()].cas = innDict[v.inn.toLowerCase()].cas.unique()
            }
            if (v.atc) {
              Array.prototype.push.apply(innDict[v.inn.toLowerCase()].atc, v.atc)
              innDict[v.inn.toLowerCase()].atc = innDict[v.inn.toLowerCase()].atc.unique()
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
                entry.ingredientClass = entry.ingredientClass.unique()
              }
              if (v.formula) {
                Array.prototype.push.apply(entry.formula, v.formula)
                entry.formula = entry.formula.unique()
              }
              if (v.cas) {
                Array.prototype.push.apply(entry.cas, v.cas)
                entry.cas = entry.cas.unique()
              }
              if (v.atc) {
                Array.prototype.push.apply(entry.atc, v.atc)
                entry.atc = entry.atc.unique()
              }
              if (v.tradenames) {
                Array.prototype.push.apply(entry.tradenames, v.tradenames)
                entry.tradenames = entry.tradenames.unique()
              }
              innDict[v.inn.toLowerCase()] = entry
            }
          }
        }
    
      })
      return innDict
  }