const https = require('https')
const cheerio = require('cheerio')
const fetch = require("node-fetch")
const config = require('../../config')

const {getErrorResponse, getHtml, createTableDict} = require('../util')

module.exports = {
  wikipediaSearch:wikipediaSearch  
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
        throw new Error("Empty query")
      }    
      //let url = new URL(`/w/api.php?action=query&list=search&srsearch=${query}&utf8=&format=json`,`https://${lang}.wikipedia.org/`)
      let url = new URL(config.SEARCH_URL.replace('${lang}',lang).replace('${query}',query))
      let res = await getHtml(url) 
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
            throw new Error("Nothing was found on wikipedia")
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
            //let url = new URL(`/wiki/${pageTitle}`,`https://${lang}.wikipedia.org/`)
            let url = new URL(config.PAGE_URL.replace('${lang}',lang).replace('${title}',pageTitle))
            let pageHtml = await getHtml(url)
            const $ = cheerio.load(pageHtml);
  
            let infoDict = createTableDict($, '.infobox, wikitable');
            if (!infoDict)
              continue;
  
            let drugClassBox;
            switch (lang) {
              case 'de':
                inn = infoDict.get("freiname") || infoDict.get("name") || infoDict.get("tableHeader") || "";
  
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
        throw new Error("Nothing was found on wikipedia")
      } else {
        throw new Error("Nothing was found on wikipedia")
      }
    } catch (ex) {
      return getErrorResponse(ex.message, query)
    }
  }