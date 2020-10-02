const VERSION="0.0.0"
const APP_NAME="Wikipedia-Medication-Extractor"
//need custom useragent to prevent errors with wikipedia
//https://meta.wikimedia.org/wiki/User-Agent_policy
const USER_AGENT_CONTACT="https://medication-wiki-api.uni-muenster.de"
const USER_AGENT = `${APP_NAME}_bot/${VERSION} (${USER_AGENT_CONTACT})`
//const PAGE_URL="https://${lang}.wikipedia.org/wiki/${title}?origin=*"
const PAGE_URL="https://${lang}.wikipedia.org/w/api.php?action=parse&section=0&prop=text&page=${title}&origin=*&format=json"
const SEARCH_URL="https://${lang}.wikipedia.org/w/api.php?action=query&list=search&origin=*&srsearch=${query}&utf8=&format=json"
const MEDS_CATEGORY_DE="Kategorie:Arzneistoff"
const ALL_MEDS_URL="https://${lang}.wikipedia.org/w/api.php?action=query&list=categorymembers&cmtitle=${medsCategory}&origin=*&format=json&cmlimit=max"
//const ALL_MEDS_URL="https://${lang}.wikipedia.org/w/index.php?title=${medsCategory}"
const PORT="8079"
const ADRESS="126.0.0.1"

const CACHE_EXPIRE="0 week"


const formSearch = document.getElementById('formSearch');
const textareaOutput = document.getElementById('textareaOutput');
const btnReset = document.getElementById('btnReset');
const btnAll = document.getElementById('btnAll');
const textareaQuery = document.getElementById('textareaQuery');


function Resolver(){
  let cb = (callback, data)=> callback(data)
  let waitingPromises = {}
  let resolverFuncs= {
      register: (id)=> {
        return new Promise(resolve=>{ 
          let pcb = cb.bind(this,resolve)
          waitingPromises[id]= pcb
      })
    },
    resolve : (id, data)=>{
      waitingPromises[id](data)
      waitingPromises[id]=undefined
    }
  }
  return resolverFuncs
}

let resolver = Resolver()
let jobID = 0;

function unique(arr) {
    return arr.filter(function (value, index, self) {
      return self.indexOf(value) === index;
    });
  };


