import { useMemo } from 'react';
import { differenceInHours, differenceInMinutes, parseISO, subDays } from 'date-fns';
import useApontamentoStore from '../store/apontamentoStore';
import useMaquinarioStore from '../store/maquinarioStore';
import useAuthStore from '../store/authStore';

const useKPIs = () => {
    const { apontamentos } = useApontamentoStore();
    const { maquinarios } = useMaquinarioStore();
    const { user } = useAuthStore();

    // 1. Status Distribution
    const statusDistribution = useMemo(() => {
        const distribution = {};
        apontamentos.forEach(apt => {
            distribution[apt.status] = (distribution[apt.status] || 0) + 1;
        });

        return {
            total: apontamentos.length,
            byStatus: distribution,
            percentages: Object.keys(distribution).reduce((acc, status) => {
                acc[status] = ((distribution[status] / apontamentos.length) * 100).toFixed(1);
                return acc;
            }, {})
        };
    }, [apontamentos]);

    // 2. Urgent Alerts
    const urgentAlerts = useMemo(() => {
        const now = new Date();
        const alerts = {
            critical: [], // >8h atrasado
            urgent: [],   // <2h para vencer SLA
            pending: []   // Pendente para o usuário
        };

        apontamentos.forEach(apt => {
            // Simular dataCriacao se não existir
            const createdAt = apt.dataCriacao ? parseISO(apt.dataCriacao) : subDays(now, 1);
            const hoursElapsed = differenceInHours(now, createdAt);

            // Crítico: >8h em qualquer status não final
            if (hoursElapsed > 8 && apt.status !== 'aprovado') {
                alerts.critical.push({ ...apt, hoursElapsed });
            }
            // Urgente: entre 10-12h (próximo do limite de 12h)
            else if (hoursElapsed > 10 && apt.status !== 'aprovado') {
                alerts.urgent.push({ ...apt, hoursElapsed });
            }

            // Pendente para o usuário
            if (user && apt.apontadorId === user.id && apt.status.includes('pendente')) {
                alerts.pending.push(apt);
            }
        });

        return alerts;
    }, [apontamentos, user]);

    // 3. SLA Compliance
    const slaCompliance = useMemo(() => {
        const now = new Date();
        let compliant = 0;
        let atRisk = 0;
        let violated = 0;

        apontamentos.forEach(apt => {
            const createdAt = apt.dataCriacao ? parseISO(apt.dataCriacao) : subDays(now, 1);
            const hoursElapsed = differenceInHours(now, createdAt);

            if (apt.status === 'aprovado') {
                // Se aprovado, verificar se foi dentro de 12h
                if (hoursElapsed <= 12) compliant++;
                else violated++;
            } else {
                // Se não aprovado
                if (hoursElapsed > 12) violated++;
                else if (hoursElapsed > 10) atRisk++;
                else compliant++;
            }
        });

        const total = apontamentos.length || 1;
        return {
            compliant,
            atRisk,
            violated,
            complianceRate: ((compliant / total) * 100).toFixed(1),
            total
        };
    }, [apontamentos]);

    // 4. Machinery Activity (último mês)
    const machineryActivity = useMemo(() => {
        const thirtyDaysAgo = subDays(new Date(), 30);
        const activeMachines = new Set();
        const allMachines = new Set(maquinarios.map(m => m.nome));

        apontamentos.forEach(apt => {
            const aptDate = apt.dataCriacao ? parseISO(apt.dataCriacao) : new Date();
            if (aptDate >= thirtyDaysAgo) {
                activeMachines.add(apt.maquina);
            }
        });

        const inactive = Array.from(allMachines).filter(m => !activeMachines.has(m));

        return {
            active: activeMachines.size,
            total: allMachines.size,
            activationRate: allMachines.size > 0
                ? ((activeMachines.size / allMachines.size) * 100).toFixed(1)
                : 0,
            inactiveMachines: inactive
        };
    }, [apontamentos, maquinarios]);

    // 5. Productivity
    const productivity = useMemo(() => {
        const totalHours = apontamentos.reduce((sum, apt) => sum + parseFloat(apt.totalHoras || 0), 0);
        const byMachine = {};
        const byType = {};

        apontamentos.forEach(apt => {
            const hours = parseFloat(apt.totalHoras || 0);
            byMachine[apt.maquina] = (byMachine[apt.maquina] || 0) + hours;

            // Extrair tipo da máquina
            const tipo = maquinarios.find(m => m.nome === apt.maquina)?.tipo || 'Outros';
            byType[tipo] = (byType[tipo] || 0) + hours;
        });

        // Top 5 máquinas
        const top5 = Object.entries(byMachine)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([machine, hours]) => ({ machine, hours }));

        return {
            totalHours: totalHours.toFixed(1),
            byMachine,
            byType,
            top5Machines: top5
        };
    }, [apontamentos, maquinarios]);

    // 6. Team Performance
    const teamPerformance = useMemo(() => {
        const apontadores = {};

        apontamentos.forEach(apt => {
            const apontadorId = apt.apontadorId;
            if (!apontadores[apontadorId]) {
                apontadores[apontadorId] = {
                    nome: apt.apontadorNome || 'Desconhecido',
                    total: 0,
                    devolvidos: 0,
                    aprovados: 0
                };
            }
            apontadores[apontadorId].total++;
            if (apt.status.includes('pendente')) apontadores[apontadorId].devolvidos++;
            if (apt.status === 'aprovado') apontadores[apontadorId].aprovados++;
        });

        return Object.entries(apontadores).map(([id, data]) => ({
            id,
            ...data,
            taxaDevolucao: data.total > 0 ? ((data.devolvidos / data.total) * 100).toFixed(1) : 0,
            taxaAprovacao: data.total > 0 ? ((data.aprovados / data.total) * 100).toFixed(1) : 0
        }));
    }, [apontamentos]);

    // 7. Checklist Status
    const checklistStatus = useMemo(() => {
        const now = new Date();
        const emDia = [];
        const aVencer = [];
        const vencidos = [];

        maquinarios.forEach(maq => {
            if (maq.proximoChecklist) {
                const proxData = parseISO(maq.proximoChecklist);
                const diasRestantes = Math.ceil((proxData - now) / (1000 * 60 * 60 * 24));

                if (diasRestantes < 0) {
                    vencidos.push({ ...maq, diasRestantes: Math.abs(diasRestantes) });
                } else if (diasRestantes <= 7) {
                    aVencer.push({ ...maq, diasRestantes });
                } else {
                    emDia.push({ ...maq, diasRestantes });
                }
            }
        });

        return {
            emDia: emDia.length,
            aVencer: aVencer.length,
            vencidos: vencidos.length,
            total: maquinarios.length,
            lista: { emDia, aVencer, vencidos }
        };
    }, [maquinarios]);

    // 8. Trends & Historical (últimos 7 dias)
    const trends = useMemo(() => {
        const now = new Date();
        const last7Days = [];
        const dailyData = {};

        // Inicializar últimos 7 dias
        for (let i = 6; i >= 0; i--) {
            const date = subDays(now, i);
            const dateKey = date.toISOString().split('T')[0];
            last7Days.push(dateKey);
            dailyData[dateKey] = {
                date: dateKey,
                total: 0,
                aprovados: 0,
                pendentes: 0,
                horas: 0
            };
        }

        // Preencher com dados
        apontamentos.forEach(apt => {
            const aptDate = (apt.data || apt.dataCriacao || '').split('T')[0];
            if (dailyData[aptDate]) {
                dailyData[aptDate].total++;
                dailyData[aptDate].horas += parseFloat(apt.totalHoras || 0);
                if (apt.status === 'aprovado') dailyData[aptDate].aprovados++;
                if (apt.status.includes('pendente')) dailyData[aptDate].pendentes++;
            }
        });

        const chartData = last7Days.map(date => dailyData[date]);

        return {
            last7Days: chartData,
            totalThisWeek: chartData.reduce((sum, day) => sum + day.total, 0),
            approvedThisWeek: chartData.reduce((sum, day) => sum + day.aprovados, 0),
            hoursThisWeek: chartData.reduce((sum, day) => sum + day.horas, 0)
        };
    }, [apontamentos]);

    // 9. Project/Location Analysis
    const projectAnalysis = useMemo(() => {
        const byVila = {};
        const byEtapa = {};
        const bySupervisor = {};

        apontamentos.forEach(apt => {
            const hours = parseFloat(apt.totalHoras || 0);

            // Por Vila
            const vila = apt.vila || 'Não informado';
            byVila[vila] = (byVila[vila] || 0) + hours;

            // Por Etapa
            const etapa = apt.detalhes?.etapa || 'Não informado';
            byEtapa[etapa] = (byEtapa[etapa] || 0) + hours;

            // Por Supervisor
            const supervisor = apt.detalhes?.supervisor || 'Não informado';
            bySupervisor[supervisor] = (bySupervisor[supervisor] || 0) + hours;
        });

        // Converter para arrays ordenados
        const vilaData = Object.entries(byVila)
            .map(([name, hours]) => ({ name, hours: hours.toFixed(1) }))
            .sort((a, b) => parseFloat(b.hours) - parseFloat(a.hours));

        const etapaData = Object.entries(byEtapa)
            .map(([name, hours]) => ({ name, hours: hours.toFixed(1) }))
            .sort((a, b) => parseFloat(b.hours) - parseFloat(a.hours));

        const supervisorData = Object.entries(bySupervisor)
            .map(([name, hours]) => ({ name, hours: hours.toFixed(1) }))
            .sort((a, b) => parseFloat(b.hours) - parseFloat(a.hours));

        return {
            byVila: vilaData,
            byEtapa: etapaData,
            bySupervisor: supervisorData
        };
    }, [apontamentos]);

    return {
        statusDistribution,
        urgentAlerts,
        slaCompliance,
        machineryActivity,
        productivity,
        teamPerformance,
        checklistStatus,
        trends,
        projectAnalysis
    };
};

export default useKPIs;
