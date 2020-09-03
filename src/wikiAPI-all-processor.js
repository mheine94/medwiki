const Queue = require('bull')
const cheerio = require('cheerio')
const fetch = require('node-fetch');
const e = require('express');
const Bull = require('bull');

Array.prototype.unique = function () {
  return this.filter(function (value, index, self) {
    return self.indexOf(value) === index;
  });
}

module.exports = async function(job){
    console.log("Wikiapi-All:",job.data)
    const lang = job.data.lang
    let res = await allMedsExtracted(lang)
    return res
}
async function getHtmlPage(url) {
  return await (await fetch(url.toString())).text()
}
function getAllMedsPage(lang,from){
      let url = new URL(`https://${lang}.wikipedia.org/w/index.php?title=Kategorie:Arzneistoff${from?'&pagefrom='+from:''}`)
      console.log("loading from name: "+from)
      return getHtmlPage(url);
}
async function allMeds(lang){
    const allMeds = new Set();
    let  htmlPage = await getAllMedsPage(lang)
    let names= [];
   do {
       names = parsePage(htmlPage);
       
        names.each((index,element) => {
           allMeds.add(element) 
        });
        if(names.length > 1)
            htmlPage = await getAllMedsPage(lang,names[names.length-1])

   }while(names.length > 1)
   console.log(JSON.stringify(allMeds))
   return allMeds;
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

async function allMedsExtracted(lang){
    const medicationNames = await allMeds(lang)   
    let wikiQ = new Queue("wikiApiQ")
    let job = await wikiQ.add({querySplit:Array.from(medicationNames), lang:lang})
    let result = await job.finished()
    return result;
}

