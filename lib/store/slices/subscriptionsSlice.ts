import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  SubscriptionRecord,
  SubscriptionStats,
  InstitutionOption,
} from "@/app/(pages)/superAdmin/subscriptions/components/types";

type SubscriptionsState = {
  subscriptions: SubscriptionRecord[];
  stats: SubscriptionStats;
  availableInstitutions: InstitutionOption[];
};

const initialState: SubscriptionsState = {
  subscriptions: [],
  stats: {
    total: 0,
    paid: 0,
    due: 0,
    overdue: 0,
    totalRevenue: 0,
    paidAmount: 0,
    dueAmount: 0,
    totalInstitutions: 0,
  },
  availableInstitutions: [],
};

const subscriptionsSlice = createSlice({
  name: "subscriptions",
  initialState,
  reducers: {
    setSubscriptions: (state, action: PayloadAction<SubscriptionRecord[]>) => {
      state.subscriptions = action.payload;
    },
    setSubscriptionStats: (state, action: PayloadAction<SubscriptionStats>) => {
      state.stats = action.payload;
    },
    setAvailableInstitutions: (
      state,
      action: PayloadAction<InstitutionOption[]>
    ) => {
      state.availableInstitutions = action.payload;
    },
  },
});

export const {
  setSubscriptions,
  setSubscriptionStats,
  setAvailableInstitutions,
} = subscriptionsSlice.actions;
export default subscriptionsSlice.reducer;
