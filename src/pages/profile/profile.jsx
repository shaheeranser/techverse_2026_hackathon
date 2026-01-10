import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Tabs,
  Tab,
  Stack,
  Chip,
  Paper,
  Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import InfoIcon from "@mui/icons-material/Info";

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
  const [description, setDescription] = useState("");
  const [pictures, setPictures] = useState([]);
  const [saving, setSaving] = useState(false);

  const [availableMap, setAvailableMap] = useState({});

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      // const loggedIn = localStorage.getItem("loggedIn") === "true";

      if (!user) {
        navigate("/", { replace: true });
        return;
      }

      try {
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
          let data = snap.data();
          if (data.points === undefined) {
            await updateDoc(userRef, { points: 250 });
            data.points = 250;
          }
          setUserData(data);
        }

        await fetchMyBooks(user.uid);
        await fetchReceivedBooks(user.uid);
      } catch (err) {
        console.error(err);
        navigate("/", { replace: true });
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Fetch user and books data
  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        let data = snap.data();
        if (data.points === undefined) {
          await updateDoc(userRef, { points: 250 });
          data.points = 250;
        }
        setUserData(data);
      }

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
    await calculateAvailableForAll();
  };

  const fetchReceivedBooks = async (uid) => {
    const receivedRef = collection(db, "users", uid, "receivedBooks");
    const snap = await getDocs(receivedRef);
    setReceivedBooks(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    setLoading(false);
  };

  const calculateAvailableForAll = async () => {
    const booksRef = collection(db, "books");
    const snap = await getDocs(booksRef);
    const books = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const map = {};
    books.forEach((b) => {
      if (b.isbn) map[b.isbn] = (map[b.isbn] || 0) + 1;
    });
    setAvailableMap(map);
  };

  const getBookPoints = (count) => {
    if (count === 1) return 50;
    if (count === 2) return 30;
    if (count === 3) return 25;
    if (count === 4) return 20;
    if (count === 5) return 18;
    if (count === 6) return 15;
    if (count === 7) return 13;
    if (count === 8) return 12;
    if (count === 9) return 11;
    return 10;
  };

  const handleOpen = (book = null) => {
    if (book) {
      setEditingBookId(book.id);
      setBookTitle(book.title);
      setAuthor(book.author);
      setLocation(book.location);
      setCondition(book.condition);
      setIsbn(book.isbn || "");
      setDescription(book.description || "");
      setPictures(book.pictures || []);
    } else {
      setEditingBookId(null);
      setBookTitle("");
      setAuthor("");
      setLocation("");
      setCondition(5);
      setIsbn("");
      setDescription("");
      setPictures([]);
    }
    setOpenModal(true);
  };
  const handleClose = () => setOpenModal(false);

  const handleAddPictures = (e) => {
    const files = Array.from(e.target.files);
    const remainingSlots = 4 - pictures.length;
    if (remainingSlots <= 0) return;
    setPictures([...pictures, ...files.slice(0, remainingSlots)]);
  };

  const handleRemovePicture = (index) => {
    setPictures(pictures.filter((_, i) => i !== index));
  };

  const handleIsbnChange = (e) => {
    const val = e.target.value;
    if (/^\d*$/.test(val)) setIsbn(val.slice(0, 13));
  };

  const handleAddOrEditBook = async () => {
    if (
      !bookTitle ||
      !author ||
      !location ||
      !isbn ||
      (!pictures.length && !editingBookId)
    ) {
      alert("Please fill all fields and upload at least one picture.");
      return;
    }

    if (isbn.length !== 13) {
      alert("ISBN must be exactly 13 digits.");
      return;
    }

    setSaving(true);
    try {
      const user = auth.currentUser;
      let pictureURLs = editingBookId
        ? [...pictures.filter((p) => typeof p === "string")]
        : [];

      for (const file of pictures) {
        if (typeof file !== "string") {
          const storageRef = ref(
            storage,
            `books/${user.uid}/${Date.now()}_${file.name}`
          );
          await uploadBytes(storageRef, file);
          const url = await getDownloadURL(storageRef);
          pictureURLs.push(url);
        }
      }

      // Calculate availability + points
      const currentAvailability = availableMap[isbn]
        ? availableMap[isbn] + (editingBookId ? 0 : 1)
        : 1;
      const points = getBookPoints(currentAvailability);

      const booksRef = collection(db, "books");

      if (editingBookId) {
        const bookRef = doc(booksRef, editingBookId);
        await updateDoc(bookRef, {
          title: bookTitle,
          author,
          location,
          condition,
          isbn,
          description,
          pictures: pictureURLs,
          points,
        });
      } else {
          await addDoc(booksRef, {
            title: bookTitle,
            author,
            location,
            condition,
            isbn,
            description,
            pictures: pictureURLs,
            ownerId: user.uid,
            ownerName: userData.name,
            ownerPhoto: userData.photo,
            points,
            createdAt: serverTimestamp(),
          });

          // 🔥 ADD +10 POINTS TO USER
          const userRef = doc(db, "users", user.uid);
          const newPoints = (userData.points || 0) + 10;

          await updateDoc(userRef, {
            points: newPoints,
          });

          // Keep UI in sync
          setUserData((prev) => ({
            ...prev,
            points: newPoints,
          }));
        }

      await calculateAvailableForAll();
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
      await calculateAvailableForAll();
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
    <Box sx={{ maxWidth: 900, mx: "auto", py: 4, px: 2 }}>
      {/* Profile Header */}
      <Paper
        elevation={3}
        sx={{ py: 3, px: 4, mb: 4, textAlign: "center", borderRadius: 3 }}
      >
        <Avatar
          src={userData.photo}
          alt={userData.name}
          sx={{ width: 120, height: 120, mx: "auto", mb: 2 }}
        />
        <Typography variant="h5" fontWeight="bold">
          {userData.name}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {userData.email}
        </Typography>
        <Typography
          variant="body1"
          fontWeight="bold"
          color="primary"
          sx={{ mt: 1 }}
        >
          📚 Points: {userData.points ?? 0}
        </Typography>
      </Paper>

      {/* Tabs */}
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

      {/* Books List */}
      <Stack spacing={3}>
        {(tabValue === 0 ? myBooks : receivedBooks).map((book) => (
          <Paper key={book.id} elevation={3} sx={{ borderRadius: 3, p: 2 }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {book.pictures?.map((img, i) => (
                  <Avatar
                    key={i}
                    src={img}
                    variant="square"
                    sx={{ width: 100, height: 100 }}
                  />
                ))}
              </Stack>

              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" fontWeight="bold">
                  {book.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {book.author}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" mt={1}>
                  <Chip
                    label={`Condition: ${book.condition}`}
                    size="small"
                    color="success"
                  />
                  <Chip
                    label={`Available: ${availableMap[book.isbn] || 0}`}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    label={`Location: ${book.location}`}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    label={`Points: ${
                      book.points ?? getBookPoints(availableMap[book.isbn] || 0)
                    }`}
                    size="small"
                    color="secondary"
                  />
                  <Tooltip title={book.description || "No description"}>
                    <InfoIcon
                      color="action"
                      fontSize="small"
                      sx={{ alignSelf: "center" }}
                    />
                  </Tooltip>
                </Stack>
              </Box>

              {tabValue === 0 && (
                <Stack spacing={1} justifyContent="flex-start">
                  <IconButton onClick={() => handleOpen(book)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDeleteBook(book.id)}>
                    <DeleteIcon />
                  </IconButton>
                </Stack>
              )}
            </Stack>
          </Paper>
        ))}
        {(tabValue === 0 ? myBooks : receivedBooks).length === 0 && (
          <Typography textAlign="center" color="text.secondary">
            No books to display.
          </Typography>
        )}
      </Stack>

      {/* Floating Add Button */}
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

      {/* Add/Edit Modal */}
      <Modal open={openModal} onClose={handleClose}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "95%", sm: 450 },
            maxHeight: "90vh",
            bgcolor: "background.paper",
            borderRadius: 3,
            boxShadow: 24,
            p: 3,
            overflowY: "auto",
          }}
        >
          <Typography variant="h6" mb={2} textAlign="center">
            {editingBookId ? "Edit Book" : "Add a Book"}
          </Typography>

          {/* Live Preview Card */}
          <Paper elevation={3} sx={{ mb: 2, p: 2, borderRadius: 2 }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {pictures.map((img, i) => (
                  <Avatar
                    key={i}
                    src={
                      typeof img === "string" ? img : URL.createObjectURL(img)
                    }
                    variant="square"
                    sx={{ width: 80, height: 80 }}
                  />
                ))}
              </Stack>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">
                  {bookTitle || "Book Title"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {author || "Author"}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" mt={1}>
                  <Chip
                    label={`Condition: ${condition}`}
                    size="small"
                    color="success"
                  />
                  <Chip
                    label={`Available: ${availableMap[isbn] || 0}`}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    label={`Location: ${location || "-"}`}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    label={`Points: ${getBookPoints(
                      (availableMap[isbn] || 0) + (editingBookId ? 0 : 1)
                    )}`}
                    size="small"
                    color="secondary"
                  />
                </Stack>
              </Box>
            </Stack>
          </Paper>

          {/* Form Fields */}
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Book Title"
              value={bookTitle}
              onChange={(e) => setBookTitle(e.target.value)}
            />
            <TextField
              fullWidth
              label="Author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
            />
            <TextField
              fullWidth
              label="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <TextField
              fullWidth
              label="ISBN Number"
              value={isbn}
              onChange={handleIsbnChange}
              helperText="Must be exactly 13 digits"
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Typography variant="caption">
              Available in database: {availableMap[isbn] || 0}
            </Typography>

            <Box>
              <Typography gutterBottom>Condition: {condition}</Typography>
              <Slider
                value={condition}
                onChange={(e, val) => setCondition(val)}
                min={1}
                max={10}
                valueLabelDisplay="auto"
              />
            </Box>

            {/* Pictures Upload */}
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {pictures.map((img, i) => (
                <Box key={i} sx={{ position: "relative" }}>
                  <Avatar
                    src={
                      typeof img === "string" ? img : URL.createObjectURL(img)
                    }
                    variant="square"
                    sx={{ width: 80, height: 80 }}
                  />
                  <Button
                    size="small"
                    color="error"
                    sx={{
                      position: "absolute",
                      top: -5,
                      right: -15,
                      bgcolor: "white",
                      width: 20,
                      height: 20,
                    }}
                    onClick={() => handleRemovePicture(i)}
                  >
                    x
                  </Button>
                </Box>
              ))}
              {pictures.length < 4 && (
                <Button
                  variant="outlined"
                  component="label"
                  sx={{ width: 80, height: 80, minWidth: 0, p: 0 }}
                >
                  <AddIcon />
                  <input
                    type="file"
                    hidden
                    multiple
                    onChange={handleAddPictures}
                    accept="image/*"
                  />
                </Button>
              )}
            </Stack>

            <Button
              variant="contained"
              fullWidth
              onClick={handleAddOrEditBook}
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editingBookId
                ? "Update Book"
                : "Add Book"}
            </Button>
          </Stack>
        </Box>
      </Modal>
    </Box>
  );
}
