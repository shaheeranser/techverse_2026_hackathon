import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
} from "@mui/material";

const BookCard = ({
  image,
  title,
  owner,
  condition,
}) => {
  return (
    <Card
      sx={{
        width: 240,
        borderRadius: 3,
        overflow: "hidden",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: 6,
        },
      }}
    >
      {/* Book Image */}
      <CardMedia
        component="img"
        height="320"
        image={image}
        alt={title}
        sx={{
          objectFit: "cover",
        }}
      />

      <CardContent>
        <Typography
          variant="subtitle1"
          fontWeight={600}
          noWrap
        >
          {title}
        </Typography>

        <Box sx={{ mt: 1 }}>
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Owner: {owner}
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
          >
            Condition: {condition}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  )
}

export default BookCard