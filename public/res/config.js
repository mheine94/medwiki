const VERSION="0.0.0"
const APP_NAME="Wikipedia-Medication-Extractor"
//need custom useragent to prevent errors with wikipedia
//https://meta.wikimedia.org/wiki/User-Agent_policy
const USER_AGENT_CONTACT="https://medication-wiki-api.uni-muenster.de"
const USER_AGENT = `${APP_NAME}_bot/${VERSION} (${USER_AGENT_CONTACT})`
//const PAGE_URL="https://${lang}.wikipedia.org/wiki/${title}?origin=*"
const PAGE_URL="https://${lang}.wikipedia.org/w/api.php?action=parse&section=0&prop=text&page=${title}&origin=*&format=json"
const SEARCH_URL="https://${lang}.wikipedia.org/w/api.php?action=query&list=search&origin=*&srsearch=${query}&utf8=&format=json"
const MEDS_CATEGORY_DE="Kategorie:Arzneistoff"
const ALL_MEDS_URL="https://${lang}.wikipedia.org/w/api.php?action=query&list=categorymembers&cmtitle=${medsCategory}&origin=*&format=json&cmlimit=max"
//const ALL_MEDS_URL="https://${lang}.wikipedia.org/w/index.php?title=${medsCategory}"

const opts = {
  mode: 'cors',
  headers:
      {
          'User-Agent': USER_AGENT,
          'Origin':'*'
      }
}

export { VERSION,APP_NAME,USER_AGENT, PAGE_URL, SEARCH_URL, MEDS_CATEGORY_DE, ALL_MEDS_URL}