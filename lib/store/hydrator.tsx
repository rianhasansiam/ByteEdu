"use client";

import { useAppDispatch } from "@/lib/store/hooks";
import { setPlans } from "@/lib/store/slices/plansSlice";
import {
  setSubscriptions,
  setSubscriptionStats,
  setAvailableInstitutions,
} from "@/lib/store/slices/subscriptionsSlice";
import {
  setInstitutions,
  setInstitutionStats,
} from "@/lib/store/slices/institutionsSlice";
import {
  setUsers,
  setUserStats,
  setUserInstitutions,
} from "@/lib/store/slices/usersSlice";
import { setNotices, setNoticeStats } from "@/lib/store/slices/noticesSlice";

const actions = {
  plans: setPlans,
  subscriptions: setSubscriptions,
  subscriptionStats: setSubscriptionStats,
  availableInstitutions: setAvailableInstitutions,
  institutions: setInstitutions,
  institutionStats: setInstitutionStats,
  users: setUsers,
  userStats: setUserStats,
  userInstitutions: setUserInstitutions,
  notices: setNotices,
  noticeStats: setNoticeStats,
} as const;

type HydrateKey = keyof typeof actions;

// Dispatches during render to ensure store is populated before
// consumer components render (required for SSR compatibility).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function Hydrate({ name, data }: { name: HydrateKey; data: any }) {
  const dispatch = useAppDispatch();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dispatch((actions[name] as any)(data));
  return null;
}
