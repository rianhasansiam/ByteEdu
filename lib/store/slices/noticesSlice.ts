import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  NoticeRecord,
  NoticeStats,
} from "@/app/(pages)/superAdmin/notice/components/types";

type NoticesState = {
  notices: NoticeRecord[];
  stats: NoticeStats;
};

const initialState: NoticesState = {
  notices: [],
  stats: { total: 0, published: 0, draft: 0, highPriority: 0, urgent: 0 },
};

const noticesSlice = createSlice({
  name: "notices",
  initialState,
  reducers: {
    setNotices: (state, action: PayloadAction<NoticeRecord[]>) => {
      state.notices = action.payload;
    },
    setNoticeStats: (state, action: PayloadAction<NoticeStats>) => {
      state.stats = action.payload;
    },
  },
});

export const { setNotices, setNoticeStats } = noticesSlice.actions;
export default noticesSlice.reducer;
