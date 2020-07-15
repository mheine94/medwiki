const cheerio = require('cheerio')
const https = require('https')
const { futimesSync } = require('fs')

module.exports = async (req, res) => {
  try {
    let query = req.query.query ? req.query.query : ''
    let lang = req.query.lang ? req.query.lang : 'en'
    let body = req.body

    if (query == undefined | query == null) {
      res.status(501)
    }
    res.status(200)

    let result;

    if (body) {
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
      result = await mutliSearch(queryWords, lang)
    } else {
      let queryWords = query.split(',');
      console.log("Get query list", queryWords)
      if (queryWords.length > 1) {
        result = await mutliSearch(queryWords, lang)
      } else {
        result = await apiSearch(query, lang)
      }
    }
    res.statusCode = 200
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
      query: query
    })
  }
}

Array.prototype.unique = function () {
  return this.filter(function (value, index, self) {
    return self.indexOf(value) === index;
  });
}


async function mutliSearch(querySplit, lang) {
  let queryPromises = querySplit.map(q => new Promise(async (resolve) => {
    let res = await apiSearch(q, lang)
    resolve({ query: q, result: res })
  }))
  let queryResults = await Promise.all(queryPromises)
  let innDict = {}
  queryResults.forEach((res) => {
    let v = res.result

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




async function apiSearch(word, lang) {
  try {
    if (word == undefined || word == null || word === "") {
      return getErrorResponse("No search word", word)
    }
    let res = await search(word, lang)

    let searchresult = JSON.parse(res)
    if (searchresult && searchresult.query && searchresult.query.searchinfo && searchresult.query.searchinfo.totalhits > 0) {
      if (searchresult.query.search[0]) {
        try {
          let page = searchresult.query.search[0]
          let pageTitle = page.title

          let inn = null
          let tradenames = []
          let drugClass = []
          let casn = []
          let atcc = []
          let formula = []

          // check for link to a "brand names"-page and move on with the INN-page to get all information
          if (pageTitle.includes(' brand names')) {
            // depcrecated: tradenames.push(word)
            pageTitle = page.title.substring(0, page.title.search(' brand names'))
          }

          let pageHtml = await getHtmlPage(pageTitle, lang)
          const $ = cheerio.load(pageHtml);

          // let hasInfobox = $('.infobox').length > 0
          // if (!hasInfobox)
          //   throw new Error('Page: "' + pageTitle + '" has no infobox.')

          let infoDict = createTableDict($, '.infobox');
          if (!infoDict)
            throw new Error('Page: "' + pageTitle + '" has no infobox.');
          // console.log(JSON.stringify(Object.fromEntries(infoDict.entries()), null, 2));

          let drugClassBox;
          switch (lang) {
            case 'de':
              let inName = $('a[title="Internationaler Freiname"]', '.infobox').first().parent().next('td').text();
              if (inName) {
                inn = inName.replace(/\n/g, '');
              } else {
                inName = infoDict.get('name');
                if (inName) {
                  inn = inName.replace(/\n/g, '');
                }
              }
              drugClassBox = $('a[title="Wirkstoffklasse"]', '.infobox').parent().next('td');
              if (drugClassBox.children('ul').length > 0) {
                drugClass = drugClassBox.find('li').map((i, el) => {
                  return $(el).text()
                }).toArray()
              } else {
                drugClass.push(drugClassBox.find('a').first().text().replace(/\n/g, ''))
              }
              let isList_casn = $('a[title="CAS-Nummer"]', '.infobox').parent().next('td').children('ul').length > 0
              if (isList_casn) {
                casn = $('a[title="CAS-Nummer"]', '.infobox').parent().next('td').find('li').map((i, el) => {
                  return $(el).text()
                }).toArray()
              } else {
                casn.push($('a[title="CAS-Nummer"]', '.infobox').parent().next('td')[0].childNodes[0].data.replace(/\n/g, ''))
              }
              let isList_atc = $('a[title="Anatomisch-Therapeutisch-Chemisches Klassifikationssystem"]', '.infobox').parent().next('td').children('ul').length > 0
              if (isList_atc) {
                atcc = $('a[title="Anatomisch-Therapeutisch-Chemisches Klassifikationssystem"]', '.infobox').parent().next('td').find('li').map((i, el) => {
                  return $(el).text()
                }).toArray()
              } else {
                atcc.push($('a[title="Anatomisch-Therapeutisch-Chemisches Klassifikationssystem"]', '.infobox').parent().next('td').find('a').text().replace(/\n/g, ''))
              }

              let isList_formula = $('a[title="Summenformel"]', '.infobox').parent().next('td').children('ul').length > 0
              if (isList_formula) {
                formula = $('a[title="Summenformel"]', '.infobox').parent().next('td').find('li').map((i, el) => {
                  return $(el).text()
                }).toArray()
              } else {
                formula.push($('a[title="Summenformel"]', '.infobox').parent().next('td').text().replace(/\n/g, ''))
              }
              break;
            default:

              inn = $('caption', '.infobox').text()
              if (!tradenames) {
                tradenames = $('a[title="Drug nomenclature"]', '.infobox').parent().next('td')[0].childNodes[0].data.split(',').map(s => s.trim()).filter(s => s.length > 0)
              }
              drugClassBox = $('a[title="Drug class"]', '.infobox').parent().next('td');
              if (drugClassBox.children('ul').length > 0) {
                drugClass = drugClassBox.find('li').map((i, el) => {
                  return $(el).text()
                }).toArray()
              } else {
                drugClass.push(drugClassBox.first().text().replace(/\n/g, ''))
              }
              casn = $('a[title="CAS Registry Number"]', '.infobox').parent().next('td').find('li').map((i, el) => {
                return $($(el).find('span')[0]).text()
              }).toArray()
              atcc = $('a[title="Anatomical Therapeutic Chemical Classification System"]', '.infobox').parent().next('td').find('li').children().filter('a').map((i, el) => {
                return $(el).text()
              }).toArray()
              formula.push($('a[title="Chemical formula"]', '.infobox').parent().next('td').text().replace(/\n/g, ''))
          }

          if (word.toLowerCase() !== inn.toLowerCase()) {
            tradenames = []
            tradenames.push(word)
          }

          let result = {
            "tradenames": tradenames,
            "ingredientClass": drugClass,
            "cas": casn,
            "atc": atcc,
            "formula": formula,
            "inn": inn
          }
          return result
          console.log(result)
        } catch (ex) {
          console.error(ex)
          return getErrorResponse(ex.message, word)
        }
      } else {
        return getErrorResponse("Nothing was found on wikipedia", word)
      }
    } else {
      return getErrorResponse("Nothing was found on wikipedia", word)

    }
  } catch (ex) {
    console.error(ex)
    return getErrorResponse(ex.message, word)
  }
}

function createTableDict($, tableSelector) {
  let table = $(tableSelector).first();
  if (table.length > 0) {
    let dict = new Map();
    table.find('tr').each((index, elem) => {
      let tableRow = $(elem);
      if (tableRow.closest('table').is(table)) {
        let rowData = tableRow.children('td');
        if (rowData.length > 1) {
          dict.set(rowData.eq(0).text().trim().toLowerCase(), rowData.eq(1).text());
        }
      }
    });
    return dict;
  }
}


function getErrorResponse(message, query) {
  return {
    error: message,
    query: query
  }
}
