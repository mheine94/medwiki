import { VERSION,APP_NAME,USER_AGENT, PAGE_URL, SEARCH_URL, MEDS_CATEGORY_DE, ALL_MEDS_URL , opts} from './config.js'

function Resolver() {
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


function promiseAllLimitConcurrency(items, asyncFunc, concurrencyLimit) {
  return new Promise((resolve, reject) => {
    let unprocessed = [...items]
    let active = 0
    let results = []
    let cb = result => {
      console.log(`Resolved`)
      results.push(result)
      active--
      if (unprocessed.length > 0) {
        active++
          asyncFunc(unprocessed.pop()).then(res=> cb(res))
      } else if(results.lenght == items.lenght && active == 0){
        resolve(results)
      }
    }
    while (active < concurrencyLimit && unprocessed.length > 0) {
      active++
      asyncFunc(unprocessed.pop()).then(res=> cb(res))
    }
  })
}
  
export { Resolver , unique, getErrorResponse, getHtml, promiseAllLimitConcurrency}