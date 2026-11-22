import { useState } from "react";
import api from "./api.js";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";

export default function MeuPerfil({ token, usuario, aoAtualizar, aoCancelar }) {
    const [nome, setNome] = useState(usuario.nome);
    const [login, setLogin] = useState(usuario.login);
    const [telefone, setTelefone] = useState(usuario.telefone || "");
    const [nascimento, setNascimento] = useState(usuario.nascimento || "");
    const [senhaAtual, setSenhaAtual] = useState("");
    const [senha, setSenha] = useState("");
    const [confirmacao, setConfirmacao] = useState("");
    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState("");
    const [salvando, setSalvando] = useState(false);
    const mudandoCredenciais = login.trim() !== usuario.login || senha !== "";

    async function salvarPerfil(event) {
        event.preventDefault();
        if (salvando) return;
        setErro("");
        setSucesso("");
        const dados = { nome: nome.trim(), login: login.trim(), telefone: telefone.trim() || null, nascimento: nascimento || null };
        if (!dados.nome || !dados.login) {
            setErro("Informe seu nome e login");
            return;
        }
        if (senha !== confirmacao) {
            setErro("A confirmação deve ser igual à nova senha");
            return;
        }
        if (senha && new TextEncoder().encode(senha).length > 72) {
            setErro("A nova senha deve ter no máximo 72 bytes");
            return;
        }
        for (const campo of Object.keys(dados)) {
            if (dados[campo] === (usuario[campo] ?? null)) delete dados[campo];
        }
        if (senha) dados.senha = senha;
        if (Object.keys(dados).length === 0) {
            setErro("Altere pelo menos um campo antes de salvar");
            return;
        }
        if (mudandoCredenciais) {
            if (!senhaAtual) {
                setErro("Informe a senha atual para mudar login ou senha");
                return;
            }
            dados.senha_atual = senhaAtual;
        }
        setSalvando(true);
        try {
            const response = await api.patch("/usuarios/me", dados, {
                headers: { Authorization: `Bearer ${token}` }
            });
            aoAtualizar(response.data);
            setSenha("");
            setConfirmacao("");
            setSenhaAtual("");
            setSucesso("Perfil atualizado com sucesso");
        } catch (error) {
            setErro(error.response?.data?.erro || "Não foi possível atualizar seu perfil");
        } finally {
            setSalvando(false);
        }
    }

    return (
        <Container>
            <Typography component="h1" variant="h5">Meu perfil</Typography>
            <Box component="form" onSubmit={salvarPerfil} sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2, maxWidth: 600 }}>
                <TextField id="perfil-nome" label="Nome" value={nome} onChange={event => setNome(event.target.value)} required disabled={salvando} slotProps={{ htmlInput: { maxLength: 120 } }} />
                <TextField id="perfil-cpf" label="CPF" value={usuario.cpf} disabled />
                <TextField id="perfil-login" label="Login" value={login} onChange={event => setLogin(event.target.value)} required disabled={salvando} autoComplete="username" slotProps={{ htmlInput: { maxLength: 30 } }} />
                <TextField id="perfil-telefone" label="Telefone (opcional)" value={telefone} onChange={event => setTelefone(event.target.value)} disabled={salvando} slotProps={{ htmlInput: { maxLength: 20, inputMode: "tel" } }} />
                <TextField id="perfil-nascimento" type="date" label="Nascimento (opcional)" value={nascimento} onChange={event => setNascimento(event.target.value)} disabled={salvando} slotProps={{ inputLabel: { shrink: true } }} />
                <TextField id="perfil-senha" type="password" label="Nova senha (opcional)" value={senha} onChange={event => setSenha(event.target.value)} disabled={salvando} autoComplete="new-password" helperText="Deixe em branco para manter sua senha" />
                <TextField id="perfil-confirmacao" type="password" label="Confirmar nova senha" value={confirmacao} onChange={event => setConfirmacao(event.target.value)} disabled={salvando} required={Boolean(senha)} autoComplete="new-password" />
                {mudandoCredenciais && <TextField id="perfil-senha-atual" type="password" label="Senha atual" value={senhaAtual} onChange={event => setSenhaAtual(event.target.value)} disabled={salvando} required autoComplete="current-password" />}
                {erro && <Alert severity="error">{erro}</Alert>}
                {sucesso && <Alert severity="success">{sucesso}</Alert>}
                <Box>
                    <Button type="submit" disabled={salvando}>{salvando ? "Salvando..." : "Salvar perfil"}</Button>
                    <Button type="button" onClick={aoCancelar} disabled={salvando}>Cancelar</Button>
                </Box>
            </Box>
        </Container>
    );
}
