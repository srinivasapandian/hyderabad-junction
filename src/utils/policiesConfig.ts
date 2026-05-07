import type { PolicyDocument } from '../pages/ordering/policies/PolicyRenderer';

export const POLICIES_URL = 'https://storage.googleapis.com/mhp-media/file/policies.json';

export type PolicyKey = 'termsOfUse' | 'cancellationRefundPolicy' | 'privacyPolicy';

export type PoliciesPayload = Record<PolicyKey, PolicyDocument>;

export interface PolicyTab {
  path: string;
  label: string;
  key: PolicyKey;
}

export const POLICY_TABS: PolicyTab[] = [
  { path: '/terms-of-use',               label: 'Terms of use',                 key: 'termsOfUse' },
  { path: '/cancellation-refund-policy', label: 'Cancellation & refund policy', key: 'cancellationRefundPolicy' },
  { path: '/privacy-policy',             label: 'Privacy Policy',               key: 'privacyPolicy' },
];
