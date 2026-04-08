require('dotenv').config();
const express = require('express');
const cors = require('cors');
require('./config/supabase'); // inicializa cliente Supabase

const app = express();
const PORT = process.env.PORT || 3001;

// Origens permitidas
// FRONTEND_URL aceita múltiplas URLs separadas por vírgula
// Ex: https://meuapp.vercel.app,https://www.rochadev.com,https://rochadev.com
const extraOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map(u => u.trim()).filter(Boolean)
    : [];

const allowedOrigins = [
    // Desenvolvimento local
    /^http:\/\/localhost:\d+$/,
    // URLs de produção (suporta múltiplas separadas por vírgula)
    ...extraOrigins,
    // Qualquer preview/branch deploy do Vercel do mesmo projeto
    ...(process.env.VERCEL_PROJECT ? [new RegExp(`^https:\\/\\/${process.env.VERCEL_PROJECT}-.*\\.vercel\\.app$`)] : []),
];

app.use(cors({
    origin: function (origin, callback) {
        // Permitir requisições sem origin (apps móveis, curl, Postman)
        if (!origin) return callback(null, true);

        const allowed = allowedOrigins.some(o =>
            o instanceof RegExp ? o.test(origin) : o === origin
        );

        if (allowed) return callback(null, true);
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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
