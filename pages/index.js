function Index(){
    return (
      <div>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Medical Wiki Search</title>
        <link rel="stylesheet" href="/res/style.css" />
        <main>
          <h1>Medical Wiki Search</h1>
          <form id="formSearch" action="/api/v2" method="POST">
            <div>
              <label>Select the language:</label>
              <select name="lang" required>
                <option value="de">German</option>
                <option value="en">English</option>
              </select>
            </div>
            <div>
              <label>Insert your requests:</label>
              <textarea name="query" rows={1} placeholder="comma, separated, ..." required defaultValue={""} />
            </div>
            <input type="submit" defaultValue="Submit" />
          </form>
          <p>Output:</p>
          <textarea id="textareaOutput" rows={1} readOnly defaultValue={""} />
        </main>
        <script src="/res/app.js"></script>
      </div>
    )
  }
export default Index