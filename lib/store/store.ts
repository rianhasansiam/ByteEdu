import { configureStore } from "@reduxjs/toolkit";
import plansReducer from "./slices/plansSlice";
import subscriptionsReducer from "./slices/subscriptionsSlice";
import institutionsReducer from "./slices/institutionsSlice";
import usersReducer from "./slices/usersSlice";
import noticesReducer from "./slices/noticesSlice";

export const makeStore = () =>
  configureStore({
    reducer: {
      plans: plansReducer,
      subscriptions: subscriptionsReducer,
      institutions: institutionsReducer,
      users: usersReducer,
      notices: noticesReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ serializableCheck: false }),
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
