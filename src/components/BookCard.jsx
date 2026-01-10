import React from "react";
import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
  Chip,
  Avatar,
  Stack,
  Tooltip,
} from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import InfoIcon from "@mui/icons-material/Info";

const BookCard = ({ book, availableCount = 0, onClick = () => {} }) => {
  const {
    title = "Untitled",
    author = "Unknown",
    ownerName = "Unknown",
    ownerPhoto = "",
    condition = 5,
    location = "",
    pictures = [],
    description = "",
    totalReaders = 0,
    demandLevel = "medium", // low, medium, high
    rarity = "common", // common, rare
    status = "available", // available, pending, exchanged
    points = 0,
  } = book || {};

  const getConditionColor = (cond) => {
    if (!cond) return "default";
    if (typeof cond === "number") {
      if (cond >= 8) return "success";
      if (cond >= 5) return "info";
      if (cond >= 3) return "warning";
      return "error";
    }
    const colors = { mint: "success", good: "info", fair: "warning", poor: "error" };
    return colors[String(cond).toLowerCase()] || "default";
  };

  const getDemandColor = (level) => {
    const colors = { low: "default", medium: "warning", high: "error" };
    return colors[level] || "default";
  };

  return (
    <Card
      onClick={onClick}
      sx={{
        width: 280,
        borderRadius: 3,
        overflow: "hidden",
        position: "relative",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        cursor: "pointer",
        "&:hover": { transform: "translateY(-8px)", boxShadow: 8 },
        opacity: status === "available" ? 1 : 0.7,
      }}
    >
      {/* Image */}
      <Box sx={{ position: "relative" }}>
        <CardMedia
          component="img"
          height="360"
          image={pictures?.[0] || ""}
          alt={title}
          sx={{ objectFit: "cover" }}
        />

        {/* Status */}
        {status !== "available" && (
          <Chip
            label={status === "pending" ? "Pending" : "Exchanged"}
            color="warning"
            size="small"
            sx={{ position: "absolute", top: 12, left: 12, fontWeight: "bold" }}
          />
        )}

        {/* Rarity */}
        {rarity === "rare" && (
          <Chip
            label="Rare"
            color="secondary"
            size="small"
            sx={{ position: "absolute", top: 12, right: 12, fontWeight: "bold" }}
          />
        )}

        {/* Points */}
        <Box
          sx={{
            position: "absolute",
            bottom: 12,
            right: 12,
            bgcolor: "primary.main",
            color: "white",
            px: 2,
            py: 0.5,
            borderRadius: 2,
            fontWeight: "bold",
            textAlign: "center",
          }}
        >
          <Typography variant="h6" fontWeight="bold">
            {points}
          </Typography>
          <Typography variant="caption" sx={{ display: "block", lineHeight: 1 }}>
            points
          </Typography>
        </Box>
      </Box>

      {/* Content */}
      <CardContent sx={{ pb: 2 }}>
        <Tooltip title={title}>
          <Typography variant="h6" fontWeight={600} noWrap sx={{ mb: 0.5 }}>
            {title}
          </Typography>
        </Tooltip>

        {author && (
          <Typography variant="body2" color="text.secondary" noWrap sx={{ mb: 1.5 }}>
            by {author}
          </Typography>
        )}

        {/* Condition & Demand */}
        <Stack direction="row" spacing={1} sx={{ mb: 1.5, flexWrap: "wrap" }}>
          <Chip
            label={`Condition: ${condition}`}
            size="small"
            color={getConditionColor(condition)}
            sx={{ fontWeight: "medium", textTransform: "capitalize" }}
          />
          <Chip label={`Available: ${availableCount}`} size="small" variant="outlined" />
          {demandLevel === "high" && (
            <Chip
              icon={<TrendingUpIcon sx={{ fontSize: 16 }} />}
              label="High Demand"
              size="small"
              color={getDemandColor(demandLevel)}
              variant="outlined"
            />
          )}
        </Stack>

        {/* Total Readers */}
        {totalReaders > 0 && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1 }}>
            <AutoStoriesIcon sx={{ fontSize: 16, color: "text.secondary" }} />
            <Typography variant="caption" color="text.secondary">
              {totalReaders} reader{totalReaders !== 1 ? "s" : ""}
            </Typography>
          </Box>
        )}

        {/* Owner */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <Avatar sx={{ width: 24, height: 24 }} src={ownerPhoto}>
            {!ownerPhoto && <AccountCircleIcon sx={{ fontSize: 16 }} />}
          </Avatar>
          <Typography variant="caption" color="text.secondary" noWrap>
            {ownerName}
          </Typography>
        </Box>

        {/* Location */}
        {location && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <LocationOnIcon sx={{ fontSize: 16, color: "text.secondary" }} />
            <Typography variant="caption" color="text.secondary" noWrap>
              {location}
            </Typography>
          </Box>
        )}

        {/* Description Tooltip */}
        {description && (
          <Tooltip title={description}>
            <InfoIcon color="action" fontSize="small" sx={{ mt: 1 }} />
          </Tooltip>
        )}
      </CardContent>
    </Card>
  );
};

export default BookCard;
