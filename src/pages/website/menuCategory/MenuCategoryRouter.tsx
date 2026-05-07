import { useParams } from 'react-router-dom';
import { menuLandingPagesBySlug } from '../../../data/menuLandingPages';
import MenuCategoryPage from './menuCategory';
import Menu from '../menu/menu';

/**
 * MenuCategoryRouter
 *
 * Handles both /indian-restaurant-menu/:categorySlug patterns:
 *  - Known SEO landing page slug  → renders full MenuCategoryPage
 *  - Unknown slug (live category) → renders Menu page (auto-scrolls to matching section)
 */
function MenuCategoryRouter() {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  if (menuLandingPagesBySlug[categorySlug!]) {
    return <MenuCategoryPage />;
  }
  return <Menu />;
}

export default MenuCategoryRouter;
