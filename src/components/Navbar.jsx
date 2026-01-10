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
  Tabs,
  Tab,
} from "@mui/material";
import {
  Notifications as NotificationsIcon,
  Close as CloseIcon,
  SwapHoriz as SwapIcon,
  CheckCircle as AcceptIcon,
  Cancel as RejectIcon,
  ShoppingCart as OrderIcon,
  Send as SentIcon,
  Inbox as ReceivedIcon,
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
  or,
} from "firebase/firestore";

export default function Navbar() {
  const [anchorEl, setAnchorEl] = useState(null);
  const [user, setUser] = useState(null);
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0); // 0 = Requests, 1 = My Orders
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
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

  // Listen for INCOMING exchange requests (where user is the giver)
  useEffect(() => {
    if (!user) {
      setIncomingRequests([]);
      return;
    }

    const q = query(
      collection(db, "exchanges"),
      where("giverId", "==", user.uid),
      where("status", "in", ["pending", "accepted", "completed"])
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
          type: "incoming",
          ...exchangeData,
          receiverName: receiverData.name || receiverData.displayName || "Anonymous",
          receiverPhoto: receiverData.photo || receiverData.photoURL,
          bookTitle,
          bookImage: listingData.photos?.[0],
          createdAt: exchangeData.requestedAt?.toDate?.() || new Date(),
        };
      });

      const exchangesData = await Promise.all(exchangePromises);
      
      // Sort by date (newest first)
      exchangesData.sort((a, b) => b.createdAt - a.createdAt);
      
      setIncomingRequests(exchangesData);
      
      // Count unread (pending status)
      const unread = exchangesData.filter(n => n.status === "pending").length;
      setUnreadCount(unread);
    });

    return () => unsubscribe();
  }, [user]);

  // Listen for MY ORDERS (where user is the receiver - books they requested)
  useEffect(() => {
    if (!user) {
      setMyOrders([]);
      return;
    }

    const q = query(
      collection(db, "exchanges"),
      where("receiverId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const orderPromises = snapshot.docs.map(async (exchangeDoc) => {
        const exchangeData = exchangeDoc.data();
        
        // Fetch giver (book owner) info
        const giverDoc = await getDoc(doc(db, "users", exchangeData.giverId));
        const giverData = giverDoc.exists() ? giverDoc.data() : {};

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
          type: "outgoing",
          ...exchangeData,
          giverName: giverData.name || giverData.displayName || "Anonymous",
          giverPhoto: giverData.photo || giverData.photoURL,
          bookTitle,
          bookImage: listingData.photos?.[0],
          createdAt: exchangeData.requestedAt?.toDate?.() || new Date(),
        };
      });

      const ordersData = await Promise.all(orderPromises);
      
      // Sort by date (newest first)
      ordersData.sort((a, b) => b.createdAt - a.createdAt);
      
      setMyOrders(ordersData);
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

      alert("Exchange accepted! Points will be transferred.");
    } catch (err) {
      console.error("Error accepting exchange:", err);
      alert("Failed to accept exchange. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle reject exchange request
  const handleRejectExchange = async (exchangeId, listingId) => {
    try {
      setLoading(true);
      const exchangeRef = doc(db, "exchanges", exchangeId);
      
      await updateDoc(exchangeRef, {
        status: "rejected",
        rejectedAt: serverTimestamp(),
      });

      // Update book listing status back to available
      const listingRef = doc(db, "book_listings", listingId);
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

  // Handle confirm receipt (for receiver)
  const handleConfirmReceipt = async (exchangeId) => {
    try {
      setLoading(true);
      const exchangeRef = doc(db, "exchanges", exchangeId);
      
      await updateDoc(exchangeRef, {
        receiverConfirmed: true,
      });

      alert("Receipt confirmed! Waiting for owner to confirm.");
    } catch (err) {
      console.error("Error confirming receipt:", err);
      alert("Failed to confirm receipt. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle confirm sent (for giver)
  const handleConfirmSent = async (exchangeId) => {
    try {
      setLoading(true);
      const exchangeRef = doc(db, "exchanges", exchangeId);
      
      await updateDoc(exchangeRef, {
        giverConfirmed: true,
      });

      alert("Confirmed! Waiting for receiver to confirm receipt.");
    } catch (err) {
      console.error("Error confirming sent:", err);
      alert("Failed to confirm. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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

  const getStatusColor = (status) => {
    const colors = {
      pending: "warning",
      accepted: "info",
      completed: "success",
      rejected: "error",
      cancelled: "default",
    };
    return colors[status] || "default";
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: "Pending",
      accepted: "Accepted",
      completed: "Completed",
      rejected: "Rejected",
      cancelled: "Cancelled",
    };
    return labels[status] || status;
  };

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
          sx: { width: { xs: "100%", sm: 450 } }
        }}
      >
        {/* Header */}
        <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" fontWeight="bold">
            Exchanges & Orders
          </Typography>
          <IconButton onClick={() => setNotificationDrawerOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
        
        {/* Tabs */}
        <Tabs 
          value={activeTab} 
          onChange={(e, val) => setActiveTab(val)}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          <Tab 
            icon={<ReceivedIcon />} 
            iconPosition="start" 
            label={`Requests (${incomingRequests.length})`} 
          />
          <Tab 
            icon={<SentIcon />} 
            iconPosition="start" 
            label={`My Orders (${myOrders.length})`} 
          />
        </Tabs>

        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Tab Panel 0: Incoming Requests */}
        {activeTab === 0 && (
          <Box>
            {!loading && incomingRequests.length === 0 && (
              <Box sx={{ p: 3, textAlign: "center" }}>
                <ReceivedIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  No exchange requests yet
                </Typography>
              </Box>
            )}

            <List sx={{ p: 0 }}>
              {incomingRequests.map((request) => (
                <Paper 
                  key={request.id}
                  elevation={0}
                  sx={{ 
                    m: 2, 
                    p: 2, 
                    borderRadius: 2,
                    border: 1,
                    borderColor: request.status === "pending" ? "primary.main" : "divider",
                    bgcolor: request.status === "pending" ? "primary.lighter" : "background.paper",
                  }}
                >
                  {/* Request Header */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                    <Avatar src={request.receiverPhoto} alt={request.receiverName} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" fontWeight="medium">
                        {request.receiverName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        wants your book
                      </Typography>
                    </Box>
                    <Chip 
                      label={getStatusLabel(request.status)} 
                      size="small"
                      color={getStatusColor(request.status)}
                      sx={{ textTransform: "capitalize" }}
                    />
                  </Box>

                  {/* Book Info */}
                  <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                    {request.bookImage && (
                      <Box
                        component="img"
                        src={request.bookImage}
                        alt={request.bookTitle}
                        sx={{ width: 60, height: 80, objectFit: "cover", borderRadius: 1 }}
                      />
                    )}
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight="medium" gutterBottom>
                        {request.bookTitle}
                      </Typography>
                      <Chip 
                        icon={<SwapIcon />}
                        label={`${request.pointsTransferred} points`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </Box>
                  </Box>

                  {/* Message */}
                  {request.messageToOwner && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      <Typography variant="caption">
                        "{request.messageToOwner}"
                      </Typography>
                    </Alert>
                  )}

                  {/* Action Buttons */}
                  {request.status === "pending" && (
                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        startIcon={<AcceptIcon />}
                        onClick={() => handleAcceptExchange(request.id)}
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
                        onClick={() => handleRejectExchange(request.id, request.listingId)}
                        fullWidth
                        disabled={loading}
                      >
                        Reject
                      </Button>
                    </Stack>
                  )}

                  {request.status === "accepted" && !request.giverConfirmed && (
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<AcceptIcon />}
                      onClick={() => handleConfirmSent(request.id)}
                      fullWidth
                      disabled={loading}
                    >
                      Confirm Book Sent
                    </Button>
                  )}

                  {request.status === "accepted" && request.giverConfirmed && (
                    <Alert severity="info">
                      <Typography variant="caption">
                        Waiting for {request.receiverName} to confirm receipt
                      </Typography>
                    </Alert>
                  )}

                  {request.status === "completed" && (
                    <Alert severity="success">
                      <Typography variant="caption">
                        ✓ Exchange completed with {request.receiverName}
                      </Typography>
                    </Alert>
                  )}
                </Paper>
              ))}
            </List>
          </Box>
        )}

        {/* Tab Panel 1: My Orders */}
        {activeTab === 1 && (
          <Box>
            {!loading && myOrders.length === 0 && (
              <Box sx={{ p: 3, textAlign: "center" }}>
                <SentIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  You haven't requested any books yet
                </Typography>
              </Box>
            )}

            <List sx={{ p: 0 }}>
              {myOrders.map((order) => (
                <Paper 
                  key={order.id}
                  elevation={0}
                  sx={{ 
                    m: 2, 
                    p: 2, 
                    borderRadius: 2,
                    border: 1,
                    borderColor: "divider",
                  }}
                >
                  {/* Order Header */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                    <Avatar src={order.giverPhoto} alt={order.giverName} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" fontWeight="medium">
                        Book from {order.giverName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {order.createdAt.toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Chip 
                      label={getStatusLabel(order.status)} 
                      size="small"
                      color={getStatusColor(order.status)}
                      sx={{ textTransform: "capitalize" }}
                    />
                  </Box>

                  {/* Book Info */}
                  <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                    {order.bookImage && (
                      <Box
                        component="img"
                        src={order.bookImage}
                        alt={order.bookTitle}
                        sx={{ width: 60, height: 80, objectFit: "cover", borderRadius: 1 }}
                      />
                    )}
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight="medium" gutterBottom>
                        {order.bookTitle}
                      </Typography>
                      <Chip 
                        icon={<SwapIcon />}
                        label={`${order.pointsTransferred} points`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </Box>
                  </Box>

                  {/* Status Messages */}
                  {order.status === "pending" && (
                    <Alert severity="info">
                      <Typography variant="caption">
                        Waiting for {order.giverName} to respond
                      </Typography>
                    </Alert>
                  )}

                  {order.status === "accepted" && !order.receiverConfirmed && (
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<AcceptIcon />}
                      onClick={() => handleConfirmReceipt(order.id)}
                      fullWidth
                      disabled={loading}
                    >
                      Confirm Book Received
                    </Button>
                  )}

                  {order.status === "accepted" && order.receiverConfirmed && !order.giverConfirmed && (
                    <Alert severity="info">
                      <Typography variant="caption">
                        Waiting for {order.giverName} to confirm
                      </Typography>
                    </Alert>
                  )}

                  {order.status === "completed" && (
                    <Alert severity="success">
                      <Typography variant="caption">
                        ✓ Book received! Enjoy your reading
                      </Typography>
                    </Alert>
                  )}

                  {order.status === "rejected" && (
                    <Alert severity="error">
                      <Typography variant="caption">
                        Request was declined by {order.giverName}
                      </Typography>
                    </Alert>
                  )}
                </Paper>
              ))}
            </List>
          </Box>
        )}
      </Drawer>
    </>
  );
}