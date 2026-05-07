import biryaniHero    from '../assets/images/new/menu/biriyani.jpg';
import curriesHero    from '../assets/images/new/menu/curries.jpg';
import dessertsHero   from '../assets/images/new/menu/desserts.jpg';
import dosaHero       from '../assets/images/new/menu/dosa.jpg';
import indianBreadsHero from '../assets/images/new/menu/indianbreads.jpg';
import startersHero   from '../assets/images/new/menu/starters.jpg';

export interface FaqAnswerSegment {
  type: 'text' | 'link';
  text: string;
  to?: string;
}

export interface FaqItem {
  question: string;
  answer: string;
  answerSegments?: FaqAnswerSegment[];
}

export interface MenuLandingPage {
  slug: string;
  heroImage: string;
  title: string;
  shortTitle: string;
  heroDescription: string;
  overview: string;
  chips: string[];
  featurePoints: string[];
  faqIntro: string;
  faqs: FaqItem[];
  seoTitle: string;
  seoDescription: string;
}

export const homeFaqItems: FaqItem[] = [
  {
    question: 'What types of Indian breads are available at Amudham Cafe?',
    answer:
      'We serve parotta, chilli parotta, naan, roti, and garlic naan — freshly made and perfect with our curries and gravies.',
    answerSegments: [
      { type: 'text', text: 'We serve ' },
      { type: 'link', text: 'parotta', to: '/indian-restaurant-menu/indian-breads' },
      { type: 'text', text: ', ' },
      { type: 'link', text: 'chilli parotta', to: '/indian-restaurant-menu/indian-breads' },
      { type: 'text', text: ', ' },
      { type: 'link', text: 'naan', to: '/indian-restaurant-menu/indian-breads' },
      { type: 'text', text: ', ' },
      { type: 'link', text: 'roti', to: '/indian-restaurant-menu/indian-breads' },
      { type: 'text', text: ', and garlic naan — freshly made and perfect with our curries and gravies.' },
    ],
  },
  {
    question: 'Is Amudham Cafe a vegetarian restaurant?',
    answer:
      'Yes. Amudham Cafe is a fully vegetarian Indian restaurant. Every dish on our menu — from dosas and idiyappam to paneer curries and Indo-Chinese — is 100% vegetarian.',
  },
  {
    question: 'What are the most popular dishes at Amudham Cafe?',
    answer:
      'Customers love masala dosai, paneer tikka masala, idiyappam kurma, chilli parotta, and babycorn chilli fries at Amudham Cafe.',
    answerSegments: [
      { type: 'text', text: 'Customers love ' },
      { type: 'link', text: 'masala dosai', to: '/indian-restaurant-menu/dosa' },
      { type: 'text', text: ', ' },
      { type: 'link', text: 'paneer tikka masala', to: '/indian-restaurant-menu/curries' },
      { type: 'text', text: ', ' },
      { type: 'link', text: 'idiyappam kurma', to: '/indian-restaurant-menu/dosa' },
      { type: 'text', text: ', ' },
      { type: 'link', text: 'chilli parotta', to: '/indian-restaurant-menu/indian-breads' },
      { type: 'text', text: ', and ' },
      { type: 'link', text: 'babycorn chilli fries', to: '/indian-restaurant-menu/starters' },
      { type: 'text', text: ' at Amudham Cafe.' },
    ],
  },
];

