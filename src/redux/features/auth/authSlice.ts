import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "../../store";

type TAuthState = {
  id: string | null;
  name: string | null;
  email: string | null;
  role: "ADMIN" | "SITE_MANAGER" | "WORKER" | null;
  token: string | null;
};

const initialState: TAuthState = {
  id: null,
  name: null,
  email: null,
  role: null,
  token: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState: initialState,
  reducers: {
    setUser: (state, action) => {
      const { id, name, email, token, role } = action.payload;
      state.id = id ?? null;
      state.name = name;
      state.email = email;
      state.role = role;
      state.token = token;
    },
    logOut: (state) => {
      state.id = null;
      state.email = null;
      state.token = null;
      state.role = null;
      state.name = null;
    },
  },
});

export const { setUser, logOut } = authSlice.actions;
export default authSlice.reducer;

export const useCurrentUser = (state: RootState) => state.auth;
export const useCurrentToken = (state: RootState) => state.auth.token;
export const useCurrentRole = (state: RootState) => state.auth.role;
