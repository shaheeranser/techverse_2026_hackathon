import React, { useEffect, useState } from "react";
import { auth, db, storage } from "../../firebase";
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
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
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

export default function Profile() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [openModal, setOpenModal] = useState(false);
  const [bookTitle, setBookTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [location, setLocation] = useState("");
  const [condition, setCondition] = useState(5);
  const [picture, setPicture] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) setUserData(snap.data());
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleOpen = () => setOpenModal(true);
  const handleClose = () => setOpenModal(false);

  const handlePictureChange = (e) => {
    if (e.target.files[0]) setPicture(e.target.files[0]);
  };

  const handleAddBook = async () => {
    if (!bookTitle || !author || !location || !picture) {
      alert("Please fill all fields and upload a picture.");
      return;
    }

    setSaving(true);
    try {
      // 1️⃣ Upload book image to Firebase Storage
      const storageRef = ref(storage, `books/${auth.currentUser.uid}/${Date.now()}_${picture.name}`);
      await uploadBytes(storageRef, picture);
      const pictureURL = await getDownloadURL(storageRef);

      // 2️⃣ Save book details in Firestore under user collection
      const booksRef = collection(db, "users", auth.currentUser.uid, "books");
      await addDoc(booksRef, {
        title: bookTitle,
        author,
        location,
        condition,
        picture: pictureURL,
        createdAt: serverTimestamp(),
      });

      // Reset form
      setBookTitle("");
      setAuthor("");
      setLocation("");
      setCondition(5);
      setPicture(null);
      handleClose();
    } catch (err) {
      console.error(err);
      alert("Failed to add book.");
    }
    setSaving(false);
  };

  if (loading)
    return <CircularProgress sx={{ display: "block", margin: "50px auto" }} />;

  if (!userData) return <div>No user data found.</div>;

  return (
    <Box sx={{ padding: 3, maxWidth: 600, margin: "auto", textAlign: "center" }}>
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

      {/* Floating Add Button */}
      <Fab
        color="primary"
        aria-label="add"
        onClick={handleOpen}
        sx={{ position: "fixed", bottom: 20, right: 20 }}
      >
        <AddIcon />
      </Fab>

      {/* Modal Form */}
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
            Add a Book
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
          <Button variant="contained" component="label" fullWidth sx={{ mb: 2 }}>
            Upload Picture
            <input type="file" hidden onChange={handlePictureChange} accept="image/*" />
          </Button>
          {picture && <Typography variant="body2">{picture.name}</Typography>}

          <Button
            variant="contained"
            fullWidth
            onClick={handleAddBook}
            disabled={saving}
          >
            {saving ? "Saving..." : "Add Book"}
          </Button>
        </Box>
      </Modal>
    </Box>
  );
}
