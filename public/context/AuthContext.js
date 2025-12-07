import React, { createContext, useContext, useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithCustomToken,
  signInAnonymously,
  onAuthStateChanged,
  signOut
} from "firebase/auth";
import { firebaseConfig } from "../firebase.js";
const AuthContext = createContext();
const useAuth = () => useContext(AuthContext);
const initialAuthToken = typeof __initial_auth_token !== "undefined" ? __initial_auth_token : null;
const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
      setAuthInitialized(true);
    });
    const signInInitial = async () => {
      try {
        if (initialAuthToken) {
          console.log("Attempting sign-in with custom token...");
          await signInWithCustomToken(auth, initialAuthToken);
        } else {
          console.log("Attempting anonymous sign-in...");
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Initial authentication failed:", error);
        setLoading(false);
        setAuthInitialized(true);
      }
    };
    if (!authInitialized) {
      signInInitial();
    }
    return () => unsubscribe();
  }, []);
  const logout = () => {
    return signOut(auth);
  };
  const value = {
    currentUser,
    loading,
    authInitialized,
    auth,
    // Expose auth instance for other components
    logout
  };
  return /* @__PURE__ */ React.createElement(AuthContext.Provider, { value }, children);
};
export {
  AuthProvider,
  useAuth
};
