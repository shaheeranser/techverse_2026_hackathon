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
  addDoc,
  serverTimestamp,
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
        // Current user
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.exists()
          ? userSnap.data()
          : { points: 0, name: user.displayName || "User" };
        setCurrentUser({ points: userData.points || 0, userId: user.uid, name: userData.name });

        const bookRef = doc(db, "books", bookId);
        const bookSnap = await getDoc(bookRef);
        if (!bookSnap.exists()) {
          setError("Book not found");
          setLoading(false);
          return;
        }
        const bookData = { id: bookSnap.id, ...bookSnap.data() };
        setBook(bookData);

        const historySnap = await getDocs(
          collection(db, "books", bookId, "exchangeHistory")
        );
        setExchangeHistory(
          historySnap.docs.map((d) => ({ id: d.id, ...d.data() }))
        );
      } catch (err) {
        setError(err.message || "Failed to load data");
      }
      setLoading(false);
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) fetchBookAndUser(user);
      else {
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

  // 🔹 New: Request Swap
 // 🔹 New: Request Swap (creates an order document instead of modifying points directly)
const handleSwapRequest = async () => {
  if (!auth.currentUser || !book) return;
  try {
    const ordersRef = collection(db, "orders"); // orders collection
    await addDoc(ordersRef, {
      bookId: book.id,
      bookTitle: book.title,
      bookAuthor: book.author,
      bookOwnerId: book.ownerId,
      requesterId: currentUser.userId,
      requesterName: currentUser.name,
      points: book.points || 0,
      status: "pending",          // pending approval
      createdAt: serverTimestamp()
    });

    alert("Swap request sent! Book owner will approve it.");
    closeSwapModal();
  } catch (err) {
    console.error(err);
    alert(err.message || "Failed to send swap request");
    closeSwapModal();
  }
};


  if (loading)
    return <Typography sx={{ mt: 5, textAlign: "center" }}>Loading…</Typography>;
  if (error)
    return <Typography sx={{ textAlign: "center", mt: 5, color: "red" }}>{error}</Typography>;
  if (!book) return null;

  return (
    <Box sx={{ maxWidth: 1400, mx: "auto", p: { xs: 2, md: 4 } }}>
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
          Home
        </Link>
        <Typography>{book.title}</Typography>
      </Breadcrumbs>

      <Grid container spacing={4}>
        {/* LEFT — 1/3 */}
        <Grid
          item
          xs={12}
          md={4}
          sx={{
            flexBasis: "33.333%",
            maxWidth: "33.333%",
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <Card sx={{ borderRadius: 3, overflow: "hidden" }}>
            <CardMedia
              component="img"
              image={book.pictures?.[0]}
              alt={book.title}
              sx={{
                width: "100%",
                height: 420,
                objectFit: "cover",
              }}
            />
          </Card>

          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Book Owner
            </Typography>

            <Stack direction="row" spacing={2} sx={{ my: 2 }}>
              <Avatar src={book.ownerPhoto}>
                <AccountIcon />
              </Avatar>
              <Box>
                <Typography>{book.ownerName}</Typography>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <StarIcon sx={{ fontSize: 16, color: "warning.main" }} />
                  <Typography variant="caption">4.8</Typography>
                </Stack>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center" mb={2}>
              <LocationIcon fontSize="small" />
              <Typography variant="body2">{book.location}</Typography>
            </Stack>

            <Button fullWidth variant="outlined" onClick={() => setSwapModalOpen(true)}>
              Swap for {book.points || 0} pts
            </Button>
          </Paper>
        </Grid>

        {/* RIGHT — 2/3 */}
        <Grid
          item
          xs={12}
          md={8}
          sx={{
            flexBasis: "66.666%",
            maxWidth: "66.666%",
          }}
        >
          <Paper sx={{ borderRadius: 3 }}>
            <Tabs
              value={tab}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
            >
              <Tab label="Details" />
              <Tab label="Reading Journey" />
            </Tabs>

            <Box sx={{ p: 3 }}>
              {tab === 0 && (
                <Box>
                  <Typography variant="h4" gutterBottom>{book.title}</Typography>
                  <Typography variant="h6" color="text.secondary">{book.author}</Typography>
                  <Divider sx={{ my: 3 }} />
                  <Typography>{book.description}</Typography>

                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>Additional Photos</Typography>
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
                      <Typography variant="body2" sx={{ mt: 1, fontStyle: "italic" }}>{entry.note}</Typography>
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
          <Typography variant="h6" gutterBottom>Request Swap</Typography>
          <Typography sx={{ mb: 3 }}>
            Are you sure you want to request to swap this book for <strong>{book?.points || 0} points</strong>?
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button variant="outlined" onClick={closeSwapModal}>Cancel</Button>
            <Button variant="contained" onClick={handleSwapRequest}>Send Request</Button>
          </Stack>
        </Box>
      </Modal>
    </Box>
  );
};

export default BookDescription;
