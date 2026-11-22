import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

export default function Informacao({ titulo, children, destaque = false }) {
    return (
        <Box sx={{ minWidth: 0 }}>
            <Typography component="div" variant="caption" sx={{ color: "text.secondary", fontWeight: 600, mb: 0.5 }}>{titulo}</Typography>
            <Typography component="div" sx={{ color: "text.primary", fontWeight: destaque ? 650 : 500, fontSize: destaque ? "1.15rem" : "0.95rem", overflowWrap: "anywhere" }}>{children ?? "Não informado"}</Typography>
        </Box>
    );
}
