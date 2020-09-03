const https = require('https')
const cheerio = require('cheerio')
const fetch = require("node-fetch")
const opts = {
  headers:{'User-Agent': process.env.USER_AGENT}
}

require('events').EventEmitter.prototype._maxListeners = 0;

function getErrorResponse(message, query) {
  return {
    error: message,
    query: query
  }
}
async function getHtmlPage(title, lang) {
  let url = new URL(`/wiki/${title}`,`https://${lang}.wikipedia.org/`)
  let userAg = process.env.USER_AGENT
  return await (await fetch(url.toString(),opts)).text()
}
async function search(term, lang) {
  let url = new URL(`/w/api.php?action=query&list=search&srsearch=${term}&utf8=&format=json`,`https://${lang}.wikipedia.org/`)
  return await (await fetch(url.toString(),opts)).text()
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
  table.find('sup').remove();
  if (table.length > 0) {
    let dict = new Map();
    table.find('tr').each((index, elem) => {
      let tableRow = $(elem);
      let rowData = tableRow.children('td, th');
      if (rowData.length > 1) {
        dict.set(
          rowData.eq(0).text().trim().toLowerCase(),
          rowData.eq(1).text().trim()
        );
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
async function wikipediaSearch(query, lang) {
  try {
    if (query == undefined || query == null || query === "") {
      return getErrorResponse("Empty query", query)
    }
    let res = await search(query, lang)
    let searchresult
try{
    searchresult = JSON.parse(res)
}catch (jsonEx){
  console.log(jsonEx.message)
  throw new Error("Cant parse wikipedia api response!")
}
    if (searchresult && searchresult.query && searchresult.query.searchinfo && searchresult.query.searchinfo.totalhits > 0) {
      for (let searchElem in searchresult.query.search) {
        if (!(searchElem < 5)) {
          return getErrorResponse("Nothing was found on wikipedia", query);
        }
        else {
          let page = searchresult.query.search[searchElem];
          let pageTitle = page.title;

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
            continue;
          // console.log(JSON.stringify(Object.fromEntries(infoDict.entries()), null, 2));

          let drugClassBox;
          switch (lang) {
            case 'de':
              inn = infoDict.get("freiname") || infoDict.get("name") || "";

              if (infoDict.has('wirkstoffklasse')) {
                drugClass = infoDict.get('wirkstoffklasse').split('\n');
              }

              if (infoDict.has('cas-nummer')) {
                casn = infoDict.get('cas-nummer').split('\n');
              }

              if (infoDict.has('atc-code')) {
                atcc = infoDict.get('atc-code').split('\n');
              }

              if (infoDict.has('summenformel')) {
                formula = infoDict.get('summenformel').split('\n');
              }

              break;
            default:

              inn = $('caption', '.infobox').text()
              if (!tradenames) {
                tradenames = $('a[title="Drug nomenclature"]', '.infobox').parent().next('td')[0].childNodes[0].data.split(',').map(s => s.trim()).filter(s => s.length > 0)
              }

              if (infoDict.has('drug class')) {
                drugClass = infoDict.get('drug class').split('\n');
              }

              if(infoDict.has('cas number')) {
                casn = infoDict.get('cas number').split('\n');
              }

              if (infoDict.has('atc code')) {
                atcc = infoDict.get('atc code').replace(/\(.*?\)|,/g, ' ').trim().split(/\s+/g);
              }

              if (infoDict.has('formula')) {
                formula = infoDict.get('formula').split('\n');
              }
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
          return result;
        }
      }
    } else {
      return getErrorResponse("Nothing was found on wikipedia", query);
    }
  } catch (ex) {
    return getErrorResponse(ex.message, query)
  }
}

module.exports = async function (job) {
  console.log(`wikiSearch:`, job.data)
  let res = await wikipediaSearch(job.data.word, job.data.lang)
  return res
}