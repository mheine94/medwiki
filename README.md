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


### beispiel
https://wikiapi.now.sh/api/search?query=nurofen,ibuhexal,ibuflam,ondansetron,zofran,beloc-zok  

```json
{
    "ibuprofen":{
        "INN": "ibuprofen",
        "tradeNames":["nurofen","ibuhexal","ibuflam"],
        "CAS":[],
        "ATC":[],
    },
    "ondansetron":{
        "INN": "ondansetron",
        "tradeNames": ["zofran"],
        "CAS":[],
        "ATC":[],
    },
    "metoprolol":{
        "INN": "metoprolol",
        "tradeNames": ["beloc zok"],
        "CAS":[],
        "ATC":[],
    }
}
```

## Google-Sheets-api
### Parameters
* documentId: Die Dokumentenid
* sheetId: (optional) Id der Tabelle
* key: (optional) gibt an auf welchen key die Einträge gemappt werden sollen 

### Beispiel
http://medication-wiki-api.uni-muenster.de/api/sheet/:documentID/:sheetID  
http://medication-wiki-api.uni-muenster.de/api/sheet/:documentID/:sheetID/?key=opusCode  
http://medication-wiki-api.uni-muenster.de/api/sheet/:documentID/:sheetID?key=opusCode&colums=LOINC,SNOMED  


```json
{
"0121": {
        "opusCode": "0121",
        "opusName": "Kreatinin",
        "openTerm": "CREA:VEN",
        "LOINC": "38483-4"
    },
    "0120": {
        "opusCode": "0120",
        "opusName": "Harnstoff-N",
        "openTerm": "UREA",
        "LOINC": "6299-2"
    },
    "0122": {
        "opusCode": "0122",
        "opusName": "Bilirubin, gesamt",
        "openTerm": "BILI",
        "LOINC": "1975-2"
    },
}
```

