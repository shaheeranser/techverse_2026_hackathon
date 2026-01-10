import React, { useEffect, useState } from "react";
import { Box, Grid, Typography, CircularProgress } from "@mui/material";
import BookSearch from "../components/BookSearch";
import BookCard from "../components/BookCard";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

const Home = () => {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const booksSnap = await getDocs(collection(db, "books"));
        const allBooks = booksSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Shuffle books randomly initially
        allBooks.sort(() => Math.random() - 0.5);

        setBooks(allBooks);
        setFilteredBooks(allBooks);
      } catch (err) {
        console.error("Error fetching books:", err);
      }
      setLoading(false);
    };

    fetchBooks();
  }, []);

  // Filtering function
  const applyFilters = (query = "", filters = {}) => {
    const q = query.toLowerCase();
    const {
      condition,
      pointRange,
      availability,
      location,
      sortBy,
    } = filters;

    let filtered = books.filter((book) => {
      const matchesQuery =
        book.title.toLowerCase().includes(q) ||
        book.author.toLowerCase().includes(q) ||
        (book.isbn || "").includes(q);

      const matchesCondition =
        condition.length === 0 || condition.includes(book.condition.toLowerCase());

      const matchesPoints =
        (book.points || 0) >= pointRange[0] && (book.points || 0) <= pointRange[1];

      const matchesAvailability =
        availability === "all" || (availability === "available" && book.available);

      const matchesLocation =
        !location || (book.location || "").toLowerCase().includes(location.toLowerCase());

      return (
        matchesQuery &&
        matchesCondition &&
        matchesPoints &&
        matchesAvailability &&
        matchesLocation
      );
    });

    // Sorting
    switch (sortBy) {
      case "newest":
        filtered.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
        break;
      case "points-low":
        filtered.sort((a, b) => (a.points || 0) - (b.points || 0));
        break;
      case "points-high":
        filtered.sort((a, b) => (b.points || 0) - (a.points || 0));
        break;
      case "popular":
        filtered.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
        break;
      case "rare":
        filtered.sort((a, b) => (a.rarity || 0) - (b.rarity || 0));
        break;
      default:
        break;
    }

    setFilteredBooks(filtered);
  };

  const handleSearch = (query, filters = {}) => {
    applyFilters(query, filters);
  };

  const handleFilterChange = (filters) => {
    applyFilters("", filters); // Keep query empty if just updating filters
  };

  if (loading)
    return <CircularProgress sx={{ display: "block", margin: "50px auto" }} />;

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom align="center">
        Explore Books
      </Typography>

      <Box sx={{ mb: 4 }}>
        <BookSearch onSearch={handleSearch} onFilterChange={handleFilterChange} />
      </Box>

      <Grid container spacing={3} justifyContent="center">
        {filteredBooks.length === 0 ? (
          <Typography>No books match your search.</Typography>
        ) : (
          filteredBooks.map((book) => (
            <Grid item key={book.id}>
              <BookCard
                onClick={() => navigate(`/book/${book.id}`)}
                title={book.title}
                owner={book.ownerName}
                condition={book.condition}
                image={book.pictures?.[0] || ""}
              />
            </Grid>
          ))
        )}
      </Grid>
    </Box>
  );
};

export default Home;