export const menuLandingPages: MenuLandingPage[] = [
  {
    slug: 'biryani',
    heroImage: biryaniHero,
    title: 'Best Veg Biryani ',
    shortTitle: 'Biryani',
    heroDescription:
      'Fragrant basmati rice, bold Indian spices, and comforting vegetarian biryani made for dine-in, pickup, and online orders.',
    overview:
      'Amudham Cafe brings together aromatic rice, rich masala, and slow-cooked flavor for guests looking for authentic vegetarian biryani. A go-to choice for hearty Indian meals with classic spice and satisfying portions — all 100% vegetarian.',
    chips: ['Veg Biryani', 'Paneer Biryani', 'Mushroom Biryani', 'Pickup and Delivery'],
    featurePoints: [
      'Prepared with traditional Indian spices and perfectly layered basmati rice.',
      'Popular choices for veg, paneer, and mushroom biryani lovers.',
      'Easy online ordering for online ordering.',
    ],
    faqIntro:
      'These are the biryani questions local guests ask most often before they place an order.',
    faqs: [
      {
        question: 'Where can I get authentic vegetarian biryani?',
        answer:
          'Amudham Cafe serves authentic vegetarian biryani with rich spices, fragrant basmati rice, and classic Indian preparation. Guests can enjoy dine-in, takeout, or order online.',
      },
      {
        question: 'Does Amudham Cafe offer paneer and mushroom biryani?',
        answer:
          'Yes. Amudham Cafe highlights popular vegetarian biryani options including paneer biryani and mushroom biryani so guests can choose the style that suits their taste.',
      },
      {
        question: 'Can I order veg biryani online near online?',
        answer:
          'Yes. Amudham Cafe makes it easy to order vegetarian biryani online for pickup or delivery online.',
      },
    ],
    seoTitle: 'Best Veg Biryani | Amudham Cafe',
    seoDescription:
      'Looking for vegetarian biryani? Explore Amudham Cafe for authentic veg, paneer, and mushroom biryani with dine-in, pickup, and online ordering.',
  },
  {
    slug: 'curries',
    heroImage: curriesHero,
    title: 'Vegetarian Indian Curries ',
    shortTitle: 'Curries',
    heroDescription:
      'Comforting gravies, slow-simmered spices, and classic vegetarian Indian curry dishes for every craving.',
    overview:
      'Amudham Cafe serves a wide range of vegetarian Indian curries for guests who want rich sauces, balanced spice, and familiar comfort-food flavor. From paneer tikka masala to dal and veg gravies, every curry is crafted fresh and 100% plant-based.',
    chips: ['Paneer Tikka Masala', 'Dal Makhani', 'Paneer Masala', 'Veg Gravies'],
    featurePoints: [
      'Rich, comforting curry bases with layered spice and aroma.',
      'Popular options for paneer, lentil, and mixed vegetable curry fans.',
      'A strong match for naan, parotta, roti, and rice-based meals.',
    ],
    faqIntro:
      'These curry FAQs are designed for guests comparing options before they dine in or order online.',
    faqs: [
      {
        question: 'Where can I get authentic vegetarian Indian curries?',
        answer:
          'Amudham Cafe serves authentic vegetarian Indian curries with bold spices, rich gravies, and classic North and South Indian flavor — all 100% vegetarian.',
      },
      {
        question: 'What are the most popular curries at Amudham Cafe?',
        answer:
          'Paneer tikka masala, dal makhani, paneer masala, and mixed vegetable curries are among the most popular choices guests look for at Amudham Cafe.',
      },
      {
        question: 'Does Amudham Cafe offer only vegetarian curries?',
        answer:
          'Yes. Amudham Cafe is a fully vegetarian restaurant. Every curry on the menu is plant-based, making it a great choice for vegetarian families and groups dining.',
      },
    ],
    seoTitle: 'Best Vegetarian Indian Curries | Amudham Cafe',
    seoDescription:
      'Explore vegetarian Indian curries at Amudham Cafe — paneer tikka masala, dal makhani, veg gravies, and more for dine-in or online ordering.',
  },
  {
    slug: 'indian-breads',
    heroImage: indianBreadsHero,
    title: 'Indian Breads and Parotta ',
    shortTitle: 'Indian Breads',
    heroDescription:
      'Fresh parotta, naan, roti, and Indian bread favorites made to pair perfectly with curries and gravies.',
    overview:
      'The Indian breads page highlights the essentials guests look for when building a complete Indian meal. Amudham Cafe pairs soft, fresh breads — including the crowd-favourite chilli parotta — with curries, chutneys, and family-style orders.',
    chips: ['Parotta', 'Chilli Parotta', 'Butter Naan', 'Garlic Naan', 'Roti'],
    featurePoints: [
      'Fresh bread options that pair well with curry, veg gravies, and rice dishes.',
      'Popular choices include parotta, chilli parotta, naan, and roti-style favorites.',
      'Ideal add-ons for family meals, combo orders, and comfort-food plates.',
    ],
    faqIntro:
      'Guests often land here when they want to know which breads pair best with the rest of the menu.',
    faqs: [
      {
        question: 'Where can I get fresh Indian breads and parotta?',
        answer:
          'Amudham Cafe offers fresh Indian breads — including parotta, chilli parotta, naan, and roti — making it easy to pair them with curries, gravies, and other classic Indian meals.',
      },
      {
        question: 'What breads are popular at Amudham Cafe?',
        answer:
          'Guests often look for chilli parotta, butter naan, garlic naan, and roti when ordering from Amudham Cafe because these breads pair well with paneer curries and veg gravies.',
      },
      {
        question: 'Can I order parotta and naan online?',
        answer:
          'Yes. Amudham Cafe offers online ordering so guests can add parotta, naan, and other Indian bread favorites to pickup and delivery orders and nearby areas.',
      },
    ],
    seoTitle: 'Fresh Parotta and Indian Breads | Amudham Cafe',
    seoDescription:
      'Looking for parotta and Indian breads? Visit Amudham Cafe for chilli parotta, butter naan, garlic naan, roti, and more to pair with your favorite dishes.',
  },
  {
    slug: 'starters',
    heroImage: startersHero,
    title: 'Vegetarian Indian Starters ',
    shortTitle: 'Starters',
    heroDescription:
      'Shareable bites, street-food favorites, and bold vegetarian appetizers to start your meal the right way.',
    overview:
      'Amudham Cafe serves vegetarian Indian starters that are perfect for guests who want a flavorful beginning before curries, biryani, or dosa. From crispy babycorn chilli fries to samosas and paneer starters, this page is built for quick appetizer searches and easy online ordering.',
    chips: ['Samosa', 'Babycorn Chilli Fries', 'Paneer Starters', 'Schzwan Noodles'],
    featurePoints: [
      'Great for sharing, snacking, or building a fuller vegetarian meal.',
      'A mix of crispy, spicy, and Indo-Chinese-style appetizer options.',
      'Popular for dine-in tables, family orders, and weekend cravings.',
    ],
    faqIntro:
      'These starter FAQs answer the quick questions guests usually have before ordering appetizers.',
    faqs: [
      {
        question: 'Where can I find the best vegetarian Indian starters?',
        answer:
          'Amudham Cafe is a popular choice for vegetarian Indian starters , serving flavorful appetizers like babycorn chilli fries, samosa, and paneer starters that are great for sharing.',
      },
      {
        question: 'What appetizers are popular at Amudham Cafe?',
        answer:
          'Guests commonly search for babycorn chilli fries, samosa, schzwan noodles, and paneer starters — all vegetarian and full of bold flavor at Amudham Cafe.',
      },
      {
        question: 'Are the starters at Amudham Cafe good for sharing?',
        answer:
          'Yes. Many guests order starters from Amudham Cafe as shareable plates for the table before moving on to curries, biryani, dosa, and breads. Every starter is 100% vegetarian.',
      },
    ],
    seoTitle: 'Best Vegetarian Indian Starters | Amudham Cafe',
    seoDescription:
      'Find vegetarian Indian starters at Amudham Cafe — babycorn chilli fries, samosa, paneer starters, and more for dine-in or takeout.',
  },
  {
    slug: 'desserts',
    heroImage: dessertsHero,
    title: 'Indian Desserts and Drinks ',
    shortTitle: 'Desserts and Drinks',
    heroDescription:
      'Sweet finishes and refreshing drinks that round out Indian vegetarian meals with comfort and balance.',
    overview:
      'This page is designed for guests looking for Indian desserts, cooling beverages, and classic sweet endings. Amudham Cafe makes it easy to add drinks and desserts to both dine-in meals and online orders.',
    chips: ['Gulab Jamun', 'Rasmalai', 'Mango Lassi', 'Masala Chai'],
    featurePoints: [
      'Sweet and refreshing options to finish a full Indian vegetarian meal.',
      'Popular pairings for curry, biryani, dosa, and parotta orders.',
      'Easy add-ons for online ordering, takeout, and group meals.',
    ],
    faqIntro:
      'These dessert and drink FAQs help guests quickly find sweet and refreshing options near USA.',
    faqs: [
      {
        question: 'Where can I get Indian desserts and drinks?',
        answer:
          'Amudham Cafe offers Indian desserts and drinks so guests can finish their meals with something sweet, creamy, or refreshing.',
      },
      {
        question: 'What desserts and beverages are popular at Amudham Cafe?',
        answer:
          'Guests often look for gulab jamun, rasmalai, mango lassi, and masala chai when ordering desserts and drinks from Amudham Cafe.',
      },
      {
        question: 'Can I add desserts and drinks to my online order?',
        answer:
          'Yes. Amudham Cafe makes it easy to add desserts and drinks to online pickup or delivery orders for guests and nearby areas.',
      },
    ],
    seoTitle: 'Indian Desserts and Drinks | Amudham Cafe',
    seoDescription:
      'Searching for Indian desserts and drinks? Explore Amudham Cafe for gulab jamun, rasmalai, mango lassi, masala chai, and more.',
  },
  {
    slug: 'dosa',
    heroImage: dosaHero,
    title: 'Best Dosa ',
    shortTitle: 'Dosa',
    heroDescription:
      'Crisp South Indian dosa favorites — masala dosai, benna dosai, and idiyappam — served with comforting chutneys and authentic flavor.',
    overview:
      'Amudham Cafe serves dosa for guests who want classic South Indian flavor. This page is focused on crisp crepes, savory fillings, soft idiyappam, and comforting accompaniments that work beautifully for breakfast, lunch, or dinner — all vegetarian.',
    chips: ['Masala Dosai', 'Benna Dosai', 'Idiyappam Kurma', 'Set Dosa'],
    featurePoints: [
      'A go-to page for crisp dosa, soft idiyappam, and South Indian comfort-food cravings.',
      'Popular for guests looking for light, flavorful, and satisfying vegetarian meals.',
      'Easy for dine-in visits, takeout meals, and online ordering.',
    ],
    faqIntro:
      'Guests browsing for dosa usually want quick clarity on variety, ordering, and what makes the page special.',
    faqs: [
      {
        question: 'Where can I get the best dosa?',
        answer:
          'Amudham Cafe offers dosa for guests looking for authentic South Indian flavor — including masala dosai, benna dosai, and idiyappam kurma with crisp texture and satisfying accompaniments.',
      },
      {
        question: 'What dosa varieties are popular at Amudham Cafe?',
        answer:
          'Guests often look for masala dosai, benna dosai, idiyappam kurma, and set dosa when visiting Amudham Cafe — all made fresh and served with chutneys and sambar.',
      },
      {
        question: 'Does Amudham Cafe offer dosa for dine-in and takeout?',
        answer:
          'Yes. Amudham Cafe serves dosa for dine-in and also makes it easy to order for takeout or online pickup and nearby areas.',
      },
    ],
    seoTitle: 'Best Dosa | Amudham Cafe',
    seoDescription:
      'Looking for dosa? Visit Amudham Cafe for masala dosai, benna dosai, idiyappam kurma, and more South Indian favorites with easy online ordering.',
  },
];

export const menuLandingPagesBySlug: Record<string, MenuLandingPage> = Object.fromEntries(
  menuLandingPages.map((page) => [page.slug, page])
);
