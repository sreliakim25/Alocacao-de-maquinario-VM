import { useState, useEffect, useRef } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    Card,
    CardContent,
    Stack,
    Alert,
    LinearProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tabs,
    Tab,
    Chip,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemText,
    TextField,
    MenuItem,
    IconButton,
    Autocomplete
} from '@mui/material';
import { CloudUpload, CheckCircle, Warning, Description, Delete, Search, Add } from '@mui/icons-material';
import * as XLSX from 'xlsx';
import api from '../services/api';

function TabPanel({ children, value, index, ...other }) {
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

// DataTable Component definido fora para evitar recriação, mas precisaria de props para os handlers
// Vamos definir dentro se for simples, ou passar callbacks.
// Para simplificar e manter estado do form de adição, faremos um componente dedicado.
const DataTable = ({ type, data, columns, onRefresh }) => {
    const [newItem, setNewItem] = useState('');
    const [newCargo, setNewCargo] = useState(''); // Supervisor
    const [newUgb, setNewUgb] = useState('');     // Supervisor/Vila
    const [newLider, setNewLider] = useState(''); // Supervisor
    const [newParent, setNewParent] = useState(''); // Geral (Vila/Tarefa)

    // Options for selects
    const [ugbs, setUgbs] = useState([]);
    const [supervisores, setSupervisores] = useState([]);
    const [subEtapas, setSubEtapas] = useState([]);

    // Identificar dependências para carregar opções
    useEffect(() => {
        const loadOptions = async () => {
            // Vila precisa de UGBs
            if (type === 'vila' || type === 'supervisor') {
                const u = await api.localizacoes.getUgbs();
                setUgbs(u);
            }
            // Tarefa precisa de SubEtapas
            if (type === 'tarefa') {
                const s = await api.localizacoes.getSubEtapas();
                setSubEtapas(s);
            }
            // Supervisor precisa de Líderes
            if (type === 'supervisor') {
                const sup = await api.localizacoes.getSupervisores();
                setSupervisores(sup);
            }
        };
        // Só carrega se for um tipo que precisa
        if (['vila', 'tarefa', 'supervisor'].includes(type)) {
            loadOptions();
        }
    }, [type]);

    const handleAdd = async () => {
        if (!newItem) return alert('Preencha o nome!');
        try {
            if (type === 'ugb') await api.localizacoes.createUgb(newItem);

            if (type === 'vila') {
                await api.localizacoes.createVila(newItem, newParent || null);
            }

            if (type === 'sub-etapa') await api.localizacoes.createSubEtapa(newItem);

            if (type === 'tarefa') {
                if (!newParent) return alert('Selecione uma Sub-Etapa!');
                await api.localizacoes.createTarefa(newParent, newItem);
            }

            if (type === 'supervisor') {
                let finalUgbId = newUgb ? (typeof newUgb === 'object' ? newUgb.id : newUgb) : null;
                let finalLiderId = newLider ? (typeof newLider === 'object' ? newLider.id : newLider) : null;

                // 1. Handle New UGB (String input)
                if (newUgb && typeof newUgb === 'string') {
                    // Check if it really doesn't exist (case insensitive check locally first?)
                    // Or just try to create. API creates distinct.
                    // Ideally we search in 'ugbs' list first.
                    const existingUgb = ugbs.find(u => u.nome.toLowerCase() === newUgb.toLowerCase());
                    if (existingUgb) {
                        finalUgbId = existingUgb.id;
                    } else {
                        // Create new UGB
                        const res = await api.localizacoes.createUgb(newUgb);
                        finalUgbId = res.id;
                        // Note: Depending on API response structure. createUgb returns { message, id }
                    }
                }

                // 2. Handle New Leader (String input)
                if (newLider && typeof newLider === 'string') {
                    const existingLider = supervisores.find(s => s.nome.toLowerCase() === newLider.toLowerCase());
                    if (existingLider) {
                        finalLiderId = existingLider.id;
                    } else {
                        // Create new Supervisor as Leader (no cargo, no ugb, no leader)
                        const res = await api.localizacoes.createSupervisor({ nome: newLider });
                        finalLiderId = res.id;
                    }
                }

                // Payload: nome, cargo, ugb_id, lider_id
                await api.localizacoes.createSupervisor({
                    nome: newItem,
                    ugb_id: finalUgbId,
                    lider_id: finalLiderId
                });
            }

            setNewItem('');
            setNewCargo('');
            setNewUgb(null); // Reset to null for Autocomplete
            setNewLider(null);
            setNewParent('');
            onRefresh();
        } catch (err) {
            alert('Erro ao criar: ' + err.message);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Tem certeza que deseja excluir?')) return;
        try {
            if (type === 'ugb') await api.localizacoes.deleteUgb(id);
            if (type === 'vila') await api.localizacoes.deleteVila(id);
            if (type === 'sub-etapa') await api.localizacoes.deleteSubEtapa(id);
            if (type === 'tarefa') await api.localizacoes.deleteTarefa(id);
            if (type === 'supervisor') await api.localizacoes.deleteSupervisor(id);
            onRefresh();
        } catch (err) {
            alert('Erro ao excluir: ' + err.message);
        }
    };

    // Filter logic per column
    const [filters, setFilters] = useState({});

    const filteredData = data.filter(row => {
        return columns.every(col => {
            const filterValue = filters[col.id]?.toLowerCase() || '';
            if (!filterValue) return true;
            const cellValue = String(row[col.id] || '').toLowerCase();
            return cellValue.includes(filterValue);
        });
    });

    return (
        <Box>
            {/* Form de Adição */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                <TextField
                    label={type === 'supervisor' ? 'Nome do Supervisor' : 'Nome'}
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    size="small"
                    sx={{ flexGrow: 1, minWidth: '200px' }}
                />

                {/* Campos Específicos de Supervisor */}
                {type === 'supervisor' && (
                    <>
                        <Autocomplete
                            value={newUgb}
                            onChange={(event, newValue) => {
                                // newValue can be null, string (create), or object {id, label}
                                setNewUgb(newValue);
                            }}
                            filterOptions={(options, params) => {
                                const filtered = options.filter(o => o.label.toLowerCase().includes(params.inputValue.toLowerCase()));
                                if (params.inputValue !== '' && !filtered.some(o => o.label.toLowerCase() === params.inputValue.toLowerCase())) {
                                    filtered.push({
                                        inputValue: params.inputValue,
                                        label: `Adicionar "${params.inputValue}"`,
                                        id: null,
                                        isNew: true
                                    });
                                }
                                return filtered;
                            }}
                            selectOnFocus
                            clearOnBlur
                            handleHomeEndKeys
                            options={ugbs.map(u => ({ label: u.nome, id: u.id }))}
                            getOptionLabel={(option) => {
                                if (typeof option === 'string') return option;
                                if (option.inputValue) return option.inputValue;
                                return option.label;
                            }}
                            renderOption={(props, option) => <li {...props}>{option.label}</li>}
                            freeSolo
                            size="small"
                            sx={{ minWidth: '200px' }}
                            renderInput={(params) => <TextField {...params} label="UGB" />}
                        />

                        <Autocomplete
                            value={newLider}
                            onChange={(event, newValue) => {
                                setNewLider(newValue);
                            }}
                            filterOptions={(options, params) => {
                                const filtered = options.filter(o => o.label.toLowerCase().includes(params.inputValue.toLowerCase()));
                                if (params.inputValue !== '' && !filtered.some(o => o.label.toLowerCase() === params.inputValue.toLowerCase())) {
                                    filtered.push({
                                        inputValue: params.inputValue,
                                        label: `Adicionar "${params.inputValue}"`,
                                        id: null,
                                        isNew: true
                                    });
                                }
                                return filtered;
                            }}
                            selectOnFocus
                            clearOnBlur
                            handleHomeEndKeys
                            options={supervisores.map(s => ({ label: s.nome, id: s.id }))}
                            getOptionLabel={(option) => {
                                if (typeof option === 'string') return option;
                                if (option.inputValue) return option.inputValue;
                                return option.label;
                            }}
                            renderOption={(props, option) => <li {...props}>{option.label}</li>}
                            freeSolo
                            size="small"
                            sx={{ minWidth: '200px' }}
                            renderInput={(params) => <TextField {...params} label="Lider" />}
                        />
                    </>
                )}

                {/* Campos de Pai Genérico (Vila/Tarefa) */}
                {(type === 'vila' || type === 'tarefa') && (
                    <TextField
                        select
                        label={type === 'vila' ? 'UGB Vinculada' : 'Sub Etapa Vinculada'}
                        value={newParent}
                        onChange={(e) => setNewParent(e.target.value)}
                        size="small"
                        sx={{ minWidth: '200px' }}
                    >
                        {type === 'vila' && ugbs.map(u => <MenuItem key={u.id} value={u.id}>{u.nome}</MenuItem>)}
                        {type === 'tarefa' && subEtapas.map(e => <MenuItem key={e.id} value={e.id}>{e.nome}</MenuItem>)}
                    </TextField>
                )}

                <Button variant="contained" startIcon={<Add />} onClick={handleAdd}>Adicionar</Button>
            </Box>

            <Divider sx={{ mb: 2 }} />

            {/* Filtros por Coluna (Modo Cascata) */}
            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                {columns.map(col => {
                    // Logic to populate options based on column ID
                    let options = [];
                    let disabled = false;

                    if (col.id === 'ugb_nome') {
                        options = ugbs.map(u => ({ id: u.nome, label: u.nome })); // Filter by Name value
                    } else if (col.id === 'lider_nome') {
                        // Cascading: Filter Leaders by selected UGB Filter if present
                        const selectedUgbFilter = filters['ugb_nome'];
                        const selectedUgb = ugbs.find(u => u.nome === selectedUgbFilter);

                        options = supervisores
                            .filter(s => !selectedUgb || s.ugb_id === selectedUgb.id)
                            .map(s => ({ id: s.nome, label: s.nome }));
                    } else if (col.id === 'ugb_vinculada') { // Vila
                        options = ugbs.map(u => ({ id: u.nome, label: u.nome }));
                    } else if (col.id === 'sub_etapa_nome') { // Tarefa
                        options = subEtapas.map(s => ({ id: s.nome, label: s.nome }));
                    } else if (col.id === 'nome') {
                        // For 'nome', we can use unique values from data or keep Text Search if list is too big?
                        // User requested "options". Let's try unique values from current full dataset.
                        const uniqueNames = [...new Set(data.map(d => d.nome))].sort();
                        options = uniqueNames.map(n => ({ id: n, label: n }));
                    }

                    // If we have options, render Select, else Render Text (failsafe)
                    if (options.length > 0 || col.id === 'nome') {
                        return (
                            <TextField
                                key={col.id}
                                select
                                label={`Filtrar por ${col.label}`}
                                size="small"
                                value={filters[col.id] || ''}
                                onChange={(e) => setFilters(prev => ({ ...prev, [col.id]: e.target.value }))}
                                sx={{ minWidth: '200px', flexGrow: 1 }}
                            >
                                <MenuItem value=""><em>Todos</em></MenuItem>
                                {options.map(opt => (
                                    <MenuItem key={opt.id} value={opt.id}>{opt.label}</MenuItem>
                                ))}
                            </TextField>
                        )
                    } else {
                        return (
                            <TextField
                                key={col.id}
                                label={`Filtrar por ${col.label}`}
                                size="small"
                                value={filters[col.id] || ''}
                                onChange={(e) => setFilters(prev => ({ ...prev, [col.id]: e.target.value }))}
                                InputProps={{
                                    startAdornment: <Search fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                                }}
                                sx={{ minWidth: '200px', flexGrow: 1 }}
                            />
                        )
                    }
                })}
            </Box>

            {/* Tabela */}
            <TableContainer>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            {columns.map(col => <TableCell key={col.id} sx={{ fontWeight: 'bold' }}>{col.label}</TableCell>)}
                            <TableCell align="right">Ações</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredData.map(row => (
                            <TableRow key={row.id}>
                                {columns.map(col => <TableCell key={col.id}>{row[col.id]}</TableCell>)}
                                <TableCell align="right">
                                    <IconButton size="small" color="error" onClick={() => handleDelete(row.id)}>
                                        <Delete fontSize="small" />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredData.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={columns.length + 1} align="center">Nenhum registro encontrado</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box >
    );
};

export default function Cadastros() {
    const fileInputRef = useRef(null);
    const [activeTab, setActiveTab] = useState(0);
    const [file, setFile] = useState(null);
    const [rows, setRows] = useState([]);
    const [loadingData, setLoadingData] = useState(false);
    const [previewData, setPreviewData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [importStats, setImportStats] = useState(null);
    const [analysisStats, setAnalysisStats] = useState(null);
    const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
    const [fullDataToImport, setFullDataToImport] = useState(null);
    const [importType, setImportType] = useState('empreendimentos');

    // Fetch data when tab changes
    const fetchData = async (tabIndex) => {
        setLoadingData(true);
        try {
            let data = [];
            if (tabIndex === 1) data = await api.localizacoes.getUgbs();
            if (tabIndex === 2) data = await api.localizacoes.getVilas();
            if (tabIndex === 3) data = await api.localizacoes.getSubEtapas();
            if (tabIndex === 4) data = await api.localizacoes.getTarefas();
            if (tabIndex === 5) data = await api.localizacoes.getSupervisores();
            setRows(data);
        } catch (err) {
            console.error(err);
            alert('Erro ao carregar dados: ' + err.message);
        } finally {
            setLoadingData(false);
        }
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
        if (newValue > 0) fetchData(newValue);
    };

    const handleFileSelect = (e) => {
        const uploadedFile = e.target.files[0];
        if (!uploadedFile) return;

        // Detect Type based on FILENAME
        const fileName = uploadedFile.name.toLowerCase();
        if (fileName.includes('supervisores')) {
            setImportType('supervisores');
        } else {
            setImportType('empreendimentos');
        }

        setFile(uploadedFile);
        setError('');
        setSuccess('');
        setImportStats(null);
        setPreviewData([]);

        const reader = new FileReader();
        reader.onload = (evt) => {
            const data = evt.target.result;
            let jsonData = [];
            try {
                if (uploadedFile.name.endsWith('.csv')) {
                    // Simple CSV parser or use library. We imported XLSX, let's use it for CSV too if possible or minimal logic
                    // Assuming xlsx handles csv
                    const wb = XLSX.read(data, { type: 'binary' });
                    const ws = wb.Sheets[wb.SheetNames[0]];
                    jsonData = XLSX.utils.sheet_to_json(ws);
                } else {
                    const workbook = XLSX.read(data, { type: 'binary' });
                    const sheetName = workbook.SheetNames[0];
                    const sheet = workbook.Sheets[sheetName];
                    jsonData = XLSX.utils.sheet_to_json(sheet, { defval: "" });
                }
                setPreviewData(jsonData.slice(0, 10));
                setFullDataToImport(jsonData); // Store temporarily, or re-read on analyze (safer to reuse)
            } catch (err) {
                setError('Erro ao ler arquivo: ' + err.message);
            }
        };
        reader.readAsBinaryString(uploadedFile);
    };

    const handleAnalyze = async () => {
        if (!fullDataToImport) return;
        setLoading(true);
        try {
            // Dry Run
            const response = await api.localizacoes.importMaster(fullDataToImport, true, importType);
            setAnalysisStats(response.stats);
            setOpenConfirmDialog(true);
        } catch (err) {
            console.error('Erro na análise:', err);
            setError('Falha ao analisar arquivo: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmImport = async () => {
        setOpenConfirmDialog(false);
        setLoading(true);
        try {
            const response = await api.localizacoes.importMaster(fullDataToImport, false, importType);
            setSuccess('Importação concluída com sucesso!');
            setImportStats(response.stats); // { ugbs: X, vilas: Y ... }
            setFile(null);
            setPreviewData([]);
            setFullDataToImport(null);
        } catch (err) {
            console.error('Erro na importação final:', err);
            setError('Falha ao salvar dados: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    const clearFile = () => {
        setFile(null);
        setPreviewData([]);
        setError('');
        setSuccess('');
        setFullDataToImport(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <Box>
            <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold', color: '#D9A441' }}>
                Central de Cadastros
            </Typography>

            <Paper sx={{ width: '100%', mb: 2, bgcolor: '#1e1e1e' }}>
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    indicatorColor="secondary"
                    textColor="secondary"
                    variant="scrollable"
                    scrollButtons="auto"
                >
                    <Tab label="Importação em Massa" />
                    <Tab label="UGBs (Contas)" />
                    <Tab label="Vilas" />
                    <Tab label="Sub Etapas (Etapas)" />
                    <Tab label="Tarefas" />
                    <Tab label="Supervisores" />
                </Tabs>
            </Paper>

            <TabPanel value={activeTab} index={0}>
                <Card sx={{ bgcolor: '#1e1e1e', mb: 3 }}>
                    <CardContent>
                        <input
                            type="file"
                            hidden
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                        />

                        {file && (
                            <Chip
                                icon={<Description />}
                                label={file.name}
                                onDelete={clearFile}
                                color="default"
                                sx={{ mb: 2 }}
                            />
                        )}

                        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                            <Button
                                variant="contained"
                                color="secondary"
                                startIcon={<CloudUpload />}
                                onClick={() => fileInputRef.current.click()}
                            >
                                Selecionar Planilha (Excel/CSV)
                            </Button>

                            <Button
                                variant="outlined"
                                color="error"
                                startIcon={<Delete />}
                                onClick={async () => {
                                    if (window.confirm('Resetar banco de dados? Isso apagará TUDO.')) {
                                        setLoading(true);
                                        await api.localizacoes.resetDatabase();
                                        setLoading(false);
                                        setSuccess('Banco resetado.');
                                    }
                                }}
                            >
                                Limpar Tudo (Resetar Banco)
                            </Button>
                        </Box>

                        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                        {success && importStats && (
                            <Alert severity="success" sx={{ mb: 2 }} icon={<CheckCircle />}>
                                {success}
                                <Box sx={{ mt: 1, fontSize: '0.9em' }}>
                                    <ul>
                                        <li>UGBs: {importStats.ugbs}</li>
                                        <li>Vilas: {importStats.vilas}</li>
                                        <li>Sub Etapas: {importStats.sub_etapas}</li>
                                        <li>Tarefas: {importStats.tarefas}</li>
                                        <li>Supervisores: {importStats.supervisores}</li>
                                    </ul>
                                </Box>
                            </Alert>
                        )}

                        {loading && <LinearProgress color="secondary" sx={{ mb: 2 }} />}

                        {!file && !success && (
                            <Alert severity="info" icon={<Warning />}>
                                {importType === 'supervisores' ? (
                                    <span>Planilha de <strong>Supervisores</strong> detectada. Colunas: <strong>UGB, Líder Direto, Colaborador, Cargo</strong>.</span>
                                ) : (
                                    <span>Planilha de <strong>Empreendimentos</strong> detectada. Colunas: <strong>UGB, Vila, Sub Etapa, Tarefa</strong>.</span>
                                )}
                            </Alert>
                        )}

                        {previewData.length > 0 && (
                            <>
                                <Divider sx={{ my: 2 }} >
                                    <Chip label="Pré-visualização (10 linhas)" />
                                </Divider>
                                <TableContainer sx={{ maxHeight: 400 }}>
                                    <Table size="small" stickyHeader>
                                        <TableHead>
                                            <TableRow>
                                                {Object.keys(previewData[0]).map((header) => (
                                                    <TableCell key={header} sx={{ bgcolor: '#333', fontWeight: 'bold' }}>{header}</TableCell>
                                                ))}
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {previewData.map((row, idx) => (
                                                <TableRow key={idx}>
                                                    {Object.values(row).map((val, i) => (
                                                        <TableCell key={i}>{val}</TableCell>
                                                    ))}
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                                    <Button variant="contained" color="primary" onClick={handleAnalyze} disabled={loading}>
                                        Analisar Planilha
                                    </Button>
                                </Box>
                            </>
                        )}

                    </CardContent>
                </Card>
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
                <Card sx={{ bgcolor: '#1e1e1e' }}>
                    <CardContent>
                        {loadingData ? <LinearProgress /> :
                            <DataTable
                                type="ugb"
                                data={rows}
                                columns={[{ id: 'nome', label: 'Nome da UGB' }]}
                                onRefresh={() => fetchData(1)}
                            />
                        }
                    </CardContent>
                </Card>
            </TabPanel>

            <TabPanel value={activeTab} index={2}>
                <Card sx={{ bgcolor: '#1e1e1e' }}>
                    <CardContent>
                        {loadingData ? <LinearProgress /> :
                            <DataTable
                                type="vila"
                                data={rows}
                                columns={[
                                    { id: 'nome', label: 'Nome da Vila' },
                                    { id: 'ugb_nome', label: 'UGB Vinculada' }
                                ]}
                                onRefresh={() => fetchData(2)}
                            />
                        }
                    </CardContent>
                </Card>
            </TabPanel>

            <TabPanel value={activeTab} index={3}>
                <Card sx={{ bgcolor: '#1e1e1e' }}>
                    <CardContent>
                        {loadingData ? <LinearProgress /> :
                            <DataTable
                                type="sub-etapa"
                                data={rows}
                                columns={[{ id: 'nome', label: 'Nome da Sub Etapa' }]}
                                onRefresh={() => fetchData(3)}
                            />
                        }
                    </CardContent>
                </Card>
            </TabPanel>

            <TabPanel value={activeTab} index={4}>
                <Card sx={{ bgcolor: '#1e1e1e' }}>
                    <CardContent>
                        {loadingData ? <LinearProgress /> :
                            <DataTable
                                type="tarefa"
                                data={rows}
                                columns={[
                                    { id: 'nome', label: 'Nome da Tarefa' },
                                    { id: 'sub_etapa_nome', label: 'Sub Etapa Vinculada' }
                                ]}
                                onRefresh={() => fetchData(4)}
                            />
                        }
                    </CardContent>
                </Card>
            </TabPanel>

            <TabPanel value={activeTab} index={5}>
                <Card sx={{ bgcolor: '#1e1e1e' }}>
                    <CardContent>
                        {loadingData ? <LinearProgress /> :
                            <DataTable
                                type="supervisor"
                                data={rows}
                                columns={[
                                    { id: 'nome', label: 'Supervisor' },
                                    // { id: 'cargo', label: 'Cargo' }, // Removido a pedido
                                    { id: 'ugb_nome', label: 'UGB' },
                                    { id: 'lider_nome', label: 'Lider' }
                                ]}
                                onRefresh={() => fetchData(5)}
                            />
                        }
                    </CardContent>
                </Card>
            </TabPanel>

            {/* Confirm Dialog */}
            <Dialog open={openConfirmDialog} onClose={() => setOpenConfirmDialog(false)} PaperProps={{ style: { backgroundColor: '#1e1e1e', color: 'white' } }}>
                <DialogTitle sx={{ color: '#D9A441' }}>Confirmar Importação de {importType === 'supervisores' ? 'Supervisores' : 'Empreendimentos'}?</DialogTitle>
                <DialogContent>
                    <Typography>Novos registros a serem criados:</Typography>
                    {analysisStats && (
                        <Box sx={{ bgcolor: '#333', p: 2, borderRadius: 1, mt: 1 }}>
                            <ul>
                                <li>UGBs: {analysisStats.ugbs}</li>
                                <li>Vilas: {analysisStats.vilas}</li>
                                <li>Sub Etapas: {analysisStats.sub_etapas}</li>
                                <li>Tarefas: {analysisStats.tarefas}</li>
                                <li>Supervisores: {analysisStats.supervisores}</li>
                            </ul>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenConfirmDialog(false)} color="inherit">Cancelar</Button>
                    <Button onClick={handleConfirmImport} variant="contained" color="primary">Confirmar</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
