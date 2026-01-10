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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const booksSnap = await getDocs(collection(db, "books"));
        const allBooks = booksSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Shuffle books randomly
        allBooks.sort(() => Math.random() - 0.5);

        setBooks(allBooks);
      } catch (err) {
        console.error("Error fetching books:", err);
      }
      setLoading(false);
    };

    fetchBooks();
  }, []);

  const handleSearch = (query) => {
    console.log("Search query:", query);
    // Optional: filter books by title, author, etc.
  };

  if (loading)
    return <CircularProgress sx={{ display: "block", margin: "50px auto" }} />;

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom align="center">
        Explore Books
      </Typography>

      <Box sx={{ mb: 4 }}>
        <BookSearch onSearch={handleSearch} />
      </Box>

      <Grid container spacing={3} justifyContent="center">
        {books.length === 0 ? (
          <Typography>No books available.</Typography>
        ) : (
          books.map((book) => (
            <Grid item key={book.id}>
              <BookCard
                onClick={() => navigate(`/book/${book.id}`)}
                title={book.title}
                owner={book.ownerName}
                condition={book.condition}
                image={book.picture}
              />
            </Grid>
          ))
        )}
      </Grid>
    </Box>
  );
};

export default Home;
