# Wikipedia-Medication-Extractor

Try it out at https://mheine94.github.io/medwiki/public/

## Wikipedia-api

### Get
#### Parameter
* lang //"de" oder "en" default bei keiner Angabe ist "en"
* query //csv der zu suchenden Medikamente
#### Beispiel
* ?lang=de&query=amoxicillin,nurofen
* http://hostname/de/amoxicillin,nurofen

### Post
#### Postbody
##### newline seperated
###### Parameter 
* lang als url Parameter
* query newline seperated Namen der Medikamente im Post body
##### Beispiel
http://hostname?lang=de
http://hostname/de

POST /api?lang=de HTTP/1.1
Content-Type: text/plain
Content-Length: 33
Amoxicillin
Nurofen,
Diclofenac

POST /de HTTP/1.1
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

{
    "query":["Amoxicillin","Nurofen","Diclofenac"],
    "lang":"de"
}


### Beispiel

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
* sheetId: (optional) gid des Tabellenblatts
* columns: (optional) Filter die Spalten
* key: (optional) gibt an auf welchen key die Einträge gemappt werden sollen 

### Beispiel
http://hostname/api/sheet/:documentID/:sheetID  
http://hostname/api/sheet/:documentID/:sheetID?key=opusCode  
http://hostname/api/sheet/:documentID/:sheetID?key=opusCode&colums=LOINC,SNOMED  


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

### Post Diff in die Tabelle
Berechtige den Service Account auf die Tabelle:
sheets@imi-sheet-api.iam.gserviceaccount.com

### Parameters
* documentId: Die Dokumentenid
* sheetId: (optional) gid des Tabellenblatts
* key: gibt an auf welchen key die Einträge gemappt werden sollen 

### Beispiel
http://hostname/api/sheet/:documentID/:sheetID?key=opusCode  

Post Body (einzeln)
``` json
    {
        "opusCode": "0122",
        "opusName": "Bilirubin, gesamt",
        "openTerm": "BILI",
        "LOINC": "1975-2"
    }
```
Post body (mehrfach)
``` json
    [
        {
            "opusCode": "0122",
            "opusName": "Bilirubin, gesamt",
            "openTerm": "BILI",
            "LOINC": "1975-2"
        },
        {
            "opusCode": "0120",
            "opusName": "Harnstoff-N",
            "openTerm": "UREA",
            "LOINC": "6299-2"
        }
    ]
```
