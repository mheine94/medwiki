# Wikipedia-Medication-Extractor


## Wikipedia-api

### Get
#### Parameter
* lang //"de" oder "en" default bei keiner Angabe ist "en"
* query //csv der zu suchenden Medikamente
#### Beispiel
* http://medication-wiki-api.uni-muenster.de/api/v2?lang=de&query=amoxicillin,nurofen

### Post
#### Postbody
##### newline seperated
###### Parameter 
* lang als url Parameter
* query newline seperated Namen der Medikamente im Post body
##### Beispiel
http://medication-wiki-api.uni-muenster.de/api/v2?lang=de

POST /api/v2?lang=de HTTP/1.1
Content-Type: text/plain
Content-Length: 33
Amoxicillin
Nurofen,
Diclofenac

##### json
###### Parameter
* lang als feld
* query als feld
###### Beispiel
http://medication-wiki-api.uni-muenster.de/api/v2

{
    "query":["Amoxicillin","Nurofen","Diclofenac"],
    "lang":"de"
}


## Google-Sheets-api
### Parameters
* documentId: Die Dokumentenid
* sheetId: (optional) Id der Tabelle
* key: (optional) gibt an auf welchen key die Einträge gemappt werden sollen 
### Beispiel
http://localhost:3000/api/sheet/documentId
http://localhost:3000/api/sheet/documentId?key=opusCode
http://localhost:3000/api/sheet/documentId?sheetId=sheetId&key=opusCode


