import React, { useState } from "react";
import { Box, Grid, Typography } from "@mui/material";
import BookSearch from "../components/BookSearch";
import BookCard from "../components/BookCard";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();
  // Temporary mock data for the cards
  const [books] = useState([
    {
      id: 1,
      title: "The Pragmatic Programmer",
      owner: "Ali",
      condition: "Good",
      image: "https://covers.openlibrary.org/b/id/10523358-L.jpg",
    },
    {
      id: 2,
      title: "Clean Code",
      owner: "Sara",
      condition: "Excellent",
      image: "https://covers.openlibrary.org/b/id/10523456-L.jpg",
    },
    {
      id: 3,
      title: "Refactoring",
      owner: "Hassan",
      condition: "Used",
      image: "https://covers.openlibrary.org/b/id/10523512-L.jpg",
    },
    {
      id: 4,
      title: "Design Patterns",
      owner: "Fatima",
      condition: "New",
      image: "https://covers.openlibrary.org/b/id/10523678-L.jpg",
    },
  ]);

  const handleSearch = (query) => {
    console.log("Search query:", query);
    // Future logic: filter the books array based on query or filter
  };

  return (
    <Box sx={{ p: 4 }}>
      {/* Page title */}
      <Typography variant="h4" gutterBottom align="center">
        Explore Books
      </Typography>

      {/* Search bar */}
      <Box sx={{ mb: 4 }}>
        <BookSearch onSearch={handleSearch} />
      </Box>

      {/* Book grid */}
      <Grid container spacing={3} justifyContent="center">
        {books.map((book) => (
          <Grid item key={book.id}>
            <BookCard
              onClick={() => navigate("/book")}
              title={book.title}
              owner={book.owner}
              condition={book.condition}
              image={book.image}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Home;
