import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  InstitutionData,
  InstitutionStats,
} from "@/app/(pages)/superAdmin/institution/components/types";

type InstitutionsState = {
  institutions: InstitutionData[];
  stats: InstitutionStats;
};

const initialState: InstitutionsState = {
  institutions: [],
  stats: { total: 0, active: 0, inactive: 0, totalUsers: 0 },
};

const institutionsSlice = createSlice({
  name: "institutions",
  initialState,
  reducers: {
    setInstitutions: (state, action: PayloadAction<InstitutionData[]>) => {
      state.institutions = action.payload;
    },
    setInstitutionStats: (state, action: PayloadAction<InstitutionStats>) => {
      state.stats = action.payload;
    },
  },
});

export const { setInstitutions, setInstitutionStats } =
  institutionsSlice.actions;
export default institutionsSlice.reducer;
