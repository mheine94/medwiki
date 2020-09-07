const Queue = require('bull')
const cheerio = require('cheerio')
const fetch = require('node-fetch');

module.exports = {
  wikiAllRequestHandler : async function (req,res){
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
  
  },
  
  
  getHtmlPage: async function (url) {
    return await (await fetch(url.toString())).text()
  },

  getAllMedsPage: function (lang,from){
        let url = new URL(`https://${lang}.wikipedia.org/w/index.php?title=Kategorie:Arzneistoff${from?'&pagefrom='+from:''}`)
        console.log("loading from name: "+from)
        return module.exports.getHtmlPage(url);
  },
  allMeds: async function(lang){
      const allMeds = new Set();
      let  htmlPage = await module.exports.getAllMedsPage(lang)
      let names= [];
     do {
         names = module.exports.parsePage(htmlPage);
         
          names.each((index,element) => {
             allMeds.add(element) 
          });
          if(names.length > 1)
              htmlPage = await module.exports.getAllMedsPage(lang,names[names.length-1])
  
     }while(names.length > 1)
     console.log(JSON.stringify(allMeds))
     return allMeds;
  },
  parsePage: function (pageHtml){
      const $ = cheerio.load(pageHtml);
      const categoryGs= $('.mw-category-group')
      const as = categoryGs.find('a')
      
      const allTitlesOnPage = as.filter(function(index, element){
          return $(element).attr('title') != null
      }).map(function(index, element){
          return $(element).attr('title');
      })
      return allTitlesOnPage;
  },
  
  allMedsExtracted: async function (lang){
      const medicationNames = await module.exports.allMeds(lang)   
      let wikiQ = new Queue("wikiApiQ")
      let job = await wikiQ.add({querySplit:Array.from(medicationNames), lang:lang})
      let result = await job.finished()
      return result;
  }
}

