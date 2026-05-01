import countries from 'i18n-iso-countries';
import * as en from 'i18n-iso-countries/langs/en.json';
import * as ar from 'i18n-iso-countries/langs/ar.json';

countries.registerLocale(en);
countries.registerLocale(ar);

export default countries;
