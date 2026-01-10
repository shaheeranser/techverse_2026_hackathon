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
  Drawer,
  Badge,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  Divider,
  Chip,
  Stack,
  Paper,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  Notifications as NotificationsIcon,
  Close as CloseIcon,
  SwapHoriz as SwapIcon,
  CheckCircle as AcceptIcon,
  Cancel as RejectIcon,
} from "@mui/icons-material";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { auth, provider, db } from "../firebase";
import { signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";
import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp,
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";

export default function Navbar() {
  const [anchorEl, setAnchorEl] = useState(null);
  const [user, setUser] = useState(null);
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return unsubscribe;
  }, []);

  // Listen for exchange requests (notifications) in real-time
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // Query for exchanges where user is the giver (incoming requests)
    const q = query(
      collection(db, "exchanges"),
      where("giverId", "==", user.uid),
      where("status", "in", ["pending", "accepted"])
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const exchangePromises = snapshot.docs.map(async (exchangeDoc) => {
        const exchangeData = exchangeDoc.data();
        
        // Fetch receiver info
        const receiverDoc = await getDoc(doc(db, "users", exchangeData.receiverId));
        const receiverData = receiverDoc.exists() ? receiverDoc.data() : {};

        // Fetch book info
        const listingDoc = await getDoc(doc(db, "book_listings", exchangeData.listingId));
        const listingData = listingDoc.exists() ? listingDoc.data() : {};

        // Fetch catalog info for book title
        let bookTitle = "Unknown Book";
        if (listingData.catalogId) {
          const catalogDoc = await getDoc(doc(db, "books_catalog", listingData.catalogId));
          if (catalogDoc.exists()) {
            bookTitle = catalogDoc.data().title;
          }
        }

        return {
          id: exchangeDoc.id,
          ...exchangeData,
          receiverName: receiverData.name || receiverData.displayName || "Anonymous",
          receiverPhoto: receiverData.photo || receiverData.photoURL,
          bookTitle,
          bookImage: listingData.photos?.[0],
        };
      });

      const exchangesData = await Promise.all(exchangePromises);
      setNotifications(exchangesData);
      
      // Count unread (pending status)
      const unread = exchangesData.filter(n => n.status === "pending").length;
      setUnreadCount(unread);
    });

    return () => unsubscribe();
  }, [user]);

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
          points: 250,
          createdAt: serverTimestamp(),
        });

        localStorage.setItem("loggedIn", "true");
      } else {
        const userData = snap.data();
        if (userData.points === undefined) {
          await setDoc(userRef, { points: 250 }, { merge: true });
        }
      }
    } catch (err) {
      console.error("Google login error:", err.message);
    }
  };

  // Handle accept exchange request
  const handleAcceptExchange = async (exchangeId) => {
    try {
      setLoading(true);
      const exchangeRef = doc(db, "exchanges", exchangeId);
      
      await updateDoc(exchangeRef, {
        status: "accepted",
        acceptedAt: serverTimestamp(),
      });

      // Cloud Function will handle point transfer automatically
      alert("Exchange accepted! Points will be transferred.");
    } catch (err) {
      console.error("Error accepting exchange:", err);
      alert("Failed to accept exchange. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle reject exchange request
  const handleRejectExchange = async (exchangeId) => {
    try {
      setLoading(true);
      const exchangeRef = doc(db, "exchanges", exchangeId);
      
      await updateDoc(exchangeRef, {
        status: "rejected",
        rejectedAt: serverTimestamp(),
      });

      // Update book listing status back to available
      const exchangeDoc = await getDoc(exchangeRef);
      const exchangeData = exchangeDoc.data();
      
      const listingRef = doc(db, "book_listings", exchangeData.listingId);
      await updateDoc(listingRef, {
        status: "available",
      });

      alert("Exchange request rejected.");
    } catch (err) {
      console.error("Error rejecting exchange:", err);
      alert("Failed to reject exchange. Please try again.");
    } finally {
      setLoading(false);
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
    localStorage.removeItem("loggedIn");
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  return (
    <>
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
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
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
                {/* Notification Bell */}
                <IconButton 
                  onClick={() => setNotificationDrawerOpen(true)}
                  color="black"
                >
                  <Badge badgeContent={unreadCount} color="error">
                    <NotificationsIcon />
                  </Badge>
                </IconButton>

                {/* Profile Avatar */}
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

      {/* Notification Drawer */}
      <Drawer
        anchor="right"
        open={notificationDrawerOpen}
        onClose={() => setNotificationDrawerOpen(false)}
        PaperProps={{
          sx: { width: { xs: "100%", sm: 400 } }
        }}
      >
        <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" fontWeight="bold">
            Exchange Requests
          </Typography>
          <IconButton onClick={() => setNotificationDrawerOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
        
        <Divider />

        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
            <CircularProgress />
          </Box>
        )}

        {!loading && notifications.length === 0 && (
          <Box sx={{ p: 3, textAlign: "center" }}>
            <NotificationsIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              No exchange requests yet
            </Typography>
          </Box>
        )}

        <List sx={{ p: 0 }}>
          {notifications.map((notification) => (
            <React.Fragment key={notification.id}>
              <Paper 
                elevation={0}
                sx={{ 
                  m: 2, 
                  p: 2, 
                  borderRadius: 2,
                  border: 1,
                  borderColor: notification.status === "pending" ? "primary.main" : "divider",
                  bgcolor: notification.status === "pending" ? "primary.lighter" : "background.paper",
                }}
              >
                {/* Request Header */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                  <Avatar src={notification.receiverPhoto} alt={notification.receiverName} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" fontWeight="medium">
                      {notification.receiverName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {notification.status === "pending" ? "Requesting your book" : "Request accepted"}
                    </Typography>
                  </Box>
                  <Chip 
                    label={notification.status} 
                    size="small"
                    color={notification.status === "pending" ? "warning" : "success"}
                    sx={{ textTransform: "capitalize" }}
                  />
                </Box>

                {/* Book Info */}
                <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                  {notification.bookImage && (
                    <Box
                      component="img"
                      src={notification.bookImage}
                      alt={notification.bookTitle}
                      sx={{ width: 60, height: 80, objectFit: "cover", borderRadius: 1 }}
                    />
                  )}
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight="medium" gutterBottom>
                      {notification.bookTitle}
                    </Typography>
                    <Chip 
                      icon={<SwapIcon />}
                      label={`${notification.pointsTransferred} points`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                </Box>

                {/* Message */}
                {notification.messageToOwner && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="caption">
                      "{notification.messageToOwner}"
                    </Typography>
                  </Alert>
                )}

                {/* Action Buttons - Only show for pending requests */}
                {notification.status === "pending" && (
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      startIcon={<AcceptIcon />}
                      onClick={() => handleAcceptExchange(notification.id)}
                      fullWidth
                      disabled={loading}
                    >
                      Accept
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      startIcon={<RejectIcon />}
                      onClick={() => handleRejectExchange(notification.id)}
                      fullWidth
                      disabled={loading}
                    >
                      Reject
                    </Button>
                  </Stack>
                )}

                {/* Status message for accepted */}
                {notification.status === "accepted" && (
                  <Alert severity="success" sx={{ mt: 1 }}>
                    <Typography variant="caption">
                      You accepted this request. Coordinate with {notification.receiverName} to exchange the book.
                    </Typography>
                  </Alert>
                )}
              </Paper>
            </React.Fragment>
          ))}
        </List>
      </Drawer>
    </>
  );
}