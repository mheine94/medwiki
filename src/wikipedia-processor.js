const https = require('https')
const cheerio = require('cheerio')
require('events').EventEmitter.prototype._maxListeners = 0;
function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (resp) => {
      let data = '';

      resp.on('data', (chunk) => {
        data += chunk;
      });
      resp.on('end', () => {
        try {
          resolve(data)
        } catch (ex) {
          reject(data)
        }
      })
      })})
}
 function getErrorResponse (message, query) {
  return {
    error: message,
    query: query
}
}
 function getHtmlPage(title, lang) {
    return get('https://' + lang + '.wikipedia.org/wiki/' + title)
  }
  function search(term, lang) {
    return get('https://' + lang + '.wikipedia.org/w/api.php?action=query&list=search&srsearch=' + term + '&utf8=&format=json')
  }
  
  /**
   * Parses the infobox of a table and and returs a dict containing the table 
   * information.
   *
   * @param {Cheerio.$} $ The cheerio instance
   * @param {string} tableSelector The jQuery selector
   * @returns {object} The TableDict contains a key for each table heading.
   */
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



  /**
   * Searches wikipedia with the query and if the page has an infobox parses
   * inn, drugclass, cas, atc and the sum formula. If the first result doesn't have
   * an infobox then the next pages in the wikipedia search will be analysed instead.
   *
   * @param {string} query The medication name that will be searched for.
   * @param {string} lang ("en", "de") The language in wich wikipedia will be searched.
   * @returns {object} searchResult An object containing the parsed information or an error object.
   */
  async function wikipediaSearch(query, lang){
    try {
      if (query == undefined || query == null || query === "") {
        return getErrorResponse("Empty query", query)
      }
      let res = await search(query, lang)
  
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
                return getErrorResponse('Page: "' + pageTitle + '" has no infobox.', query);
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
  
            if (query.toLowerCase() !== inn.toLowerCase()) {
              tradenames = []
              tradenames.push(query)
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
          } catch (ex) {
            console.error(ex)
            return getErrorResponse(ex.message, query)
          }
        } else {
          return getErrorResponse("Nothing was found on wikipedia", query)
        }
      } else {
        return getErrorResponse("Nothing was found on wikipedia", query)
  
      }
    } catch (ex) {
      console.error(ex)
      return getErrorResponse(ex.message, query)
    }
  }
  module.exports = async function(job){
    console.log(`wikiSearch:`,job.data)
    let res = await wikipediaSearch(job.data.word,job.data.lang)
    return res
  }