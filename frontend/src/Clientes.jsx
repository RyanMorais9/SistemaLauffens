import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import api from "./api.js";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import DetalhesProjeto from "./DetalhesProjeto.jsx";
import TextField from "@mui/material/TextField";
import FormularioCliente from "./FormularioCliente.jsx";
import Informacao from "./Informacao.jsx";

export default function Clientes({ token, perfil }) {
    const [clientes, setClientes] = useState([]);
    const [erro, setErro] = useState("");
    const [carregando, setCarregando] = useState(false);
    const [projetoSelecionado, setProjetoSelecionado] = useState(null);
    const [atualizacaoLista, setAtualizacaoLista] = useState(0);
    const [busca, setBusca] = useState("");
    const [formularioAberto, setFormularioAberto] = useState(false);
    const [salvandoFormulario, setSalvandoFormulario] = useState(false);
    const [clienteEmEdicao, setClienteEmEdicao] = useState(null);
    const [sucesso, setSucesso] = useState("");

    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    const numeros = termo.replace(/\D/g, "");
    const clientesFiltrados = clientes.filter(cliente =>
        cliente.nome.toLocaleLowerCase("pt-BR").includes(termo) ||
        (numeros !== "" && (
            cliente.cpf.includes(numeros) ||
            (cliente.telefone || "").replace(/\D/g, "").includes(numeros)
        ))
    );

    function abrirFormulario(cliente = null) {
        setClienteEmEdicao(cliente);
        setSucesso("");
        setFormularioAberto(true);
    }

    function clienteSalvo() {
        setSucesso(clienteEmEdicao ? "Cliente atualizado com sucesso" : "Cliente cadastrado com sucesso");
        setFormularioAberto(false);
        setClienteEmEdicao(null);
        setAtualizacaoLista(atual => atual + 1);
    }

    useEffect(() => {
        async function buscarClientes() {
            setErro("");
            setCarregando(true);
            try {
                const response = await api.get("/clientes", { headers: { Authorization: `Bearer ${token}` } })
                setClientes(response.data);
            } catch (error) {
                setErro(error.response?.data?.erro || "Não foi possível listar os clientes")
            } finally {
                setCarregando(false);
            }
        }
        buscarClientes();
    }, [token, atualizacaoLista])

    async function abrirProjeto(projetoId) {
        if (carregando) return;
        setErro("");
        setCarregando(true);
        try {
            const response = await api.get(`/projetos/${projetoId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProjetoSelecionado(response.data);
        } catch (error) {
            setErro(error.response?.data?.erro || "Não foi possível abrir o projeto");
        } finally {
            setCarregando(false);
        }
    }

    function voltarParaClientes() {
        setProjetoSelecionado(null);
        setAtualizacaoLista(atual => atual + 1);
    }

    if (formularioAberto && clienteEmEdicao && perfil === "Administrador") {
        return (
            <FormularioCliente
                token={token}
                cliente={clienteEmEdicao}
                aoSalvar={clienteSalvo}
                aoCancelar={() => {
                    setFormularioAberto(false);
                    setClienteEmEdicao(null);
                }}
            />
        );
    }

    if (projetoSelecionado) {
        return (
            <DetalhesProjeto
                projeto={projetoSelecionado}
                aoVoltar={voltarParaClientes}
                token={token}
                perfil={perfil}
            />
        );
    }

    return (
        <Container>
            <Typography component="h1" variant="h5">Clientes</Typography>
            <Box sx={{ display: "flex", gap: 2, alignItems: "center", my: 3, flexWrap: "wrap" }}>
                <TextField label="Buscar por nome, CPF ou telefone" value={busca} onChange={event => setBusca(event.target.value)} sx={{ flex: "1 1 220px" }} />
                {perfil === "Administrador" && <Button variant="contained" onClick={() => abrirFormulario()} disabled={carregando}>Cadastrar cliente</Button>}
            </Box>
            {sucesso && <Alert severity="success">{sucesso}</Alert>}
            {carregando === true && (
                <Typography>Carregando clientes...</Typography>
            )}
            {erro && (
                <Alert severity="error">{erro}</Alert>
            )}
            {!carregando && !erro && (
                <>
                    <Typography>Clientes encontrados: {clientesFiltrados.length}</Typography>
                    {clientesFiltrados.length === 0 && (
                        <Typography>Nenhum cliente encontrado</Typography>
                    )}
                    {clientesFiltrados.map(cliente => (
                        <Box key={cliente.cliente_id} sx={{ p: { xs: 2, sm: 3 }, mb: 2, border: "1px solid", borderColor: "divider", borderRadius: 3, bgcolor: "background.paper" }}>
                            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "2fr 1fr 1fr" }, gap: 3 }}>
                                <Informacao titulo="Nome do cliente" destaque>{cliente.nome}</Informacao>
                                <Informacao titulo="CPF">{cliente.cpf}</Informacao>
                                <Informacao titulo="Telefone">{cliente.telefone || "Não informado"}</Informacao>
                            </Box>
                            <Box component="details" sx={{ mt: 3, p: 2, bgcolor: "#f6f6f4", borderRadius: 2 }}>
                                <Box component="summary" sx={{ cursor: "pointer", fontWeight: 600 }}>Projetos ({(cliente.projeto || []).length})</Box>
                                {(cliente.projeto || []).length === 0 && <Typography sx={{ mt: 2 }}>Nenhum projeto vinculado</Typography>}
                                {(cliente.projeto || []).map(projeto => (
                                    <Box key={projeto.proj_id} sx={{ pt: 2, mt: 1, borderTop: "1px solid", borderColor: "divider", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                                        <Button onClick={() => abrirProjeto(projeto.proj_id)} disabled={carregando} sx={{ textAlign: "left", justifyContent: "flex-start" }}>{projeto.nome}</Button>
                                        <Informacao titulo="Status">{projeto.status}</Informacao>
                                    </Box>
                                ))}
                            </Box>
                            {perfil === "Administrador" && <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}><Button variant="outlined" onClick={() => abrirFormulario(cliente)} disabled={carregando}>Editar cliente</Button></Box>}
                        </Box>
                    ))}
                </>
            )}
            <Dialog open={formularioAberto && !clienteEmEdicao && perfil === "Administrador"} onClose={() => { if (!salvandoFormulario) setFormularioAberto(false); }} aria-labelledby="titulo-formulario-cliente" fullWidth maxWidth="sm">
                <DialogContent>
                    {formularioAberto && !clienteEmEdicao && (
                        <FormularioCliente token={token} aoSalvar={clienteSalvo} aoCancelar={() => setFormularioAberto(false)} aoOcupar={setSalvandoFormulario} />
                    )}
                </DialogContent>
            </Dialog>
        </Container>
    );
}
