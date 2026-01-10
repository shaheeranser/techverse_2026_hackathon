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
} from "@mui/material";
import { Link, /* useParams */ } from "react-router-dom";

const BookDescription = () => {
//   const { bookId } = useParams();
//   Fetch book details using bookId
  const [tab, setTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTab(newValue);
  };

  // Dummy book data
  const book = {
    title: "The Pragmatic Programmer",
    owner: "Ali",
    condition: "Good",
    image: "https://covers.openlibrary.org/b/id/10523358-L.jpg",
    description:
      "This classic book offers practical advice for programmers, including tips on how to improve your coding, maintain projects, and work effectively with teams.",
    exchangeHistory: [
      { user: "Sara", date: "2025-12-01" },
      { user: "Hassan", date: "2025-11-15" },
      { user: "Fatima", date: "2025-10-30" },
    ],
  };

  return (
    <Box sx={{ p: 4 }}>
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

      {/* Main content */}
      <Grid container spacing={4}>
        {/* Book Image */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3 }}>
            <CardMedia
              component="img"
              image={book.image}
              alt={book.title}
              sx={{ width: "100%", height: "auto", objectFit: "cover" }}
            />
          </Card>
        </Grid>

        {/* Tabbed content */}
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
              <Tab label="Exchange History" />
            </Tabs>

            <Box sx={{ p: 3 }}>
              {tab === 0 && (
                <Box>
                  <Typography variant="h5" gutterBottom>
                    {book.title}
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                    Owner: {book.owner}
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                    Condition: {book.condition}
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 2 }}>
                    {book.description}
                  </Typography>
                </Box>
              )}

              {tab === 1 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Exchange History
                  </Typography>
                  {book.exchangeHistory.map((entry, index) => (
                    <Typography key={index} variant="body2" color="text.secondary">
                      {entry.user} borrowed on {entry.date}
                    </Typography>
                  ))}
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BookDescription;
