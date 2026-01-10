import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Avatar,
  Popover,
} from "@mui/material";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { auth, provider, db } from "../firebase";
import { signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

export default function Navbar() {
  const [anchorEl, setAnchorEl] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return unsubscribe;
  }, []);

  // Google login
  // Google login
  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const loggedUser = result.user;

      const userRef = doc(db, "users", loggedUser.uid);
      const snap = await getDoc(userRef);

      if (!snap.exists()) {
        // First login: create user with 250 points
        await setDoc(userRef, {
          name: loggedUser.displayName,
          email: loggedUser.email,
          photo: loggedUser.photoURL,
          points: 250, // give 250 points on first login
          createdAt: serverTimestamp(),
        });
      } else {
        // Optionally, you can check if points field exists and set it if missing
        const userData = snap.data();
        if (userData.points === undefined) {
          await setDoc(userRef, { points: 250 }, { merge: true });
        }
      }
    } catch (err) {
      console.error("Google login error:", err.message);
    }
  };

  // Popover for avatar
  const handleProfileClick = (event) => setAnchorEl(event.currentTarget);
  const handlePopoverClose = () => setAnchorEl(null);
  const handleGoToProfile = () => {
    navigate("/profile");
    handlePopoverClose();
  };
  const handleLogout = async () => {
    await signOut(auth);
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: "background.paper",
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
      <Toolbar sx={{ maxWidth: 1200, mx: "auto", width: "100%" }}>
        {/* Brand */}
        <Typography
          variant="h6"
          component={Link}
          to="/"
          sx={{
            textDecoration: "none",
            color: "text.primary",
            fontWeight: 700,
            letterSpacing: "-0.5px",
            flexGrow: 1,
          }}
        >
          BooksExchange
        </Typography>

        {/* Actions */}
        <Box>
          {!user ? (
            <Button
              onClick={handleLogin}
              variant={
                location.pathname === "/login" ? "contained" : "outlined"
              }
              sx={{
                textTransform: "none",
                borderRadius: 2,
                px: 3,
              }}
            >
              Login
            </Button>
          ) : (
            <>
              <IconButton onClick={handleProfileClick}>
                <Avatar src={user.photoURL} alt={user.displayName} />
              </IconButton>
              <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={handlePopoverClose}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
              >
                <Box
                  sx={{
                    p: 2,
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                  }}
                >
                  <Button onClick={handleGoToProfile}>Profile</Button>
                  <Button onClick={handleLogout}>Logout</Button>
                </Box>
              </Popover>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
