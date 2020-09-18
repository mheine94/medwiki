const VERSION="1.0.0"
const APP_NAME="Wikipedia-Medication-Extractor"
//need custom useragent to prevent errors with wikipedia
//https://meta.wikimedia.org/wiki/User-Agent_policy
const USER_AGENT_CONTACT="https://medication-wiki-api.uni-muenster.de"
const USER_AGENT = `${APP_NAME}_bot/${VERSION} (${USER_AGENT_CONTACT})`
const PAGE_URL="https://${lang}.wikipedia.org/wiki/${title}"
const SEARCH_URL="https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${query}&utf8=&format=json"
const MEDS_CATEGORY_DE="Kategorie:Arzneistoff"
const ALL_MEDS_URL="https://${lang}.wikipedia.org/w/index.php?title=${medsCategory}"
const PORT="8080"
const ADRESS="127.0.0.1"

const CACHE_EXPIRE="1 week"

module.exports = {
    VERSION:VERSION,
    APP_NAME:APP_NAME,
    USER_AGENT_CONTACT:USER_AGENT_CONTACT,
    USER_AGENT:USER_AGENT,
    PAGE_URL:PAGE_URL,
    SEARCH_URL:SEARCH_URL,
    MEDS_CATEGORY_DE:MEDS_CATEGORY_DE,
    ALL_MEDS_URL:ALL_MEDS_URL,
    PORT:PORT,
    ADRESS:ADRESS,
    CACHE_EXPIRE:CACHE_EXPIRE
}