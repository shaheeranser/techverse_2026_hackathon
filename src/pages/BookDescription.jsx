import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Box,
  Grid,
  Card,
  CardMedia,
  Paper,
  Typography,
  Breadcrumbs,
  Tabs,
  Tab,
  Divider,
  Avatar,
  Stack,
  Button,
  Modal,
  IconButton,
} from "@mui/material";
import {
  AccountCircle as AccountIcon,
  Star as StarIcon,
  LocationOn as LocationIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { db, auth } from "../firebase";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  serverTimestamp,
  runTransaction,
  addDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const BookDescription = () => {
  const { bookId } = useParams();
  const [tab, setTab] = useState(0);
  const [book, setBook] = useState(null);
  const [exchangeHistory, setExchangeHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState({
    points: 0,
    userId: "",
    name: "",
  });
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState("");
  const [swapModalOpen, setSwapModalOpen] = useState(false);

  useEffect(() => {
    const fetchBookAndUser = async (user) => {
      setLoading(true);
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.exists()
          ? userSnap.data()
          : { points: 0, name: user.displayName || "User" };

        setCurrentUser({
          points: userData.points || 0,
          userId: user.uid,
          name: userData.name,
        });

        // Fetch book
        const bookRef = doc(db, "books", bookId);
        const bookSnap = await getDoc(bookRef);
        if (!bookSnap.exists()) {
          setError("Book not found");
          setBook(null);
          setExchangeHistory([]);
          setLoading(false);
          return;
        }

        const bookData = { id: bookSnap.id, ...bookSnap.data() };
        setBook(bookData);

        // Fetch exchange history
        const historyRef = collection(db, "books", bookId, "exchangeHistory");
        const historySnap = await getDocs(historyRef);
        const historyData = historySnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setExchangeHistory(historyData);
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load book data");
      }
      setLoading(false);
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchBookAndUser(user);
      } else {
        setError("User not logged in");
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [bookId]);

  const handleTabChange = (event, newValue) => setTab(newValue);

  const openLightbox = (image) => {
    setLightboxImage(image);
    setLightboxOpen(true);
  };
  const closeLightbox = () => setLightboxOpen(false);

  const openSwapModal = () => setSwapModalOpen(true);
  const closeSwapModal = () => setSwapModalOpen(false);

  const handleSwapConfirm = async () => {
    if (!auth.currentUser || !book) return;

    try {
      const currentUserId = auth.currentUser.uid;
      const ownerId = book.ownerId;
      const cost = book.points || 0;

      // Transaction: deduct points from current user and add to owner
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, "users", currentUserId);
        const ownerRef = doc(db, "users", ownerId);

        const userSnap = await transaction.get(userRef);
        const ownerSnap = await transaction.get(ownerRef);

        if (!userSnap.exists() || !ownerSnap.exists()) {
          throw new Error("User or book owner not found");
        }

        const userPoints = userSnap.data().points || 0;
        const ownerPoints = ownerSnap.data().points || 0;

        if (userPoints < cost) {
          throw new Error("You don't have enough points to swap this book");
        }

        transaction.update(userRef, { points: userPoints - cost });
        transaction.update(ownerRef, { points: ownerPoints + cost });
      });

      // Record the swap in exchange history
      const historyRef = collection(db, "books", book.id, "exchangeHistory");
      await addDoc(historyRef, {
        reader: auth.currentUser.displayName || "User",
        readerId: currentUserId,
        location: book.location,
        note: "Book swapped",
        rating: 0,
        timestamp: serverTimestamp(),
      });

      // Add book to receivedBooks
      const receivedRef = collection(db, "users", currentUserId, "receivedBooks");
      await addDoc(receivedRef, {
        bookId: book.id,
        title: book.title,
        author: book.author,
        pictures: book.pictures,
        location: book.location,
        points: book.points,
        ownerName: book.ownerName,
        ownerId: book.ownerId,
        timestamp: serverTimestamp(),
      });

      // Update current user points in UI
      setCurrentUser((prev) => ({ ...prev, points: prev.points - cost }));

      alert("Swap successful!");
      closeSwapModal();
    } catch (err) {
      console.error(err);
      alert(err.message || "Swap failed");
      closeSwapModal();
    }
  };

  if (loading)
    return <Typography sx={{ textAlign: "center", mt: 5 }}>Loading...</Typography>;
  if (error)
    return (
      <Typography sx={{ textAlign: "center", mt: 5, color: "red" }}>{error}</Typography>
    );
  if (!book) return null;

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 1400, margin: "0 auto" }}>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
        <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
          Home
        </Link>
        <Typography color="text.primary">{book.title || "Book"}</Typography>
      </Breadcrumbs>

      <Grid container spacing={4}>
        {/* Left Column */}
        <Grid item xs={12} md={4} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Card sx={{ borderRadius: 3, flex: 1, overflow: "hidden" }}>
            <CardMedia
              component="img"
              image={book.pictures?.[0] || ""}
              alt={book.title}
              sx={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </Card>

          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
              Book Owner
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Avatar sx={{ mr: 2 }} src={book.ownerPhoto}>
                <AccountIcon />
              </Avatar>
              <Box>
                <Typography variant="body1">{book.ownerName}</Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <StarIcon sx={{ fontSize: 16, color: "warning.main" }} />
                  <Typography variant="caption">4.8 rating</Typography>
                </Box>
              </Box>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", color: "text.secondary", mb: 1 }}>
              <LocationIcon sx={{ fontSize: 18, mr: 1 }} />
              <Typography variant="body2">{book.location}</Typography>
            </Box>
            <Button variant="outlined" fullWidth size="small" onClick={openSwapModal}>
              Swap for {book.points || 0} pts
            </Button>
          </Paper>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} md={8} sx={{ flexGrow: 1 }}>
          <Paper sx={{ borderRadius: 3 }}>
            <Tabs value={tab} onChange={handleTabChange} indicatorColor="primary" textColor="primary" variant="fullWidth">
              <Tab label="Details" />
              <Tab label="Reading Journey" />
              <Tab label="Exchange Points" />
            </Tabs>

            <Box sx={{ p: 3 }}>
              {tab === 0 && (
                <Box>
                  <Typography variant="h4" gutterBottom>
                    {book.title}
                  </Typography>
                  <Typography variant="h6" color="text.secondary">
                    {book.author}
                  </Typography>
                  <Divider sx={{ my: 3 }} />
                  <Typography variant="body1">{book.description}</Typography>

                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Additional Photos
                    </Typography>
                    <Grid container spacing={2}>
                      {book.pictures?.map((p, i) => (
                        <Grid item xs={6} sm={4} key={i}>
                          <Card sx={{ cursor: "pointer", borderRadius: 2, overflow: "hidden" }} onClick={() => openLightbox(p)}>
                            <CardMedia component="img" image={p} alt={`Photo ${i + 1}`} sx={{ width: "100%", height: 150, objectFit: "cover" }} />
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                </Box>
              )}
              {tab === 1 && (
                <Stack spacing={2}>
                  {exchangeHistory.length === 0 && <Typography>No reading history yet.</Typography>}
                  {exchangeHistory.map((entry, i) => (
                    <Paper key={i} sx={{ p: 2 }}>
                      <Typography variant="subtitle2">{entry.reader}</Typography>
                      <Typography variant="caption">{entry.location}</Typography>
                      <Box sx={{ display: "flex", mt: 1 }}>
                        {[...Array(5)].map((_, idx) => (
                          <StarIcon key={idx} sx={{ fontSize: 16, color: idx < (entry.rating || 0) ? "warning.main" : "grey.300" }} />
                        ))}
                      </Box>
                      <Typography variant="body2" sx={{ mt: 1, fontStyle: "italic" }}>
                        {entry.note}
                      </Typography>
                    </Paper>
                  ))}
                </Stack>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Lightbox Modal */}
      <Modal open={lightboxOpen} onClose={closeLightbox}>
        <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", maxWidth: "90%", maxHeight: "90%", outline: "none" }}>
          <Card sx={{ position: "relative" }}>
            <IconButton sx={{ position: "absolute", top: 8, right: 8, color: "white", zIndex: 1 }} onClick={closeLightbox}>
              <CloseIcon />
            </IconButton>
            <CardMedia component="img" src={lightboxImage} alt="Book" sx={{ width: "100%", maxHeight: "90vh", objectFit: "contain" }} />
          </Card>
        </Box>
      </Modal>

      {/* Swap Modal */}
      <Modal open={swapModalOpen} onClose={closeSwapModal}>
        <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", bgcolor: "background.paper", borderRadius: 2, boxShadow: 24, p: 4, width: { xs: "90%", sm: 400 } }}>
          <Typography variant="h6" gutterBottom>
            Confirm Swap
          </Typography>
          <Typography sx={{ mb: 3 }}>
            Are you sure you want to swap this book for <strong>{book?.points || 0} points</strong>?
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button variant="outlined" onClick={closeSwapModal}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleSwapConfirm}>
              Confirm
            </Button>
          </Stack>
        </Box>
      </Modal>
    </Box>
  );
};

export default BookDescription;
