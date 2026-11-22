import { useEffect, useState } from "react";
import api from "./api.js";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import AvisosDispositivo from "./AvisosDispositivo.jsx";

function formatarHorario(data) {
    return new Date(data).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

export default function Notificacoes({ token, usuarioId, aoLer, atualizacaoExterna = 0 }) {
    const [notificacoes, setNotificacoes] = useState([]);
    const [totalNaoLidas, setTotalNaoLidas] = useState(0);
    const [lida, setLida] = useState("");
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");
    const [marcando, setMarcando] = useState(false);
    const [atualizacao, setAtualizacao] = useState(0);

    useEffect(() => {
        let ativo = true;
        async function buscarNotificacoes() {
            setCarregando(true);
            setErro("");
            if (!Number.isSafeInteger(usuarioId) || usuarioId <= 0) {
                setErro("Entre novamente no sistema para carregar suas notificações");
                setCarregando(false);
                return;
            }
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const params = {};
                if (lida !== "") params.lida = lida;
                const [resLista, resContagem] = await Promise.all([
                    api.get(`/notificacoes/usuario/${usuarioId}`, { ...config, params }),
                    api.get(`/notificacoes/usuario/${usuarioId}/nao-lidas/contagem`, config)
                ]);
                if (ativo) {
                    setNotificacoes(resLista.data);
                    setTotalNaoLidas(resContagem.data.total);
                }
            } catch (error) {
                if (ativo) setErro(error.response?.data?.erro || "Não foi possível carregar as notificações");
            } finally {
                if (ativo) setCarregando(false);
            }
        }
        buscarNotificacoes();
        return () => { ativo = false; };
    }, [token, usuarioId, lida, atualizacao, atualizacaoExterna]);

    async function marcarComoLida(notificacaoId) {
        if (marcando || carregando) return;
        setMarcando(true);
        setErro("");
        try {
            await api.patch(`/notificacoes/usuario/${usuarioId}/${notificacaoId}/lida`, null, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAtualizacao(atual => atual + 1);
            aoLer?.();
        } catch (error) {
            setErro(error.response?.data?.erro || "Não foi possível marcar a notificação como lida");
        } finally {
            setMarcando(false);
        }
    }

    return (
        <Container>
            <Typography component="h1" variant="h5">Notificações</Typography>
            <AvisosDispositivo token={token} />
            <Box sx={{ display: "flex", gap: 2, my: 2, flexWrap: "wrap" }}>
                <TextField id="notificacoes-lida" select label="Situação" value={lida} onChange={event => setLida(event.target.value)} disabled={marcando} sx={{ minWidth: 160 }}>
                    <MenuItem value="">Todas</MenuItem>
                    <MenuItem value="false">Não lidas</MenuItem>
                    <MenuItem value="true">Lidas</MenuItem>
                </TextField>
                <Button onClick={() => setAtualizacao(atual => atual + 1)} disabled={carregando || marcando}>Atualizar</Button>
            </Box>
            {erro && <Alert severity="error">{erro}</Alert>}
            {carregando && <Typography>Carregando notificações...</Typography>}
            {!carregando && !erro && (
                <>
                    <Typography>Não lidas: {totalNaoLidas}</Typography>
                    {notificacoes.length === 0 && <Typography>Nenhuma notificação encontrada</Typography>}
                    {notificacoes.map(item => (
                        <Box key={item.notf_id} sx={{ p: 2, border: "1px solid #ddd" }}>
                            <Typography sx={{ fontWeight: item.lida_em ? "normal" : "bold" }}>{item.titulo}</Typography>
                            <Typography sx={{ whiteSpace: "pre-wrap" }}>{item.mensagem}</Typography>
                            <Typography>Recebida: {formatarHorario(item.criada_em)} (Brasília)</Typography>
                            {item.lida_em ? (
                                <Typography>Lida em: {formatarHorario(item.lida_em)} (Brasília)</Typography>
                            ) : (
                                <Button onClick={() => marcarComoLida(item.notf_id)} disabled={marcando}>Marcar como lida</Button>
                            )}
                        </Box>
                    ))}
                </>
            )}
        </Container>
    );
}
