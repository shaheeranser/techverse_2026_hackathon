import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Card,
  CardMedia,
  Typography,
  Breadcrumbs,
  Link as MuiLink,
  Tabs,
  Tab,
  Paper,
  Button,
  Chip,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Avatar,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Skeleton,
} from "@mui/material";
import {
  SwapHoriz as SwapIcon,
  Star as StarIcon,
  LocationOn as LocationIcon,
  AccountCircle as AccountIcon,
  Close as CloseIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
  Info as InfoIcon,
} from "@mui/icons-material";
import { Link, useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase"; // Adjust path to your firebase config

const BookDescription = () => {
  const { id: bookId } = useParams(); // Get book listing ID from URL
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [tab, setTab] = useState(0);
  const [swapDialogOpen, setSwapDialogOpen] = useState(false);
  const [swapConfirmed, setSwapConfirmed] = useState(false);
  const [selectedMeetingPoint, setSelectedMeetingPoint] = useState("");
  const [messageToOwner, setMessageToOwner] = useState("");
  
  // Data states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [book, setBook] = useState(null);
  const [catalogInfo, setCatalogInfo] = useState(null);
  const [ownerInfo, setOwnerInfo] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [bookHistory, setBookHistory] = useState(null);
  const [nearbyExchangePoints, setNearbyExchangePoints] = useState([]);

  const handleTabChange = (event, newValue) => {
    setTab(newValue);
  };

  const handleSwapRequest = () => {
    setSwapDialogOpen(true);
  };

  const handleConfirmSwap = async () => {
    try {
      // Create exchange request in Firestore
      const exchangeData = {
        giverId: book.ownerId,
        receiverId: currentUser.userId,
        listingId: book.listingId,
        catalogId: book.catalogId,
        qrCodeId: book.qrCodeId,
        pointsTransferred: book.calculatedPoints,
        status: "pending",
        requestedAt: serverTimestamp(),
        acceptedAt: null,
        completedAt: null,
        giverConfirmed: false,
        receiverConfirmed: false,
        disputeRaised: false,
        messageToOwner: messageToOwner,
        exchangePointId: selectedMeetingPoint || null,
      };

      await addDoc(collection(db, "exchanges"), exchangeData);

      setSwapConfirmed(true);
      setTimeout(() => {
        setSwapDialogOpen(false);
        setSwapConfirmed(false);
        navigate("/my-exchanges"); // Redirect to user's exchanges page
      }, 2000);
    } catch (err) {
      console.error("Error creating exchange request:", err);
      alert("Failed to create exchange request. Please try again.");
    }
  };

  // Fetch all book data
  useEffect(() => {
    const fetchBookData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Fetch book listing
        const bookDoc = await getDoc(doc(db, "book_listings", bookId));
        
        if (!bookDoc.exists()) {
          setError("Book not found");
          setLoading(false);
          return;
        }

        const bookData = { listingId: bookDoc.id, ...bookDoc.data() };
        setBook(bookData);

        // 2. Fetch catalog info (book details like title, author)
        if (bookData.catalogId) {
          const catalogDoc = await getDoc(doc(db, "books_catalog", bookData.catalogId));
          if (catalogDoc.exists()) {
            setCatalogInfo(catalogDoc.data());
          }
        }

        // 3. Fetch owner info
        if (bookData.ownerId) {
          const ownerDoc = await getDoc(doc(db, "users", bookData.ownerId));
          if (ownerDoc.exists()) {
            setOwnerInfo(ownerDoc.data());
          }
        }

        // 4. Fetch current user info
        if (auth.currentUser) {
          const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
          if (userDoc.exists()) {
            setCurrentUser({ userId: auth.currentUser.uid, ...userDoc.data() });
          }
        }

        // 5. Fetch book history (QR code history)
        if (bookData.qrCodeId) {
          const historyDoc = await getDoc(doc(db, "book_history", bookData.qrCodeId));
          if (historyDoc.exists()) {
            setBookHistory(historyDoc.data());
          }
        }

        // 6. Fetch nearby exchange points
        // TODO: Implement geolocation-based query
        // For now, fetch all active exchange points
        const exchangePointsQuery = query(
          collection(db, "exchange_points"),
          where("isActive", "==", true)
        );
        const exchangePointsSnap = await getDocs(exchangePointsQuery);
        const points = exchangePointsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setNearbyExchangePoints(points.slice(0, 5)); // Limit to 5 for now

      } catch (err) {
        console.error("Error fetching book data:", err);
        setError("Failed to load book details");
      } finally {
        setLoading(false);
      }
    };

    if (bookId) {
      fetchBookData();
    }
  }, [bookId]);

  // Loading state
  if (loading) {
    return (
      <Box sx={{ p: 4, maxWidth: 1400, margin: "0 auto" }}>
        <Skeleton variant="text" width={300} height={40} sx={{ mb: 3 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3, mb: 2 }} />
            <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 3 }} />
          </Grid>
          <Grid item xs={12} md={8}>
            <Skeleton variant="rectangular" height={600} sx={{ borderRadius: 3 }} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  // Error state
  if (error || !book) {
    return (
      <Box sx={{ p: 4, maxWidth: 1400, margin: "0 auto" }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || "Book not found"}
        </Alert>
        <Button component={Link} to="/books" variant="contained">
          Back to Books
        </Button>
      </Box>
    );
  }

  const canAfford = currentUser && currentUser.points >= book.calculatedPoints;
  const isOwner = currentUser && currentUser.userId === book.ownerId;

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 1400, margin: "0 auto" }}>
      {/* Breadcrumbs */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: { xs: 2, md: 3 } }}>
        <MuiLink component={Link} to="/" underline="hover" color="inherit">
          Home
        </MuiLink>
        <MuiLink component={Link} to="/books" underline="hover" color="inherit">
          Books
        </MuiLink>
        <Typography color="text.primary" noWrap>
          {catalogInfo?.title || book.title || "Book Details"}
        </Typography>
      </Breadcrumbs>

      {/* Status Alert */}
      {book.status === "available" && !isOwner && (
        <Alert severity="success" sx={{ mb: { xs: 2, md: 3 } }}>
          This book is available for exchange!
        </Alert>
      )}
      
      {isOwner && (
        <Alert severity="info" sx={{ mb: { xs: 2, md: 3 } }}>
          This is your listing
        </Alert>
      )}

      {/* Main content */}
      <Grid container spacing={{ xs: 2, md: 3, lg: 4 }}>
        {/* Left Column - Image & Quick Actions */}
        <Grid item xs={12} md={5} lg={4}>
          <Card sx={{ borderRadius: 3, mb: 2 }}>
            <CardMedia
              component="img"
              image={book.photos?.[0] || catalogInfo?.coverImageURL || "https://via.placeholder.com/300x400"}
              alt={catalogInfo?.title || book.title}
              sx={{ 
                width: "100%", 
                height: { xs: 300, sm: 400, md: "auto" },
                objectFit: "cover" 
              }}
            />
          </Card>

          {/* Point Value Card */}
          <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, mb: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="h6" fontSize={{ xs: "1rem", md: "1.25rem" }}>
                Exchange Value
              </Typography>
              <Tooltip title="How points are calculated">
                <IconButton size="small">
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            
            <Typography 
              variant="h3" 
              color="primary" 
              sx={{ 
                mb: 1, 
                fontWeight: "bold",
                fontSize: { xs: "2rem", md: "3rem" }
              }}
            >
              {book.calculatedPoints}
              <Typography component="span" variant="h6" color="text.secondary">
                {" "}points
              </Typography>
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
              Value Breakdown:
            </Typography>
            <Stack spacing={1}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="body2" fontSize={{ xs: "0.75rem", md: "0.875rem" }}>
                  Base Points:
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {book.pointsBreakdown?.basePoints || 100}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
                <Typography variant="body2" fontSize={{ xs: "0.75rem", md: "0.875rem" }}>
                  Condition (×{book.pointsBreakdown?.conditionMultiplier || 1.0}):
                </Typography>
                <Chip label={book.condition} size="small" color="success" />
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
                <Typography variant="body2" fontSize={{ xs: "0.75rem", md: "0.875rem" }}>
                  Demand (×{book.pointsBreakdown?.demandMultiplier || 1.0}):
                </Typography>
                <Typography variant="body2" color="warning.main" fontWeight="medium" fontSize={{ xs: "0.75rem", md: "0.875rem" }}>
                  {catalogInfo?.totalWishlists > 10 ? "High" : "Medium"} ({catalogInfo?.totalWishlists || 0})
                </Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
                <Typography variant="body2" fontSize={{ xs: "0.75rem", md: "0.875rem" }}>
                  Rarity (×{book.pointsBreakdown?.rarityMultiplier || 1.0}):
                </Typography>
                <Typography variant="body2" color="info.main" fontWeight="medium" fontSize={{ xs: "0.75rem", md: "0.875rem" }}>
                  {catalogInfo?.totalActiveListings <= 3 ? "Rare" : "Common"}
                </Typography>
              </Box>
            </Stack>

            <Divider sx={{ my: 2 }} />

            {/* User's Current Points */}
            {currentUser && !isOwner && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Your Points Balance:
                </Typography>
                <Typography variant="h6" color={canAfford ? "success.main" : "error.main"}>
                  {currentUser.points} points
                </Typography>
                {!canAfford && (
                  <Typography variant="caption" color="error">
                    You need {book.calculatedPoints - currentUser.points} more points
                  </Typography>
                )}
              </Box>
            )}

            {/* Swap Button */}
            {!isOwner && currentUser && (
              <>
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  startIcon={<SwapIcon />}
                  onClick={handleSwapRequest}
                  disabled={!canAfford || book.status !== "available"}
                  sx={{ mb: 1 }}
                >
                  {canAfford ? "Request Swap" : "Not Enough Points"}
                </Button>

                {!canAfford && (
                  <Button variant="outlined" fullWidth size="small" component={Link} to="/buy-points">
                    Buy More Points
                  </Button>
                )}
              </>
            )}

            {!currentUser && (
              <Button variant="contained" fullWidth size="large" component={Link} to="/login">
                Login to Exchange
              </Button>
            )}
          </Paper>

          {/* Owner Info Card */}
          {ownerInfo && (
            <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                Book Owner
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Avatar 
                  src={ownerInfo.photoURL}
                  sx={{ mr: 2, bgcolor: "primary.main", width: { xs: 40, md: 48 }, height: { xs: 40, md: 48 } }}
                >
                  {ownerInfo.displayName?.charAt(0) || <AccountIcon />}
                </Avatar>
                <Box>
                  <Typography variant="body1" fontWeight="medium" fontSize={{ xs: "0.875rem", md: "1rem" }}>
                    {ownerInfo.displayName || "Anonymous"}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <StarIcon sx={{ fontSize: 16, color: "warning.main" }} />
                    <Typography variant="caption">4.8 rating</Typography>
                  </Box>
                </Box>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", color: "text.secondary", mb: 1 }}>
                <LocationIcon sx={{ fontSize: 18, mr: 1 }} />
                <Typography variant="body2" fontSize={{ xs: "0.75rem", md: "0.875rem" }}>
                  {book.location?.city}, {book.location?.state}
                </Typography>
              </Box>
              {!isOwner && (
                <Button variant="outlined" fullWidth size="small" sx={{ mt: 1 }}>
                  Send Message
                </Button>
              )}
            </Paper>
          )}
        </Grid>

        {/* Right Column - Tabbed content */}
        <Grid item xs={12} md={7} lg={8}>
          <Paper sx={{ borderRadius: 3 }}>
            <Tabs
              value={tab}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant={isMobile ? "scrollable" : "fullWidth"}
              scrollButtons={isMobile ? "auto" : false}
              allowScrollButtonsMobile
            >
              <Tab label="Details" />
              <Tab label="Reading Journey" />
              <Tab label="Exchange Points" />
            </Tabs>

            <Box sx={{ p: { xs: 2, md: 3 } }}>
              {/* Tab 0: Details */}
              {tab === 0 && (
                <Box>
                  <Typography 
                    variant="h4" 
                    gutterBottom 
                    fontWeight="bold"
                    fontSize={{ xs: "1.5rem", md: "2.125rem" }}
                  >
                    {catalogInfo?.title || "Book Title"}
                  </Typography>
                  <Typography 
                    variant="h6" 
                    color="text.secondary" 
                    gutterBottom
                    fontSize={{ xs: "1rem", md: "1.25rem" }}
                  >
                    by {catalogInfo?.author || "Unknown Author"}
                  </Typography>

                  <Box sx={{ display: "flex", gap: 1, my: 2, flexWrap: "wrap" }}>
                    <Chip label={`Condition: ${book.condition}`} color="success" size={isMobile ? "small" : "medium"} />
                    <Chip label={`${catalogInfo?.totalWishlists || 0} people want this`} variant="outlined" size={isMobile ? "small" : "medium"} />
                    <Chip label={`Only ${catalogInfo?.totalActiveListings || 0} available`} color="warning" size={isMobile ? "small" : "medium"} />
                  </Box>

                  <Divider sx={{ my: 3 }} />

                  <Typography variant="h6" gutterBottom fontSize={{ xs: "1rem", md: "1.25rem" }}>
                    Description
                  </Typography>
                  <Typography variant="body1" paragraph fontSize={{ xs: "0.875rem", md: "1rem" }}>
                    {catalogInfo?.description || "No description available."}
                  </Typography>

                  <Divider sx={{ my: 3 }} />

                  <Typography variant="h6" gutterBottom fontSize={{ xs: "1rem", md: "1.25rem" }}>
                    Condition Notes
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph fontSize={{ xs: "0.75rem", md: "0.875rem" }}>
                    {book.conditionNotes || "No condition notes provided."}
                  </Typography>

                  {book.photos && book.photos.length > 0 && (
                    <>
                      <Typography variant="h6" gutterBottom sx={{ mt: 3 }} fontSize={{ xs: "1rem", md: "1.25rem" }}>
                        Additional Photos
                      </Typography>
                      <Grid container spacing={2}>
                        {book.photos.map((photo, index) => (
                          <Grid item xs={6} sm={4} key={index}>
                            <Card>
                              <CardMedia component="img" image={photo} alt={`Photo ${index + 1}`} />
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </>
                  )}

                  <Box sx={{ mt: 3, p: 2, bgcolor: "info.lighter", borderRadius: 2 }}>
                    <Typography variant="body2" color="info.dark" fontSize={{ xs: "0.75rem", md: "0.875rem" }}>
                      <strong>QR Code ID:</strong> {book.qrCodeId}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                      This book's unique identifier preserves its journey across all exchanges
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Tab 1: Reading Journey */}
              {tab === 1 && (
                <Box>
                  <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1, mb: 3 }}>
                    <Typography variant="h6" fontSize={{ xs: "1rem", md: "1.25rem" }}>
                      Reading Journey
                    </Typography>
                    <Chip 
                      label={`${bookHistory?.totalReaders || 0} readers`} 
                      size="small"
                      color="primary"
                    />
                  </Box>

                  {bookHistory?.citiesVisited && bookHistory.citiesVisited.length > 0 && (
                    <Typography variant="body2" color="text.secondary" paragraph fontSize={{ xs: "0.75rem", md: "0.875rem" }}>
                      This book has traveled through {bookHistory.citiesVisited.join(', ')}
                    </Typography>
                  )}

                  {bookHistory?.readingHistory && bookHistory.readingHistory.length > 0 ? (
                    <Stack spacing={{ xs: 2, md: 3 }}>
                      {bookHistory.readingHistory.map((entry, index) => (
                        <Paper key={index} sx={{ p: { xs: 2, md: 3 }, borderLeft: 4, borderColor: "primary.main" }}>
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start", mb: 2, flexWrap: "wrap", gap: 2 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Avatar sx={{ bgcolor: "primary.light", width: { xs: 32, md: 40 }, height: { xs: 32, md: 40 } }}>
                                {entry.readerDisplayName?.charAt(0) || "?"}
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle1" fontWeight="medium" fontSize={{ xs: "0.875rem", md: "1rem" }}>
                                  {entry.readerDisplayName || "Anonymous Reader"}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {entry.location}
                                </Typography>
                              </Box>
                            </Box>
                            {entry.rating && (
                              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                {[...Array(5)].map((_, i) => (
                                  <StarIcon
                                    key={i}
                                    sx={{
                                      fontSize: { xs: 16, md: 18 },
                                      color: i < entry.rating ? "warning.main" : "grey.300",
                                    }}
                                  />
                                ))}
                              </Box>
                            )}
                          </Box>

                          <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
                            {entry.durationDays && (
                              <Chip
                                icon={<ScheduleIcon />}
                                label={`Read in ${entry.durationDays} days`}
                                size="small"
                                variant="outlined"
                              />
                            )}
                            {entry.startedAt && (
                              <Chip label={new Date(entry.startedAt).toLocaleDateString()} size="small" variant="outlined" />
                            )}
                          </Box>

                          {entry.note && (
                            <Typography variant="body2" paragraph sx={{ fontStyle: "italic" }} fontSize={{ xs: "0.75rem", md: "0.875rem" }}>
                              "{entry.note}"
                            </Typography>
                          )}

                          {entry.tip && (
                            <Box sx={{ bgcolor: "warning.lighter", p: { xs: 1.5, md: 2 }, borderRadius: 1 }}>
                              <Typography variant="caption" color="warning.dark" fontWeight="medium">
                                💡 Reader's Tip:
                              </Typography>
                              <Typography variant="body2" color="text.secondary" fontSize={{ xs: "0.75rem", md: "0.875rem" }}>
                                {entry.tip}
                              </Typography>
                            </Box>
                          )}
                        </Paper>
                      ))}
                    </Stack>
                  ) : (
                    <Alert severity="info">
                      This book hasn't been read by anyone yet. Be the first to start its journey!
                    </Alert>
                  )}

                  <Box sx={{ mt: 3, p: 2, bgcolor: "success.lighter", borderRadius: 2, textAlign: "center" }}>
                    <Typography variant="body2" color="success.dark" fontSize={{ xs: "0.75rem", md: "0.875rem" }}>
                      🌟 Want to add your reading experience? Request this book to join its journey!
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Tab 2: Exchange Points */}
              {tab === 2 && (
                <Box>
                  <Typography variant="h6" gutterBottom fontSize={{ xs: "1rem", md: "1.25rem" }}>
                    Nearby Exchange Points
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph fontSize={{ xs: "0.75rem", md: "0.875rem" }}>
                    Meet the owner at these physical locations for safe book exchange
                  </Typography>

                  {nearbyExchangePoints.length > 0 ? (
                    <Stack spacing={2}>
                      {nearbyExchangePoints.map((point) => (
                        <Paper key={point.id} sx={{ p: { xs: 2, md: 3 }, border: 1, borderColor: "divider" }}>
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start", flexWrap: "wrap", gap: 2 }}>
                            <Box sx={{ flex: 1, minWidth: { xs: "100%", sm: "auto" } }}>
                              <Typography variant="subtitle1" fontWeight="medium" gutterBottom fontSize={{ xs: "0.875rem", md: "1rem" }}>
                                {point.name}
                              </Typography>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                                <LocationIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                                <Typography variant="body2" color="text.secondary" fontSize={{ xs: "0.75rem", md: "0.875rem" }}>
                                  {point.address}
                                </Typography>
                              </Box>
                              {point.description && (
                                <Typography variant="caption" color="text.secondary" display="block">
                                  {point.description}
                                </Typography>
                              )}
                            </Box>
                            <Button variant="outlined" size="small">
                              Select
                            </Button>
                          </Box>
                        </Paper>
                      ))}
                    </Stack>
                  ) : (
                    <Alert severity="info">
                      No exchange points available in your area yet.
                    </Alert>
                  )}

                  <Button variant="text" fullWidth sx={{ mt: 2 }}>
                    View All on Map
                  </Button>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Swap Confirmation Dialog */}
      <Dialog 
        open={swapDialogOpen} 
        onClose={() => !swapConfirmed && setSwapDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          Confirm Book Exchange
          {!swapConfirmed && (
            <IconButton
              onClick={() => setSwapDialogOpen(false)}
              sx={{ position: "absolute", right: 8, top: 8 }}
            >
              <CloseIcon />
            </IconButton>
          )}
        </DialogTitle>
        
        <DialogContent>
          {!swapConfirmed ? (
            <>
              <Alert severity="info" sx={{ mb: 3 }}>
                You are about to request this book exchange. Points will be deducted once the owner accepts.
              </Alert>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Exchange Summary
                </Typography>
                <Paper sx={{ p: 2, bgcolor: "grey.50" }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1, gap: 2 }}>
                    <Typography variant="body2" fontSize={{ xs: "0.75rem", md: "0.875rem" }}>Book:</Typography>
                    <Typography variant="body2" fontWeight="medium" fontSize={{ xs: "0.75rem", md: "0.875rem" }} sx={{ textAlign: "right" }}>
                      {catalogInfo?.title}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                    <Typography variant="body2" fontSize={{ xs: "0.75rem", md: "0.875rem" }}>Owner:</Typography>
                    <Typography variant="body2" fontWeight="medium" fontSize={{ xs: "0.75rem", md: "0.875rem" }}>
                      {ownerInfo?.displayName}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                    <Typography variant="body2" fontSize={{ xs: "0.75rem", md: "0.875rem" }}>Points Required:</Typography>
                    <Typography variant="body2" fontWeight="medium" color="primary" fontSize={{ xs: "0.75rem", md: "0.875rem" }}>
                      {book.calculatedPoints}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                    <Typography variant="body2" fontSize={{ xs: "0.75rem", md: "0.875rem" }}>Your Balance:</Typography>
                    <Typography variant="body2" fontWeight="medium" fontSize={{ xs: "0.75rem", md: "0.875rem" }}>
                      {currentUser?.points}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2" fontWeight="bold" fontSize={{ xs: "0.75rem", md: "0.875rem" }}>
                      Balance After:
                    </Typography>
                    <Typography variant="body2" fontWeight="bold" color="success.main" fontSize={{ xs: "0.75rem", md: "0.875rem" }}>
                      {currentUser?.points - book.calculatedPoints}
                    </Typography>
                  </Box>
                </Paper>
              </Box>

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Message to Owner (Optional)"
                placeholder="Hi! I'm interested in this book..."
                value={messageToOwner}
                onChange={(e) => setMessageToOwner(e.target.value)}
                sx={{ mb: 2 }}
              />

              <Typography variant="subtitle2" gutterBottom>
                Preferred Exchange Point (Optional)
              </Typography>
              <TextField
                select
                fullWidth
                value={selectedMeetingPoint}
                onChange={(e) => setSelectedMeetingPoint(e.target.value)}
                SelectProps={{ native: true }}
              >
                <option value="">Select a meeting point...</option>
                {nearbyExchangePoints.map((point) => (
                  <option key={point.id} value={point.id}>
                    {point.name}
                  </option>
                ))}
              </TextField>
            </>
          ) : (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <CheckIcon sx={{ fontSize: { xs: 48, md: 64 }, color: "success.main", mb: 2 }} />
              <Typography variant="h6" gutterBottom fontSize={{ xs: "1rem", md: "1.25rem" }}>
                Exchange Request Sent!
              </Typography>
              <Typography variant="body2" color="text.secondary" fontSize={{ xs: "0.75rem", md: "0.875rem" }}>
                The owner will be notified. You'll receive a notification when they respond.
              </Typography>
            </Box>
          )}
        </DialogContent>
        
        {!swapConfirmed && (
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button onClick={() => setSwapDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleConfirmSwap}>
              Confirm Exchange Request
            </Button>
          </DialogActions>
        )}
      </Dialog>
    </Box>
  );
};

export default BookDescription;