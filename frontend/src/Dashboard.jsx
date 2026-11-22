import { useEffect, useState } from "react";
import api from "./api.js";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import DetalhesProjeto from "./DetalhesProjeto.jsx";
import Informacao from "./Informacao.jsx";

function dataHoje() {
    const partes = new Intl.DateTimeFormat("en", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
    const valor = tipo => partes.find(parte => parte.type === tipo).value;
    return `${valor("year")}-${valor("month")}-${valor("day")}`;
}

function diasAntes(data, dias) {
    const resultado = new Date(`${data}T12:00:00Z`);
    resultado.setUTCDate(resultado.getUTCDate() - dias);
    return resultado.toISOString().slice(0, 10);
}

function formatarTempo(segundos) {
    const total = Math.round(Number(segundos) || 0);
    const horas = Math.floor(total / 3600);
    const minutos = Math.floor((total % 3600) / 60);
    const resto = total % 60;
    return `${horas}h ${String(minutos).padStart(2, "0")}min ${String(resto).padStart(2, "0")}s`;
}

export default function Dashboard({ token, perfil }) {
    const [periodo, setPeriodo] = useState("30dias");
    const [inicio, setInicio] = useState("");
    const [fim, setFim] = useState("");
    const [porte, setPorte] = useState("");
    const [ordem, setOrdem] = useState("desc");
    const [projetos, setProjetos] = useState([]);
    const [erro, setErro] = useState("");
    const [carregando, setCarregando] = useState(true);
    const [atualizacao, setAtualizacao] = useState(0);
    const [selecionado, setSelecionado] = useState(null);
    const hoje = dataHoje();
    const dataInicio = periodo === "personalizado" ? inicio : periodo === "hoje" ? hoje : periodo === "7dias" ? diasAntes(hoje, 6) : periodo === "30dias" ? diasAntes(hoje, 29) : periodo === "mes" ? `${hoje.slice(0, 7)}-01` : "";
    const dataFim = periodo === "personalizado" ? fim : periodo === "todos" ? "" : hoje;

    useEffect(() => {
        let ativo = true;
        async function buscarDados() {
            setCarregando(true);
            setErro("");
            if (periodo === "personalizado" && (!dataInicio || !dataFim || dataInicio > dataFim)) {
                setProjetos([]);
                setErro("Informe um período com a data final igual ou posterior à inicial");
                setCarregando(false);
                return;
            }
            try {
                const params = {};
                if (dataInicio) params.data_inicio = dataInicio;
                if (dataFim) params.data_fim = dataFim;
                if (porte) params.porte = porte;
                const response = await api.get("/projetos", { headers: { Authorization: `Bearer ${token}` }, params });
                if (ativo) setProjetos(response.data);
            } catch (error) {
                if (ativo) setErro(error.response?.data?.erro || "Não foi possível carregar o dashboard");
            } finally {
                if (ativo) setCarregando(false);
            }
        }
        buscarDados();
        return () => { ativo = false; };
    }, [token, periodo, dataInicio, dataFim, porte, atualizacao]);

    const produtivos = projetos.filter(projeto => Number(projeto.tempo_periodo_segundos) > 0);
    const registros = produtivos.flatMap(projeto => projeto.etapas
        .filter(etapa => Number(etapa.tempo_periodo_segundos) > 0)
        .map(etapa => ({ projeto, etapa, segundos: Number(etapa.tempo_periodo_segundos) })))
        .sort((a, b) => (ordem === "asc" ? a.segundos - b.segundos : b.segundos - a.segundos) || a.projeto.proj_id - b.projeto.proj_id || a.etapa.etapa_id - b.etapa.etapa_id);
    const total = produtivos.reduce((soma, projeto) => soma + Number(projeto.tempo_periodo_segundos), 0);
    const porEtapa = ["Corte", "Fitagem", "Refinamento", "Embalamento"].map(tipo => ({
        nome: tipo,
        segundos: registros.filter(item => item.etapa.tipo === tipo).reduce((soma, item) => soma + item.segundos, 0)
    }));
    const maiorEtapa = Math.max(1, ...porEtapa.map(item => item.segundos));
    const ranking = [...produtivos].sort((a, b) => Number(b.tempo_periodo_segundos) - Number(a.tempo_periodo_segundos) || a.proj_id - b.proj_id).slice(0, 5);
    const maiorProjeto = Math.max(1, ...ranking.map(item => Number(item.tempo_periodo_segundos)));

    function voltarAoDashboard() {
        setSelecionado(null);
        setAtualizacao(atual => atual + 1);
    }

    if (selecionado) return <DetalhesProjeto projeto={selecionado} token={token} perfil={perfil} aoVoltar={voltarAoDashboard} />;

    return (
        <Container>
            <Typography component="h1" variant="h5">Dashboard de produção</Typography>
            <Typography>Tempos de execução das etapas dentro do período selecionado.</Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" }, gap: 2, my: 2 }}>
                <TextField id="dashboard-periodo" select label="Período" value={periodo} onChange={event => setPeriodo(event.target.value)}>
                    <MenuItem value="hoje">Hoje</MenuItem>
                    <MenuItem value="7dias">Últimos 7 dias</MenuItem>
                    <MenuItem value="30dias">Últimos 30 dias</MenuItem>
                    <MenuItem value="mes">Mês atual</MenuItem>
                    <MenuItem value="todos">Todo o histórico</MenuItem>
                    <MenuItem value="personalizado">Personalizado</MenuItem>
                </TextField>
                <TextField id="dashboard-porte" select label="Porte" value={porte} onChange={event => setPorte(event.target.value)}>
                    <MenuItem value="">Todos</MenuItem>
                    {["Pequeno", "Médio", "Grande"].map(item => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                </TextField>
                <TextField id="dashboard-ordem" select label="Tempo das etapas" value={ordem} onChange={event => setOrdem(event.target.value)}>
                    <MenuItem value="desc">Maior tempo primeiro</MenuItem>
                    <MenuItem value="asc">Menor tempo primeiro</MenuItem>
                </TextField>
                <Button onClick={() => setAtualizacao(atual => atual + 1)} disabled={carregando}>Atualizar dashboard</Button>
                {periodo === "personalizado" && (
                    <>
                        <TextField id="dashboard-inicio" type="date" label="Data inicial" value={inicio} onChange={event => setInicio(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
                        <TextField id="dashboard-fim" type="date" label="Data final" value={fim} onChange={event => setFim(event.target.value)} slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: inicio || undefined } }} />
                    </>
                )}
            </Box>
            {erro && <Alert severity="error">{erro}</Alert>}
            {carregando && <Typography>Carregando dashboard...</Typography>}
            {!carregando && !erro && (
                <>
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" }, gap: 2, mb: 2 }}>
                        {[['Projetos com execução', produtivos.length], ['Etapas com execução', registros.length], ['Tempo no período', formatarTempo(total)]].map(([titulo, valor]) => (
                            <Box key={titulo} sx={{ border: "1px solid #ddd", p: 2 }}>
                                <Typography>{titulo}</Typography>
                                <Typography variant="h6">{valor}</Typography>
                            </Box>
                        ))}
                    </Box>
                    {registros.length === 0 ? <Typography>Nenhuma execução encontrada neste período e porte</Typography> : (
                        <>
                            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" }, gap: 2, mb: 2 }}>
                                <Box sx={{ p: 3, border: "1px solid", borderColor: "divider", borderRadius: 3, bgcolor: "background.paper" }}>
                                    <Typography component="h2" variant="h6">Tempo por etapa</Typography>
                                    {porEtapa.map(item => (
                                        <Box key={item.nome} sx={{ my: 2 }}>
                                            <Typography>{item.nome}: {formatarTempo(item.segundos)}</Typography>
                                            <Box aria-hidden="true" sx={{ height: 10, bgcolor: "#eee", mt: 0.5 }}>
                                                <Box sx={{ height: "100%", bgcolor: "#333", width: `${item.segundos / maiorEtapa * 100}%` }} />
                                            </Box>
                                        </Box>
                                    ))}
                                </Box>
                                <Box sx={{ p: 3, border: "1px solid", borderColor: "divider", borderRadius: 3, bgcolor: "background.paper" }}>
                                    <Typography component="h2" variant="h6">Projetos com mais tempo</Typography>
                                    {ranking.map(projeto => (
                                        <Box key={projeto.proj_id} sx={{ my: 1 }}>
                                            <Button onClick={() => setSelecionado(projeto)} sx={{ textTransform: "none", color: "inherit", p: 0 }}>{projeto.nome}</Button>
                                            <Typography>{formatarTempo(projeto.tempo_periodo_segundos)}</Typography>
                                            <Box aria-hidden="true" sx={{ height: 10, bgcolor: "#eee", mt: 0.5 }}>
                                                <Box sx={{ height: "100%", bgcolor: "#555", width: `${Number(projeto.tempo_periodo_segundos) / maiorProjeto * 100}%` }} />
                                            </Box>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                            <Typography component="h2" variant="h6">Registros por etapa</Typography>
                            <Box sx={{ mt: 2, border: "1px solid", borderColor: "divider", borderRadius: 3, bgcolor: "background.paper", overflow: "hidden" }}>
                                {registros.map(item => (
                                    <Box key={item.etapa.etapa_id} data-registro-etapa sx={{ p: 2.5, borderBottom: "1px solid", borderColor: "divider", display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "2fr 1.5fr 1fr 1fr 1.5fr" }, gap: 2 }}>
                                        <Informacao titulo="Projeto"><Button onClick={() => setSelecionado(item.projeto)} sx={{ color: "inherit", p: 0, minHeight: 0, textAlign: "left", justifyContent: "flex-start" }}>{item.projeto.nome}</Button></Informacao>
                                        <Informacao titulo="Cliente">{item.projeto.cliente?.nome || "Não informado"}</Informacao>
                                        <Informacao titulo="Porte">{item.projeto.porte}</Informacao>
                                        <Informacao titulo="Etapa">{item.etapa.tipo}</Informacao>
                                        <Informacao titulo="Tempo no período">{formatarTempo(item.segundos)}</Informacao>
                                    </Box>
                                ))}
                            </Box>
                        </>
                    )}
                </>
            )}
        </Container>
    );
}
