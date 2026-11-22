import { useEffect, useState } from "react";
import api from "./api.js";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Menu from "@mui/material/Menu";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import FormularioFuncionario from "./FormularioFuncionario.jsx";
import Informacao from "./Informacao.jsx";

export default function Funcionarios({ token }) {
    const [funcionarios, setFuncionarios] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState("");
    const [busca, setBusca] = useState("");
    const [filtroAtivo, setFiltroAtivo] = useState("");
    const [atualizacao, setAtualizacao] = useState(0);
    const [formulario, setFormulario] = useState(null);
    const [salvandoFormulario, setSalvandoFormulario] = useState(false);
    const [desativacao, setDesativacao] = useState(null);
    const [alterandoSituacao, setAlterandoSituacao] = useState(false);
    const [menuFuncionario, setMenuFuncionario] = useState(null);

    useEffect(() => {
        let ativo = true;
        async function buscarFuncionarios() {
            setCarregando(true);
            setErro("");
            try {
                const response = await api.get("/usuarios", { headers: { Authorization: `Bearer ${token}` } });
                if (ativo) setFuncionarios(response.data);
            } catch (error) {
                if (ativo) setErro(error.response?.data?.erro || "Não foi possível listar os funcionários");
            } finally {
                if (ativo) setCarregando(false);
            }
        }
        buscarFuncionarios();
        return () => { ativo = false; };
    }, [token, atualizacao]);

    function abrirFormulario(funcionario = null, remuneracao = false) {
        setSucesso("");
        setFormulario({ funcionario, remuneracao });
    }

    function funcionarioSalvo() {
        setSucesso(formulario.remuneracao ? "Remuneração atualizada com sucesso" : formulario.funcionario ? "Funcionário atualizado com sucesso" : "Funcionário cadastrado com sucesso");
        setFormulario(null);
        setAtualizacao(atual => atual + 1);
    }

    async function desativarFuncionario() {
        if (alterandoSituacao || !desativacao) return;
        setAlterandoSituacao(true);
        setErro("");
        setSucesso("");
        try {
            await api.put(`/usuarios/${desativacao.usuario_id}/desativar`, null, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDesativacao(null);
            setSucesso("Funcionário desativado com sucesso");
            setAtualizacao(atual => atual + 1);
        } catch (error) {
            setErro(error.response?.data?.erro || "Não foi possível desativar o funcionário");
            setDesativacao(null);
        } finally {
            setAlterandoSituacao(false);
        }
    }

    async function reativarFuncionario(funcionario) {
        if (alterandoSituacao) return;
        setAlterandoSituacao(true);
        setErro("");
        setSucesso("");
        try {
            await api.put(`/usuarios/${funcionario.usuario_id}/reativar`, null, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSucesso("Funcionário reativado com sucesso");
            setAtualizacao(atual => atual + 1);
        } catch (error) {
            setErro(error.response?.data?.erro || "Não foi possível reativar o funcionário");
        } finally {
            setAlterandoSituacao(false);
        }
    }

    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    const numeros = termo.replace(/\D/g, "");
    const filtrados = funcionarios.filter(funcionario =>
        (funcionario.nome.toLocaleLowerCase("pt-BR").includes(termo)
            || funcionario.login.toLocaleLowerCase("pt-BR").includes(termo)
            || (numeros !== "" && funcionario.cpf.includes(numeros)))
        && (filtroAtivo === "" || String(funcionario.ativo) === filtroAtivo)
    );

    if (formulario?.funcionario && !formulario.remuneracao) {
        return <FormularioFuncionario token={token} funcionario={formulario.funcionario} remuneracao={formulario.remuneracao} aoSalvar={funcionarioSalvo} aoCancelar={() => setFormulario(null)} />;
    }

    return (
        <Container>
            <Typography component="h1" variant="h5">Funcionários</Typography>
            <Button variant="contained" onClick={() => abrirFormulario()} disabled={carregando || alterandoSituacao}>Cadastrar funcionário</Button>
            <Box sx={{ display: "flex", gap: 2, my: 2, flexWrap: "wrap" }}>
                <TextField id="funcionarios-busca" label="Buscar por nome, login ou CPF" value={busca} onChange={event => setBusca(event.target.value)} sx={{ flex: 1, minWidth: 220 }} />
                <TextField id="funcionarios-status" select label="Situação" value={filtroAtivo} onChange={event => setFiltroAtivo(event.target.value)} sx={{ minWidth: 160 }}>
                    <MenuItem value="">Todos</MenuItem>
                    <MenuItem value="true">Ativos</MenuItem>
                    <MenuItem value="false">Inativos</MenuItem>
                </TextField>
                <Button onClick={() => setAtualizacao(atual => atual + 1)} disabled={carregando || alterandoSituacao}>Atualizar</Button>
            </Box>
            {sucesso && <Alert severity="success">{sucesso}</Alert>}
            {erro && <Alert severity="error">{erro}</Alert>}
            {carregando && <Typography>Carregando funcionários...</Typography>}
            {!carregando && !erro && (
                <>
                    <Typography>Funcionários encontrados: {filtrados.length}</Typography>
                    {filtrados.length === 0 && <Typography>Nenhum funcionário encontrado</Typography>}
                    {filtrados.map(funcionario => (
                        <Box key={funcionario.usuario_id} sx={{ p: { xs: 2, sm: 3 }, mb: 2, border: "1px solid", borderColor: "divider", borderRadius: 3, bgcolor: "background.paper", display: "flex", gap: 3, alignItems: "center", flexWrap: "wrap" }}>
                            <Box sx={{ flex: "2 1 200px" }}><Informacao titulo="Nome do funcionário">
                            <Button
                                onClick={event => setMenuFuncionario({ elemento: event.currentTarget, funcionario })}
                                disabled={alterandoSituacao}
                                aria-haspopup="menu"
                                aria-expanded={menuFuncionario?.funcionario.usuario_id === funcionario.usuario_id ? "true" : undefined}
                                sx={{ color: "inherit", textTransform: "none", p: 0 }}
                            >
                                {funcionario.nome}
                            </Button>
                            </Informacao></Box>
                            <Box sx={{ flex: "1 1 100px" }}><Informacao titulo="Status">{funcionario.ativo ? "Ativo" : "Inativo"}</Informacao></Box>
                            <Box sx={{ flex: "1 1 120px" }}><Informacao titulo="Login">{funcionario.login}</Informacao></Box>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap", ml: "auto" }}>
                                <Button variant="outlined" onClick={() => abrirFormulario(funcionario, true)} disabled={alterandoSituacao}>Remuneração</Button>
                                <Typography>
                                    {Number.isFinite(Number(funcionario.salario)) && Number.isFinite(Number(funcionario.horas_mensais)) && Number(funcionario.horas_mensais) > 0
                                        ? `${(Number(funcionario.salario) / Number(funcionario.horas_mensais)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}/h`
                                        : "Não informada"}
                                </Typography>
                            </Box>
                        </Box>
                    ))}
                </>
            )}
            <Menu anchorEl={menuFuncionario?.elemento || null} open={Boolean(menuFuncionario)} onClose={() => setMenuFuncionario(null)}>
                <MenuItem onClick={() => {
                    abrirFormulario(menuFuncionario.funcionario);
                    setMenuFuncionario(null);
                }}>Editar funcionário</MenuItem>
                <MenuItem onClick={() => {
                    const funcionario = menuFuncionario.funcionario;
                    setMenuFuncionario(null);
                    if (funcionario.ativo) setDesativacao(funcionario);
                    else reativarFuncionario(funcionario);
                }}>{menuFuncionario?.funcionario.ativo ? "Desativar funcionário" : "Reativar funcionário"}</MenuItem>
            </Menu>
            <Dialog open={Boolean(desativacao)} onClose={() => { if (!alterandoSituacao) setDesativacao(null); }} aria-labelledby="titulo-desativar">
                <DialogTitle id="titulo-desativar">Desativar funcionário</DialogTitle>
                <DialogContent>Deseja desativar {desativacao?.nome}? A conta deixará de acessar o sistema. O histórico será preservado.</DialogContent>
                <DialogActions>
                    <Button onClick={() => setDesativacao(null)} disabled={alterandoSituacao}>Cancelar</Button>
                    <Button onClick={desativarFuncionario} disabled={alterandoSituacao}>{alterandoSituacao ? "Desativando..." : "Confirmar desativação"}</Button>
                </DialogActions>
            </Dialog>
            <Dialog open={Boolean(formulario && (!formulario.funcionario || formulario.remuneracao))} onClose={() => { if (!salvandoFormulario) setFormulario(null); }} aria-labelledby="titulo-formulario-funcionario" fullWidth maxWidth="sm">
                <DialogContent>
                    {formulario && (!formulario.funcionario || formulario.remuneracao) && (
                        <FormularioFuncionario token={token} funcionario={formulario.funcionario} remuneracao={formulario.remuneracao} aoSalvar={funcionarioSalvo} aoCancelar={() => setFormulario(null)} aoOcupar={setSalvandoFormulario} />
                    )}
                </DialogContent>
            </Dialog>
        </Container>
    );
}
