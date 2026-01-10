import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import App from "./App.jsx";
import Home from "./pages/Home.jsx";
import Profile from "./pages/profile/Profile.jsx";
import BookDescription from "./pages/BookDescription.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<App />}>
          <Route path="/" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/book/:bookId" element={<BookDescription />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
