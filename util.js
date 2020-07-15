

module.exports = function(){
    this.get = function(url) {
        return new Promise((resolve, reject) => {
          https.get(url, (resp) => {
            let data = '';
      
            resp.on('data', (chunk) => {
              data += chunk;
            });
            resp.on('end', () => {
              try {
                resolve(data)
              } catch (ex) {
                reject(data)
              }
            })
          })
        })
    }
    this.getErrorResponse = function(message, query) {
        return {
          error: message,
          query: query
    }
    }

}
Array.prototype.unique = function () {
    return this.filter(function (value, index, self) {
      return self.indexOf(value) === index;
    });
}
  
  