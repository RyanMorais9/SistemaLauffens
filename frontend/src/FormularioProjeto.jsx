import { useEffect, useState } from "react";
import api from "./api.js";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import ManutencoesProjeto from "./ManutencoesProjeto.jsx";

const tiposEtapa = ["Corte", "Fitagem", "Refinamento", "Embalamento"];

export default function FormularioProjeto({ token, projeto, aoSalvar, aoCancelar, aoOcupar }) {
    const [nome, setNome] = useState(projeto?.nome || "");
    const [clienteId, setClienteId] = useState("");
    const [clientes, setClientes] = useState([]);
    const [porte, setPorte] = useState(projeto?.porte || "");
    const [prazo, setPrazo] = useState(projeto?.prazo_planejado || "");
    const [valorBase, setValorBase] = useState(projeto?.valor_base == null ? "" : String(projeto.valor_base));
    const [tempos, setTempos] = useState({ Corte: "", Fitagem: "", Refinamento: "", Embalamento: "" });
    const [erro, setErro] = useState("");
    const [carregando, setCarregando] = useState(!projeto);
    const [salvando, setSalvando] = useState(false);
    const [tentativa, setTentativa] = useState(0);
    const valorBloqueado = Boolean(projeto?.data_inicio && projeto?.valor_base != null);

    useEffect(() => {
        if (projeto) return;
        let ativo = true;
        async function buscarClientes() {
            setCarregando(true);
            setErro("");
            try {
                const response = await api.get("/clientes", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (ativo) setClientes(response.data);
            } catch (error) {
                if (ativo) setErro(error.response?.data?.erro || "Não foi possível carregar os clientes");
            } finally {
                if (ativo) setCarregando(false);
            }
        }
        buscarClientes();
        return () => { ativo = false; };
    }, [token, projeto, tentativa]);

    async function salvarProjeto(event) {
        event.preventDefault();
        if (salvando || carregando) return;
        setErro("");
        const dados = { nome: nome.trim(), porte, prazo_planejado: prazo };
        if (!dados.nome) {
            setErro("Informe o nome do projeto");
            return;
        }
        if (!valorBloqueado && valorBase.trim() !== "") {
            const valor = Number(valorBase);
            if (!Number.isFinite(valor) || valor <= 0 || valor > 9999999.99 || Number(valor.toFixed(2)) !== valor) {
                setErro("Informe um valor-base positivo, até 9999999,99, com no máximo duas casas decimais");
                return;
            }
            dados.valor_base = valor;
        }
        if (projeto) {
            if (dados.nome === projeto.nome) delete dados.nome;
            if (dados.porte === projeto.porte) delete dados.porte;
            if (dados.prazo_planejado === projeto.prazo_planejado) delete dados.prazo_planejado;
            if (dados.valor_base === Number(projeto.valor_base)) delete dados.valor_base;
            if (projeto.valor_base != null && !valorBloqueado && !valorBase.trim()) {
                setErro("O valor-base já informado não pode ser apagado");
                return;
            }
            if (Object.keys(dados).length === 0) {
                setErro("Altere pelo menos um campo antes de salvar");
                return;
            }
        } else {
            dados.cliente_id = Number(clienteId);
            if (!Number.isSafeInteger(dados.cliente_id) || dados.cliente_id <= 0) {
                setErro("Selecione um cliente");
                return;
            }
            dados.etapas = tiposEtapa.map(tipo => ({ tipo, tempo_planejado: Number(tempos[tipo]) }));
            if (dados.etapas.some(etapa => !Number.isFinite(etapa.tempo_planejado)
                || etapa.tempo_planejado < 0.6 || etapa.tempo_planejado > 600000
                || Math.abs(etapa.tempo_planejado * 100 - Math.round(etapa.tempo_planejado * 100)) > 0.000001)) {
                setErro("Informe de 0,6 a 600000 minutos em cada etapa, com no máximo duas casas decimais");
                return;
            }
        }
        setSalvando(true);
        aoOcupar?.(true);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            if (projeto) {
                await api.patch(`/projetos/${projeto.proj_id}`, dados, config);
            } else {
                await api.post("/projetos", dados, config);
            }
            aoSalvar();
        } catch (error) {
            setErro(error.response?.data?.erro || "Não foi possível salvar o projeto");
        } finally {
            setSalvando(false);
            aoOcupar?.(false);
        }
    }

    return (
        <Container>
            <Typography id="titulo-formulario-projeto" component="h1" variant="h5">{projeto ? "Editar projeto" : "Cadastrar projeto"}</Typography>
            {carregando && <Typography>Carregando clientes...</Typography>}
            <Box component="form" onSubmit={salvarProjeto} sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
                <TextField id="projeto-nome" label="Nome do projeto" value={nome} onChange={event => setNome(event.target.value)} required disabled={salvando} slotProps={{ htmlInput: { maxLength: 120 } }} />
                {projeto ? (
                    <TextField id="projeto-cliente" label="Cliente" value={projeto.cliente?.nome || "Não informado"} disabled helperText="O cliente original é mantido na edição" />
                ) : (
                    <TextField id="projeto-cliente" select label="Cliente" value={clienteId} onChange={event => setClienteId(event.target.value)} required disabled={salvando || carregando} helperText="Se necessário, cadastre primeiro o cliente na aba Clientes">
                        {clientes.map(cliente => <MenuItem key={cliente.cliente_id} value={cliente.cliente_id}>{cliente.nome} — {cliente.cpf}</MenuItem>)}
                    </TextField>
                )}
                {!projeto && !carregando && clientes.length === 0 && (
                    <Alert severity="info">Nenhum cliente disponível. Cadastre um cliente na aba Clientes ou tente carregar novamente.</Alert>
                )}
                {!projeto && !carregando && <Button onClick={() => setTentativa(atual => atual + 1)} disabled={salvando}>Atualizar clientes</Button>}
                <TextField id="projeto-porte" select label="Porte" value={porte} onChange={event => setPorte(event.target.value)} required disabled={salvando}>
                    {["Pequeno", "Médio", "Grande"].map(item => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                </TextField>
                <TextField id="projeto-prazo" type="date" label="Prazo planejado" value={prazo} onChange={event => setPrazo(event.target.value)} required disabled={salvando} slotProps={{ inputLabel: { shrink: true } }} helperText="De hoje até dois anos à frente" />
                <TextField id="projeto-valor" type="number" label="Valor-base (R$)" value={valorBase} onChange={event => setValorBase(event.target.value)} disabled={salvando || valorBloqueado} slotProps={{ htmlInput: { min: 0.01, max: 9999999.99, step: 0.01 } }} helperText={valorBloqueado ? "O valor informado fica bloqueado após o início da produção" : "Opcional no cadastro; necessário para o fechamento financeiro"} />
                {!projeto && (
                    <>
                        <Typography component="h2" variant="h6">Planejamento das etapas</Typography>
                        {tiposEtapa.map((tipo, indice) => (
                            <TextField key={tipo} id={`projeto-etapa-${indice}`} type="number" label={`${tipo} (minutos)`} value={tempos[tipo]} onChange={event => setTempos(atuais => ({ ...atuais, [tipo]: event.target.value }))} required disabled={salvando} slotProps={{ htmlInput: { min: 0.6, max: 600000, step: 0.01 } }} />
                        ))}
                    </>
                )}
                {erro && <Alert severity="error">{erro}</Alert>}
                <Box>
                    <Button type="submit" disabled={salvando || carregando || (!projeto && clientes.length === 0)}>{salvando ? "Salvando..." : "Salvar"}</Button>
                    <Button onClick={aoCancelar} disabled={salvando}>Cancelar</Button>
                </Box>
            </Box>
            {projeto && <ManutencoesProjeto token={token} projeto={projeto} ocupado={salvando} />}
        </Container>
    );
}
