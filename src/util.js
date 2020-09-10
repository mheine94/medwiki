const fetch = require('node-fetch')
const opts = {
    headers:{'User-Agent': process.env.USER_AGENT}
  }
module.exports = {
    getErrorResponse : function (message, query) {
    return {
      error: message,
      query: query
    }
  },
  async getHtml(url){
    return await (await fetch(url.toString(),opts)).text()
  },
 
  /**
   * Parses the infobox of a table and and returs a dict containing the table 
   * information.
   *
   * @param {Cheerio.$} $ The cheerio instance
   * @param {string} tableSelector The jQuery selector
   * @returns {object} The TableDict contains a key for each table heading.
   */
  createTableDict : function($, tableSelector) {
    let table = $(tableSelector).first();
    table.find('sup').remove();
    if (table.length > 0) {
      let dict = new Map();
      table.find('tr').each((index, elem) => {
        let tableRow = $(elem);
        let rowData = tableRow.children('td, th');
        rowData.find("br").replaceWith('\n');
        if (rowData.length > 1) {
          dict.set(
            rowData.eq(0).text().trim().toLowerCase(),
            rowData.eq(1).text().trim()
          );
        } else if(index == 0 && rowData.length > 0){
          dict.set("tableHeader", rowData.text().trim())
        }
      });
      return dict;
    }
  },
  

}