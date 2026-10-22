// Alt text for the site's shared images, used by the page generators and by
// scripts/fix-alts.cjs (which fills in empty alt="" on hand-written pages).
//   altFor(src) → a description for the image at `src`, or '' if unknown

const PHOTOS = {
  'australia-hero': 'Sydney Opera House on the harbour',
  'australia-food': 'Pavlova topped with cream and fresh fruit',
  'bali-hero': 'Green rice terraces in Bali',
  'bali-food': 'Babi guling, Balinese roast pork with rice',
  'bhutan-hero': "Paro Taktsang, the Tiger's Nest monastery, on a cliff in Bhutan",
  'bhutan-food': 'Ema datshi, chillies in cheese, with steamed bread',
  'clarke-quay-hero': 'Boat Quay shophouses along the Singapore River',
  'dubai-hero': 'Yachts and towers at Dubai Marina',
  'dubai-food': 'Karak chai with luqaimat dumplings',
  'egypt-hero': 'The pyramids of Giza in Egypt',
  'egypt-food': 'A bowl of Egyptian koshary',
  'france-hero': 'The Eiffel Tower in Paris in spring',
  'france-food': 'Colourful French macarons',
  'gardens-by-the-bay-hero': 'Supertree Grove at Gardens by the Bay, Singapore',
  'germany-hero': 'Neuschwanstein Castle in Bavaria, Germany',
  'germany-food': 'Currywurst with fries',
  'greece-hero': 'Blue domes of Oia, Santorini',
  'greece-food': 'Greek salad with feta and olives',
  'hong-kong-hero': 'Hong Kong skyline across Victoria Harbour at night',
  'hong-kong-food': 'A dim sum spread in Hong Kong',
  'iceland-hero': 'Skógafoss waterfall in Iceland',
  'iceland-food': 'Plokkfiskur, Icelandic fish stew, with rye bread',
  'india-hero': 'The Taj Mahal in Agra, India',
  'india-food': 'A spicy anda (egg) curry',
  'indonesia-hero': 'Mount Bromo volcano at sunrise in Java, Indonesia',
  'indonesia-food': 'Indonesian gado-gado with peanut sauce',
  'italy-hero': 'The Colosseum in Rome',
  'italy-food': 'A vegetarian pizza',
  'japan-hero': 'Kiyomizu-dera temple in Kyoto, Japan, in autumn',
  'jewel-changi-hero': 'The Rain Vortex waterfall at Jewel Changi Airport',
  'johor-causeway-hero': 'The Johor–Singapore Causeway',
  'little-india-hero': 'Sri Veeramakaliamman Temple in Little India, Singapore',
  'malaysia-hero': 'Petronas Twin Towers in Kuala Lumpur, Malaysia',
  'malaysia-food': 'Nasi lemak with sambal, egg and peanuts',
  'maldives-hero': 'A resort pool overlooking the sea in the Maldives',
  'maldives-food': 'Mas huni with roshi, a Maldivian breakfast',
  'merlion-hero': 'The Merlion at Marina Bay, Singapore',
  'mexico-hero': 'El Castillo pyramid at Chichén Itzá, Mexico',
  'mexico-food': 'A bowl of fresh guacamole',
  'nepal-hero': 'Swayambhunath stupa with prayer flags in Kathmandu, Nepal',
  'nepal-food': 'A plate of steamed momos',
  'peru-hero': 'Machu Picchu in the Andes, Peru',
  'peru-food': 'A street food stall in Lima, Peru',
  'philippines-hero': 'The Chocolate Hills of Bohol, Philippines',
  'philippines-food': 'Halo-halo, Filipino shaved-ice dessert',
  'portugal-hero': 'Rua Augusta Arch in Lisbon, Portugal',
  'portugal-food': 'Pastéis de nata custard tarts with coffee',
  'sentosa-hero': 'Palawan Beach on Sentosa, Singapore',
  'singapore-hero': 'ArtScience Museum and the Marina Bay skyline, Singapore',
  'singapore-food': 'A bowl of laksa noodle soup',
  'singapore-hdb-hero': 'Pinnacle@Duxton public housing towers, Singapore',
  'singapore-zoo-hero': 'An Asian elephant at Singapore Zoo',
  'south-korea-hero': 'Gyeonghoeru pavilion at Gyeongbokgung Palace, Seoul',
  'spain-hero': 'The carved ceiling of the Alhambra in Granada, Spain',
  'spain-food': 'Paella cooking in a large pan',
  'sri-lanka-hero': 'A blue train crossing the Nine Arch Bridge in Ella, Sri Lanka',
  'sri-lanka-food': 'Sri Lankan rice and curry',
  'thailand-hero': 'Wat Arun temple in Bangkok, Thailand',
  'turkey-hero': 'Göreme valley in Cappadocia, Turkey',
  'turkey-food': 'A plate of sultan kebab',
  'universal-studios-singapore-hero': 'The Universal Studios globe on Sentosa, Singapore',
  'vietnam-hero': 'Limestone islands in Ha Long Bay, Vietnam',
  'azerbaijan-hero': 'The Flame Towers above Baku, Azerbaijan',
  'azerbaijan-food': 'Azerbaijani plov, the saffron rice dish served at celebrations',
  'georgia-hero': 'Gergeti Trinity Church on a green hill below the Caucasus, Georgia',
  'georgia-food': "Khachapuri, Georgia's cheese-filled bread",
  'kazakhstan-hero': 'Charyn Canyon, Kazakhstan',
  'kazakhstan-food': 'Baursak, fried dough puffs served with tea in Kazakhstan',
  'uzbekistan-hero': 'A tiled madrasa on the Registan in Samarkand, Uzbekistan',
  'uzbekistan-food': 'Uzbek samsa, flaky pastries baked in a tandoor',
  'cambodia-hero': 'Angkor Wat reflected in a lotus pond, Cambodia',
  'cambodia-food': "Fish amok, Cambodia's coconut curry steamed in banana leaf",
  'taiwan-hero': 'Taipei 101 rising above the Taipei skyline, Taiwan',
  'taiwan-food': 'Taiwanese beef noodle soup at a Taipei noodle shop',
  'qatar-hero': 'The West Bay skyline of Doha at night, Qatar',
  'qatar-food': 'Machboos, the spiced rice dish of the Gulf',
  'oman-food': 'A shared platter of Omani rice with grilled meat',
  'oman-hero': 'Nizwa Fort and the minaret of the Friday Mosque, Oman',
  'macau-hero': "The Ruins of St. Paul's, Macau",
  'macau-food': "Portuguese egg tarts, Macau's most famous snack",
};

