import { useState } from "react";
import api from "./api.js";
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from "@mui/material/Typography";
import FundoFolha from "./FundoFolha.jsx";

export default function Login({ aoEntrar }) {
    const [login, setLogin] = useState("");
    const [senha, setSenha] = useState("");
    const [erro, setErro] = useState("");
    const [credenciaisInvalidas, setCredenciaisInvalidas] = useState(false);
    const [carregando, setCarregando] = useState(false);

    async function enviarLogin() {
        setErro("");
        setCredenciaisInvalidas(false);
        if (!login.trim() || !senha) {
            return setErro("Preencha o login e a senha");
        }
        setCarregando(true);
        try {
            const dados = { login: login.trim(), senha: senha };
            const response = await api.post("/login", dados);
            if (!response.data.token) {
                setErro("A resposta de autenticação é inválida");
                return;
            }
            aoEntrar(response.data.token, response.data.perfil, response.data.usuario_id);
            if (!response.data.token) {
                setErro("A resposta de autenticação é inválida");
            }
        } catch (error) {
            if (error.response?.status === 401) {
                setCredenciaisInvalidas(true);
                setErro("Login ou senha incorretos");
            } else {
                setErro(error.response?.data?.erro || "Não foi possível conectar ao servidor");
            }
        } finally {
            setCarregando(false);
        }
    }

    return (
        <Box sx={{
            position: "relative",
            display: "flex",
            minHeight: "100dvh",
            overflow: "hidden",
            isolation: "isolate"
        }}>
            <FundoFolha />
            <Box
                component="img"
                src="/lauffens-logo-preta.png"
                alt="Lauffens"
                sx={{
                    position: "absolute",
                    top: 24,
                    left: 24,
                    width: { xs: 140, sm: 180 },
                    height: "auto"
                }}
            />
            <Box sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                alignItems: "center",
                p: { xs: 3, sm: 4 }
            }}>
                <Box sx={{ width: "100%", maxWidth: 1200, p: { xs: 2.5, sm: 3 }, pb: { xs: 2.5, sm: 6 }, bgcolor: "rgba(255, 255, 255, 0.88)", border: "1px solid rgba(255, 255, 255, 0.95)", borderRadius: 3 }}>
                    <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 3, alignItems: { xs: "stretch", sm: "flex-end" } }}>
                        <Box sx={{ flex: 1, minWidth: 0, width: { xs: "100%", sm: "auto" } }}>
                            <Typography
                                component="h2"
                                sx={{
                                    m: 0,
                                    mb: 0.5,
                                    fontFamily: 'Futura, Arial, sans-serif',
                                    fontSize: 18,
                                    fontWeight: 600
                                }}>LOGIN</Typography>
                            <TextField
                                id="login"
                                variant="standard"
                                type="text"
                                placeholder="Digite seu login"
                                value={login}
                                error={credenciaisInvalidas}
                                fullWidth
                                onChange={(event) => setLogin(event.target.value)}
                            />
                        </Box>

                        <Box sx={{ flex: 1, minWidth: 0, width: { xs: "100%", sm: "auto" } }}>
                            <Typography
                                component="h2"
                                sx={{
                                    m: 0,
                                    mb: 0.5,
                                    fontFamily: 'Futura, Arial, sans-serif',
                                    fontSize: 18,
                                    fontWeight: 600
                                }}
                            >SENHA</Typography>
                            <TextField
                                id="senha"
                                variant="standard"
                                type="password"
                                placeholder="Digite sua senha"
                                helperText={erro || " "}
                                sx={{ position: "relative" }}
                                slotProps={{
                                    formHelperText: {
                                        "aria-live": "polite",
                                        sx: {
                                            position: { xs: "static", sm: "absolute" },
                                            minHeight: { xs: 40, sm: 0 },
                                            top: "100%",
                                            left: 0,
                                            right: 0,
                                            m: 0,
                                            mt: 1,
                                            color: "error.main",
                                            overflowWrap: "anywhere"
                                        }
                                    }
                                }}
                                value={senha}
                                error={credenciaisInvalidas}
                                fullWidth
                                onChange={(event) => setSenha(event.target.value)}
                            />
                        </Box>
                        <Button variant="contained" disabled={carregando} onClick={enviarLogin}
                            sx={{
                                flexShrink: 0,
                                bgcolor: "#111",
                                color: "#fff",
                                "&:hover": {
                                    bgcolor: "#444"
                                },
                                fontFamily: 'Futura, Arial, sans-serif',
                                fontSize: 14
                            }}>
                            {carregando ? "Entrando..." : "Enviar"}
                        </Button>
                    </Box>
                </Box>
            </Box>
        </Box>
    )
}
