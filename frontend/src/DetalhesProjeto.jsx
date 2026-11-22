import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import { useEffect, useState } from "react";
import api from "./api.js";
import Alert from "@mui/material/Alert";
import TextField from "@mui/material/TextField";
import FuncionariosProjeto from "./FuncionariosProjeto.jsx";
import ManutencoesProjeto from "./ManutencoesProjeto.jsx";
import Informacao from "./Informacao.jsx";

export default function DetalhesProjeto({ projeto, aoVoltar, token, perfil }) {

    const [projetoAtual, setProjetoAtual] = useState(projeto);
    const [erro, setErro] = useState("");
    const [carregando, setCarregando] = useState(false);
    const [executando, setExecutando] = useState(false);
    const [finalizacao, setFinalizacao] = useState(null);
    const [valorBase, setValorBase] = useState("");
    const [referencias, setReferencias] = useState(null);
    const [relogioPronto, setRelogioPronto] = useState(false);
    const [sincronizadoEm, setSincronizadoEm] = useState(() => performance.now());
    const [agora, setAgora] = useState(() => performance.now());
    const [atualizacaoEquipe, setAtualizacaoEquipe] = useState(0);
    const [erroAcompanhamento, setErroAcompanhamento] = useState("");
    const emExecucao = projetoAtual.etapas.some(etapa => etapa.status === "Em andamento") && !projetoAtual.data_fim && !["Concluído", "Cancelado"].includes(projetoAtual.status);
    const acrescimo = emExecucao && relogioPronto && !executando && !carregando ? Math.max(0, (agora - sincronizadoEm) / 1000) : 0;
    const segundosTotais = Number(projetoAtual.tempo_total_segundos ?? Number(projetoAtual.tempo_total_minutos || 0) * 60) + acrescimo;
    const custoHora = referencias?.reduce((total, vinculo) => total + Number(vinculo.custo_hora_referencia), 0);
    const custoEstimado = referencias?.length && Number.isFinite(custoHora) ? segundosTotais / 3600 * custoHora : null;
    const moeda = valor => Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    const tempo = segundos => `${Math.floor(segundos / 3600)}h ${String(Math.floor(segundos % 3600 / 60)).padStart(2, "0")}min ${String(Math.floor(segundos % 60)).padStart(2, "0")}s`;

    useEffect(() => {
        if (!emExecucao) return;
        const intervalo = setInterval(() => setAgora(performance.now()), 1000);
        return () => clearInterval(intervalo);
    }, [emExecucao]);

    useEffect(() => {
        if (executando || carregando) return;
        let ativo = true;
        async function acompanhar() {
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const [resProjeto, resEquipe] = await Promise.all([
                    api.get(`/projetos/${projeto.proj_id}`, config),
                    perfil === "Administrador" ? api.get(`/projetos-usuarios/projeto/${projeto.proj_id}`, config) : Promise.resolve({ data: null })
                ]);
                if (ativo) {
                    const instante = performance.now();
                    setProjetoAtual(resProjeto.data);
                    setReferencias(resEquipe.data);
                    setSincronizadoEm(instante);
                    setRelogioPronto(true);
                    setAgora(instante);
                    setErroAcompanhamento("");
                }
            } catch {
                if (ativo) setErroAcompanhamento("Não foi possível sincronizar o acompanhamento. Use Atualizar para tentar novamente.");
            }
        }
        acompanhar();
        const intervalo = setInterval(acompanhar, 15000);
        return () => { ativo = false; clearInterval(intervalo); };
    }, [token, perfil, projeto.proj_id, executando, carregando, atualizacaoEquipe]);

    async function atualizarProjeto() {
        setErro("");
        setCarregando(true);
        try {
            const response = await api.get(`/projetos/${projetoAtual.proj_id}`, { headers: { Authorization: `Bearer ${token}` } });
            setProjetoAtual(response.data);
            setRelogioPronto(false);

        } catch (error) {
            setErro(error.response?.data?.erro || "Não foi possível atualizar os dados do projeto")
        } finally {
            setCarregando(false);
        }
    }

    async function iniciarEtapa(etapaId) {
        if (executando || carregando) return;
        setErro("");
        setExecutando(true);
        try {
            await api.post(`/etapas/${etapaId}/iniciar`, null, { headers: { Authorization: `Bearer ${token}` } });
            await atualizarProjeto();
        } catch (error) {
            setErro(error.response?.data?.erro || "Não foi possível iniciar a etapa");
        } finally {
            setExecutando(false);
        }
    }

    async function pausarEtapa(etapaId) {
        if (executando || carregando) return;
        setErro("");
        setExecutando(true);
        try {
            await api.post(`/etapas/${etapaId}/pausar`, null, { headers: { Authorization: `Bearer ${token}` } });
            await atualizarProjeto();
        } catch (error) {
            setErro(error.response?.data?.erro || "Não foi possível pausar a etapa");
        } finally {
            setExecutando(false);
        }

    }
    async function retomarEtapa(etapaId) {
        if (executando || carregando) return;
        setErro("");
        setExecutando(true);
        try {
            await api.post(`/etapas/${etapaId}/retomar`, null, { headers: { Authorization: `Bearer ${token}` } });
            await atualizarProjeto();
        } catch (error) {
            setErro(error.response?.data?.erro || "Não foi possível retomar a etapa");
        } finally {
            setExecutando(false);
        }
    }

    async function concluirEtapa(etapaId) {
        if (executando || carregando) return;
        setFinalizacao(null);
        setErro("");
        setExecutando(true);
        try {

            const response = await api.post(`/etapas/${etapaId}/concluir`, null, { headers: { Authorization: `Bearer ${token}` } });
            await atualizarProjeto();
            setFinalizacao(response.data.finalizacao_projeto);
        } catch (error) {
            setErro(error.response?.data?.erro || "Não foi possível concluir a etapa");
        } finally {
            setExecutando(false);
        }
    }

    async function salvarValorBase() {
        if (executando || carregando) return;
        setErro("")
        const vb = Number(valorBase)
        if (!valorBase.trim() || !Number.isFinite(vb) || vb <= 0) {
            setErro("Informe um valor base válido");
            return;
        }
        setExecutando(true);
        try {
            await api.post(`/projetos/${projetoAtual.proj_id}`, { valor_base: vb }, { headers: { Authorization: `Bearer ${token}` } });
            setFinalizacao(null);
            setValorBase("");
            await atualizarProjeto();
        } catch (error) {
            setErro(error.response?.data?.erro || "Não foi possível salvar o valor-base");
        } finally {
            setExecutando(false);
        }
    }

    async function finalizarProjeto() {
        if (executando || carregando) return;
        setErro("");
        setFinalizacao(null);
        setExecutando(true);
        try {
            await api.post(`/etapas/projeto/${projetoAtual.proj_id}/concluir`, null, { headers: { Authorization: `Bearer ${token}` } });
            await atualizarProjeto();
            setFinalizacao({ concluido: true, producao_encerrada: true })
        } catch (error) {
            setErro(error.response?.data?.erro || "Não foi possível finalizar o projeto");
        } finally {
            setExecutando(false);
        }
    }

    return (
        <Container>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, flexWrap: "wrap", mb: 3 }}>
                <Typography component="h1" variant="h5">{projetoAtual.nome}</Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    <Button onClick={aoVoltar} disabled={executando || carregando}>Voltar</Button>
                    <Button variant="outlined" disabled={carregando || executando} onClick={() => atualizarProjeto()}>{carregando ? "Atualizando..." : "Atualizar"}</Button>
                    {perfil === "Administrador" && <FuncionariosProjeto projeto={projetoAtual} token={token} ocupado={executando || carregando} aoOcupar={setExecutando} aoVincular={() => setAtualizacaoEquipe(atual => atual + 1)} />}
                </Box>
            </Box>
            <Box sx={{ p: { xs: 2, sm: 3 }, border: "1px solid", borderColor: "divider", bgcolor: "background.paper", borderRadius: 3, display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 3 }}>
                <Informacao titulo="Cliente">{projetoAtual.cliente?.nome || "Não informado"}</Informacao>
                <Informacao titulo="Porte">{projetoAtual.porte}</Informacao>
                <Informacao titulo="Status">{projetoAtual.status}</Informacao>
                <Informacao titulo="Tempo registrado" destaque>{tempo(segundosTotais)}</Informacao>
                {projetoAtual.valor_base != null && <Informacao titulo="Valor-base" destaque>{moeda(projetoAtual.valor_base)}</Informacao>}
                {projetoAtual.custo_mao_de_obra_final != null ? (
                    <Informacao titulo="Mão de obra final" destaque>{moeda(projetoAtual.custo_mao_de_obra_final)}</Informacao>
                ) : perfil === "Administrador" && (
                    <Informacao titulo="Mão de obra estimada" destaque>{custoEstimado == null ? "Aguardando equipe" : moeda(custoEstimado)}</Informacao>
                )}
                {projetoAtual.valor_final != null && <Informacao titulo="Valor final" destaque>{moeda(projetoAtual.valor_final)}</Informacao>}
            </Box>
            {perfil === "Administrador" && projetoAtual.custo_mao_de_obra_final == null && <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>Estimativa atualizada durante a execução com o custo por hora dos funcionários vinculados. O fechamento oficial é calculado pelo sistema.</Typography>}
            {erroAcompanhamento && <Alert severity="warning">{erroAcompanhamento}</Alert>}
            {perfil === "Administrador" && projetoAtual.valor_base === null && !["Concluído", "Cancelado"].includes(projetoAtual.status) && (
                <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap", my: 3 }}>
                    <TextField label="Valor-base (R$)" type="number" value={valorBase} onChange={event => setValorBase(event.target.value)} disabled={executando || carregando} />
                    <Button variant="contained" disabled={executando || carregando} onClick={salvarValorBase}>Salvar valor base</Button>
                </Box>
            )}
            {perfil === "Administrador" && <ManutencoesProjeto token={token} projeto={projetoAtual} ocupado={executando || carregando} />}
            <Typography component="h2" variant="h6" sx={{ mt: 4, mb: 2 }}>Etapas de produção</Typography>
            {projetoAtual.etapas.map(etapa => (
                <Box key={etapa.etapa_id} sx={{ p: { xs: 2, sm: 3 }, mb: 2, border: "1px solid", borderColor: etapa.status === "Em andamento" ? "#939d8f" : "divider", borderRadius: 3, bgcolor: "background.paper", display: "flex", alignItems: "center", gap: 3, flexWrap: "wrap" }}>
                    <Box sx={{ flex: "1 1 300px" }}>
                        <Typography component="h3" variant="h6" sx={{ mb: 2 }}>{etapa.tipo}</Typography>
                        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, 1fr)" }, gap: 2 }}>
                            <Informacao titulo="Status">{etapa.status}</Informacao>
                            <Informacao titulo="Tempo planejado">{etapa.tempo_planejado} min</Informacao>
                            <Informacao titulo="Tempo registrado">{tempo(Number(etapa.tempo_total_segundos ?? Number(etapa.tempo_total_minutos || 0) * 60) + (etapa.status === "Em andamento" ? acrescimo : 0))}</Informacao>
                        </Box>
                        {(etapa.excedeu_planejamento || Number(etapa.tempo_total_segundos || 0) + (etapa.status === "Em andamento" ? acrescimo : 0) > Number(etapa.tempo_planejado) * 60) && <Typography color="error" variant="caption" sx={{ mt: 1, display: "block" }}>Tempo planejado excedido</Typography>}
                    </Box>
                    {!["Concluído", "Cancelado"].includes(projetoAtual.status) && !projetoAtual.data_fim && (
                        <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end", flexWrap: "wrap", ml: "auto", borderLeft: { md: "1px solid" }, borderColor: "divider", pl: { md: 3 } }}>
                            {etapa.status === "Planejada" && <Button variant="contained" disabled={executando || carregando} onClick={() => iniciarEtapa(etapa.etapa_id)}>Iniciar</Button>}
                            {etapa.status === "Em andamento" && <Button variant="outlined" disabled={executando || carregando} onClick={() => pausarEtapa(etapa.etapa_id)}>Pausar</Button>}
                            {etapa.status === "Pausada" && <Button variant="outlined" disabled={executando || carregando} onClick={() => retomarEtapa(etapa.etapa_id)}>Retomar</Button>}
                            {etapa.status === "Em andamento" && <Button variant="contained" disabled={executando || carregando} onClick={() => concluirEtapa(etapa.etapa_id)}>Concluir</Button>}
                        </Box>
                    )}
                </Box>
            ))}
            {projetoAtual.data_fim && projetoAtual.valor_base != null && !["Concluído", "Cancelado"].includes(projetoAtual.status) && <Button variant="contained" disabled={executando || carregando} onClick={finalizarProjeto}>Finalizar projeto</Button>}
            {finalizacao?.producao_encerrada && <Alert severity={finalizacao.concluido ? "success" : "warning"}>{finalizacao.concluido ? "Projeto concluído" : finalizacao.motivo}</Alert>}
            {erro && <Alert severity="error">{erro}</Alert>}
        </Container>
    );
}
