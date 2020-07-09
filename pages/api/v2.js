const cheerio = require('cheerio')
const https = require('https')

module.exports = async (req, res) => {
  try {
    let query = req.query.query?req.query.query:''
    let  lang = req.query.lang?req.query.lang:'en'
    let body  = req.body

    if (query == undefined | query == null) {
      res.status(501)
    }
    res.status(200)
    
      let result;

      if(body){
        let queryWords;
        if(body.query){
          console.log("Post body query:",body.query)
          console.log("Post lang:",body.lang)
          queryWords=body.query;
          lang= body.lang
        }else{
          queryWords = body.replace(/\r/g,'').split(/\n/)
        }
        console.log("Post body query list",queryWords)
        result = await mutliSearch(queryWords,lang)
      }else{
        let queryWords = query.split(',');
        console.log("Get query list",queryWords)
        if (queryWords.length > 1) {
          result = await mutliSearch(queryWords,lang)
        } else {
          result = await apiSearch(query,lang)
        }
      }
      
  
      try {
  
        let jsonpretty = JSON.stringify(result, null, 4)
        res.header("Content-Type",'application/json');
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
  
  
  async function mutliSearch(querySplit,lang) {
    let queryPromises = querySplit.map(q => new Promise(async(resolve)=>{
      let res = await apiSearch(q,lang)
      resolve( {query:q,result:res})
    }))
    let queryResults = await Promise.all(queryPromises)
    let innDict = {}
    queryResults.forEach((res) => {
      let v=res.result
    
      if(v.error|| !v.inn){
        if(innDict["unknown"]==null || innDict["unknown"]==undefined){
          innDict["unknown"]=[]
        }
        innDict["unknown"].push(res.query)
      }else{
        if (v.inn && innDict[v.inn.toLowerCase()]) {
          if(v.ingredientClass){
            Array.prototype.push.apply(innDict[v.inn.toLowerCase()].ingredientClass, v.ingredientClass)
            innDict[v.inn.toLowerCase()].ingredientClass = innDict[v.inn.toLowerCase()].ingredientClass.unique()
          }
          if(v.formula){
            Array.prototype.push.apply(innDict[v.inn.toLowerCase()].formula, v.formula)
            innDict[v.inn.toLowerCase()].formula = innDict[v.inn.toLowerCase()].formula.unique()
          }
          if(v.tradenames){
            Array.prototype.push.apply(innDict[v.inn.toLowerCase()].tradenames, v.tradenames)
            innDict[v.inn.toLowerCase()].tradenames = innDict[v.inn.toLowerCase()].tradenames.unique()
          }
          if(v.cas){
            Array.prototype.push.apply(innDict[v.inn.toLowerCase()].cas, v.cas)
            innDict[v.inn.toLowerCase()].cas = innDict[v.inn.toLowerCase()].cas.unique()
          }
          if(v.atc){
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
            if(v.ingredientClass) {
              Array.prototype.push.apply(entry.ingredientClass, v.ingredientClass)
              entry.ingredientClass = entry.ingredientClass.unique()
            }
            if(v.formula) {
              Array.prototype.push.apply(entry.formula, v.formula)
              entry.formula = entry.formula.unique()
            }
            if(v.cas){
              Array.prototype.push.apply(entry.cas, v.cas)
              entry.cas = entry.cas.unique()
            }
            if(v.atc){
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
  

  function search(term,lang) {
    return get('https://'+ lang +'.wikipedia.org/w/api.php?action=query&list=search&srsearch=' + term + '&utf8=&format=json')
  }
  
  function getPageInfo(pageId) {
    return get('https://en.wikipedia.org/w/api.php?action=query&prop=revisions&rvprop=content&rvsection=0&format=json&pageids=' + pageId + '&redirects=true')
  }
  function getPageContent(pageid) {
    return get('https://en.wikipedia.org/w/api.php?action=query&prop=revisions&rvslots=*&rvprop=content&format=json&formatversion=2&pageids=' + pageid)
  }
  function getHtmlPage(title,lang){
    return get('https://'+ lang +'.wikipedia.org/wiki/'+title)
  }
  

  
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
      })
    })
  }
  
  async function apiSearch(word,lang) {
    try{
    if (word == undefined || word == null || word === "") {
      return getErrorResponse("No search word", word)
    }
    let res = await search(word,lang)
    
    let searchresult = JSON.parse(res)
    if (searchresult && searchresult.query && searchresult.query.searchinfo && searchresult.query.searchinfo.totalhits > 0) {
      if (searchresult.query.search[0]) {
        try {
          let page = searchresult.query.search[0]
          let pageTitle = page.title

          let inn= null
          let tradenames = []
          let ingredientClass = []
          let casn =  []
          let atcc= []
          let formula = []

          // check for link to a "brand names"-page and move on with the INN-page to get all information
          if (pageTitle.includes(' brand names')) {
            // depcrecated: tradenames.push(word)
            pageTitle = page.title.substring(0, page.title.search(' brand names'))
          }

          let pageHtml = await getHtmlPage(pageTitle,lang)
          const $ = cheerio.load(pageHtml);
          
          let hasInfobox = $('.infobox').length > 0
          if(!hasInfobox)
            throw new Error('Page: "' + pageTitle + '" has no infobox.')

          
          switch(lang){
            case 'de':
              inn = $('a[title="Internationaler Freiname"]','.infobox').parent().next('td')[0].childNodes[0].data.replace(/\n/g,'')
              
              let isList_inredientClass = $('a[title="Wirkstoffklasse"]','.infobox').parent().next('td').children('ul').length > 0
              if(isList_inredientClass) {
                ingredientClass = $('a[title="Wirkstoffklasse"]','.infobox').parent().next('td').find('li').map((i,el)=> {
                  return $(el).text()
                }).toArray()
              } else {
                ingredientClass.push($('a[title="Wirkstoffklasse"]','.infobox').parent().next('td').find('a').first().text().replace(/\n/g,''))
              }
              let isList_casn = $('a[title="CAS-Nummer"]','.infobox').parent().next('td').children('ul').length > 0
              if(isList_casn){
                casn = $('a[title="CAS-Nummer"]','.infobox').parent().next('td').find('li').map((i,el)=> {
                  return $(el).text()
                }).toArray()
              }else{
                casn.push( $('a[title="CAS-Nummer"]','.infobox').parent().next('td')[0].childNodes[0].data.replace(/\n/g,''))
              }
              let isList_atc = $('a[title="Anatomisch-Therapeutisch-Chemisches Klassifikationssystem"]','.infobox').parent().next('td').children('ul').length > 0
              if(isList_atc){
                atcc = $('a[title="Anatomisch-Therapeutisch-Chemisches Klassifikationssystem"]','.infobox').parent().next('td').find('li').map((i,el)=> {
                  return $(el).text()
                }).toArray()
              }else{
                atcc.push($('a[title="Anatomisch-Therapeutisch-Chemisches Klassifikationssystem"]','.infobox').parent().next('td').find('a').text().replace(/\n/g,''))
              }
              
              let isList_formula = $('a[title="Summenformel"]','.infobox').parent().next('td').children('ul').length > 0
              if(isList_formula){
                formula = $('a[title="Summenformel"]','.infobox').parent().next('td').find('li').map((i,el)=> {
                  return $(el).text()
                }).toArray()
              }else{
                formula.push($('a[title="Summenformel"]','.infobox').parent().next('td').text().replace(/\n/g,''))
              }
              break;
            default:
              
              //$('caption span','.infobox')[0].childNodes[0].data
              inn= $('caption','.infobox').text()
              if(!tradenames) {
                tradenames = $('a[title="Drug nomenclature"]','.infobox').parent().next('td')[0].childNodes[0].data.split(',').map(s=>s.trim()).filter(s=> s.length>0)
              }
              casn = $('a[title="CAS Registry Number"]','.infobox').parent().next('td').find('li').map((i,el)=> {
                return $($(el).find('span')[0]).text()
              }).toArray()
              atcc = $('a[title="Anatomical Therapeutic Chemical Classification System"]','.infobox').parent().next('td').find('li').children().filter('a').map((i,el)=> {
                return $(el).text()
              }).toArray()
              formula.push($('a[title="Chemical formula"]','.infobox').parent().next('td').text().replace(/\n/g,''))
          }
         
          if(word.toLowerCase() !== inn.toLowerCase()){
            tradenames = []
            tradenames.push(word)
          }

          let result = {
            "tradenames": tradenames,
            "ingredientClass": ingredientClass,
            "cas": casn,
            "atc": atcc,
            "formula": formula,
            "inn": inn
          }
          return result
          console.log(result)
        } catch (ex) {
          return getErrorResponse(ex.message, word)
        }
      } else {
        return getErrorResponse("Nothing was found on wikipedia", word)
      }
    } else {
      return getErrorResponse("Nothing was found on wikipedia", word)
      
    }
  }catch (ex){
    return getErrorResponse(ex.message, word)
  }
  }
  
  function getErrorResponse(message,query){
    return {
      error: message,
      query: query
    }
  }
  