const FLAGS = {
  sg: 'Singapore', jp: 'Japan', th: 'Thailand', my: 'Malaysia', id: 'Indonesia', vn: 'Vietnam', kr: 'South Korea',
  in: 'India', tr: 'Turkey', it: 'Italy', gr: 'Greece', fr: 'France', es: 'Spain', pt: 'Portugal', de: 'Germany',
  is: 'Iceland', mx: 'Mexico', pe: 'Peru', eg: 'Egypt', au: 'Australia', lk: 'Sri Lanka', mv: 'Maldives',
  ae: 'United Arab Emirates', np: 'Nepal', bt: 'Bhutan', hk: 'Hong Kong', ph: 'Philippines',
  az: 'Azerbaijan', ge: 'Georgia', kz: 'Kazakhstan', uz: 'Uzbekistan', kh: 'Cambodia', tw: 'Taiwan', qa: 'Qatar', om: 'Oman', mo: 'Macau',
};

const OTHER = {
  '/public/images/brand/logo-mark.svg': 'Love and Layovers logo',
  '/public/images/brand/logo-mark-light.svg': 'Love and Layovers logo',
  '/assets/self/couple-hero.webp': 'Sanket and Nikita, travel and lifestyle creators in Singapore',
  '/assets/self/nikita-about.webp': 'Nikita',
  '/assets/self/avatar.webp': 'Sanket and Nikita',
  '/public/images/banner-1200.webp': 'Love and Layovers: Singapore travel and lifestyle',
};

function altFor(src = '') {
  const path = src.split('?')[0];
  if (OTHER[path]) return OTHER[path];
  let m = path.match(/\/images\/flags\/([a-z]{2})\.(?:svg|webp)$/);
  if (m && FLAGS[m[1]]) return `Flag of ${FLAGS[m[1]]}`;
  m = path.match(/\/images\/destinations\/(?:thumbs\/)?([\w-]+)\.webp$/);
  if (m && PHOTOS[m[1]]) return PHOTOS[m[1]];
  return '';
}

module.exports = { altFor, PHOTOS, FLAGS };
