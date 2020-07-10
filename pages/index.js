import FormSearch from './res/FormSearch.js';

function Index() {
  return (
    <div>
      <meta charSet="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Medical Wiki Search</title>
      <main>
        <FormSearch action="/api/v2" method="POST"/>
      </main>
    </div>
  )
}
export default Index