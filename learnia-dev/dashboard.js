import { getSessions, getUsers } from './apiService.js';
import { showElement, hideElement, showError, setCurrentDate, addEventListeners } from './domUtils.js';

// Variables para almacenar referencias de gráficos
let topicsChart = null;
let sessionsOverTimeChart = null;
let userSessionsChart = null;

// Controlador del Dashboard
const dashboard = {
    async init() {
        // Configurar fecha actual
        setCurrentDate();
        
        // Agregar event listeners
        addEventListeners(() => this.loadData(), () => this.loadData());
        
        // Cargar datos iniciales
        await this.loadData();
    },
    
    async loadData() {
        this.showLoading();
        this.hideError();
        this.hideDashboard();
        
        try {
            // Obtener datos reales de la API
            const sessions = await getSessions();
            const users = await getUsers();
            
            // Procesar y mostrar datos
            this.renderDashboard(sessions, users);
        } catch (error) {
            this.showError(error.message);
        }
    },
    
    renderDashboard(sessions, users) {
        // Actualizar estadísticas
        this.updateStats(sessions);
        
        // Renderizar gráficos
        this.renderTopicsChart(sessions);
        this.renderSessionsOverTimeChart(sessions);
        this.renderUserSessionsChart(users);
        
        // Mostrar dashboard
        this.hideLoading();
        this.showDashboard();
    },
    
    updateStats(sessions) {
        // Calcular CSAT
        const successfulSessions = sessions.filter(s => s.success).length;
        const csatScore = sessions.length > 0 
            ? ((successfulSessions / sessions.length) * 100).toFixed(1)
            : 0;
        
        // Actualizar elementos
        document.getElementById('total-sessions').textContent = sessions.length;
        document.getElementById('csat-score').textContent = `${csatScore}%`;
        document.getElementById('csat-badge').style.setProperty('--p', `${csatScore}%`);
        
        // Actualizar barra de éxito
        document.getElementById('success-rate').textContent = `${csatScore}%`;
        document.getElementById('success-bar').style.width = `${csatScore}%`;
        
        // Calcular costos de OpenAI
        const costs = this.calculateOpenAICosts(sessions);
        document.getElementById('total-cost').textContent = costs.totalCost;
        document.getElementById('user-cost').textContent = costs.userCost;
        document.getElementById('assistant-cost').textContent = costs.assistantCost;
        
        // Actualizar temas principales
        const topics = this.getPopularTopics(sessions);
        document.getElementById('top-topics-count').textContent = topics.length;
        if (topics.length > 0) {
            document.getElementById('topic-1').textContent = topics[0].topic;
            document.getElementById('topic-2').textContent = topics.length > 1 ? topics[1].topic : 'N/A';
        }
    },
    
    calculateOpenAICosts(sessions) {
        let userTokens = 0;
        let assistantTokens = 0;

        sessions.forEach((session) => {
            try {
                const history = session.history || [];
                history.forEach((message) => {
                    if (message.role === "user") {
                        userTokens += message.tokens || 0;
                    } else if (message.role === "assistant") {
                        assistantTokens += message.tokens || 0;
                    }
                });
            } catch (e) {
                console.error("Error parsing history:", e);
            }
        });

        const userCost = (userTokens / 1000000) * 2.5;
        const assistantCost = (assistantTokens / 1000000) * 10;
        const totalCost = userCost + assistantCost;

        return {
            userTokens,
            assistantTokens,
            userCost: userCost.toFixed(4),
            assistantCost: assistantCost.toFixed(4),
            totalCost: totalCost.toFixed(4),
        };
    },
    
    getPopularTopics(sessions) {
        const topicCounts = {};
        
        sessions.forEach(session => {
            const topic = session.topic || 'Sin tema';
            topicCounts[topic] = (topicCounts[topic] || 0) + 1;
        });
        
        return Object.entries(topicCounts)
            .map(([topic, count]) => ({ topic, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 6);
    },
    
    renderTopicsChart(sessions) {
        const topicsData = this.getPopularTopics(sessions);
        const ctx = document.getElementById('topicsChart').getContext('2d');
        
        // Destruir gráfico existente si hay uno
        if (topicsChart) {
            topicsChart.destroy();
        }
        
        topicsChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: topicsData.map(t => t.topic),
                datasets: [{
                    data: topicsData.map(t => t.count),
                    backgroundColor: [
                        '#4361ee', '#3a0ca3', '#7209b7', '#f72585', '#4cc9f0', '#4895ef',
                        '#560bad', '#b5179e', '#480ca8', '#3f37c9'
                    ],
                    borderWidth: 0,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            boxWidth: 15,
                            padding: 15,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: ${context.parsed} sesiones`;
                            }
                        }
                    }
                },
                cutout: '65%'
            }
        });
    },
    
    renderSessionsOverTimeChart(sessions) {
        // Agrupar sesiones por fecha
        const dateCounts = {};
        
        sessions.forEach(session => {
            const date = new Date(session.created_at).toISOString().split('T')[0];
            dateCounts[date] = (dateCounts[date] || 0) + 1;
        });
        
        // Ordenar fechas cronológicamente
        const dates = Object.keys(dateCounts).sort((a, b) => 
            new Date(a) - new Date(b)
        );
        const counts = dates.map(date => dateCounts[date]);
        
        const ctx = document.getElementById('sessionsOverTimeChart').getContext('2d');
        
        // Destruir gráfico existente si hay uno
        if (sessionsOverTimeChart) {
            sessionsOverTimeChart.destroy();
        }
        
        sessionsOverTimeChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Sesiones',
                    data: counts,
                    borderColor: '#4361ee',
                    backgroundColor: 'rgba(67, 97, 238, 0.1)',
                    borderWidth: 3,
                    pointRadius: 5,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#4361ee',
                    pointBorderWidth: 2,
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            title: function(tooltipItems) {
                                return tooltipItems[0].label;
                            },
                            label: function(context) {
                                return `Sesiones: ${context.parsed.y}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            precision: 0
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    },
    
    renderUserSessionsChart(users) {
        // Procesar datos de usuarios
        const userData = users.map(user => ({
            name: user.nickname || 'Usuario desconocido',
            sessions: user.session_count || 0
        })).sort((a, b) => b.sessions - a.sessions).slice(0, 10);
        
        const ctx = document.getElementById('userSessionsChart').getContext('2d');
        
        // Destruir gráfico existente si hay uno
        if (userSessionsChart) {
            userSessionsChart.destroy();
        }
        
        userSessionsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: userData.map(u => u.name),
                datasets: [{
                    label: 'Sesiones',
                    data: userData.map(u => u.sessions),
                    backgroundColor: '#4361ee',
                    borderRadius: 6,
                    borderSkipped: false,
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            title: function(tooltipItems) {
                                return tooltipItems[0].label;
                            },
                            label: function(context) {
                                return `Sesiones: ${context.parsed.x}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Número de sesiones'
                        }
                    },
                    y: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            autoSkip: false,
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                }
            }
        });
    },
    
    showLoading() {
        hideElement('error');
        hideElement('dashboard');
        showElement('loading');
    },
    
    hideLoading() {
        hideElement('loading');
    },
    
    showError(message) {
        showError(message);
        hideElement('loading');
        showElement('error');
    },
    
    hideError() {
        hideElement('error');
    },
    
    showDashboard() {
        showElement('dashboard');
    },
    
    hideDashboard() {
        hideElement('dashboard');
    }
};

// Inicializar el dashboard cuando el documento esté listo
document.addEventListener('DOMContentLoaded', () => dashboard.init());