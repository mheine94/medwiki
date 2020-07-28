function mapOnKey(key,data){
    let result;
    if(typeof data === 'object'){
      result ={} 
      if(data[key]){
        result[data[key]]=data 
      }   
    }else{
      result = data.reduce((obj, row)=>{
        if(row[key]!=null && row[key]!= undefined){
          obj[row[key]]=row
        }
        return obj 
      },{})  
    }
     
    return result
  }
  testdat ={"k":1}
  
  mapOnKey("k",testdat)