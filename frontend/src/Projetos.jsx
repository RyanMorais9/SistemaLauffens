import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import { useEffect, useState } from "react";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import api from "./api.js";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import DetalhesProjeto from "./DetalhesProjeto";
import FormularioProjeto from "./FormularioProjeto.jsx";
import Informacao from "./Informacao.jsx";

export default function Projetos({ token, perfil }) {
    const [projetos, setProjetos] = useState([]);
    const [erro, setErro] = useState("");
    const [carregando, setCarregando] = useState(false);
    const [filtroStatus, setFiltroStatus] = useState("");
    const [filtroPorte, setFiltroPorte] = useState("");
    const [ordemTempo, setOrdemTempo] = useState("");
    const [projetoSelecionado, setProjetoSelecionado] = useState(null);
    const [atualizacaoLista, setAtualizacaoLista] = useState(0);
    const [formularioAberto, setFormularioAberto] = useState(false);
    const [salvandoFormulario, setSalvandoFormulario] = useState(false);
    const [projetoEmEdicao, setProjetoEmEdicao] = useState(null);
    const [sucesso, setSucesso] = useState("");

    function abrirFormulario(projeto = null) {
        setProjetoEmEdicao(projeto);
        setSucesso("");
        setFormularioAberto(true);
    }

    function projetoSalvo() {
        setSucesso(projetoEmEdicao ? "Projeto atualizado com sucesso" : "Projeto cadastrado com sucesso");
        setFormularioAberto(false);
        setProjetoEmEdicao(null);
        setAtualizacaoLista(atual => atual + 1);
    }
 
    useEffect(() => {
        async function buscarProjetos() {
            setErro("");
            setCarregando(true);
            try {
                const params = {};
                if (filtroStatus !== "") {
                    params.status = filtroStatus;
                }
                if (filtroPorte !== "") {
                    params.porte = filtroPorte;
                }
                if (ordemTempo !== "") {
                    params.ordenar_por = "tempo";
                    params.ordem = ordemTempo;
                }
                const response = await api.get("/projetos", { headers: { Authorization: `Bearer ${token}` }, params: params })
                setProjetos(response.data);
            } catch (error) {
                setErro(error.response?.data?.erro || "Não é possivel listar projetos no momento")
            } finally {
                setCarregando(false);
            }
        }
        buscarProjetos();
    }, [token, filtroStatus, filtroPorte, ordemTempo, atualizacaoLista])

    async function voltarParaLista() {
        setProjetoSelecionado(null);
        setAtualizacaoLista(atual => atual + 1);
    }


    if (formularioAberto && projetoEmEdicao && perfil === "Administrador") {
        return (
            <FormularioProjeto
                token={token}
                projeto={projetoEmEdicao}
                aoSalvar={projetoSalvo}
                aoCancelar={() => {
                    setFormularioAberto(false);
                    setProjetoEmEdicao(null);
                }}
            />
        );
    }

    if (projetoSelecionado) {
        return (<DetalhesProjeto
            projeto={projetoSelecionado}
            aoVoltar={voltarParaLista}
            token={token}
            perfil={perfil}>
        </DetalhesProjeto>)
    }

    return (
        <Container>
            <Typography component="h1" variant="h5">Projetos</Typography>
            {perfil === "Administrador" && (
                <Button variant="contained" onClick={() => abrirFormulario()} disabled={carregando}>Cadastrar projeto</Button>
            )}
            {sucesso && <Alert severity="success">{sucesso}</Alert>}
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" }, gap: 2, my: 2 }}>
                <TextField
                    select
                    label="Status"
                    value={filtroStatus}
                    onChange={(event) => setFiltroStatus(event.target.value)}>
                    <MenuItem value="">Todos</MenuItem>
                    <MenuItem value="Planejado">Planejado</MenuItem>
                    <MenuItem value="Em andamento">Em andamento</MenuItem>
                    <MenuItem value="Atrasado">Atrasado</MenuItem>
                    <MenuItem value="Cancelado">Cancelado</MenuItem>
                    <MenuItem value="Concluído">Concluído</MenuItem>
                </TextField>
                <TextField
                    select
                    label="Porte"
                    value={filtroPorte}
                    onChange={(event) => setFiltroPorte(event.target.value)}>
                    <MenuItem value="">Todos</MenuItem>
                    <MenuItem value="Pequeno">Pequeno</MenuItem>
                    <MenuItem value="Médio">Médio</MenuItem>
                    <MenuItem value="Grande">Grande</MenuItem>
                </TextField>
                <TextField
                    select
                    label="Ordenar por tempo"
                    value={ordemTempo}
                    onChange={(event) => setOrdemTempo(event.target.value)}>
                    <MenuItem value="">Padrão</MenuItem>
                    <MenuItem value="asc">Menor tempo primeiro</MenuItem>
                    <MenuItem value="desc">Maior tempo primeiro</MenuItem>
                </TextField>
            </Box>
            {carregando && (
                <Typography>Carregando projetos...</Typography>
            )}
            {!carregando && !erro && (
                <>
                    <Typography>
                        Projetos
                        encontrados: {projetos.length}
                    </Typography>
                    {projetos.length === 0 && (
                        <Typography>Nenhum projeto encontrado</Typography>
                    )}
                    {projetos.map((projeto) => (
                        <Box key={projeto.proj_id} sx={{ p: { xs: 2, sm: 3 }, mb: 2, border: "1px solid", borderColor: "divider", borderRadius: 3, bgcolor: "background.paper" }}>
                            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "2fr 2fr 1fr 1fr" }, gap: 3 }}>
                                <Informacao titulo="Projeto" destaque>{projeto.nome}</Informacao>
                                <Informacao titulo="Cliente">{projeto.cliente?.nome}</Informacao>
                                <Informacao titulo="Porte">{projeto.porte}</Informacao>
                                <Informacao titulo="Status">{projeto.status}</Informacao>
                                <Informacao titulo="Etapa atual">{projeto.etapa_atual?.tipo || "Nenhuma etapa em execução"}</Informacao>
                                <Informacao titulo="Tempo registrado">{projeto.tempo_total_minutos} min</Informacao>
                            </Box>
                            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 2, pt: 2, borderTop: "1px solid", borderColor: "divider", flexWrap: "wrap" }}>
                                {perfil === "Administrador" && !["Concluído", "Cancelado"].includes(projeto.status) && (
                                    <Button variant="outlined" onClick={() => abrirFormulario(projeto)}>Editar projeto</Button>
                                )}
                                <Button variant="contained" onClick={() => setProjetoSelecionado(projeto)}>Ver detalhes</Button>
                            </Box>
                        </Box>
                    ))}
                </>
            )}
            {erro && (
                <Alert severity="error">{erro}</Alert>
            )}
            <Dialog open={formularioAberto && !projetoEmEdicao && perfil === "Administrador"} onClose={() => { if (!salvandoFormulario) setFormularioAberto(false); }} aria-labelledby="titulo-formulario-projeto" fullWidth maxWidth="sm">
                <DialogContent>
                    {formularioAberto && !projetoEmEdicao && (
                        <FormularioProjeto token={token} aoSalvar={projetoSalvo} aoCancelar={() => setFormularioAberto(false)} aoOcupar={setSalvandoFormulario} />
                    )}
                </DialogContent>
            </Dialog>
        </Container>
    )
}

