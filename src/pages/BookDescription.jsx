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

        const bookRef = doc(db, "books", bookId);
        const bookSnap = await getDoc(bookRef);
        if (!bookSnap.exists()) {
          setError("Book not found");
          setLoading(false);
          return;
        }

        setBook({ id: bookSnap.id, ...bookSnap.data() });

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

    const unsub = onAuthStateChanged(auth, (user) => {
      user ? fetchBookAndUser(user) : setError("Not logged in");
    });

    return () => unsub();
  }, [bookId]);

  if (loading)
    return <Typography sx={{ mt: 5, textAlign: "center" }}>Loading…</Typography>;
  if (error)
    return (
      <Typography sx={{ mt: 5, textAlign: "center", color: "error.main" }}>
        {error}
      </Typography>
    );

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
            <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth">
              <Tab label="Details" />
              <Tab label="Reading Journey" />
              <Tab label="Exchange Points" />
            </Tabs>

            <Box sx={{ p: 3 }}>
              {tab === 0 && (
                <>
                  <Typography variant="h4">{book.title}</Typography>
                  <Typography color="text.secondary">{book.author}</Typography>
                  <Divider sx={{ my: 3 }} />
                  <Typography>{book.description}</Typography>

                  <Grid container spacing={2} sx={{ mt: 3 }}>
                    {book.pictures?.map((img, i) => (
                      <Grid item xs={6} sm={4} key={i}>
                        <Card
                          onClick={() => {
                            setLightboxImage(img);
                            setLightboxOpen(true);
                          }}
                          sx={{ cursor: "pointer" }}
                        >
                          <CardMedia
                            component="img"
                            image={img}
                            sx={{ height: 150, objectFit: "cover" }}
                          />
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </>
              )}

              {tab === 1 && (
                <Stack spacing={2}>
                  {exchangeHistory.length === 0 && (
                    <Typography>No reading history yet.</Typography>
                  )}
                  {exchangeHistory.map((e) => (
                    <Paper key={e.id} sx={{ p: 2 }}>
                      <Typography fontWeight={500}>{e.reader}</Typography>
                      <Typography variant="caption">{e.location}</Typography>
                      <Typography sx={{ mt: 1 }}>{e.note}</Typography>
                    </Paper>
                  ))}
                </Stack>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* LIGHTBOX */}
      <Modal open={lightboxOpen} onClose={() => setLightboxOpen(false)}>
        <Box sx={{ position: "absolute", inset: 0, bgcolor: "rgba(0,0,0,0.9)" }}>
          <IconButton
            onClick={() => setLightboxOpen(false)}
            sx={{ position: "absolute", top: 16, right: 16, color: "white" }}
          >
            <CloseIcon />
          </IconButton>
          <CardMedia
            component="img"
            image={lightboxImage}
            sx={{
              maxHeight: "90vh",
              maxWidth: "90vw",
              objectFit: "contain",
              m: "auto",
            }}
          />
        </Box>
      </Modal>
    </Box>
  );
};

export default BookDescription;
