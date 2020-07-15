const util = require("./util")
 
const get = util.get
const getErrorResponse = util.getErrorResponse

 function getHtmlPage(title, lang) {
    return get('https://' + lang + '.wikipedia.org/wiki/' + title)
  }
  function search(term, lang) {
    return get('https://' + lang + '.wikipedia.org/w/api.php?action=query&list=search&srsearch=' + term + '&utf8=&format=json')
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



  async function wikipediaSearch(word, lang){
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
  module.exports = async function(job){
      console.log("proccing wikipedia")
    // Do some heavy work
    return job.data
  }