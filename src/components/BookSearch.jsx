import React, { useState } from "react";
import {
  Box,
  TextField,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Button,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";


const BookSearch = ({ onSearch }) => {
  const [query, setQuery] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleSearch = () => {
    if (onSearch) onSearch(query);
  };

  const handleFilterClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setAnchorEl(null);
  };

  const handleFilterSelect = (filter) => {
    console.log("Selected filter:", filter);
    setAnchorEl(null);
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        backgroundColor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        p: 0.5,
        maxWidth: 500,
        mx: "auto",
      }}
    >
      {/* Search Input */}
      <TextField
        fullWidth
        variant="standard"
        placeholder="Search books..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        InputProps={{
          disableUnderline: true,
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
        }}
        sx={{
          input: { px: 1 },
        }}
      />

      {/* Filter Button */}
      <IconButton
        onClick={handleFilterClick}
        color="primary"
        sx={{ p: 1 }}
      >
        <FilterListIcon />
      </IconButton>

      {/* Filter Menu */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleFilterClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <MenuItem onClick={() => handleFilterSelect("All")}>All</MenuItem>
        <MenuItem onClick={() => handleFilterSelect("New")}>New</MenuItem>
        <MenuItem onClick={() => handleFilterSelect("Used")}>Used</MenuItem>
        <MenuItem onClick={() => handleFilterSelect("Excellent")}>
          Excellent Condition
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default BookSearch;
