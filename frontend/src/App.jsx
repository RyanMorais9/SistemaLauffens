import { useState } from "react";
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Login from './Login.jsx';

export default function App() {
    const [token, setToken] = useState("");

    return (
        <Container maxWidth={false} disableGutters>
            {!token ? (
                <Login aoEntrar={setToken} />
            ) : (
                <Typography>Você entrou no sistema.</Typography>
            )}
        </Container>
    );
}
