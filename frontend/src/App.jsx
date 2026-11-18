import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Login from './Login.jsx';

export default function App() {
    return (
        <Container maxWidth="sm" sx={{ py: 4 }}>
            <Typography variant="h4" align="center" sx={{ mb: 3 }}>
                Sistema Lauffens
            </Typography>
            <Login />
        </Container>
    );
}
