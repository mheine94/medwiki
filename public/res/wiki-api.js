import {Resolver, unique, getErrorResponse, getHtml, promiseAllLimitConcurrency } from './util.js'
import { VERSION,APP_NAME,USER_AGENT, PAGE_URL, SEARCH_URL, MEDS_CATEGORY_DE, ALL_MEDS_URL , opts} from './config.js'

let resolver = Resolver()
let jobID = 0;


/**
   * Parses the infobox of a table and and returs a dict containing the table 
   * information.
   *
   * @param {Cheerio.$} $ The cheerio instance
   * @param {string} tableSelector The jQuery selector
   * @returns {object} The TableDict contains a key for each table heading.
   */
  function createTableDict (dom, tableSelector) {

    let table = dom.querySelector(tableSelector);
    if(table != null){
      table.querySelectorAll('sup').forEach(el => el.remove())
      let dict = new Map();
      table.querySelectorAll('tr').forEach((elem,index) => {
      let tableRow = elem;
          let rowData = tableRow.querySelectorAll('td, th');
          rowData.forEach(el=> el.querySelectorAll("br").forEach(br=>br.replaceWith('\n')))
          //rowData.find("br").replaceWith('\n');
          if (rowData.length > 1) {
            dict.set(
              rowData[0].textContent.trim().toLowerCase(),
              rowData[1].textContent.trim()
            );
          } else if(index == 0 && rowData.length > 0 && rowData.textContent != null){
            dict.set("tableHeader", rowData.textContent.trim())
          }
        });
        return dict;
    }
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

async function wikipediaSearch(query, lang) {
    try {
      if (query == undefined || query == null || query === "") {
        throw new Error("Empty query")
      }    
      //let url = new URL(`/w/api.php?action=query&list=search&srsearch=${query}&utf8=&format=json`,`https://${lang}.wikipedia.org/`)
      let url = new URL(SEARCH_URL.replace('${lang}',lang).replace('${query}',query))
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
            let url = new URL(PAGE_URL.replace('${lang}',lang).replace('${title}',pageTitle))
            let apiResponse = await getHtml(url)
            let apiResponseJson = JSON.parse(apiResponse)
            let pageHtmlString = apiResponseJson.parse.text["*"]
            let domparser = new DOMParser()
            let pageHtml = domparser.parseFromString(pageHtmlString, "text/html")
            //let pageHtml = $.parseHTML(pageHtmlString)
            //const jq = $(pageHtml);
  
            let infoDict = createTableDict(pageHtml, '.infobox, .wikitable');
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
  
async function wikipediaSearchAdapter(data) {
  let result = await wikipediaSearch(data.query, data.lang)
  return {query:data.query, result:result}
}
function wikipediaSearchParameterWrap(medicationName, lang) {
  return {query:medicationName,lang:lang}
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
async function wikiApi(medicationNames, lang) {
  let wrappedParams = medicationNames.map(e => wikipediaSearchParameterWrap(e, lang))
  let promise = promiseAllLimitConcurrency(wrappedParams, wikipediaSearchAdapter, 10)
  let result = await(promise)
  let innDict = createInnDict(result)
  return innDict 
}



function parsePage(pageHtml){
    const $ = cheerio.load(pageHtml);
    const categoryGs= $('.mw-category-group')
    const as = categoryGs.find('a')
    
    const allTitlesOnPage = as.filter(function(index, element){
        return $(element).attr('title') != null
    }).map(function(index, element){
        return $(element).attr('title');
    })
    return allTitlesOnPage;
}
async function allMeds(lang){
    if(lang!="de"){
      throw new Error("only german is supported at the moment")
    }    
    ;
    //let url = new URL(`https://${lang}.wikipedia.org/w/index.php?title=Kategorie:Arzneistoff`)
    let baseUrl = ALL_MEDS_URL.replace('${lang}',lang).replace('${medsCategory}',MEDS_CATEGORY_DE)
    let url = new URL(baseUrl)
    let continueString;
    let names= [];
   do {
      if(continueString){
        url = new URL(baseUrl + "&cmcontinue=" + continueString)
      }
      let apiResponse = await getHtml(url) 
      let jsonApiResponse = JSON.parse(apiResponse)
      let categorymembers=  jsonApiResponse.query.categorymembers
      names.push(categorymembers)
      
      if(jsonApiResponse.continue){
        continueString = jsonApiResponse.continue.cmcontinue
      }else{
        continueString = undefined
      }
   }while(continueString!= undefined)
   let pageNames = names.flat().map(e=>e.title)
   return pageNames;
}
async function getAllMedsPage(lang,from){
      
      console.log("loading from name: "+from)
      return await (await fetch(url.toString())).text()   
}
async function wikiAllRequestHandler(lang){
  try{
    let result = await allMedsExtracted(lang) 
    return result;
  } catch (ex) {
    console.log(ex)
    res.json({
      error: ex,
      query: "all-query"
    })
  }

}
async function allMedsExtracted(lang){
    const medicationNames = await allMeds(lang)   
    let result = await wikiApi(medicationNames,lang)
    return result
}
/**
 * Handles the http requests to the wikipediaApi
 *
 * @param {*} req {@link express} the express request object
 * @param {*} res the express result object
 */
async function wikiApiRequestHandler (query,lang){
  try {
   
    if ((query == undefined || query == null)) {
      throw new Error("No query.")
    }
    let result = await wikiApi(query,lang)
    return result
  } catch (ex) {
    return {
      error: ex,
      query: query ? query : ''
    }
  }
}


export { allMeds, allMedsExtracted, createInnDict,createTableDict,parsePage, wikiAllRequestHandler,wikiApi,wikiApiRequestHandler, wikipediaSearch}