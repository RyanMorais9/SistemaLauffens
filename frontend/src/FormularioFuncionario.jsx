import { useState } from "react";
import api from "./api.js";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";

export default function FormularioFuncionario({ token, funcionario, remuneracao, aoSalvar, aoCancelar, aoOcupar }) {
    const [nome, setNome] = useState(funcionario?.nome || "");
    const [cpf, setCpf] = useState(funcionario?.cpf || "");
    const [perfil, setPerfil] = useState(funcionario?.perfil || "Marceneiro");
    const [login, setLogin] = useState(funcionario?.login || "");
    const [senha, setSenha] = useState("");
    const [nascimento, setNascimento] = useState(funcionario?.nascimento || "");
    const [telefone, setTelefone] = useState(funcionario?.telefone || "");
    const [salario, setSalario] = useState(funcionario?.salario == null ? "" : String(funcionario.salario));
    const [horasMensais, setHorasMensais] = useState(funcionario?.horas_mensais == null ? "" : String(funcionario.horas_mensais));
    const [erro, setErro] = useState("");
    const [salvando, setSalvando] = useState(false);

    async function salvarFuncionario(event) {
        event.preventDefault();
        if (salvando) return;
        setErro("");
        let dados;
        if (remuneracao || !funcionario) {
            const valorSalario = Number(salario);
            const horas = Number(horasMensais);
            if ([valorSalario, horas].some(valor => !Number.isFinite(valor) || valor <= 0 || valor > 999999.99 || Number(valor.toFixed(2)) !== valor)) {
                setErro("Salário e horas mensais devem ser positivos, até 999999,99 e com no máximo duas casas decimais");
                return;
            }
            dados = { salario: valorSalario, horas_mensais: horas };
        } else {
            dados = {};
        }
        if (!remuneracao) {
            if (!nome.trim() || !login.trim() || !/^\d{11}$/.test(cpf.trim())) {
                setErro("Informe nome, login e CPF com exatamente 11 números");
                return;
            }
            if ((!funcionario && senha.length === 0) || new TextEncoder().encode(senha).length > 72) {
                setErro("Informe uma senha de até 72 bytes. Acentos e emojis podem ocupar mais de um byte");
                return;
            }
            Object.assign(dados, { nome: nome.trim(), cpf: cpf.trim(), perfil, login: login.trim(), nascimento: nascimento || null, telefone: telefone.trim() || null });
            if (senha !== "") dados.senha = senha;
            if (funcionario) {
                for (const campo of ["nome", "cpf", "perfil", "login", "nascimento", "telefone"]) {
                    if (dados[campo] === (funcionario[campo] ?? null)) delete dados[campo];
                }
                if (Object.keys(dados).length === 0) {
                    setErro("Altere pelo menos um campo antes de salvar");
                    return;
                }
            }
        }
        setSalvando(true);
        aoOcupar?.(true);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            if (remuneracao) {
                await api.put(`/usuarios/${funcionario.usuario_id}/remuneracao`, dados, config);
            } else if (funcionario) {
                await api.patch(`/usuarios/${funcionario.usuario_id}`, dados, config);
            } else {
                await api.post("/usuarios", dados, config);
            }
            aoSalvar();
        } catch (error) {
            setErro(error.response?.data?.erro || "Não foi possível salvar o funcionário");
        } finally {
            setSalvando(false);
            aoOcupar?.(false);
        }
    }

    return (
        <Container>
            <Typography id="titulo-formulario-funcionario" component="h1" variant="h5">{remuneracao ? `Remuneração de ${funcionario.nome}` : funcionario ? "Editar funcionário" : "Cadastrar funcionário"}</Typography>
            <Box component="form" onSubmit={salvarFuncionario} sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
                {!remuneracao && (
                    <>
                        <TextField id="funcionario-nome" label="Nome" value={nome} onChange={event => setNome(event.target.value)} required disabled={salvando} slotProps={{ htmlInput: { maxLength: 120 } }} />
                        <TextField id="funcionario-cpf" label="CPF" value={cpf} onChange={event => setCpf(event.target.value)} required disabled={salvando} helperText="11 números, sem pontos ou traço" slotProps={{ htmlInput: { maxLength: 11, inputMode: "numeric" } }} />
                        <TextField id="funcionario-perfil" select label="Perfil" value={perfil} onChange={event => setPerfil(event.target.value)} required disabled={salvando}>
                            <MenuItem value="Marceneiro">Marceneiro</MenuItem>
                            <MenuItem value="Administrador">Administrador</MenuItem>
                        </TextField>
                        <TextField id="funcionario-login" label="Login" value={login} onChange={event => setLogin(event.target.value)} required disabled={salvando} autoComplete="off" slotProps={{ htmlInput: { maxLength: 30 } }} />
                        <TextField id="funcionario-senha" type="password" label={funcionario ? "Nova senha (opcional)" : "Senha"} value={senha} onChange={event => setSenha(event.target.value)} required={!funcionario} disabled={salvando} autoComplete="new-password" helperText={funcionario ? "Deixe em branco para manter a senha atual" : "Até 72 bytes"} />
                        <TextField id="funcionario-nascimento" type="date" label="Nascimento (opcional)" value={nascimento} onChange={event => setNascimento(event.target.value)} disabled={salvando} slotProps={{ inputLabel: { shrink: true } }} />
                        <TextField id="funcionario-telefone" label="Telefone (opcional)" value={telefone} onChange={event => setTelefone(event.target.value)} disabled={salvando} slotProps={{ htmlInput: { maxLength: 20, inputMode: "tel" } }} />
                    </>
                )}
                {(remuneracao || !funcionario) && (
                    <>
                        <TextField id="funcionario-salario" type="number" label="Salário (R$)" value={salario} onChange={event => setSalario(event.target.value)} required disabled={salvando} slotProps={{ htmlInput: { min: 0.01, max: 999999.99, step: 0.01 } }} />
                        <TextField id="funcionario-horas" type="number" label="Horas mensais" value={horasMensais} onChange={event => setHorasMensais(event.target.value)} required disabled={salvando} slotProps={{ htmlInput: { min: 0.01, max: 999999.99, step: 0.01 } }} />
                    </>
                )}
                {remuneracao && <Typography>A alteração vale para novos vínculos. As referências dos projetos existentes são preservadas.</Typography>}
                {erro && <Alert severity="error">{erro}</Alert>}
                <Box>
                    <Button type="submit" disabled={salvando}>{salvando ? "Salvando..." : "Salvar"}</Button>
                    <Button onClick={aoCancelar} disabled={salvando}>Cancelar</Button>
                </Box>
            </Box>
        </Container>
    );
}