const opts = {
    mode: 'cors',
    headers:
        {
            'User-Agent': USER_AGENT,
            'Origin':'*'
        }
  }

  function getErrorResponse(message, query) {
    return {
      error: message,
      query: query
    }
  }
 async function getHtml(url){
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
  function createTableDict (instance, tableSelector) {
    let table = instance.find(tableSelector).first();
    table.find('sup').remove();
    if (table.length > 0) {
      let dict = new Map();
      table.find('tr').each((index, elem) => {
        let tableRow = $(elem);
        let rowData = tableRow.children('td, th');
        rowData.find("br").replaceWith('\n');
        if (rowData.length > 1) {
          dict.set(
            rowData.eq(0).text().trim().toLowerCase(),
            rowData.eq(1).text().trim()
          );
        } else if(index == 0 && rowData.length > 0){
          dict.set("tableHeader", rowData.text().trim())
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
            let pageHtml = $.parseHTML(pageHtmlString)
            const jq = $(pageHtml);
  
            let infoDict = createTableDict(jq, '.infobox, .wikitable');
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

  

 async function queueWikiSearches(medicationNames, lang){
   let queryPromises = []
   for(let i = 0; i< medicationNames.length; i++){
   let query = medicationNames[i]
   let id = jobID++
   let jp =  resolver.register(id)
   let qId = await wikipediaQ.add({
       handler:"wikipedia",   
       args:{id:id, query:query,lang:lang}
    })
    queryPromises.push(new Promise(async resolve=>{
       let result = await jp
       resolve({query: query, result:result})
     }))
   }
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
    let queryPromises = await queueWikiSearches(medicationNames,lang)
    let queryResults = await Promise.all(queryPromises)
    let innDict = createInnDict(queryResults)
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
      wikiAllQ.start()
      let id = jobID++
      let jobProm = resolver.register(id)
      await wikiAllQ.add({
        handler:'wikiAll',
        args:{
          id:id,
            lang:lang
        }
    })
    let result = await jobProm 
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
    let id = jobID++
    let jobProm = resolver.register(id)
    await wikiApiQ.add({
        handler:'wikiApi',
        args:{id:id, query:medicationNames, lang:lang}
    })
    let result = await jobProm
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
    wikiApiQ.start()
    let id = jobID++
    let jobProm = resolver.register(id)
    await wikiApiQ.add({
          handler:'wikiApi',
        args:{id:id,query:query,lang:lang}
      })
    let result = await jobProm
    return result
  } catch (ex) {
    return {
      error: ex,
      query: query ? query : ''
    }
  }
}




class WikipediaWorker {
    handle(args){
        // If return value is false, this task will retry until retry value 5.
    // If retry value is 5 in worker, current task will be as failed and freezed in the task pool.
    let retry = 0;

    // Should return true or false value (boolean) that end of the all process
    // If process rejected, current task will be removed from task pool in worker.
    return new Promise((resolve, reject) => {
        try{
      // A function is called in this example.
      // The async operation is started by resolving the promise class with the return value.
      wikipediaSearch(args.query,args.lang).then((data)=>{
          console.log(data)
        resolver.resolve(args.id, data)
        resolve(true)
      })
    }catch (ex){
         // Task will be failed.
        // If retry value i not equal to 5,
        // If the retry value was not 5, it is being sent back to the pool to try again.
        resolve(false)
    }
    });
    }
}

class WikiApiWorker {
    handle(args){
        // If return value is false, this task will retry until retry value 5.
    // If retry value is 5 in worker, current task will be as failed and freezed in the task pool.
    let retry = 0;

    return new Promise((resolve, reject)=>{
       wikiApi(args.query, args.lang).then((data)=>{
           console.log(data)
            resolver.resolve(args.id, data)
           resolve(true)
       })
    })

    // Should return true or false value (boolean) that end of the all process
    // If process rejected, current task will be removed from task pool in worker.

    }
}
class WikiAllWorker {
    handle(args){
        // If return value is false, this task will retry until retry value 5.
    // If retry value is 5 in worker, current task will be as failed and freezed in the task pool.
    let retry = 0;

    // Should return true or false value (boolean) that end of the all process
    // If process rejected, current task will be removed from task pool in worker.
    return new Promise((resolve, reject) => {
        try{
      // A function is called in this example.
      // The async operation is started by resolving the promise class with the return value.
      allMedsExtracted(args.lang).then((res)=>{
        resolver.resolve(args.id, data)
        resolve(true)
      })
    }catch{
         // Task will be failed.
        // If retry value i not equal to 5,
        // If the retry value was not 5, it is being sent back to the pool to try again.
        resolve(false)
    }
    });
    }
}

const queue = new Queue();
Queue.workers({"wikipedia":WikipediaWorker, "wikiApi":WikiApiWorker, "wikiAll":WikiAllWorker})
queue.setTimeout(10);
queue.setPrinciple(Queue.FIFO);
queue.setStorage("localstorage");
queue.setDebug(true);

const wikipediaQ = queue.create("wikipedia") 
const wikiApiQ = queue.create("wikiApi") 
const wikiAllQ = queue.create("wikiAll") 
wikipediaQ.start()
wikiApiQ.start()
wikiAllQ.start()


formSearch.addEventListener('submit', async function (event) {
    try {
        event.preventDefault();
        textareaOutput.value = '';
        textareaOutput.rows = 1;
        let formData = new FormData(formSearch);
        /**
         * @type {Object} name/value-pairs from form elements
         * @property {String} lang selected language
         * @property {String} query comma separated string with query values
         */
        let data = Object.fromEntries(formData.entries());
        result = await wikiApiRequestHandler(data.query.replace(/\s+/g, ' ').trim().split(/\s|\s*,\s*/g), data.lang)
       
        if (result.error) throw new Error('Error: ' + result.error.message);
        let outputString = JSON.stringify(result, null, 4);
        textareaOutput.value = outputString;
        textareaOutput.rows = (outputString.match(/\n/g) || []).length + 1;
    } catch (err) {
        console.error(err);
        let outputString = err.toString();
        textareaOutput.value = outputString;
        textareaOutput.rows = (outputString.match(/\n/g) || []).length + 1;
    }
});

btnReset.addEventListener('click', function (event) {
    event.preventDefault();
    textareaQuery.value = "";
    textareaQuery.focus();
});
btnAll.addEventListener('click', async function (event) {
    try {
        event.preventDefault();
        textareaOutput.value = '';
        textareaOutput.rows = 1;
        let formData = new FormData(formSearch);
        let data = Object.fromEntries(formData.entries());
        result = await wikiAllRequestHandler(data.lang)
       
        if (result.error) throw new Error('Error: ' + result.error.message);
        let outputString = JSON.stringify(result, null, 4);
        textareaOutput.value = outputString;
        textareaOutput.rows = (outputString.match(/\n/g) || []).length + 1;
    } catch (err) {
        console.error(err);
        let outputString = err.toString();
        textareaOutput.value = outputString;
        textareaOutput.rows = (outputString.match(/\n/g) || []).length + 1;
    }
});