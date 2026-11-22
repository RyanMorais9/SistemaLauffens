import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Close from "@mui/icons-material/Close";

export default function MenuLateral({ perfil, aoSelecionar, paginaAtual, aberto, aoFechar }) {
    const opcoes = [
        { pagina: "projetos", titulo: "Projetos" },
        ...(perfil === "Administrador" ? [
            { pagina: "clientes", titulo: "Clientes" },
            { pagina: "funcionarios", titulo: "Funcionários" },
            { pagina: "manutencoes", titulo: "Manutenções" },
            { pagina: "notificacoes", titulo: "Notificações" },
            { pagina: "dashboard", titulo: "Dashboard" }
        ] : [])
    ];
    const conteudo = (
        <Box component="nav" aria-label="Menu principal" sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
            {opcoes.map(opcao => (
                <Button
                    key={opcao.pagina}
                    fullWidth
                    aria-current={paginaAtual === opcao.pagina ? "page" : undefined}
                    sx={{ color: "inherit", justifyContent: "flex-start", gap: 1.5, minHeight: 46, mb: 0.5, mt: opcao.pagina === "dashboard" ? "auto" : 0, bgcolor: paginaAtual === opcao.pagina ? "#333" : "transparent" }}
                    onClick={() => { aoSelecionar(opcao.pagina); aoFechar(); }}
                >
                    <Box component="img" src={`/icones/${opcao.pagina}.svg`} alt="" aria-hidden="true" sx={{ width: 20, height: 20, flexShrink: 0 }} />
                    {opcao.titulo}
                </Button>
            ))}
        </Box>
    );

    return (
        <>
            <Box component="aside" sx={{ display: { xs: "none", md: "flex" }, flexDirection: "column", width: 220, flexShrink: 0, position: "sticky", top: 64, alignSelf: "flex-start", height: "calc(100dvh - 64px)", overflowY: "auto", p: 2, bgcolor: "#111", color: "white" }}>
                <Typography sx={{ mb: 2 }}>Lauffens</Typography>
                {conteudo}
            </Box>
            <Drawer open={aberto} onClose={aoFechar} sx={{ display: { xs: "block", md: "none" } }} slotProps={{ paper: { sx: { width: 280, maxWidth: "calc(100vw - 48px)", bgcolor: "#111", color: "white", p: 2 } } }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Typography sx={{ flex: 1 }}>Lauffens</Typography>
                    <IconButton onClick={aoFechar} aria-label="Fechar menu" sx={{ color: "inherit" }}><Close /></IconButton>
                </Box>
                {conteudo}
            </Drawer>
        </>
    );
}
