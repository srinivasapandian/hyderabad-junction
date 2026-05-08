import banner11 from '../../assets/banner/banner-11.jpg';
import banner31       from '../../assets/banner/banner-31.jpg';
import contactBanner from '../../assets/contact-banner.png';
import ohImg2   from '../../assets/images/openingHours/002.jpg';
import ohImg3   from '../../assets/images/openingHours/003.png';
import ohImg7   from '../../assets/images/openingHours/007.jpg';
import event2         from '../../assets/event2.png';
import accountBanner from '../../assets/account-banner.png';
import menuBanner from '../../assets/menu-banner.jpg';

export const BANNER_IMAGES = {
  about:   banner11,
  menu:    menuBanner,
  contact: contactBanner,
  account: accountBanner,
  blog:    ohImg2,
} as const;

export type BannerImageKey = keyof typeof BANNER_IMAGES;
