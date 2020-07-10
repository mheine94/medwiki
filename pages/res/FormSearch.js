import styles from './FormSearch.module.css'

export default class FormSearch extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            lang: 'de',
            query: '',
            output: '',
            outputRows: '1',
            action: props.action || '',
            method: props.method || 'POST'
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleReset = this.handleReset.bind(this);
    }

    handleChange(event) {
        const target = event.target;
        this.setState({
            [target.name]: target.value
        });
    }

    async handleSubmit(event) {
        try {
            event.preventDefault();
            this.setState({
                output: '',
                outputRows: '1'
            });
            /**
             * @type {Object} name/value-pairs from form elements
             * @property {String} lang selected language
             * @property {String} query comma separated string with query values
             */
            let data = this.state;
            let response = await fetch(data.action, {
                method: data.method,
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
            this.setState({
                output: outputString,
                outputRows: (outputString.match(/\n/g) || []).length + 1
            });
        } catch (err) {
            console.error(err);
            let outputString = err.toString();
            this.setState({
                output: outputString,
                outputRows: (outputString.match(/\n/g) || []).length + 1
            });
        }
    }

    handleReset(event) {
        event.preventDefault();
        this.setState({
            query: ''
        })
    }

    render() {
        return (
            <form className={styles.form} method={this.state.method} action={this.state.action} onSubmit={this.handleSubmit}>
                <h1>Medical Wiki Search</h1>
                <div>
                    <label className={styles.label}>
                        Select the language:
                        <br/>
                        <select className={styles.select} name="lang" value={this.state.lang} onChange={this.handleChange}>
                            <option value="de">German</option>
                            <option value="en">English</option>
                        </select>
                    </label>
                </div>
                <div>
                    <label className={styles.label}>
                        Insert your requests:
                        <br/>
                        <textarea className={styles.inputTextarea} name="query" rows="1" placeholder="comma, separated, ..." value={this.state.query} onChange={this.handleChange} autoFocus></textarea>
                    </label>
                </div>
                <div>
                    <button className={styles.button} type="submit">Submit</button>
                    <button className={styles.button} onClick={this.handleReset} type="reset">Reset</button>
                </div>
                <div>
                    <label className={styles.label}>
                        Output:
                        <br/>
                        <textarea className={styles.outputTextarea} rows={this.state.outputRows} value={this.state.output} readOnly></textarea>
                    </label>
                </div>
            </form>
        );
    }
}