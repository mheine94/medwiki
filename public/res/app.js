const formSearch = document.getElementById('formSearch');
const textareaOutput = document.getElementById('textareaOutput');
const btnReset = document.getElementById('btnReset');
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
        let response = await fetch(formSearch.action, {
            method: formSearch.method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                'lang': data.lang,
                'query': data.query.replace(/\s+/g, ' ').trim().split(/\s*,\s*/g)
            }),
        });
        if (!response.ok) throw new Error('Response returned with status: ' + response.status);
        let outputString = JSON.stringify(await response.json(), null, 4);
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