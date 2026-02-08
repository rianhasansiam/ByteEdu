import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { PlanRecord } from "@/app/(pages)/superAdmin/subscriptions/components/types";

type PlansState = {
  plans: PlanRecord[];
};

const initialState: PlansState = {
  plans: [],
};

const plansSlice = createSlice({
  name: "plans",
  initialState,
  reducers: {
    setPlans: (state, action: PayloadAction<PlanRecord[]>) => {
      state.plans = action.payload;
    },
  },
});

export const { setPlans } = plansSlice.actions;
export default plansSlice.reducer;
