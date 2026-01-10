import React, { useEffect, useState } from "react";
import { Box, Grid, Typography, CircularProgress } from "@mui/material";
import BookSearch from "../components/BookSearch";
import BookCard from "../components/BookCard";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

const Home = () => {
  const navigate = useNavigate();
  const [allBooks, setAllBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState("");

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const user = auth.currentUser;
        setCurrentUserId(user?.uid || "");

        const snap = await getDocs(collection(db, "books"));
        const booksData = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Exclude books owned by the current user
        const visibleBooks = booksData.filter((b) => b.ownerId !== user?.uid);

        setAllBooks(visibleBooks);
        setFilteredBooks(visibleBooks);
      } catch (err) {
        console.error("Error fetching books:", err);
      }
      setLoading(false);
    };

    fetchBooks();
  }, []);

  const handleFilterChange = (query) => {
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
                book={book}
              />
            </Grid>
          ))
        )}
      </Grid>
    </Box>
  );
};

export default Home;
