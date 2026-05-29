import { configureStore, createListenerMiddleware } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { baseApi } from "@/services/server/baseApi";
import { authActions, authReducer } from "@/redux/auth/authSlice";
import { tokenManager } from "@/lib/tokenManager";
// Register all RTK Query endpoint modules
import "@/services/server";

const authListenerMiddleware = createListenerMiddleware();

authListenerMiddleware.startListening({
  actionCreator: authActions.setCredentials,
  effect: (action) => {
    tokenManager.setAccessToken(action.payload.accessToken);
  },
});

authListenerMiddleware.startListening({
  actionCreator: authActions.clearCredentials,
  effect: () => {
    tokenManager.clear();
  },
});

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .prepend(authListenerMiddleware.middleware)
      .concat(baseApi.middleware),
  devTools: import.meta.env.DEV,
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
