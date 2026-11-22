import { lazy, Suspense, useEffect, useState } from "react";
import Container from '@mui/material/Container';
import Login from './Login.jsx';
import MenuLateral from "./MenuLateral.jsx";
import Box from "@mui/material/Box";
import BarraSuperior from "./BarraSuperior.jsx";
import api from "./api.js";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";

const Projetos = lazy(() => import("./Projetos.jsx"));
const Clientes = lazy(() => import("./Clientes.jsx"));
const Funcionarios = lazy(() => import("./Funcionarios.jsx"));
const Manutencoes = lazy(() => import("./Manutencoes.jsx"));
const Notificacoes = lazy(() => import("./Notificacoes.jsx"));
const MeuPerfil = lazy(() => import("./MeuPerfil.jsx"));
const Dashboard = lazy(() => import("./Dashboard.jsx"));

export default function App() {
    const [token, setToken] = useState("");
    const [perfil, setPerfil] = useState("");
    const [paginaAtual, setPaginaAtual] = useState("projetos");
    const [paginaAnteriorPerfil, setPaginaAnteriorPerfil] = useState("projetos");
    const [usuarioId, setUsuarioId] = useState(null);
    const [usuario, setUsuario] = useState(null);
    const [carregandoPerfil, setCarregandoPerfil] = useState(true);
    const [erroPerfil, setErroPerfil] = useState("");
    const [recarregarPerfil, setRecarregarPerfil] = useState(0);
    const [atualizacaoNotificacoes, setAtualizacaoNotificacoes] = useState(0);
    const [menuAberto, setMenuAberto] = useState(false);

    function entrarNoSistema(tokenRecebido, perfilRecebido, usuarioIdRecebido) {
        setToken(tokenRecebido);
        setPerfil(perfilRecebido);
        setUsuarioId(usuarioIdRecebido);
        if (perfilRecebido === "Administrador" && new URLSearchParams(window.location.search).get("tela") === "notificacoes") {
            setPaginaAtual("notificacoes");
        } else {
            setPaginaAtual("projetos");
        }
    }

    function selecionarPagina(pagina) {
        if (pagina === "perfil" && paginaAtual !== "perfil") setPaginaAnteriorPerfil(paginaAtual);
        setPaginaAtual(pagina);
    }

    function sairDoSistema() {
        setToken("");
        setPerfil("");
        setUsuarioId(null);
        setUsuario(null);
        setErroPerfil("");
        setPaginaAtual("projetos");
        setPaginaAnteriorPerfil("projetos");
        setAtualizacaoNotificacoes(0);
        setMenuAberto(false);
        const endereco = new URL(window.location.href);
        endereco.searchParams.delete("tela");
        window.history.replaceState(null, "", endereco);
    }

    function atualizarNotificacoes() {
        setAtualizacaoNotificacoes(atual => atual + 1);
    }

    useEffect(() => {
        const consulta = window.matchMedia("(min-width: 900px)");
        function ajustarMenu(event) {
            if (event.matches) setMenuAberto(false);
        }
        consulta.addEventListener("change", ajustarMenu);
        return () => consulta.removeEventListener("change", ajustarMenu);
    }, []);

    useEffect(() => {
        if (!token) return;
        let ativo = true;
        async function buscarMeuPerfil() {
            setCarregandoPerfil(true);
            setErroPerfil("");
            try {
                const response = await api.get("/usuarios/me", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (ativo) {
                    setUsuario(response.data);
                    setUsuarioId(response.data.usuario_id);
                    setPerfil(response.data.perfil);
                }
            } catch (error) {
                if (ativo) setErroPerfil(error.response?.data?.erro || "Não foi possível carregar seu perfil");
            } finally {
                if (ativo) setCarregandoPerfil(false);
            }
        }
        buscarMeuPerfil();
        return () => { ativo = false; };
    }, [token, recarregarPerfil]);

    useEffect(() => {
        if (!token || perfil !== "Administrador" || !("serviceWorker" in navigator)) return;
        function abrirNotificacoes(event) {
            if (event.data?.tipo === "abrir-notificacoes") setPaginaAtual("notificacoes");
        }
        navigator.serviceWorker.addEventListener("message", abrirNotificacoes);
        return () => navigator.serviceWorker.removeEventListener("message", abrirNotificacoes);
    }, [token, perfil]);

    return (
        <Container maxWidth={false} disableGutters>
            {!token ? (
                <Login aoEntrar={entrarNoSistema} />
            ) : (
                <Box sx={{ minHeight: "100vh" }}>
                    <BarraSuperior
                        token={token}
                        perfil={perfil}
                        usuarioId={usuarioId}
                        nome={usuario?.nome}
                        aoSelecionar={selecionarPagina}
                        aoSair={sairDoSistema}
                        atualizacaoNotificacoes={atualizacaoNotificacoes}
                        aoLer={atualizarNotificacoes}
                        aoAbrirMenu={() => setMenuAberto(true)}
                    />
                    <Box sx={{ display: "flex", minHeight: "calc(100vh - 64px)" }}>
                        <MenuLateral perfil={perfil} aoSelecionar={selecionarPagina} paginaAtual={paginaAtual} aberto={menuAberto} aoFechar={() => setMenuAberto(false)} />
                        <Box component="main" sx={{flex: 1, minWidth: 0, py: 2 }}>
                            <Suspense fallback={<Typography>Carregando tela...</Typography>}>
                                {paginaAtual === "dashboard" && perfil === "Administrador" && (
                                    <Dashboard token={token} perfil={perfil} />
                                )}
                                {paginaAtual === "projetos" && (
                                    <Projetos token={token} perfil={perfil}/>
                                )}
                                {paginaAtual === "clientes" &&
                                perfil === "Administrador" && (
                                    <Clientes token={token} perfil={perfil}/>
                                )}

                                {paginaAtual === "funcionarios" && perfil === "Administrador" && (
                                    <Funcionarios token={token} />
                                )}
                                {paginaAtual === "manutencoes" && perfil === "Administrador" && (
                                    <Manutencoes token={token} />
                                )}
                                {paginaAtual === "notificacoes" && perfil === "Administrador" && (
                                    <Notificacoes token={token} usuarioId={usuarioId} aoLer={atualizarNotificacoes} atualizacaoExterna={atualizacaoNotificacoes} />
                                )}
                                {paginaAtual === "perfil" && (
                                    <>
                                        {carregandoPerfil && <Typography>Carregando seu perfil...</Typography>}
                                        {!carregandoPerfil && erroPerfil && (
                                            <Box sx={{ p: 2 }}>
                                                <Alert severity="error">{erroPerfil}</Alert>
                                                <Button onClick={() => setRecarregarPerfil(atual => atual + 1)}>Tentar novamente</Button>
                                                <Button onClick={() => setPaginaAtual(paginaAnteriorPerfil)}>Cancelar</Button>
                                            </Box>
                                        )}
                                        {!carregandoPerfil && !erroPerfil && usuario && (
                                            <MeuPerfil token={token} usuario={usuario} aoAtualizar={setUsuario} aoCancelar={() => setPaginaAtual(paginaAnteriorPerfil)} />
                                        )}
                                    </>
                                )}
                            </Suspense>
                        </Box>
                    </Box>
                </Box>
            )}
        </Container>
    );
}
