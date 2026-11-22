import { useEffect, useState } from "react";
import api from "./api.js";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";

export default function FuncionariosProjeto({ projeto, token, ocupado, aoOcupar, aoVincular }) {
    const [aberto, setAberto] = useState(false);
    const [usuarios, setUsuarios] = useState([]);
    const [vinculos, setVinculos] = useState([]);
    const [selecionados, setSelecionados] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState("");
    const [atualizacao, setAtualizacao] = useState(0);
    const [consultaValida, setConsultaValida] = useState(false);
    const equipeBloqueada = Boolean(projeto.data_inicio || projeto.data_fim || ["Concluído", "Cancelado"].includes(projeto.status));
    const idsVinculados = vinculos.map(vinculo => vinculo.usuario_id);
    const funcionarios = usuarios.filter(usuario =>
        (usuario.ativo && usuario.perfil === "Marceneiro") || idsVinculados.includes(usuario.usuario_id)
    );
    const bloqueado = carregando || salvando || ocupado || equipeBloqueada || !consultaValida;

    useEffect(() => {
        if (!aberto) return;
        let ativo = true;
        async function buscarEquipe() {
            setCarregando(true);
            setConsultaValida(false);
            setErro("");
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const [resUsuarios, resVinculos] = await Promise.all([
                    api.get("/usuarios", config),
                    api.get(`/projetos-usuarios/projeto/${projeto.proj_id}`, config)
                ]);
                if (ativo) {
                    setUsuarios(resUsuarios.data);
                    setVinculos(resVinculos.data);
                    setSelecionados([]);
                    setConsultaValida(true);
                }
            } catch (error) {
                if (ativo) setErro(error.response?.data?.erro || "Não foi possível carregar os funcionários do projeto");
            } finally {
                if (ativo) setCarregando(false);
            }
        }
        buscarEquipe();
        return () => { ativo = false; };
    }, [token, projeto.proj_id, atualizacao, aberto]);

    function selecionarFuncionario(usuarioId, marcado) {
        setSucesso("");
        setSelecionados(atuais => marcado ? [...atuais, usuarioId] : atuais.filter(id => id !== usuarioId));
    }

    async function vincularSelecionados() {
        if (bloqueado || selecionados.length === 0) return;
        setErro("");
        setSucesso("");
        setSalvando(true);
        aoOcupar(true);
        let vinculadosAgora = 0;
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            for (const usuarioId of selecionados) {
                const response = await api.post("/projetos-usuarios", {
                    proj_id: projeto.proj_id,
                    usuario_id: usuarioId
                }, config);
                setVinculos(atuais => [...atuais, response.data]);
                setSelecionados(atuais => atuais.filter(id => id !== usuarioId));
                vinculadosAgora++;
            }
            setSucesso("Funcionários selecionados vinculados com sucesso");
        } catch (error) {
            const mensagem = error.response?.data?.erro || "Não foi possível vincular os funcionários";
            setErro(`${vinculadosAgora > 0 ? `${vinculadosAgora} funcionário(s) já vinculado(s). ` : ""}${mensagem}`);
        } finally {
            setSalvando(false);
            aoOcupar(false);
            if (vinculadosAgora > 0) aoVincular?.();
        }
    }

    return (
        <Box>
            <Button
                variant="outlined"
                onClick={() => {
                    setConsultaValida(false);
                    setCarregando(true);
                    setSucesso("");
                    setAberto(true);
                }}
                disabled={ocupado}
            >
                Vincular funcionário +
            </Button>
            <Dialog
                open={aberto}
                onClose={() => { if (!salvando) setAberto(false); }}
                aria-labelledby="titulo-equipe"
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle id="titulo-equipe">Funcionários do projeto</DialogTitle>
                <DialogContent dividers>
                    <Typography sx={{ mb: 1 }}>{projeto.nome}</Typography>
                    {carregando && <Typography>Carregando funcionários...</Typography>}
                    {erro && <Alert severity="error">{erro}</Alert>}
                    {sucesso && <Alert severity="success">{sucesso}</Alert>}
                    {consultaValida && !carregando && (
                        <>
                            <Typography>Funcionários vinculados: {vinculos.length}</Typography>
                            {equipeBloqueada ? (
                                <Typography>A equipe só pode ser alterada antes do início da produção.</Typography>
                            ) : (
                                <Typography>Selecione os marceneiros ativos que deseja vincular. Os vínculos existentes ficam marcados.</Typography>
                            )}
                            {funcionarios.length === 0 && <Typography>Nenhum marceneiro ativo disponível</Typography>}
                            <FormGroup sx={{ gap: 1.5, my: 3 }}>
                                {funcionarios.map(funcionario => {
                                    const vinculado = idsVinculados.includes(funcionario.usuario_id);
                                    return (
                                        <FormControlLabel
                                            key={funcionario.usuario_id}
                                            sx={{ m: 0, p: 1, border: "1px solid", borderColor: vinculado ? "#cbd1cb" : "divider", borderRadius: 3, bgcolor: vinculado ? "#f3f5f1" : "background.paper" }}
                                            label={`${funcionario.nome}${vinculado ? " — já vinculado" : ""}${!funcionario.ativo ? " — inativo" : ""}`}
                                            control={
                                                <Checkbox
                                                    checked={vinculado || selecionados.includes(funcionario.usuario_id)}
                                                    disabled={bloqueado || vinculado}
                                                    onChange={event => selecionarFuncionario(funcionario.usuario_id, event.target.checked)}
                                                />
                                            }
                                        />
                                    );
                                })}
                            </FormGroup>
                            {!equipeBloqueada && (
                                <Button variant="contained" onClick={vincularSelecionados} disabled={bloqueado || selecionados.length === 0}>
                                    {salvando ? "Vinculando..." : `Vincular selecionados (${selecionados.length})`}
                                </Button>
                            )}
                        </>
                    )}
                    <Button onClick={() => { setSucesso(""); setAtualizacao(atual => atual + 1); }} disabled={carregando || salvando || ocupado}>Atualizar funcionários</Button>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAberto(false)} disabled={salvando}>Fechar</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
