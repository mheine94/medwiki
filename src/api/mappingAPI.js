const parser = require("csv-parse/lib/sync")
const fetch = require("node-fetch")
const path = require('path')
const { GoogleSpreadsheet } = require('google-spreadsheet');

module.exports = async (req, res) => {
    let documentId = req.params.documentId
    let sheetId = req.params.sheetId
    let key = req.query.key
    let columns = req.query.columns
    let requestJson = req.body
    if(columns!=null && columns != undefined)
    {
      columns= columns.split(/,/g)
    }
    console.log("columns",columns)
    console.log("documentid",documentId)
    console.log("sheetid",sheetId)
    console.log("key",key)

    switch(req.method){
      case "GET":
        let result = await get(documentId,sheetId,key,columns)
        let jsonpretty = JSON.stringify(result, null, 4)
        res.setHeader("Content-Type",'application/json')
        if(!result.error){
          res.statusCode = 200
          res.send(jsonpretty)
        }else{
          res.statusCode = 400
          res.send(jsonpretty)  
        }
      break
      case "POST":
        const err = await post(documentId, sheetId, key, columns,requestJson)
        if(!err){
          res.sendStatus(200)
        }else{
          let jsonpretty = JSON.stringify(err, null, 4)
          res.statusCode = 400
          res.setHeader("Content-Type",'application/json')
          res.send(jsonpretty)
        }  
      break
    } 
}

async function get(documentId,sheetId,key,columns){
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
    return getErrorResponse(ex.message,{"documentId":documentId,"sheetId":sheetId,"key":key})
  }
}

async function post(documentId, sheetId, key, columns, postJson){
  try{
    if(!documentId){
      throw new Error("No document id")
    }

    if(!key){
      throw new Error("No key")
    }
    let postData;
  if(!postJson.length){
    postData = new Object()
    postData[postJson[key]]=postJson 
  } else{
    postData = mapOnKey(key,postJson)
  } 
  let sheetData = mapOnKey(key,await getRowValues(await getSheet(documentId,sheetId)))
  const inPostJsonButNotInSheet = diff(postData,sheetData)
  await appendRows(documentId, sheetId, inPostJsonButNotInSheet)
  }catch (ex) {
    return getErrorResponse(ex.message,{"documentId":documentId,"sheetId":sheetId,"key":key})
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

function mapOnKey(key,data){
  let result = data.reduce((obj, row)=>{
      if(row[key]!=null && row[key]!= undefined){
        obj[row[key]]=row
      }
      return obj 
    },{})  
  
   
  return result
}
async function appendRows(sheetId,gid,data){
  if(data && data.length > 0){
    const doc = await getSheet(sheetId,gid)
    for(let i =0; i< data.length;i++){
      await doc.addRow(data[i])
    } 
    //await Promise.all(data.map((element)=> doc.addRow(element)))
  }
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
  await doc.useServiceAccountAuth(require('../../google-credentials.json'));
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

/**
 * 
 * Generates a diff for the jsons a and b. Symetric if the sym is true.
 * 
 *example:
a
```json
{
"0121": {
        "opusCode": "0121",
        "opusName": "Kreatinin"
    },
    "0120": {
        "opusCode": "0120",
        "opusName": "Harnstoff-N"
    },
    "0122": {
        "opusCode": "0122",
        "opusName": "Bilirubin, gesamt"
    },
}
```

b
```json
{
"0121": {
        "opusCode": "0121",
        "opusName": "Kreatinin",
        "openTerm": "CREA:VEN",
        "LOINC": "38483-4"
    },
    "0122": {
        "opusCode": "0122",
        "opusName": "Bilirubin, gesamt",
        "openTerm": "BILI",
        "LOINC": "1975-2"
    },
}
```
```json
    "0120": {
        "opusCode": "0120",
        "opusName": "Harnstoff-N"
    }
```
 *
 * @param {Object} a Json a
 * @param {Object} b Json b
 * @param {Boolean} sym flag for symetric diff -> elements from a that are not in b and vice versa.
 * @returns {Object} Object containing the difference elements.
 */
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