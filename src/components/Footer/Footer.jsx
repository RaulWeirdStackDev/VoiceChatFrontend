import { Box, Typography, Link } from "@mui/material";

export const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        mt: 4,
        bgcolor: "primary.main",
        color: "primary.contrastText",
        textAlign: "center",
        boxShadow: "0 -2px 6px rgba(0,0,0,0.2)",
      }}
    >
      <Typography variant="body1">
        &copy; {new Date().getFullYear()} VoiceChat. 
                Creado por{" "}
        <Link href="https://raul-rodriguez-c.vercel.app/" target="_blank" rel="noopener" color="inherit" underline="hover">
          Raúl Rodríguez
        </Link>
      </Typography>

    </Box>
  );
};
