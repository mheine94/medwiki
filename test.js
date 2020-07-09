let test = [
 "Amikacin",
 "Amoxicillin",
 "Ampicillin",
 "Azidocillin",
 "Azithromycin",
 "Aztreonam",
 "Bacampicillin",
 "Benzylpenicillin",
 "Benzylpenicillin-Benzathin",
 "Cefacetril",
 "Cefadroxil",
 "Cefalexin",
 "Cefaloridin",
 "Cefalotin",
 "Cefamandol",
 "Cefamandolnafat",
 "Cefapirin",
 "Cefazedon",
 "Cefazolin",
 "Cefepim",
 "Cefiderocol",
 "Cefixim",
 "Cefodizim",
 "Cefotaxim",
 "Cefotiam",
 "Cefoxitin",
 "Cefpodoxim",
 "Cefpodoximproxetil",
 "Cefradin",
 "Cefroxadin",
 "Ceftazidim",
 "Ceftibuten",
 "Ceftiofur",
 "Ceftobiprol",
 "Ceftolozan",
 "Ceftriaxon",
 "Cefuroxim",
 "Chloramphenicol",
 "Chlortetracyclin",
 "Cilastatin",
 "Ciprofloxacin",
 "Clarithromycin",
 "Clavulansäure",
 "Clindamycin",
 "Cloxacillin",
 "Colistin",
 "Cotrimoxazol",
 "Dalbavancin",
 "Daptomycin",
 "Doripenem",
 "Doxycyclin",
 "Enoxacin",
 "Ertapenem",
 "Erythromycin",
 "Faropenem",
 "Fleroxacin",
 "Flucloxacillin",
 "Fosfomycin",
 "Gentamicin",
 "Grepafloxacin",
 "Iclaprim",
 "Imipenem",
 "Josamycin",
 "Kanamycine",
 "Lefamulin",
 "Levofloxacin",
 "Lincomycin",
 "Linezolid",
 "Lomefloxacin",
 "Loracarbef",
 "Meropenem",
 "Methicillin",
 "Metronidazol",
 "Mezlocillin",
 "Minocyclin",
 "Moxifloxacin",
 "Nalidixinsäure",
 "Neomycin",
 "Netilmicin",
 "Nitrofurantoin",
 "Nitroxolin",
 "Norfloxacin",
 "Ofloxacin",
 "Oxacillin",
 "Oxytetracyclin",
 "Phenoxymethylpenicillin",
 "Pipemidsäure",
 "Piperacillin",
 "Pivmecillinam",
 "Pristinamycin",
 "Propicillin",
 "Roxithromycin",
 "Spectinomycin",
 "Spiramycin",
 "Streptomycin",
 "Sulbactam",
 "Sulfadiazin",
 "Sulfadimidin",
 "Sulfamerazin",
 "Sulfamethoxazol",
 "Sulfanilamid",
 "Sultamicillin",
 "Tazobactam",
 "Tebipenempivoxil",
 "Tedizolid",
 "Teicoplanin",
 "Telithromycin",
 "Tetracyclin",
 "Tigecyclin",
 "Trimethoprim",
 "Vancomycin"
]

const https = require('https')
function get(url){
    return new Promise((resolve,reject)=>{
        https.get(url,(resp)=>{
            let data = '';
    
            resp.on('data',(chunk)=>{
                data+=chunk;
            });
            resp.on('end',()=>{
              try{
                resolve(data)
              }catch(ex){
                reject(data)
              }
            })
    })
})
}
let url= "https://wikiapi.mheine94.now.sh/api/search?query="
async function testee(arr){
  let promiseArr =[]
    let resultarr =[]
    for(i=0; i< arr.length; i++){
        //console.log("Request "+(i+1)+"/"+arr.length)
         console.log("Query Nr"+i)
         promiseArr[i] =  get(url+arr[i]);
    }
    let ress = Promise.all(promiseArr)
    return ress;
}

testee(test).then((res)=>{
    let jso= res.map((result,i) => {return{"name": test[i], "result": JSON.parse(result)}})
  
    jso.forEach(res=> console.log(res.name,res.result.CAS))
    console.log("Finished")
})
