const parser = require("csv-parse/lib/sync")
const fetch = require("node-fetch")
const path = require('path')
const { GoogleSpreadsheet } = require('google-spreadsheet');

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
  let parsedTsv = await getRowValues(await getSheet(documentId,sheetId))
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
async function getSheet(sheetId,gid){
  // spreadsheet key is the long id in the sheets URL
  const doc = new GoogleSpreadsheet(sheetId);
  // use service account creds
  //await doc.useServiceAccountAuth({
   // client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
   // private_key: process.env.GOOGLE_PRIVATE_KEY,
  //});
  // OR load directly from json file if not in secure environment
  await doc.useServiceAccountAuth(require('./imi-sheet-api-277897e53174.json'));
  // OR use API key -- only for read-only access to public sheets
  //doc.useApiKey('YOUR-API-KEY');
  
  await doc.loadInfo(); // loads document properties and worksheets
  //await doc.updateProperties({ title: 'renamed doc' });
  
  const sheet = gid?doc.sheetsById[gid]:doc.sheetsByIndex[0]
  //console.log("Gidsheet" ,gidsheet.title)
   //await sheet.addRow(["bongo","mongo"])
  // adding / removing sheets
  //const newSheet = await doc.addSheet({ title: 'hot new sheet!' });
  //await newSheet.delete();
  return sheet
}

async function getRowValues(sheet){
  await sheet.loadHeaderRow();
  const headers = sheet.headerValues
  const rows = await sheet.getRows()
  const values = rows.map(row=>headers.reduce((p,c)=>{p[c]=row[c];return p},{}))
  return values
} 

function diff(a,b,sym){
  const aKeys =Object.keys(a)
  const bKeys =Object.keys(b)
  
  let diffObjs = aKeys.filter(k => !bKeys.includes(k))
                        .map(k=>a[k])
  if(sym)
    diffObjs.concat(
      bKeys.filter(k=> !aKeys.includes(k))
      .map(k=>b[k])
    )
                        
  return diffObjs                     
} 