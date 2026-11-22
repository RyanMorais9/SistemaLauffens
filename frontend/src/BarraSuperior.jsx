import { useEffect, useRef, useState } from "react";
import api from "./api.js";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Popover from "@mui/material/Popover";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import NotificationsOutlined from "@mui/icons-material/NotificationsOutlined";
import MenuIcon from "@mui/icons-material/Menu";

export default function BarraSuperior({ token, perfil, usuarioId, nome, aoSelecionar, aoSair, atualizacaoNotificacoes, aoLer, aoAbrirMenu }) {
    const [menuConta, setMenuConta] = useState(null);
    const [menuAvisos, setMenuAvisos] = useState(null);
    const [total, setTotal] = useState(0);
    const [avisos, setAvisos] = useState([]);
    const [erro, setErro] = useState("");
    const [carregando, setCarregando] = useState(false);
    const [marcando, setMarcando] = useState(false);
    const [atualizacao, setAtualizacao] = useState(0);
    const tituloAvisos = useRef(null);
    const administrador = perfil === "Administrador";
    const idValido = Number.isSafeInteger(usuarioId) && usuarioId > 0;
    const iniciais = (nome || "Usuário").trim().split(/\s+/).slice(0, 2).map(parte => parte[0]).join("").toLocaleUpperCase("pt-BR");

    useEffect(() => {
        if (!administrador || !idValido) return;
        let ativo = true;
        async function buscarContagem() {
            try {
                const response = await api.get(`/notificacoes/usuario/${usuarioId}/nao-lidas/contagem`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (ativo) setTotal(response.data.total);
            } catch {
                if (ativo) setTotal(0);
            }
        }
        buscarContagem();
        const intervalo = setInterval(buscarContagem, 30000);
        return () => { ativo = false; clearInterval(intervalo); };
    }, [token, administrador, idValido, usuarioId, atualizacaoNotificacoes]);

    useEffect(() => {
        if (!menuAvisos || !administrador || !idValido) return;
        let ativo = true;
        async function buscarAvisos() {
            setCarregando(true);
            setErro("");
            try {
                const response = await api.get(`/notificacoes/usuario/${usuarioId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (ativo) setAvisos(response.data.slice(0, 5));
            } catch (error) {
                if (ativo) setErro(error.response?.data?.erro || "Não foi possível carregar as notificações");
            } finally {
                if (ativo) setCarregando(false);
            }
        }
        buscarAvisos();
        return () => { ativo = false; };
    }, [token, usuarioId, administrador, idValido, menuAvisos, atualizacao]);

    async function marcarComoLida(notificacaoId) {
        if (marcando) return;
        setMarcando(true);
        setErro("");
        try {
            await api.patch(`/notificacoes/usuario/${usuarioId}/${notificacaoId}/lida`, null, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAtualizacao(atual => atual + 1);
            aoLer();
            tituloAvisos.current?.focus();
        } catch (error) {
            setErro(error.response?.data?.erro || "Não foi possível marcar a notificação como lida");
        } finally {
            setMarcando(false);
        }
    }

    return (
        <AppBar position="sticky" color="inherit" elevation={0} sx={{ top: 0, zIndex: tema => tema.zIndex.appBar, borderBottom: "1px solid #ddd" }}>
            <Toolbar sx={{ minHeight: "64px !important", gap: 1 }}>
                <IconButton aria-label="Abrir menu de navegação" onClick={aoAbrirMenu} sx={{ display: { xs: "inline-flex", md: "none" } }}><MenuIcon /></IconButton>
                <Typography sx={{ flex: 1, fontWeight: "bold", fontSize: { xs: 14, sm: 16 } }}>Sistema Lauffens</Typography>
                <IconButton aria-label={`Notificações${administrador && total ? `: ${total} não lidas` : ""}`} aria-haspopup="dialog" aria-expanded={Boolean(menuAvisos)} onClick={event => setMenuAvisos(event.currentTarget)}>
                    <Badge badgeContent={administrador ? total : 0} color="error"><NotificationsOutlined /></Badge>
                </IconButton>
                <IconButton aria-label="Abrir menu da conta" aria-haspopup="menu" aria-controls={menuConta ? "menu-conta" : undefined} aria-expanded={Boolean(menuConta)} onClick={event => setMenuConta(event.currentTarget)}>
                    <Avatar sx={{ width: 36, height: 36, bgcolor: "#111", fontSize: 14 }}>{iniciais}</Avatar>
                </IconButton>
                <Menu id="menu-conta" anchorEl={menuConta} open={Boolean(menuConta)} onClose={() => setMenuConta(null)}>
                    <MenuItem disabled>{nome || "Minha conta"}</MenuItem>
                    <MenuItem onClick={() => { setMenuConta(null); aoSelecionar("perfil"); }}>Editar meu perfil</MenuItem>
                    <MenuItem onClick={() => { setMenuConta(null); aoSair(); }}>Sair</MenuItem>
                </Menu>
                <Popover
                    anchorEl={menuAvisos}
                    open={Boolean(menuAvisos)}
                    onClose={() => { if (!marcando) setMenuAvisos(null); }}
                    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                    transformOrigin={{ vertical: "top", horizontal: "right" }}
                    slotProps={{ paper: { role: "dialog", "aria-labelledby": "titulo-avisos-topo", sx: { width: 380, maxWidth: "calc(100vw - 32px)", maxHeight: "70vh", p: 2 } } }}
                >
                    <Typography id="titulo-avisos-topo" component="h2" variant="h6" ref={tituloAvisos} tabIndex={-1}>Notificações</Typography>
                    {!administrador ? (
                        <Typography>Os avisos de produção são destinados aos administradores.</Typography>
                    ) : !idValido ? (
                        <Alert severity="info">Entre novamente para carregar as notificações.</Alert>
                    ) : (
                        <>
                            {carregando && <Typography>Carregando notificações...</Typography>}
                            {erro && <Alert severity="error">{erro}</Alert>}
                            {!carregando && !erro && avisos.length === 0 && <Typography>Nenhuma notificação encontrada</Typography>}
                            {!carregando && !erro && avisos.map(aviso => (
                                <Box key={aviso.notf_id} sx={{ py: 1, borderBottom: "1px solid #ddd" }}>
                                    <Typography sx={{ fontWeight: aviso.lida_em ? "normal" : "bold" }}>{aviso.titulo}</Typography>
                                    <Typography sx={{ whiteSpace: "pre-wrap" }}>{aviso.mensagem}</Typography>
                                    <Typography variant="caption">{new Date(aviso.criada_em).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} (Brasília)</Typography>
                                    {!aviso.lida_em && <Button onClick={() => marcarComoLida(aviso.notf_id)} disabled={marcando}>Marcar como lida</Button>}
                                </Box>
                            ))}
                            <Button onClick={() => { setMenuAvisos(null); aoSelecionar("notificacoes"); }} disabled={marcando}>Ver todas as notificações</Button>
                        </>
                    )}
                    <Button onClick={() => setMenuAvisos(null)} disabled={marcando}>Fechar notificações</Button>
                </Popover>
            </Toolbar>
        </AppBar>
    );
}
