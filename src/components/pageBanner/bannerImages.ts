import banner11 from '../../assets/banner/banner-11.jpg';
import banner31 from '../../assets/banner/banner-31.jpg';
import ohImg2   from '../../assets/images/openingHours/002.jpg';
import ohImg3   from '../../assets/images/openingHours/003.png';
import ohImg7   from '../../assets/images/openingHours/007.jpg';

export const BANNER_IMAGES = {
  about:   banner11,
  menu:    ohImg7,
  contact: banner31,
  account: ohImg3,
  blog:    ohImg2,
} as const;

export type BannerImageKey = keyof typeof BANNER_IMAGES;
