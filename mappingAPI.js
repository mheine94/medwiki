const parser = require("csv-parse/lib/sync")
const fetch = require("node-fetch")
const allowedFields = 
[ "opusCode",
"opusName",
"LOINC",
"openTerm",
"unit"]
module.exports = async (req, res) => {
    let documentId = req.params.documentId
    let sheetId = req.query.sheetId
    let key = req.query.key
    console.log("documentid",req.query.documentId)
    console.log("sheetid",req.query.sheetId)
    console.log("key",req.query.key)
    let result = await apiCall(documentId,sheetId,key)
    let jsonpretty = JSON.stringify(result, null, 4)
    res.statusCode = 200
    res.setHeader("Content-Type",'application/json')
    res.send(jsonpretty)
}

async function apiCall(documentId,sheetId,key){
  try{
    if(!documentId){
      throw new Error("No document id")
    }
  let tsvText = await downloadTsv(documentId,sheetId)
  let parsedTsv = parseTsv(tsvText)
  let fieldFilter = getFieldFilter(allowedFields)
  let filteredTsv = parsedTsv.map(row=>fieldFilter(row))
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


async function downloadTsv(documentId,sheetId){
  let response = await (await fetch(`https://docs.google.com/spreadsheets/d/e/${documentId}/pub?${sheetId?`gid=${sheetId}`:''}output=tsv`))
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