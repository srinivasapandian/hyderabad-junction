import { useLocation, useOutletContext, Navigate } from 'react-router-dom';
import PolicyRenderer from './PolicyRenderer';
import { POLICY_TABS } from '../../../utils/policiesConfig';
import type { PoliciesOutletContext } from './PoliciesLayout';

export default function PolicyPage() {
  const { pathname } = useLocation();
  const { data, loading, error } = useOutletContext<PoliciesOutletContext>();

  const tab = POLICY_TABS.find((t) => t.path === pathname);
  if (!tab) return <Navigate to={POLICY_TABS[0].path} replace />;

  if (loading) return <p className="policies-intro">Loading…</p>;
  if (error)   return <p className="policies-intro">Unable to load policy. Please try again later.</p>;
  if (!data)   return null;

  return <PolicyRenderer doc={data[tab.key]} />;
}
