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
import { doc, getDoc, collection, getDocs } from "firebase/firestore";

const BookDescription = () => {
  const { bookId } = useParams();
  const [tab, setTab] = useState(0);
  const [book, setBook] = useState(null);
  const [exchangeHistory, setExchangeHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState({ points: 0, userId: "", name: "" });

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState("");

  const nearbyExchangePoints = [
    { id: "ep1", name: "Karachi Book Hub", address: "Saddar, Karachi", distance: "2.3 km", hours: "Sat-Sun 2-5 PM" },
    { id: "ep2", name: "DHA Reading Corner", address: "DHA Phase 5, Karachi", distance: "5.1 km", hours: "Daily 4-7 PM" },
  ];

  useEffect(() => {
    const fetchBook = async () => {
      if (!bookId) {
        setError("Book ID not provided.");
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const user = auth.currentUser;
        if (user) setCurrentUser({ points: 250, userId: user.uid, name: user.displayName || "User" });

        const bookRef = doc(db, "books", bookId);
        const bookSnap = await getDoc(bookRef);

        if (!bookSnap.exists()) {
          setError("Book not found.");
          setBook(null);
          setExchangeHistory([]);
          setLoading(false);
          return;
        }

        const bookData = { id: bookSnap.id, ...bookSnap.data() };
        setBook(bookData);

        const historyRef = collection(db, "books", bookId, "exchangeHistory");
        const historySnap = await getDocs(historyRef);
        const historyData = historySnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setExchangeHistory(historyData);
      } catch (err) {
        console.error(err);
        setError("Failed to load book data.");
      }

      setLoading(false);
    };

    fetchBook();
  }, [bookId]);

  const handleTabChange = (event, newValue) => setTab(newValue);

  const openLightbox = (image) => {
    setLightboxImage(image);
    setLightboxOpen(true);
  };

  const closeLightbox = () => setLightboxOpen(false);

  if (loading) return <Typography sx={{ textAlign: "center", mt: 5 }}>Loading...</Typography>;
  if (error) return <Typography sx={{ textAlign: "center", mt: 5, color: "red" }}>{error}</Typography>;
  if (!book) return null;

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 1400, margin: "0 auto" }}>
      {/* Breadcrumbs */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
        <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>Home</Link>
        <Typography color="text.primary">{book.title || "Book"}</Typography>
      </Breadcrumbs>

      <Grid container spacing={4} sx={{ width: "100%" }}>
        {/* Left Column */}
        <Grid
          item
          xs={12}
          md={4}
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            maxWidth: "33.333%",
            flexShrink: 0,
          }}
        >
          <Card sx={{ borderRadius: 3, flex: 1, overflow: "hidden" }}>
            <CardMedia
              component="img"
              image={book.pictures?.[0] || ""}
              alt={book.title}
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                maxWidth: "100%",
              }}
            />
          </Card>

          {/* Owner Info */}
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>Book Owner</Typography>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Avatar sx={{ mr: 2 }} src={book.ownerPhoto}>
                <AccountIcon />
              </Avatar>
              <Box>
                <Typography variant="body1">{book.ownerName || "Unknown"}</Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <StarIcon sx={{ fontSize: 16, color: "warning.main" }} />
                  <Typography variant="caption">4.8 rating</Typography>
                </Box>
              </Box>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", color: "text.secondary", mb: 1 }}>
              <LocationIcon sx={{ fontSize: 18, mr: 1 }} />
              <Typography variant="body2">{book.location || "Unknown"}</Typography>
            </Box>
            <Button variant="outlined" fullWidth size="small">Send Message</Button>
          </Paper>
        </Grid>

        {/* Right Column */}
        <Grid
          item
          xs={12}
          md={8}
          sx={{
            maxWidth: "66.666%",
            flexGrow: 1,
          }}
        >
          <Paper sx={{ borderRadius: 3 }}>
            <Tabs value={tab} onChange={handleTabChange} indicatorColor="primary" textColor="primary" variant="fullWidth">
              <Tab label="Details" />
              <Tab label="Reading Journey" />
              <Tab label="Exchange Points" />
            </Tabs>

            <Box sx={{ p: 3 }}>
              {/* Details Tab */}
              {tab === 0 && (
                <Box>
                  <Typography variant="h4" gutterBottom>{book.title}</Typography>
                  <Typography variant="h6" color="text.secondary">{book.author}</Typography>
                  <Divider sx={{ my: 3 }} />
                  <Typography variant="body1">{book.description}</Typography>

                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>Additional Photos</Typography>
                    <Grid container spacing={2}>
                      {book.pictures?.map((p, i) => (
                        <Grid item xs={6} sm={4} key={i}>
                          <Card
                            sx={{ cursor: "pointer", borderRadius: 2, overflow: "hidden" }}
                            onClick={() => openLightbox(p)}
                          >
                            <CardMedia
                              component="img"
                              image={p}
                              alt={`Photo ${i + 1}`}
                              sx={{ width: "100%", height: 150, objectFit: "cover" }}
                            />
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                </Box>
              )}

              {/* Reading Journey */}
              {tab === 1 && (
                <Stack spacing={2}>
                  {exchangeHistory.length === 0 && <Typography>No reading history yet.</Typography>}
                  {exchangeHistory.map((entry, i) => (
                    <Paper key={i} sx={{ p: 2 }}>
                      <Typography variant="subtitle2">{entry.reader}</Typography>
                      <Typography variant="caption">{entry.location}</Typography>
                      <Box sx={{ display: "flex", mt: 1 }}>
                        {[...Array(5)].map((_, idx) => (
                          <StarIcon
                            key={idx}
                            sx={{ fontSize: 16, color: idx < (entry.rating || 0) ? "warning.main" : "grey.300" }}
                          />
                        ))}
                      </Box>
                      <Typography variant="body2" sx={{ mt: 1, fontStyle: "italic" }}>{entry.note}</Typography>
                    </Paper>
                  ))}
                </Stack>
              )}

              {/* Exchange Points */}
              {tab === 2 && (
                <Stack spacing={2}>
                  {nearbyExchangePoints.map((point) => (
                    <Paper key={point.id} sx={{ p: 2 }}>
                      <Typography variant="subtitle1">{point.name}</Typography>
                      <Typography variant="body2">{point.address}</Typography>
                      <Typography variant="caption">{point.distance} away | Hours: {point.hours}</Typography>
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
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            maxWidth: "90%",
            maxHeight: "90%",
            outline: "none",
          }}
        >
          <Card sx={{ position: "relative" }}>
            <IconButton
              sx={{ position: "absolute", top: 8, right: 8, color: "white", zIndex: 1 }}
              onClick={closeLightbox}
            >
              <CloseIcon />
            </IconButton>
            <CardMedia
              component="img"
              src={lightboxImage}
              alt="Book"
              sx={{ width: "100%", maxHeight: "90vh", objectFit: "contain" }}
            />
          </Card>
        </Box>
      </Modal>
    </Box>
  );
};

export default BookDescription;
