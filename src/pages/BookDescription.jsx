import React, { useState } from "react";
import {
  Box,
  Grid,
  Card,
  CardMedia,
  CardContent,
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
  LinearProgress,
  IconButton,
  Tooltip,
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
import { Link } from "react-router-dom";

const BookDescription = () => {
  const [tab, setTab] = useState(0);
  const [swapDialogOpen, setSwapDialogOpen] = useState(false);
  const [swapConfirmed, setSwapConfirmed] = useState(false);
  const [selectedMeetingPoint, setSelectedMeetingPoint] = useState("");

  const handleTabChange = (event, newValue) => {
    setTab(newValue);
  };

  const handleSwapRequest = () => {
    setSwapDialogOpen(true);
  };

  const handleConfirmSwap = () => {
    // This will connect to Firebase later
    setSwapConfirmed(true);
    setTimeout(() => {
      setSwapDialogOpen(false);
      setSwapConfirmed(false);
    }, 2000);
  };

  // Mock data - will come from Firebase
  const currentUser = {
    points: 250,
    userId: "user123",
    name: "Ahmed Khan",
  };

  const book = {
    listingId: "listing-001",
    qrCodeId: "QR-UUID-12345",
    title: "The Pragmatic Programmer",
    author: "David Thomas, Andrew Hunt",
    owner: "Ali Hassan",
    ownerId: "owner456",
    condition: "Good",
    calculatedPoints: 130,
    pointsBreakdown: {
      basePoints: 100,
      conditionMultiplier: 1.0,
      demandMultiplier: 1.2,
      rarityMultiplier: 1.08,
    },
    image: "https://covers.openlibrary.org/b/id/10523358-L.jpg",
    description:
      "This classic book offers practical advice for programmers, including tips on how to improve your coding, maintain projects, and work effectively with teams.",
    location: {
      city: "Karachi",
      state: "Sindh",
    },
    photos: [
      "https://covers.openlibrary.org/b/id/10523358-L.jpg",
      "https://covers.openlibrary.org/b/id/10523358-L.jpg",
    ],
    conditionNotes: "Slight wear on spine, all pages intact and clean. No markings.",
    status: "available",
    listedAt: "2025-01-05",
    totalWishlists: 12,
    totalActiveListings: 3,
    exchangeHistory: [
      {
        reader: "Sara Ahmed",
        location: "Lahore, Punjab",
        date: "2024-12-01",
        duration: 21,
        rating: 5,
        note: "Absolutely transformative read! Changed how I approach coding.",
        tip: "Take notes while reading - you'll want to reference later",
      },
      {
        reader: "Hassan Ali",
        location: "Islamabad",
        date: "2024-10-15",
        duration: 18,
        rating: 5,
        note: "Every programmer should read this at least once.",
        tip: "Don't skip the tool chapters, very practical advice",
      },
      {
        reader: "Fatima Khan",
        location: "Karachi, Sindh",
        date: "2024-08-20",
        duration: 25,
        rating: 4,
        note: "Great insights, some parts felt dated but core concepts hold up.",
        tip: "Read chapter 1 twice before moving forward",
      },
    ],
  };

  const nearbyExchangePoints = [
    {
      id: "ep1",
      name: "Karachi Book Hub",
      address: "Saddar, Karachi",
      distance: "2.3 km",
      hours: "Sat-Sun 2-5 PM",
    },
    {
      id: "ep2",
      name: "DHA Reading Corner",
      address: "DHA Phase 5, Karachi",
      distance: "5.1 km",
      hours: "Daily 4-7 PM",
    },
  ];

  const canAfford = currentUser.points >= book.calculatedPoints;

  return (
    <Box sx={{ p: 4, maxWidth: 1400, margin: "0 auto" }}>
      {/* Breadcrumbs */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
        <MuiLink component={Link} to="/" underline="hover" color="inherit">
          Home
        </MuiLink>
        <MuiLink component={Link} to="/books" underline="hover" color="inherit">
          Books
        </MuiLink>
        <Typography color="text.primary">{book.title}</Typography>
      </Breadcrumbs>

      {/* Status Alert */}
      {book.status === "available" && (
        <Alert severity="success" sx={{ mb: 3 }}>
          This book is available for exchange!
        </Alert>
      )}

      {/* Main content */}
      <Grid container spacing={4}>
        {/* Left Column - Image & Quick Actions */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, mb: 2 }}>
            <CardMedia
              component="img"
              image={book.image}
              alt={book.title}
              sx={{ width: "100%", height: "auto", objectFit: "cover" }}
            />
          </Card>

          {/* Point Value Card */}
          <Paper sx={{ p: 3, borderRadius: 3, mb: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="h6">Exchange Value</Typography>
              <Tooltip title="How points are calculated">
                <IconButton size="small">
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            
            <Typography variant="h3" color="primary" sx={{ mb: 1, fontWeight: "bold" }}>
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
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2">Base Points:</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {book.pointsBreakdown.basePoints}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2">Condition (×{book.pointsBreakdown.conditionMultiplier}):</Typography>
                <Chip label={book.condition} size="small" color="success" />
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2">Demand (×{book.pointsBreakdown.demandMultiplier}):</Typography>
                <Typography variant="body2" color="warning.main" fontWeight="medium">
                  High ({book.totalWishlists} wishlists)
                </Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2">Rarity (×{book.pointsBreakdown.rarityMultiplier}):</Typography>
                <Typography variant="body2" color="info.main" fontWeight="medium">
                  {book.totalActiveListings <= 3 ? "Rare" : "Common"}
                </Typography>
              </Box>
            </Stack>

            <Divider sx={{ my: 2 }} />

            {/* User's Current Points */}
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

            {/* Swap Button */}
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
          </Paper>

          {/* Owner Info Card */}
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
              Book Owner
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Avatar sx={{ mr: 2, bgcolor: "primary.main" }}>
                <AccountIcon />
              </Avatar>
              <Box>
                <Typography variant="body1" fontWeight="medium">
                  {book.owner}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <StarIcon sx={{ fontSize: 16, color: "warning.main" }} />
                  <Typography variant="caption">4.8 rating</Typography>
                </Box>
              </Box>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", color: "text.secondary", mb: 1 }}>
              <LocationIcon sx={{ fontSize: 18, mr: 1 }} />
              <Typography variant="body2">
                {book.location.city}, {book.location.state}
              </Typography>
            </Box>
            <Button variant="outlined" fullWidth size="small" sx={{ mt: 1 }}>
              Send Message
            </Button>
          </Paper>
        </Grid>

        {/* Right Column - Tabbed content */}
        <Grid item xs={12} md={8}>
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
              <Tab label="Exchange Points" />
            </Tabs>

            <Box sx={{ p: 3 }}>
              {/* Tab 0: Details */}
              {tab === 0 && (
                <Box>
                  <Typography variant="h4" gutterBottom fontWeight="bold">
                    {book.title}
                  </Typography>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    by {book.author}
                  </Typography>

                  <Box sx={{ display: "flex", gap: 1, my: 2, flexWrap: "wrap" }}>
                    <Chip label={`Condition: ${book.condition}`} color="success" />
                    <Chip label={`${book.totalWishlists} people want this`} variant="outlined" />
                    <Chip label={`Only ${book.totalActiveListings} available`} color="warning" />
                  </Box>

                  <Divider sx={{ my: 3 }} />

                  <Typography variant="h6" gutterBottom>
                    Description
                  </Typography>
                  <Typography variant="body1" paragraph>
                    {book.description}
                  </Typography>

                  <Divider sx={{ my: 3 }} />

                  <Typography variant="h6" gutterBottom>
                    Condition Notes
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {book.conditionNotes}
                  </Typography>

                  <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
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

                  <Box sx={{ mt: 3, p: 2, bgcolor: "info.lighter", borderRadius: 2 }}>
                    <Typography variant="body2" color="info.dark">
                      <strong>QR Code ID:</strong> {book.qrCodeId}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                      This book's unique identifier preserves its journey across all exchanges
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Tab 1: Exchange History */}
              {tab === 1 && (
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                    Reading Journey
                    <Chip 
                      label={`${book.exchangeHistory.length} readers`} 
                      size="small" 
                      sx={{ ml: 2 }}
                      color="primary"
                    />
                  </Typography>

                  <Typography variant="body2" color="text.secondary" paragraph>
                    This book has traveled through {book.exchangeHistory.map(h => h.location.split(',')[0]).join(', ')}
                  </Typography>

                  <Stack spacing={3}>
                    {book.exchangeHistory.map((entry, index) => (
                      <Paper key={index} sx={{ p: 3, borderLeft: 4, borderColor: "primary.main" }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start", mb: 2 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Avatar sx={{ bgcolor: "primary.light" }}>
                              {entry.reader.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle1" fontWeight="medium">
                                {entry.reader}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {entry.location}
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            {[...Array(5)].map((_, i) => (
                              <StarIcon
                                key={i}
                                sx={{
                                  fontSize: 18,
                                  color: i < entry.rating ? "warning.main" : "grey.300",
                                }}
                              />
                            ))}
                          </Box>
                        </Box>

                        <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                          <Chip
                            icon={<ScheduleIcon />}
                            label={`Read in ${entry.duration} days`}
                            size="small"
                            variant="outlined"
                          />
                          <Chip label={entry.date} size="small" variant="outlined" />
                        </Box>

                        <Typography variant="body2" paragraph sx={{ fontStyle: "italic" }}>
                          "{entry.note}"
                        </Typography>

                        <Box sx={{ bgcolor: "warning.lighter", p: 2, borderRadius: 1 }}>
                          <Typography variant="caption" color="warning.dark" fontWeight="medium">
                            💡 Reader's Tip:
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {entry.tip}
                          </Typography>
                        </Box>
                      </Paper>
                    ))}
                  </Stack>

                  <Box sx={{ mt: 3, p: 2, bgcolor: "success.lighter", borderRadius: 2, textAlign: "center" }}>
                    <Typography variant="body2" color="success.dark">
                      🌟 Want to add your reading experience? Request this book to join its journey!
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Tab 2: Exchange Points */}
              {tab === 2 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Nearby Exchange Points
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Meet the owner at these physical locations for safe book exchange
                  </Typography>

                  <Stack spacing={2}>
                    {nearbyExchangePoints.map((point) => (
                      <Paper key={point.id} sx={{ p: 3, border: 1, borderColor: "divider" }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                              {point.name}
                            </Typography>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                              <LocationIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                              <Typography variant="body2" color="text.secondary">
                                {point.address}
                              </Typography>
                            </Box>
                            <Typography variant="caption" color="primary">
                              {point.distance} away
                            </Typography>
                            <Typography variant="caption" display="block" color="text.secondary">
                              Hours: {point.hours}
                            </Typography>
                          </Box>
                          <Button variant="outlined" size="small">
                            Select
                          </Button>
                        </Box>
                      </Paper>
                    ))}
                  </Stack>

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
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                    <Typography variant="body2">Book:</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {book.title}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                    <Typography variant="body2">Owner:</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {book.owner}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                    <Typography variant="body2">Points Required:</Typography>
                    <Typography variant="body2" fontWeight="medium" color="primary">
                      {book.calculatedPoints}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                    <Typography variant="body2">Your Balance:</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {currentUser.points}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2" fontWeight="bold">
                      Balance After:
                    </Typography>
                    <Typography variant="body2" fontWeight="bold" color="success.main">
                      {currentUser.points - book.calculatedPoints}
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
                    {point.name} - {point.distance}
                  </option>
                ))}
              </TextField>
            </>
          ) : (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <CheckIcon sx={{ fontSize: 64, color: "success.main", mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Exchange Request Sent!
              </Typography>
              <Typography variant="body2" color="text.secondary">
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