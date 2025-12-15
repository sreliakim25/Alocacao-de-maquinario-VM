require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { db } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3005',
    credentials: true
}));
app.use(express.json());

// Rotas
const authRoutes = require('./routes/auth');
const usuariosRoutes = require('./routes/usuarios');
const maquinasRoutes = require('./routes/maquinas');
const localizacoesRoutes = require('./routes/localizacoes');
const apontamentosRoutes = require('./routes/apontamentos');

app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/maquinas', maquinasRoutes);
app.use('/api/localizacoes', localizacoesRoutes);
app.use('/api/apontamentos', apontamentosRoutes);

// Rota de health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: 'connected'
    });
});

// Rota raiz
app.get('/', (req, res) => {
    res.json({
        message: 'API do Sistema de Apontamento de Maquinários',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            health: '/health'
        }
    });
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Erro interno do servidor',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 Frontend permitido: ${process.env.FRONTEND_URL || 'http://localhost:3005'}`);
});

module.exports = app;
