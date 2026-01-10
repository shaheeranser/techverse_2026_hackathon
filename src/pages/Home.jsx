import React, { useEffect, useState } from "react";
import { Box, Grid, Typography, CircularProgress } from "@mui/material";
import BookSearch from "../components/BookSearch";
import BookCard from "../components/BookCard";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

const Home = () => {
  const navigate = useNavigate();
  const [allBooks, setAllBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const booksSnap = await getDocs(collection(db, "books"));
        const booksData = booksSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setAllBooks(booksData);
        setFilteredBooks(booksData);
      } catch (err) {
        console.error("Error fetching books:", err);
      }
      setLoading(false);
    };

    fetchBooks();
  }, []);

  // Filter callback
  const handleFilterChange = (query /*, filters */) => {
    let temp = [...allBooks];

    if (query) {
      const q = query.toLowerCase();
      temp = temp.filter(
        (b) =>
          b.title?.toLowerCase().includes(q) ||
          b.author?.toLowerCase().includes(q) ||
          b.isbn?.toString().includes(q)
      );
    }

    // Commented out the rest for now
    /*
    // Condition filter
    if (filters.condition.length) {
      temp = temp.filter((b) =>
        filters.condition.includes(
          (typeof b.condition === "string"
            ? b.condition.toLowerCase()
            : b.condition?.toString()) || ""
        )
      );
    }

    // Points filter
    temp = temp.filter(
      (b) =>
        (b.points || 0) >= filters.pointRange[0] &&
        (b.points || 0) <= filters.pointRange[1]
    );

    // Availability filter
    if (filters.availability === "available") {
      temp = temp.filter((b) => b.available !== false);
    }

    // Location filter
    if (filters.location) {
      const loc = filters.location.toLowerCase();
      temp = temp.filter((b) => b.location?.toLowerCase().includes(loc));
    }
    */

    setFilteredBooks(temp);
  };

  if (loading)
    return <CircularProgress sx={{ display: "block", margin: "50px auto" }} />;

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom align="center">
        Explore Books
      </Typography>

      <Box sx={{ mb: 4 }}>
        <BookSearch onFilterChange={handleFilterChange} />
      </Box>

      <Grid container spacing={3} justifyContent="center">
        {filteredBooks.length === 0 ? (
          <Typography>No books available.</Typography>
        ) : (
          filteredBooks.map((book) => (
            <Grid item key={book.id}>
              <BookCard
                onClick={() => navigate(`/book/${book.id}`)}
                title={book.title}
                owner={book.ownerName}
                condition={book.condition}
                image={book.pictures?.[0]} // first picture
              />
            </Grid>
          ))
        )}
      </Grid>
    </Box>
  );
};

export default Home;
