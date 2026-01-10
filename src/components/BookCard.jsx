import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
  Avatar,
  Stack,
} from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

const BookCard = ({
  image,
  title,
  author,
  owner,
  condition,
  points,
  location,
  isWishlisted = false,
  totalReaders = 0,
  demandLevel = "medium", // low, medium, high
  rarity = "common", // common, rare
  status = "available", // available, pending, exchanged
  onToggleWishlist,
  onClick,
}) => {
  const getConditionColor = (condition) => {
    const colors = {
      mint: "success",
      good: "info",
      fair: "warning",
      poor: "error",
    };
    return colors[condition?.toLowerCase()] || "default";
  };

  const getDemandColor = (level) => {
    const colors = {
      low: "default",
      medium: "warning",
      high: "error",
    };
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
        "&:hover": {
          transform: "translateY(-8px)",
          boxShadow: 8,
        },
        opacity: status === "available" ? 1 : 0.7,
      }}
    >
      {/* Book Image with Overlay */}
      <Box sx={{ position: "relative" }}>
        <CardMedia
          component="img"
          height="360"
          image={image}
          alt={title}
          sx={{
            objectFit: "cover",
          }}
        />

        {/* Status Badge */}
        {status !== "available" && (
          <Chip
            label={status === "pending" ? "Pending" : "Exchanged"}
            color="warning"
            size="small"
            sx={{
              position: "absolute",
              top: 12,
              left: 12,
              fontWeight: "bold",
            }}
          />
        )}

        {/* Rarity Badge */}
        {rarity === "rare" && (
          <Chip
            label="Rare"
            color="secondary"
            size="small"
            sx={{
              position: "absolute",
              top: 12,
              right: 52,
              fontWeight: "bold",
            }}
          />
        )}

        {/* Wishlist Button */}
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            if (onToggleWishlist) onToggleWishlist();
          }}
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            bgcolor: "rgba(255, 255, 255, 0.9)",
            "&:hover": {
              bgcolor: "rgba(255, 255, 255, 1)",
            },
          }}
          size="small"
        >
          {isWishlisted ? (
            <FavoriteIcon color="error" fontSize="small" />
          ) : (
            <FavoriteBorderIcon fontSize="small" />
          )}
        </IconButton>

        {/* Points Badge */}
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

      <CardContent sx={{ pb: 2 }}>
        {/* Title and Author */}
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

        {/* Condition & Demand Chips */}
        <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
          <Chip
            label={condition}
            size="small"
            color={getConditionColor(condition)}
            sx={{ fontWeight: "medium", textTransform: "capitalize" }}
          />
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

        {/* Reading History */}
        {totalReaders > 0 && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1 }}>
            <AutoStoriesIcon sx={{ fontSize: 16, color: "text.secondary" }} />
            <Typography variant="caption" color="text.secondary">
              {totalReaders} reader{totalReaders !== 1 ? "s" : ""}
            </Typography>
          </Box>
        )}

        {/* Owner Info */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <Avatar sx={{ width: 24, height: 24, bgcolor: "primary.light" }}>
            <AccountCircleIcon sx={{ fontSize: 16 }} />
          </Avatar>
          <Typography variant="caption" color="text.secondary" noWrap>
            {owner}
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
      </CardContent>
    </Card>
  );
};

export default BookCard;