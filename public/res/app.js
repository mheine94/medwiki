import { Resolver} from './util.js'
import { WikiAllWorker, WikiApiWorker, WikipediaWorker, wikiAllRequestHandler,wikiApiRequestHandler} from './wiki-api.js'
import { VERSION,APP_NAME,USER_AGENT, PAGE_URL, SEARCH_URL, MEDS_CATEGORY_DE, ALL_MEDS_URL} from './config.js'

const formSearch = document.getElementById('formSearch');
const textareaOutput = document.getElementById('textareaOutput');
const btnReset = document.getElementById('btnReset');
const btnAll = document.getElementById('btnAll');
const textareaQuery = document.getElementById('textareaQuery');

formSearch.addEventListener('submit', async function (event) {
    try {
        event.preventDefault();
        textareaOutput.value = '';
        textareaOutput.rows = 1;
        let formData = new FormData(formSearch);
        /**
         * @type {Object} name/value-pairs from form elements
         * @property {String} lang selected language
         * @property {String} query comma separated string with query values
         */
        let data = Object.fromEntries(formData.entries());
        result = await wikiApiRequestHandler(data.query.replace(/\s+/g, ' ').trim().split(/\s|\s*,\s*/g), data.lang)
       
        if (result.error) throw new Error('Error: ' + result.error.message);
        let outputString = JSON.stringify(result, null, 4);
        textareaOutput.value = outputString;
        textareaOutput.rows = (outputString.match(/\n/g) || []).length + 1;
    } catch (err) {
        console.error(err);
        let outputString = err.toString();
        textareaOutput.value = outputString;
        textareaOutput.rows = (outputString.match(/\n/g) || []).length + 1;
    }
});

btnReset.addEventListener('click', function (event) {
    event.preventDefault();
    textareaQuery.value = "";
    textareaQuery.focus();
});
btnAll.addEventListener('click', async function (event) {
    try {
        event.preventDefault();
        textareaOutput.value = '';
        textareaOutput.rows = 1;
        let formData = new FormData(formSearch);
        let data = Object.fromEntries(formData.entries());
        result = await wikiAllRequestHandler(data.lang)
       
        if (result.error) throw new Error('Error: ' + result.error.message);
        let outputString = JSON.stringify(result, null, 4);
        textareaOutput.value = outputString;
        textareaOutput.rows = (outputString.match(/\n/g) || []).length + 1;
    } catch (err) {
        console.error(err);
        let outputString = err.toString();
        textareaOutput.value = outputString;
        textareaOutput.rows = (outputString.match(/\n/g) || []).length + 1;
    }
});