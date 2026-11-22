import { useEffect, useState } from "react";
import api from "./api.js";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import FormularioManutencao from "./FormularioManutencao.jsx";
import Informacao from "./Informacao.jsx";

export default function ManutencoesProjeto({ token, projeto, ocupado = false }) {
    const [manutencoes, setManutencoes] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState("");
    const [atualizacao, setAtualizacao] = useState(0);
    const [formulario, setFormulario] = useState(null);

    useEffect(() => {
        let ativo = true;
        async function buscarManutencoes() {
            setCarregando(true);
            setErro("");
            try {
                const response = await api.get("/manutencoes", {
                    headers: { Authorization: `Bearer ${token}` }, params: { proj_id: projeto.proj_id }
                });
                if (ativo) setManutencoes(response.data);
            } catch (error) {
                if (ativo) setErro(error.response?.data?.erro || "Não foi possível carregar as manutenções do projeto");
            } finally {
                if (ativo) setCarregando(false);
            }
        }
        buscarManutencoes();
        return () => { ativo = false; };
    }, [token, projeto.proj_id, atualizacao]);

    function abrirFormulario(manutencao = null, resolver = false) {
        setSucesso("");
        setFormulario({ manutencao, resolver });
    }

    function manutencaoSalva() {
        setSucesso(formulario.resolver ? "Manutenção resolvida com sucesso" : formulario.manutencao ? "Manutenção atualizada com sucesso" : "Manutenção cadastrada com sucesso");
        setFormulario(null);
        setAtualizacao(atual => atual + 1);
    }

    return (
        <Box component="section" aria-labelledby="titulo-manutencoes-projeto" sx={{ my: 2 }}>
            <Button variant="outlined" type="button" onClick={() => abrirFormulario()} disabled={ocupado}>Registrar manutenção</Button>
            {sucesso && <Alert severity="success">{sucesso}</Alert>}
            {erro && <Alert severity="error">{erro}</Alert>}
            {carregando && <Typography>Carregando manutenções...</Typography>}
            <Box component="details" sx={{ mt: 2, p: 2, bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
                <Box id="titulo-manutencoes-projeto" component="summary" sx={{ cursor: "pointer", fontWeight: 600 }}>Manutenções realizadas ({manutencoes.length})</Box>
            <Button type="button" onClick={() => setAtualizacao(atual => atual + 1)} disabled={ocupado || carregando}>Atualizar manutenções</Button>
            {!carregando && !erro && (
                <>
                    {manutencoes.length === 0 && <Typography>Nenhuma manutenção registrada neste projeto</Typography>}
                    {manutencoes.map(item => (
                        <Box key={item.mntnc_id} sx={{ p: 2, mt: 2, borderTop: "1px solid", borderColor: "divider" }}>
                            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, 1fr)" }, gap: 2 }}>
                                <Informacao titulo="Motivo">{item.motivo}</Informacao>
                                <Informacao titulo="Status">{item.status}</Informacao>
                                <Informacao titulo="Retorno">{item.data_retorno.split("-").reverse().join("/")}</Informacao>
                            </Box>
                            <Box sx={{ my: 2, whiteSpace: "pre-wrap" }}><Informacao titulo="Descrição">{item.descricao}</Informacao></Box>
                            {item.data_conclusao && <Typography>Conclusão: {item.data_conclusao.split("-").reverse().join("/")}</Typography>}
                            <Button type="button" onClick={() => abrirFormulario(item)} disabled={ocupado}>Editar manutenção</Button>
                            {item.status === "Aberta" && <Button type="button" onClick={() => abrirFormulario(item, true)} disabled={ocupado}>Resolver manutenção</Button>}
                        </Box>
                    ))}
                </>
            )}
            </Box>
            <Dialog open={Boolean(formulario)} aria-labelledby="titulo-formulario-manutencao" fullWidth maxWidth="sm">
                <DialogTitle id="titulo-formulario-manutencao">Manutenção de {projeto.nome}</DialogTitle>
                <DialogContent dividers>
                    {formulario && (
                        <FormularioManutencao
                            token={token}
                            projeto={projeto}
                            manutencao={formulario.manutencao}
                            resolver={formulario.resolver}
                            aoSalvar={manutencaoSalva}
                            aoCancelar={() => setFormulario(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </Box>
    );
}
