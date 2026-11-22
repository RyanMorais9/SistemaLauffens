import { useEffect, useState } from "react";
import api from "./api.js";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";

export default function AvisosDispositivo({ token }) {
    const [ocupado, setOcupado] = useState(false);
    const [inscrito, setInscrito] = useState(false);
    const [erro, setErro] = useState("");
    const [mensagem, setMensagem] = useState("");
    const suportado = window.isSecureContext && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

    useEffect(() => {
        if (!suportado) return;
        let ativo = true;
        async function verificarInscricao() {
            try {
                const registro = await navigator.serviceWorker.getRegistration(new URL("./", document.baseURI).href);
                const inscricao = registro ? await registro.pushManager.getSubscription() : null;
                if (ativo) setInscrito(Boolean(inscricao));
            } catch {
                if (ativo) setErro("Não foi possível consultar a inscrição deste navegador");
            }
        }
        verificarInscricao();
        return () => { ativo = false; };
    }, [suportado]);

    async function habilitar() {
        if (ocupado || !suportado) return;
        setOcupado(true);
        setErro("");
        setMensagem("");
        try {
            const permissao = await Notification.requestPermission();
            if (permissao !== "granted") {
                setErro("Permita as notificações nas configurações do navegador para receber os avisos");
                return;
            }
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await api.get("/notificacoes/push/chave-publica", config);
            const chave = response.data.chavePublica;
            const base64 = chave.replace(/-/g, "+").replace(/_/g, "/");
            const bytes = Uint8Array.from(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")), caractere => caractere.charCodeAt(0));
            await navigator.serviceWorker.register(new URL("sw-notificacoes.js", document.baseURI).href);
            const registro = await navigator.serviceWorker.ready;
            let inscricao = await registro.pushManager.getSubscription();
            if (!inscricao) inscricao = await registro.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: bytes });
            setInscrito(true);
            await api.post("/notificacoes/push/inscricao", inscricao.toJSON(), config);
            setMensagem("Notificações habilitadas para sua conta neste dispositivo");
        } catch (error) {
            setErro(error.response?.data?.erro || "Não foi possível habilitar os avisos neste navegador");
        } finally {
            setOcupado(false);
        }
    }

    async function desabilitar() {
        if (ocupado || !suportado) return;
        setOcupado(true);
        setErro("");
        setMensagem("");
        try {
            const registro = await navigator.serviceWorker.getRegistration(new URL("./", document.baseURI).href);
            const inscricao = registro ? await registro.pushManager.getSubscription() : null;
            if (inscricao) {
                await api.delete("/notificacoes/push/inscricao", {
                    headers: { Authorization: `Bearer ${token}` }, data: inscricao.toJSON()
                });
                const removida = await inscricao.unsubscribe();
                if (!removida) throw new Error("Não foi possível remover a inscrição");
            }
            setInscrito(false);
            setMensagem("Notificações desabilitadas neste dispositivo");
        } catch (error) {
            setErro(error.response?.data?.erro || "Não foi possível desabilitar os avisos neste navegador");
        } finally {
            setOcupado(false);
        }
    }

    return (
        <Box sx={{ my: 2, p: 2, border: "1px solid #ddd" }}>
            <Typography component="h2" variant="h6">Avisos neste dispositivo</Typography>
            {suportado ? (
                <>
                    <Typography>{inscrito ? "Este navegador possui uma inscrição. Use Habilitar para associá-la à sua conta atual." : "Habilite para receber os avisos mesmo fora desta tela."}</Typography>
                    <Typography>Os avisos da conta são enviados ao último dispositivo habilitado.</Typography>
                    <Button onClick={habilitar} disabled={ocupado}>Habilitar notificações</Button>
                    <Button onClick={desabilitar} disabled={ocupado || !inscrito}>Desabilitar notificações</Button>
                </>
            ) : (
                <Typography>Os avisos push exigem um navegador compatível e HTTPS ou localhost. A central abaixo continua disponível.</Typography>
            )}
            {ocupado && <Typography>Atualizando inscrição...</Typography>}
            {erro && <Alert severity="error">{erro}</Alert>}
            {mensagem && <Alert severity="success">{mensagem}</Alert>}
        </Box>
    );
}
