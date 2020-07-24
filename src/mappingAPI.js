const parser = require("csv-parse/lib/sync")
const fetch = require("node-fetch")
module.exports = async (req, res) => {
    let documentId = req.params.documentId
    let sheetId = req.params.sheetId
    let key = req.query.key

    let columns = req.query.columns
    if(columns!=null && columns != undefined)
      {
        columns= columns.split(/,/g)
      }
    console.log("columns",columns)
    console.log("documentid",documentId)
    console.log("sheetid",sheetId)
    console.log("key",key)
    let result = await apiCall(documentId,sheetId,key,columns)
    let jsonpretty = JSON.stringify(result, null, 4)
    res.statusCode = 200
    res.setHeader("Content-Type",'application/json')
    res.send(jsonpretty)
}

async function apiCall(documentId,sheetId,key,columns){
  try{
    if(!documentId){
      throw new Error("No document id")
    }
  let tsvText = await downloadTsv(documentId,sheetId)
  let parsedTsv = parseTsv(tsvText)
   let filteredTsv;
   let fieldFilter; 
  if(columns!==null && columns!=undefined){
    fieldFilter = getFieldFilter(columns)
    filteredTsv = parsedTsv.map(row=>fieldFilter(row))
  }else{
    filteredTsv = parsedTsv
  }
  let result = key?mapOnKey(key, filteredTsv):filteredTsv
  return result
  }catch (ex) {
    return getErrorResponse(ex.message, `documentId:${documentId},sheetId:${sheetId},key:${key}`)
  }
}

function getErrorResponse(message,query){
  return {
    error: message,
    query: query
  }
}


/**
 * //All requests must include id in the path and a format parameter
  //https://docs.google.com/spreadsheets/d/{SpreadsheetId}/export
 
  //FORMATS WITH NO ADDITIONAL OPTIONS
  //format=xlsx       //excel
  //format=ods        //Open Document Spreadsheet
  //format=zip        //html zipped          
  
  //CSV,TSV OPTIONS***********
  //format=csv        // comma seperated values
  //             tsv        // tab seperated values
  //gid=sheetId             // the sheetID you want to export, The first sheet will be 0. others will have a uniqe ID
  
  // PDF OPTIONS****************
  //format=pdf     
  //size=0,1,2..10             paper size. 0=letter, 1=tabloid, 2=Legal, 3=statement, 4=executive, 5=folio, 6=A3, 7=A4, 8=A5, 9=B4, 10=B5  
  //fzr=true/false             repeat row headers
  //portrait=true/false        false =  landscape
  //fitw=true/false            fit window or actual size
  //gridlines=true/false
  //printtitle=true/false
  //pagenum=CENTER/UNDEFINED      CENTER = show page numbers / UNDEFINED = do not show
  //attachment = true/false      dunno? Leave this as true
  //gid=sheetId                 Sheet Id if you want a specific sheet. The first sheet will be 0. others will have a uniqe ID. 
                               // Leave this off for all sheets. 
  // EXPORT RANGE OPTIONS FOR PDF
  //need all the below to export a range
  //gid=sheetId                must be included. The first sheet will be 0. others will have a uniqe ID
  //ir=false                   seems to be always false
  //ic=false                   same as ir
  //r1=Start Row number - 1        row 1 would be 0 , row 15 wold be 14
  //c1=Start Column number - 1     column 1 would be 0, column 8 would be 7   
  //r2=End Row number
  //c2=End Column number
 *
 * @param {*} documentId
 * @param {*} sheetId
 * @returns
 */
async function downloadTsv(documentId,sheetId){
  let response = await (await fetch(`https://docs.google.com/spreadsheets/d/e/${documentId}/export?${sheetId?`gid=${sheetId}&`:''}output=tsv`))
  let text = await response.text()
  return text
}


function parseTsv(tsvString){
  return parser(tsvString,{
    delimiter: "\t",
    trim: true,
    columns: true
  })
}

function getFieldFilter(keys){
  return (o)=> keys.reduce((obj, key) => ({ ...obj, [key]: o[key] }), {});
}

function mapOnKey(key,tsv){
  let result = tsv.reduce((obj, row)=>{
    if(row[key]!=null && row[key]!= undefined){
      obj[row[key]]=row
    }
    return obj
  }
    ,{})
  return result
}