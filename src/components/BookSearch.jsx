import React, { useState } from "react";
import {
  Box,
  TextField,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Button,
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

const BookSearch = ({ onSearch, onFilterChange }) => {
  const [query, setQuery] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    condition: [],
    pointRange: [0, 500],
    availability: "all",
    location: "",
    sortBy: "newest",
  });

  const open = Boolean(anchorEl);

  const handleSearch = () => {
    if (onSearch) onSearch(query, filters);
  };

  const handleFilterClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setAnchorEl(null);
  };

  const handleConditionToggle = (condition) => {
    const newConditions = filters.condition.includes(condition)
      ? filters.condition.filter((c) => c !== condition)
      : [...filters.condition, condition];
    
    const newFilters = { ...filters, condition: newConditions };
    setFilters(newFilters);
    if (onFilterChange) onFilterChange(newFilters);
  };

  const handlePointRangeChange = (event, newValue) => {
    const newFilters = { ...filters, pointRange: newValue };
    setFilters(newFilters);
  };

  const handlePointRangeCommitted = (event, newValue) => {
    if (onFilterChange) onFilterChange(filters);
  };

  const handleSortChange = (sortBy) => {
    const newFilters = { ...filters, sortBy };
    setFilters(newFilters);
    if (onFilterChange) onFilterChange(newFilters);
    setAnchorEl(null);
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
    if (onFilterChange) onFilterChange(resetFilters);
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
        {/* Search Input */}
        <TextField
          fullWidth
          variant="standard"
          placeholder="Search by title, author, ISBN..."
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
            input: { px: 1, fontSize: "1rem" },
          }}
        />

        {/* Advanced Filters Toggle */}
        <IconButton
          onClick={() => setShowAdvanced(!showAdvanced)}
          color={showAdvanced ? "primary" : "default"}
          sx={{ p: 1 }}
        >
          <TuneIcon />
        </IconButton>

        {/* Sort Menu */}
        <IconButton
          onClick={handleFilterClick}
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

        {/* Search Button */}
        <Button
          variant="contained"
          onClick={handleSearch}
          sx={{ px: 3, py: 1, borderRadius: 2 }}
        >
          Search
        </Button>
      </Box>

      {/* Advanced Filters Panel */}
      <Collapse in={showAdvanced}>
        <Paper sx={{ mt: 2, p: 3, borderRadius: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h6" fontWeight="medium">
              Advanced Filters
            </Typography>
            <Button size="small" onClick={clearFilters} startIcon={<CloseIcon />}>
              Clear All
            </Button>
          </Box>

          <Stack spacing={3}>
            {/* Condition Filters */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Condition
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {["Mint", "Good", "Fair", "Poor"].map((condition) => (
                  <Chip
                    key={condition}
                    label={condition}
                    onClick={() => handleConditionToggle(condition.toLowerCase())}
                    color={filters.condition.includes(condition.toLowerCase()) ? "primary" : "default"}
                    variant={filters.condition.includes(condition.toLowerCase()) ? "filled" : "outlined"}
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
                onChangeCommitted={handlePointRangeCommitted}
                valueLabelDisplay="auto"
                min={0}
                max={500}
                sx={{ mt: 2 }}
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
                onChange={(e) => {
                  const newFilters = { ...filters, location: e.target.value };
                  setFilters(newFilters);
                }}
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
                      onChange={(e) => {
                        const newFilters = {
                          ...filters,
                          availability: e.target.checked ? "available" : "all",
                        };
                        setFilters(newFilters);
                        if (onFilterChange) onFilterChange(newFilters);
                      }}
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
        <MenuItem disabled>
          <Typography variant="caption" color="text.secondary">
            Sort By
          </Typography>
        </MenuItem>
        <MenuItem
          onClick={() => handleSortChange("newest")}
          selected={filters.sortBy === "newest"}
        >
          Newest First
        </MenuItem>
        <MenuItem
          onClick={() => handleSortChange("points-low")}
          selected={filters.sortBy === "points-low"}
        >
          Points: Low to High
        </MenuItem>
        <MenuItem
          onClick={() => handleSortChange("points-high")}
          selected={filters.sortBy === "points-high"}
        >
          Points: High to Low
        </MenuItem>
        <MenuItem
          onClick={() => handleSortChange("popular")}
          selected={filters.sortBy === "popular"}
        >
          Most Popular
        </MenuItem>
        <MenuItem
          onClick={() => handleSortChange("rare")}
          selected={filters.sortBy === "rare"}
        >
          Rarest Books
        </MenuItem>
      </Menu>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <Box sx={{ mt: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Typography variant="caption" color="text.secondary" sx={{ alignSelf: "center" }}>
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
              onDelete={() => {
                const newFilters = { ...filters, availability: "all" };
                setFilters(newFilters);
                if (onFilterChange) onFilterChange(newFilters);
              }}
            />
          )}
          {filters.location && (
            <Chip
              label={`Location: ${filters.location}`}
              size="small"
              onDelete={() => {
                const newFilters = { ...filters, location: "" };
                setFilters(newFilters);
                if (onFilterChange) onFilterChange(newFilters);
              }}
            />
          )}
        </Box>
      )}
    </Box>
  );
};

export default BookSearch;