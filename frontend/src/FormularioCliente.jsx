import { useState } from "react";
import api from "./api.js";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";

export default function FormularioCliente({ token, cliente, aoSalvar, aoCancelar, aoOcupar }) {
    const [nome, setNome] = useState(cliente?.nome || "");
    const [cpf, setCpf] = useState(cliente?.cpf || "");
    const [telefone, setTelefone] = useState(cliente?.telefone || "");
    const [erro, setErro] = useState("");
    const [salvando, setSalvando] = useState(false);

    async function salvarCliente(event) {
        event.preventDefault();
        if (salvando) return;
        setErro("");
        const dados = { nome: nome.trim(), cpf: cpf.trim(), telefone: telefone.trim() };
        if (!dados.nome) {
            setErro("Informe o nome do cliente");
            return;
        }
        if (!/^\d{11}$/.test(dados.cpf)) {
            setErro("O CPF deve conter exatamente 11 números, sem pontos ou traço");
            return;
        }
        if (cliente) {
            if (dados.nome === cliente.nome) delete dados.nome;
            if (dados.cpf === cliente.cpf) delete dados.cpf;
            if (dados.telefone === (cliente.telefone || "")) delete dados.telefone;
            if (Object.keys(dados).length === 0) {
                setErro("Altere pelo menos um campo antes de salvar");
                return;
            }
        }
        setSalvando(true);
        aoOcupar?.(true);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            if (cliente) {
                await api.put(`/clientes/${cliente.cliente_id}`, dados, config);
            } else {
                await api.post("/clientes", dados, config);
            }
            aoSalvar();
        } catch (error) {
            setErro(error.response?.data?.erro || "Não foi possível salvar o cliente");
        } finally {
            setSalvando(false);
            aoOcupar?.(false);
        }
    }

    return (
        <Container>
            <Typography id="titulo-formulario-cliente" component="h1" variant="h5">{cliente ? "Editar cliente" : "Cadastrar cliente"}</Typography>
            <Box component="form" onSubmit={salvarCliente} sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
                <TextField label="Nome" value={nome} onChange={event => setNome(event.target.value)} required disabled={salvando} slotProps={{ htmlInput: { maxLength: 120 } }} />
                <TextField label="CPF" value={cpf} onChange={event => setCpf(event.target.value)} required disabled={salvando} helperText="11 números, sem pontos ou traço" slotProps={{ htmlInput: { maxLength: 11, inputMode: "numeric" } }} />
                <TextField label="Telefone (opcional)" value={telefone} onChange={event => setTelefone(event.target.value)} disabled={salvando} slotProps={{ htmlInput: { maxLength: 20, inputMode: "tel" } }} />
                {erro && <Alert severity="error">{erro}</Alert>}
                <Box>
                    <Button type="submit" disabled={salvando}>{salvando ? "Salvando..." : "Salvar"}</Button>
                    <Button onClick={aoCancelar} disabled={salvando}>Cancelar</Button>
                </Box>
            </Box>
        </Container>
    );
}
