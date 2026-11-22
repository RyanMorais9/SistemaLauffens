import { useEffect, useState } from "react";
import api from "./api.js";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import Informacao from "./Informacao.jsx";

export default function Manutencoes({ token }) {
    const [manutencoes, setManutencoes] = useState([]);
    const [projetos, setProjetos] = useState([]);
    const [status, setStatus] = useState("");
    const [projetoId, setProjetoId] = useState("");
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");
    const [atualizacao, setAtualizacao] = useState(0);

    useEffect(() => {
        let ativo = true;
        async function buscarManutencoes() {
            setCarregando(true);
            setErro("");
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const params = {};
                if (status) params.status = status;
                if (projetoId !== "") params.proj_id = projetoId;
                const [resManutencoes, resProjetos] = await Promise.all([
                    api.get("/manutencoes", { ...config, params }),
                    api.get("/projetos", config)
                ]);
                if (ativo) {
                    setManutencoes(resManutencoes.data);
                    setProjetos(resProjetos.data);
                }
            } catch (error) {
                if (ativo) setErro(error.response?.data?.erro || "Não foi possível listar as manutenções");
            } finally {
                if (ativo) setCarregando(false);
            }
        }
        buscarManutencoes();
        return () => { ativo = false; };
    }, [token, status, projetoId, atualizacao]);

    return (
        <Container>
            <Typography component="h1" variant="h5">Manutenções</Typography>
            <Box sx={{ display: "flex", gap: 2, my: 2, flexWrap: "wrap" }}>
                <TextField id="manutencoes-status" select label="Status" value={status} onChange={event => setStatus(event.target.value)} sx={{ minWidth: 160 }}>
                    <MenuItem value="">Todos</MenuItem>
                    <MenuItem value="Aberta">Aberta</MenuItem>
                    <MenuItem value="Resolvida">Resolvida</MenuItem>
                </TextField>
                <TextField id="manutencoes-projeto" select label="Projeto" value={projetoId} onChange={event => setProjetoId(event.target.value)} sx={{ minWidth: 220 }}>
                    <MenuItem value="">Todos</MenuItem>
                    {projetos.map(item => <MenuItem key={item.proj_id} value={item.proj_id}>{item.nome}</MenuItem>)}
                </TextField>
                <Button onClick={() => setAtualizacao(atual => atual + 1)} disabled={carregando}>Atualizar</Button>
            </Box>
            {erro && <Alert severity="error">{erro}</Alert>}
            {carregando && <Typography>Carregando manutenções...</Typography>}
            {!carregando && !erro && (
                <>
                    <Typography>Manutenções encontradas: {manutencoes.length}</Typography>
                    {manutencoes.length === 0 && <Typography>Nenhuma manutenção encontrada</Typography>}
                    {manutencoes.map(item => (
                        <Box key={item.mntnc_id} sx={{ p: { xs: 2, sm: 3 }, mb: 2, border: "1px solid", borderColor: "divider", borderRadius: 3, bgcolor: "background.paper" }}>
                            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "2fr 1fr 1fr 1fr" }, gap: 3 }}>
                                <Informacao titulo="Projeto" destaque>{projetos.find(projeto => projeto.proj_id === item.proj_id)?.nome || "Não informado"}</Informacao>
                                <Informacao titulo="Status">{item.status}</Informacao>
                                <Informacao titulo="Data de retorno">{item.data_retorno.split("-").reverse().join("/")}</Informacao>
                                <Informacao titulo="Motivo">{item.motivo}</Informacao>
                            </Box>
                            <Box sx={{ mt: 3, pt: 2, borderTop: "1px solid", borderColor: "divider", whiteSpace: "pre-wrap" }}><Informacao titulo="Descrição">{item.descricao}</Informacao></Box>
                            {item.data_conclusao && <Box sx={{ mt: 2 }}><Informacao titulo="Conclusão">{item.data_conclusao.split("-").reverse().join("/")}</Informacao></Box>}
                        </Box>
                    ))}
                </>
            )}
        </Container>
    );
}
