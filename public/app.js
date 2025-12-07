import React, { useState } from "react";
import { useAuth } from "./context/AuthContext.jsx";
import { getFunctions, httpsCallable } from "firebase/functions";
const LoginScreen = ({ error }) => /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-center justify-center min-h-screen bg-gray-100" }, /* @__PURE__ */ React.createElement("div", { className: "p-8 bg-white shadow-lg rounded-lg" }, /* @__PURE__ */ React.createElement("h1", { className: "text-2xl font-bold mb-4 text-emerald-700" }, "Comic Scan Pro"), /* @__PURE__ */ React.createElement("p", { className: "mb-4 text-gray-600" }, "Please sign in to continue."), error && /* @__PURE__ */ React.createElement("p", { className: "text-red-500 text-sm mb-4" }, error), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-400" }, "Authenticating...")));
const Dashboard = ({ user, logout }) => /* @__PURE__ */ React.createElement("div", { className: "p-8" }, /* @__PURE__ */ React.createElement("header", { className: "flex justify-between items-center mb-8" }, /* @__PURE__ */ React.createElement("h1", { className: "text-3xl font-bold text-gray-800" }, "Dashboard"), /* @__PURE__ */ React.createElement("button", { onClick: logout, className: "px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600" }, "Log Out")), /* @__PURE__ */ React.createElement("div", { className: "bg-white p-6 rounded shadow" }, /* @__PURE__ */ React.createElement("p", { className: "text-lg" }, "Welcome, User: ", /* @__PURE__ */ React.createElement("span", { className: "font-mono" }, user.uid)), /* @__PURE__ */ React.createElement("p", { className: "mt-4 text-gray-600" }, "Barcode scanning and AI features are ready.")));
const App = () => {
  const { currentUser, loading, authInitialized, logout } = useAuth();
  if (loading || !authInitialized) {
    return /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-center min-h-screen text-xl text-emerald-600" }, "Loading Application...");
  }
  if (!currentUser) {
    return /* @__PURE__ */ React.createElement(LoginScreen, { error: "Authentication failed or pending." });
  }
  return /* @__PURE__ */ React.createElement(Dashboard, { user: currentUser, logout });
};
var App_default = App;
export {
  App_default as default
};
