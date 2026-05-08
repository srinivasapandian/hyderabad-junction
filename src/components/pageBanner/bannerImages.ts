import contactBanner from '../../assets/contact-banner.png';
import accountBanner from '../../assets/account-banner.png';
import menuBanner from '../../assets/menu-banner.jpg';

export const BANNER_IMAGES = {
  menu:    menuBanner,
  contact: contactBanner,
  account: accountBanner,
} as const;

export type BannerImageKey = keyof typeof BANNER_IMAGES;
