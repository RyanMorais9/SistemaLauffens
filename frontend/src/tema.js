import { createTheme } from "@mui/material/styles";

const tema = createTheme({
    palette: {
        primary: { main: "#242424" },
        background: { default: "#f5f5f3", paper: "#ffffff" },
        text: { primary: "#242424", secondary: "#666b70" },
        divider: "#e5e6e3"
    },
    shape: { borderRadius: 6 },
    typography: {
        fontFamily: "Helvetica, Arial, sans-serif",
        h5: { fontWeight: 650, letterSpacing: "-0.025em", marginBottom: 8 },
        h6: { fontWeight: 600, fontSize: "1.1rem" },
        button: { textTransform: "none", fontWeight: 600 }
    },
    components: {
        MuiCssBaseline: { styleOverrides: { body: { overflowWrap: "anywhere" }, "#root": { minHeight: "100dvh" } } },
        MuiButton: { styleOverrides: { root: { borderRadius: 8, minHeight: 40, "@media (max-width: 599.95px)": { minHeight: 44, maxWidth: "100%" } }, contained: { boxShadow: "none" } } },
        MuiOutlinedInput: { styleOverrides: { root: { backgroundColor: "#fff", borderRadius: 10 } } },
        MuiIconButton: { styleOverrides: { root: { "@media (max-width: 599.95px)": { minHeight: 44, minWidth: 44 } } } },
        MuiDialog: { styleOverrides: { paper: { borderRadius: 20, "@media (max-width: 599.95px)": { margin: 16, maxWidth: "calc(100% - 32px)", maxHeight: "calc(100dvh - 32px)" } } } },
        MuiDialogTitle: { styleOverrides: { root: { fontWeight: 600, padding: "24px 24px 16px" } } },
        MuiDialogContent: { styleOverrides: { root: { padding: 24 } } },
        MuiDialogActions: { styleOverrides: { root: { padding: "12px 24px 20px" } } },
        MuiAlert: { styleOverrides: { root: { marginTop: 12, marginBottom: 12, borderRadius: 10 } } }
    }
});

export default tema;
