import React, { useEffect, useState } from "react";
import { auth, db, storage } from "../../firebase";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

import {
  Box,
  Typography,
  Avatar,
  Fab,
  Modal,
  TextField,
  Button,
  Slider,
  CircularProgress,
  IconButton,
  Card,
  CardContent,
  CardActions,
  Tabs,
  Tab,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

export default function Profile() {
  const [userData, setUserData] = useState(null);
  const [myBooks, setMyBooks] = useState([]);
  const [receivedBooks, setReceivedBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);

  const [openModal, setOpenModal] = useState(false);
  const [editingBookId, setEditingBookId] = useState(null);
  const [bookTitle, setBookTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [location, setLocation] = useState("");
  const [condition, setCondition] = useState(5);
  const [isbn, setIsbn] = useState("");
  const [picture, setPicture] = useState(null);
  const [saving, setSaving] = useState(false);

  // Store available quantities by ISBN
  const [availableMap, setAvailableMap] = useState({});

  // Fetch user data and books
  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) setUserData(snap.data());

      await fetchMyBooks(user.uid);
      await fetchReceivedBooks(user.uid);
    };

    const unsubscribe = auth.onAuthStateChanged(() => fetchData());
    return () => unsubscribe();
  }, []);

  const fetchMyBooks = async (uid) => {
    const booksRef = collection(db, "books");
    const q = query(booksRef, where("ownerId", "==", uid));
    const snap = await getDocs(q);
    const books = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setMyBooks(books);
    await calculateAvailableForAll(books);
  };

  const fetchReceivedBooks = async (uid) => {
    const receivedRef = collection(db, "users", uid, "receivedBooks");
    const snap = await getDocs(receivedRef);
    setReceivedBooks(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    setLoading(false);
  };

  // Calculate available quantities for all ISBNs
  const calculateAvailableForAll = async (books) => {
    const booksRef = collection(db, "books");
    const newMap = {};
    const allISBNs = Array.from(new Set(books.map((b) => b.isbn)));
    for (const code of allISBNs) {
      const q = query(booksRef, where("isbn", "==", code));
      const snap = await getDocs(q);
      newMap[code] = snap.size;
    }
    setAvailableMap(newMap);
  };

  // Handle modal open
  const handleOpen = (book = null) => {
    if (book) {
      setEditingBookId(book.id);
      setBookTitle(book.title);
      setAuthor(book.author);
      setLocation(book.location);
      setCondition(book.condition);
      setIsbn(book.isbn || "");
    } else {
      setEditingBookId(null);
      setBookTitle("");
      setAuthor("");
      setLocation("");
      setCondition(5);
      setIsbn("");
      setPicture(null);
    }
    setOpenModal(true);
  };
  const handleClose = () => setOpenModal(false);

  const handlePictureChange = (e) => {
    if (e.target.files[0]) setPicture(e.target.files[0]);
  };

  const handleIsbnChange = (e) => {
    setIsbn(e.target.value);
  };

  const handleAddOrEditBook = async () => {
    if (
      !bookTitle ||
      !author ||
      !location ||
      !isbn ||
      (!picture && !editingBookId)
    ) {
      alert("Please fill all fields and upload a picture.");
      return;
    }

    setSaving(true);
    try {
      let pictureURL = null;
      const user = auth.currentUser;

      if (picture) {
        const storageRef = ref(
          storage,
          `books/${user.uid}/${Date.now()}_${picture.name}`
        );
        await uploadBytes(storageRef, picture);
        pictureURL = await getDownloadURL(storageRef);
      }

      const booksRef = collection(db, "books");

      if (editingBookId) {
        const bookRef = doc(booksRef, editingBookId);
        await updateDoc(bookRef, {
          title: bookTitle,
          author,
          location,
          condition,
          ...(pictureURL && { picture: pictureURL }),
          isbn,
        });
      } else {
        await addDoc(booksRef, {
          title: bookTitle,
          author,
          location,
          condition,
          picture: pictureURL,
          isbn,
          ownerId: user.uid,
          ownerName: userData.name,
          ownerPhoto: userData.photo,
          createdAt: serverTimestamp(),
        });
      }

      // Refresh books and available map
      await fetchMyBooks(user.uid);

      handleClose();
    } catch (err) {
      console.error(err);
      alert("Failed to save book.");
    }
    setSaving(false);
  };

  const handleDeleteBook = async (id) => {
    if (!window.confirm("Are you sure you want to delete this book?")) return;
    try {
      const bookRef = doc(db, "books", id);
      await deleteDoc(bookRef);

      const user = auth.currentUser;
      if (user) await fetchMyBooks(user.uid);
    } catch (err) {
      console.error(err);
      alert("Failed to delete book. Check your Firestore rules.");
    }
  };

  const handleTabChange = (event, newValue) => setTabValue(newValue);

  if (loading)
    return <CircularProgress sx={{ display: "block", margin: "50px auto" }} />;

  if (!userData) return <div>No user data found.</div>;

  return (
    <Box
      sx={{ padding: 3, maxWidth: 800, margin: "auto", textAlign: "center" }}
    >
      <Typography variant="h4" mb={2}>
        Profile Page
      </Typography>
      <Avatar
        src={userData.photo}
        alt={userData.name}
        sx={{ width: 100, height: 100, margin: "auto", mb: 2 }}
      />
      <Typography variant="h6">{userData.name}</Typography>
      <Typography variant="body1" mb={4}>
        {userData.email}
      </Typography>

      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        centered
        sx={{ mb: 3 }}
        indicatorColor="primary"
        textColor="primary"
      >
        <Tab label="My Books" />
        <Tab label="Received Books" />
      </Tabs>

      {tabValue === 0 && (
        <Box>
          {myBooks.length === 0 ? (
            <Typography>No books added yet.</Typography>
          ) : (
            myBooks.map((book) => (
              <Card key={book.id} sx={{ mb: 2 }}>
                <CardContent sx={{ display: "flex", alignItems: "center" }}>
                  <Avatar
                    src={book.picture}
                    variant="square"
                    sx={{ width: 80, height: 80, mr: 2 }}
                  />
                  <Box sx={{ flexGrow: 1, textAlign: "left" }}>
                    <Typography variant="h6">{book.title}</Typography>
                    <Typography variant="body2">
                      Author: {book.author} | Location: {book.location} |
                      Condition: {book.condition} | Available:{" "}
                      {availableMap[book.isbn] || 0}
                    </Typography>
                  </Box>
                  <CardActions>
                    <IconButton onClick={() => handleOpen(book)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDeleteBook(book.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </CardActions>
                </CardContent>
              </Card>
            ))
          )}
        </Box>
      )}

      {tabValue === 1 && (
        <Box>
          {receivedBooks.length === 0 ? (
            <Typography>No received books yet.</Typography>
          ) : (
            receivedBooks.map((book) => (
              <Card key={book.id} sx={{ mb: 2 }}>
                <CardContent sx={{ display: "flex", alignItems: "center" }}>
                  <Avatar
                    src={book.picture}
                    variant="square"
                    sx={{ width: 80, height: 80, mr: 2 }}
                  />
                  <Box sx={{ flexGrow: 1, textAlign: "left" }}>
                    <Typography variant="h6">{book.title}</Typography>
                    <Typography variant="body2">
                      Author: {book.author} | Location: {book.location} |
                      Condition: {book.condition} | Available:{" "}
                      {availableMap[book.isbn] || 0}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            ))
          )}
        </Box>
      )}

      {tabValue === 0 && (
        <Fab
          color="primary"
          aria-label="add"
          onClick={() => handleOpen()}
          sx={{ position: "fixed", bottom: 20, right: 20 }}
        >
          <AddIcon />
        </Fab>
      )}

      <Modal open={openModal} onClose={handleClose}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "90%", sm: 400 },
            bgcolor: "background.paper",
            borderRadius: 2,
            boxShadow: 24,
            p: 4,
          }}
        >
          <Typography variant="h6" mb={2}>
            {editingBookId ? "Edit Book" : "Add a Book"}
          </Typography>
          <TextField
            fullWidth
            label="Book Title"
            value={bookTitle}
            onChange={(e) => setBookTitle(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Author"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="ISBN Number"
            value={isbn}
            onChange={handleIsbnChange}
            sx={{ mb: 1 }}
          />
          <Typography variant="caption" display="block" mb={2}>
            Available in database: {availableMap[isbn] || 0}
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Typography gutterBottom>Condition: {condition}</Typography>
            <Slider
              value={condition}
              onChange={(e, val) => setCondition(val)}
              min={1}
              max={10}
              valueLabelDisplay="auto"
            />
          </Box>
          <Button
            variant="contained"
            component="label"
            fullWidth
            sx={{ mb: 2 }}
          >
            {editingBookId ? "Upload New Picture" : "Upload Picture"}
            <input
              type="file"
              hidden
              onChange={handlePictureChange}
              accept="image/*"
            />
          </Button>
          {picture && <Typography variant="body2">{picture.name}</Typography>}
          <Button
            variant="contained"
            fullWidth
            onClick={handleAddOrEditBook}
            disabled={saving}
          >
            {saving ? "Saving..." : editingBookId ? "Update Book" : "Add Book"}
          </Button>
        </Box>
      </Modal>
    </Box>
  );
}
