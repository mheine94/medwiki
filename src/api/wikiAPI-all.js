const Queue = require('bull')
const cheerio = require('cheerio')
const fetch = require('node-fetch');
const { getHtml } = require('../util');
const config = require('../../config')

module.exports = {
  wikiAllRequestHandler:wikiAllRequestHandler,
  getAllMedsPage:getAllMedsPage,
  allMeds:allMeds,
  parsePage:parsePage,
  allMedsExtracted:allMedsExtracted
}
async function allMedsExtracted(lang){
      const medicationNames = await module.exports.allMeds(lang)   
      let wikiQ = new Queue("wikiApiQ")
      let job = await wikiQ.add({querySplit:Array.from(medicationNames), lang:lang})
      let result = await job.finished()
      return result;
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
      const allMeds = new Set();
      //let url = new URL(`https://${lang}.wikipedia.org/w/index.php?title=Kategorie:Arzneistoff`)
      let baseUrl = config.ALL_MEDS_URL.replace('${lang}',lang).replace('${medsCategory}',config.MEDS_CATEGORY_DE)
      let url = new URL(baseUrl)
      let  htmlPage = await getHtml(url)
      let names= [];
     do {
         names = module.exports.parsePage(htmlPage);
         
          names.each((index,element) => {
             allMeds.add(element) 
          });
          if(names.length > 1){
            let url = new URL(`${baseUrl}${names[names.length-1]?'&pagefrom='+names[names.length-1]:''}`)
            htmlPage = await getHtml(url)
          }  
     }while(names.length > 1)
     console.log(JSON.stringify(allMeds))
     return allMeds;
  }
async function getAllMedsPage(lang,from){
        
        console.log("loading from name: "+from)
        return await (await fetch(url.toString())).text()   
  }
async function wikiAllRequestHandler(req,res){
    try{
      let lang = req.query.lang ? req.query.lang : req.params.lang? req.params.lang : 'en'
      var wikiAllQ = new Queue("wikiAll")
      let job = await wikiAllQ.add({lang:lang})
      let result = await job.finished()
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
        query: "all-query"
      })
    }
  
  }