import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  User,
  UserStats,
} from "@/app/(pages)/superAdmin/users/components/types";

type UsersState = {
  users: User[];
  stats: UserStats;
  institutions: string[];
};

const initialState: UsersState = {
  users: [],
  stats: {
    total: 0,
    superAdmins: 0,
    admins: 0,
    teachers: 0,
    students: 0,
    users: 0,
  },
  institutions: [],
};

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    setUsers: (state, action: PayloadAction<User[]>) => {
      state.users = action.payload;
    },
    setUserStats: (state, action: PayloadAction<UserStats>) => {
      state.stats = action.payload;
    },
    setUserInstitutions: (state, action: PayloadAction<string[]>) => {
      state.institutions = action.payload;
    },
  },
});

export const { setUsers, setUserStats, setUserInstitutions } =
  usersSlice.actions;
export default usersSlice.reducer;
