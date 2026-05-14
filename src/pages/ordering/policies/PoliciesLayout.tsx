import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import PageBg from '../../../components/pageBg/PageBg';
import { POLICIES_URL, POLICY_TABS, type PoliciesPayload } from '../../../utils/policiesConfig';
import localPolicies from '../../../data/policies.json';
import './policies.css';

export interface PoliciesOutletContext {
  data: PoliciesPayload | null;
  loading: boolean;
  error: string | null;
}

export default function PoliciesLayout() {
  const tabsRef = useRef<HTMLElement>(null);
  const { pathname } = useLocation();

  const [data, setData] = useState<PoliciesPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Remote fetch disabled — using bundled local policies data (no network request)
    // POLICIES_URL preserved for future re-enablement: fetch(POLICIES_URL, { signal })
    setData(localPolicies as PoliciesPayload);
    setLoading(false);
  }, []);

  useEffect(() => {
    const nav = tabsRef.current;
    const activeTab = nav?.querySelector<HTMLElement>('.policies-tab.is-active');
    if (!nav || !activeTab) return;

    const navRect = nav.getBoundingClientRect();
    const tabRect = activeTab.getBoundingClientRect();
    const offset =
      tabRect.left - navRect.left + tabRect.width / 2 - nav.clientWidth / 2;

    nav.scrollTo({ left: nav.scrollLeft + offset, behavior: 'smooth' });
  }, [pathname]);

  const outletContext: PoliciesOutletContext = { data, loading, error: null };

  return (
    <PageBg className="policies-page">
      <div className="policies-inner">
        <nav ref={tabsRef} className="policies-tabs" aria-label="Terms and policies sections">
          {POLICY_TABS.map((tab) => (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={({ isActive }) =>
                `policies-tab${isActive ? ' is-active' : ''}`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>

        <section className="policies-content">
          <Outlet context={outletContext} />
        </section>
      </div>
    </PageBg>
  );
}
