import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import tema from "./tema.js";

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <ThemeProvider theme={tema}>
            <CssBaseline />
            <App />
        </ThemeProvider>
    </StrictMode>
);
