function Resolver(){
    let cb = (callback, data)=> callback(data)
    let waitingPromises = {}
    let resolverFuncs= {
        register: (id)=> {
          return new Promise(resolve=>{ 
            let pcb = cb.bind(this,resolve)
            waitingPromises[id]= pcb
        })
      },
      resolve : (id, data)=>{
        waitingPromises[id](data)
        waitingPromises[id]=undefined
      }
    }
    return resolverFuncs
}

function unique(arr) {
    return arr.filter(function (value, index, self) {
      return self.indexOf(value) === index;
    });
};
  

function getErrorResponse(message, query) {
    return {
      error: message,
      query: query
    }
}
  
async function getHtml(url){
    return await (await fetch(url.toString(),opts)).text()
}

  
export { Resolver , unique, getErrorResponse, getHtml}