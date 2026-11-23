import Box from "@mui/material/Box";

export default function FundoFolha({ discreto = false }) {
    return (
        <Box aria-hidden="true" sx={{ position: "fixed", inset: 0, overflow: "hidden", zIndex: -1, pointerEvents: "none" }}>
            <Box
                component="img"
                src="/Logotipo de Folha Cinza Minimalista.png"
                alt=""
                aria-hidden="true"
                width={1536}
                height={1024}
                sx={{
                    position: "absolute",
                    pointerEvents: "none",
                    userSelect: "none",
                    width: { xs: "min(150vw, 680px)", md: "min(88vw, 1350px)" },
                    height: "auto",
                    maxWidth: "none",
                    aspectRatio: "3 / 2",
                    objectFit: "contain",
                    left: { xs: "68%", md: "76%" },
                    top: { xs: "30%", md: "40%" },
                    transform: "translate(-50%, -50%) rotate(90deg)",
                    opacity: discreto ? 0.2 : 0.9
                }}
            />
        </Box>
    );
}
