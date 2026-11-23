import Box from "@mui/material/Box";

export default function FundoFolha({ discreto = false, originalDesktop = false }) {
    return (
        <Box aria-hidden="true" sx={{ position: "fixed", inset: 0, overflow: "hidden", zIndex: -1, pointerEvents: "none" }}>
            {originalDesktop && (
                <Box sx={{
                    display: { xs: "none", md: "block" },
                    position: "absolute",
                    inset: "-20%",
                    backgroundImage: 'url("/Logotipo de Folha Cinza Minimalista.png")',
                    backgroundSize: "cover",
                    backgroundPosition: "right",
                    backgroundRepeat: "no-repeat",
                    transform: "translateX(25%) translateY(5%) rotate(90deg) scale(1.2)"
                }} />
            )}
            <Box
                component="img"
                src="/Logotipo de Folha Cinza Minimalista.png"
                alt=""
                aria-hidden="true"
                width={1536}
                height={1024}
                sx={{
                    display: { xs: "block", md: originalDesktop ? "none" : "block" },
                    position: "absolute",
                    pointerEvents: "none",
                    userSelect: "none",
                    width: { xs: originalDesktop ? "max(260vw, 105dvh)" : "min(150vw, 680px)", md: "min(88vw, 1350px)" },
                    height: "auto",
                    maxWidth: "none",
                    aspectRatio: "3 / 2",
                    objectFit: "contain",
                    left: { xs: originalDesktop ? "88%" : "68%", md: "76%" },
                    top: { xs: originalDesktop ? "68%" : "30%", md: "40%" },
                    transform: "translate(-50%, -50%) rotate(90deg)",
                    opacity: discreto ? 0.2 : 0.9
                }}
            />
        </Box>
    );
}
