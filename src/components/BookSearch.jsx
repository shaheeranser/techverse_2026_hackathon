import React, { useState } from "react";
import {
  Box,
  TextField,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Chip,
  Stack,
  Typography,
  Divider,
  Slider,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Paper,
  Collapse,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import CloseIcon from "@mui/icons-material/Close";
import TuneIcon from "@mui/icons-material/Tune";
import LocationOnIcon from "@mui/icons-material/LocationOn";

const BookSearch = ({ onFilterChange }) => {
  const [query, setQuery] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [filters, setFilters] = useState({
    condition: [],
    pointRange: [0, 500],
    availability: "all",
    location: "",
    sortBy: "newest",
  });

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  // Trigger search callback
  const triggerChange = (updatedFilters = filters, q = query) => {
    if (onFilterChange) onFilterChange(q, updatedFilters);
  };

  const handleQueryChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    triggerChange(filters, val); // 🔥 live search on every keystroke
  };

  const handleConditionToggle = (condition) => {
    const newConditions = filters.condition.includes(condition)
      ? filters.condition.filter((c) => c !== condition)
      : [...filters.condition, condition];
    const newFilters = { ...filters, condition: newConditions };
    setFilters(newFilters);
    triggerChange(newFilters);
  };

  const handlePointRangeChange = (event, newValue) => {
    const newFilters = { ...filters, pointRange: newValue };
    setFilters(newFilters);
    triggerChange(newFilters); // 🔥 live update
  };

  const handleSortChange = (sortBy) => {
    const newFilters = { ...filters, sortBy };
    setFilters(newFilters);
    triggerChange(newFilters);
    setAnchorEl(null);
  };

  const handleLocationChange = (e) => {
    const newFilters = { ...filters, location: e.target.value };
    setFilters(newFilters);
    triggerChange(newFilters);
  };

  const handleAvailabilityToggle = () => {
    const newFilters = {
      ...filters,
      availability: filters.availability === "all" ? "available" : "all",
    };
    setFilters(newFilters);
    triggerChange(newFilters);
  };

  const clearFilters = () => {
    const resetFilters = {
      condition: [],
      pointRange: [0, 500],
      availability: "all",
      location: "",
      sortBy: "newest",
    };
    setFilters(resetFilters);
    setQuery("");
    triggerChange(resetFilters, ""); // 🔥 reset search results
  };

  const activeFilterCount =
    filters.condition.length +
    (filters.availability !== "all" ? 1 : 0) +
    (filters.location ? 1 : 0);

  return (
    <Box sx={{ maxWidth: 900, mx: "auto" }}>
      {/* Main Search Bar */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          backgroundColor: "background.paper",
          border: "2px solid",
          borderColor: "divider",
          borderRadius: 3,
          p: 1,
          boxShadow: 2,
        }}
      >
        <TextField
          fullWidth
          variant="standard"
          placeholder="Search by title, author, ISBN..."
          value={query}
          onChange={handleQueryChange}
          InputProps={{
            disableUnderline: true,
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{ input: { px: 1, fontSize: "1rem" } }}
        />

        <IconButton
          onClick={() => setShowAdvanced(!showAdvanced)}
          color={showAdvanced ? "primary" : "default"}
          sx={{ p: 1 }}
        >
          <TuneIcon />
        </IconButton>

        <IconButton
          onClick={(e) => setAnchorEl(e.currentTarget)}
          color={activeFilterCount > 0 ? "primary" : "default"}
          sx={{ p: 1, position: "relative" }}
        >
          <FilterListIcon />
          {activeFilterCount > 0 && (
            <Box
              sx={{
                position: "absolute",
                top: 4,
                right: 4,
                width: 18,
                height: 18,
                borderRadius: "50%",
                bgcolor: "error.main",
                color: "white",
                fontSize: "0.7rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {activeFilterCount}
            </Box>
          )}
        </IconButton>
      </Box>

      {/* Advanced Filters Panel */}
      <Collapse in={showAdvanced}>
        <Paper sx={{ mt: 2, p: 3, borderRadius: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h6" fontWeight="medium">
              Advanced Filters
            </Typography>
            <IconButton onClick={clearFilters}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Stack spacing={3}>
            {/* Condition Filters */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Condition
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {["Mint", "Good", "Fair", "Poor"].map((cond) => (
                  <Chip
                    key={cond}
                    label={cond}
                    onClick={() => handleConditionToggle(cond.toLowerCase())}
                    color={
                      filters.condition.includes(cond.toLowerCase())
                        ? "primary"
                        : "default"
                    }
                    variant={
                      filters.condition.includes(cond.toLowerCase())
                        ? "filled"
                        : "outlined"
                    }
                  />
                ))}
              </Stack>
            </Box>

            <Divider />

            {/* Point Range */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Point Range: {filters.pointRange[0]} - {filters.pointRange[1]} points
              </Typography>
              <Slider
                value={filters.pointRange}
                onChange={handlePointRangeChange}
                valueLabelDisplay="auto"
                min={0}
                max={500}
              />
            </Box>

            <Divider />

            {/* Location */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Location
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="Enter city or area..."
                value={filters.location}
                onChange={handleLocationChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationOnIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <Divider />

            {/* Availability */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Availability
              </Typography>
              <FormGroup row>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters.availability === "available"}
                      onChange={handleAvailabilityToggle}
                    />
                  }
                  label="Only Available Books"
                />
              </FormGroup>
            </Box>
          </Stack>
        </Paper>
      </Collapse>

      {/* Sort Menu */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        {[
          { label: "Newest First", value: "newest" },
          { label: "Points: Low to High", value: "points-low" },
          { label: "Points: High to Low", value: "points-high" },
          { label: "Most Popular", value: "popular" },
          { label: "Rarest Books", value: "rare" },
        ].map((item) => (
          <MenuItem
            key={item.value}
            selected={filters.sortBy === item.value}
            onClick={() => handleSortChange(item.value)}
          >
            {item.label}
          </MenuItem>
        ))}
      </Menu>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <Box sx={{ mt: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ alignSelf: "center" }}
          >
            Active filters:
          </Typography>
          {filters.condition.map((cond) => (
            <Chip
              key={cond}
              label={`Condition: ${cond}`}
              size="small"
              onDelete={() => handleConditionToggle(cond)}
            />
          ))}
          {filters.availability === "available" && (
            <Chip
              label="Available only"
              size="small"
              onDelete={handleAvailabilityToggle}
            />
          )}
          {filters.location && (
            <Chip
              label={`Location: ${filters.location}`}
              size="small"
              onDelete={() => handleLocationChange({ target: { value: "" } })}
            />
          )}
        </Box>
      )}
    </Box>
  );
};

export default BookSearch;
