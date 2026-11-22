import { useState } from "react";
import api from "./api.js";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";

const motivos = ["Ajuste", "Reparo", "Defeito", "Problema na instalação", "Outro"];

export default function FormularioManutencao({ token, manutencao, projeto, resolver, aoSalvar, aoCancelar }) {
    const [retorno, setRetorno] = useState(manutencao?.data_retorno || "");
    const [motivo, setMotivo] = useState(manutencao?.motivo || "");
    const [descricao, setDescricao] = useState(manutencao?.descricao || "");
    const [conclusao, setConclusao] = useState("");
    const [erro, setErro] = useState("");
    const [salvando, setSalvando] = useState(false);

    async function salvarManutencao(event) {
        event.preventDefault();
        event.stopPropagation();
        if (salvando) return;
        setErro("");
        let dados;
        if (resolver) {
            if (!conclusao || conclusao < manutencao.data_retorno) {
                setErro("A data de conclusão deve ser igual ou posterior à data de retorno");
                return;
            }
            dados = { data_conclusao: conclusao };
        } else {
            if (!descricao.trim()) {
                setErro("Informe a descrição da manutenção");
                return;
            }
            dados = { data_retorno: retorno, motivo, descricao: descricao.trim() };
            if (manutencao) {
                for (const campo of Object.keys(dados)) {
                    if (dados[campo] === manutencao[campo]) delete dados[campo];
                }
                if (Object.keys(dados).length === 0) {
                    setErro("Altere pelo menos um campo antes de salvar");
                    return;
                }
            } else {
                dados.proj_id = projeto.proj_id;
                if (!Number.isSafeInteger(dados.proj_id) || dados.proj_id <= 0) {
                    setErro("Selecione um projeto");
                    return;
                }
            }
        }
        setSalvando(true);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            if (resolver) {
                await api.put(`/manutencoes/${manutencao.mntnc_id}`, dados, config);
            } else if (manutencao) {
                await api.patch(`/manutencoes/${manutencao.mntnc_id}`, dados, config);
            } else {
                await api.post("/manutencoes", dados, config);
            }
            aoSalvar();
        } catch (error) {
            setErro(error.response?.data?.erro || "Não foi possível salvar a manutenção");
        } finally {
            setSalvando(false);
        }
    }

    return (
        <Container>
            <Typography component="h1" variant="h5">{resolver ? "Resolver manutenção" : manutencao ? "Editar manutenção" : "Cadastrar manutenção"}</Typography>
            <Box component="form" onSubmit={salvarManutencao} sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
                <Typography>Projeto: {projeto.nome}</Typography>
                {resolver ? (
                    <>
                        <Typography>Retorno: {manutencao.data_retorno.split("-").reverse().join("/")}</Typography>
                        <TextField id="manutencao-conclusao" type="date" label="Data de conclusão" value={conclusao} onChange={event => setConclusao(event.target.value)} required disabled={salvando} slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: manutencao.data_retorno } }} />
                    </>
                ) : (
                    <>
                        <TextField id="manutencao-retorno" type="date" label="Data de retorno" value={retorno} onChange={event => setRetorno(event.target.value)} required disabled={salvando} slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: manutencao?.data_conclusao || undefined } }} />
                        <TextField id="manutencao-motivo" select label="Motivo" value={motivo} onChange={event => setMotivo(event.target.value)} required disabled={salvando}>
                            {motivos.map(item => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                        </TextField>
                        <TextField id="manutencao-descricao" label="Descrição" value={descricao} onChange={event => setDescricao(event.target.value)} multiline minRows={3} required disabled={salvando} />
                    </>
                )}
                {erro && <Alert severity="error">{erro}</Alert>}
                <Box>
                    <Button type="submit" disabled={salvando}>{salvando ? "Salvando..." : resolver ? "Resolver" : "Salvar"}</Button>
                    <Button onClick={aoCancelar} disabled={salvando}>Cancelar</Button>
                </Box>
            </Box>
        </Container>
    );
}
