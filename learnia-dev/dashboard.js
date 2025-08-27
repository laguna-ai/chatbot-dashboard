import { getSessions } from './apiService.js';
import { showElement, hideElement, showError, setCurrentDate, addEventListeners,formatMessage } from './domUtils.js';

// Variables para almacenar referencias de gráficos
let topicsChart = null;
let sessionsOverTimeChart = null;

// Controlador del Dashboard
const dashboard = {
    currentSesssions : [],
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
            
            // Procesar y mostrar datos
            this.renderDashboard(sessions);
        } catch (error) {
            this.showError(error.message);
        }
    },
    
    renderDashboard(sessions) {

        this.currentSesssions = sessions;
        // Actualizar estadísticas
        this.updateStats(sessions);
        
        // Renderizar gráficos
        this.renderTopicsChart(sessions);
        this.renderSessionsOverTimeChart(sessions);
        
        // Mostrar dashboard
        this.hideLoading();
        this.showDashboard();

        // Poblar la lista de sesiones
        this.populateSessionsList(sessions);
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
        
        //Actualizar sesiones exitosas
        document.getElementById('successful-sessions').textContent = successfulSessions;


        // Actualizar barra de éxito
        // document.getElementById('success-rate').textContent = `${csatScore}%`;
        // document.getElementById('success-bar').style.width = `${csatScore}%`;
        
 
        // Actualizar temas principales
        const topics = this.getPopularTopics(sessions);
        // document.getElementById('top-topics-count').textContent = topics.length;
        if (topics.length > 0) {
            document.getElementById('topic-1').textContent = topics[0].topic;
            document.getElementById('topic-2').textContent = topics.length > 1 ? topics[1].topic : 'N/A';
        }
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
    },


    // Función para popular la lista de sesiones
    populateSessionsList(sessions) {
        const container = document.getElementById('sessions-list');
        if (!container) return; // Verificar si el contenedor existe
        
        container.innerHTML = '';
        
        // Almacenar las sesiones actuales para referencia futura
        this.currentSessions = sessions;
        
        // Ordenar sesiones por fecha (más reciente primero)
        const sortedSessions = [...sessions].sort((a, b) => 
            new Date(b.created_at) - new Date(a.created_at)
        );
        
        sortedSessions.forEach(session => {
            const sessionElement = document.createElement('div');
            sessionElement.classList.add('session-item');
            sessionElement.dataset.sessionId = session.id;
            
            const date = new Date(session.created_at).toLocaleDateString();
            const topic = session.topic || 'Sin tema';
            
            // Obtener el último mensaje para el preview
            let preview = 'No hay mensajes';
            if (session.history && session.history.length > 0) {
                const lastMessage = session.history[session.history.length - 1];
                preview = lastMessage.content.substring(0, 50) + (lastMessage.content.length > 50 ? '...' : '');
            }
            
            sessionElement.innerHTML = `
                <div class="session-header">
                    <div class="session-topic">${topic}</div>
                    <div class="session-date">${date}</div>
                </div>
                <div class="session-preview">${preview}</div>
            `;
            
            sessionElement.addEventListener('click', () => {
                // Buscar la sesión actual por ID en las sesiones almacenadas
                const sessionId = sessionElement.dataset.sessionId;
                const currentSession = this.currentSessions.find(s => s.id === sessionId);
                
                if (!currentSession) return;
                
                const currentDate = new Date(currentSession.created_at).toLocaleDateString();
                const currentTopic = currentSession.topic || 'Sin tema';
                
                // Remover clase activa de todos los elementos
                document.querySelectorAll('.session-item').forEach(item => {
                    item.classList.remove('active');
                });
                
                // Agregar clase activa al elemento seleccionado
                sessionElement.classList.add('active');
                
                // Actualizar encabezado de conversación (verificar si existe)
                const selectedTopicEl = document.getElementById('selected-session-topic');
                const selectedDateEl = document.getElementById('selected-session-date');
                const conversationHeader = document.getElementById('conversation-header');
                
                if (selectedTopicEl) selectedTopicEl.textContent = currentTopic;
                if (selectedDateEl) selectedDateEl.textContent = `Iniciada el ${currentDate}`;
                if (conversationHeader) conversationHeader.classList.remove('hidden');
                
                // Mostrar la conversación
                this.renderConversationHistory(currentSession.history || []);
            });
            
            container.appendChild(sessionElement);
        });
        
        // Evento para búsqueda
        const searchInput = document.getElementById('session-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                const sessionItems = container.querySelectorAll('.session-item');
                
                sessionItems.forEach(item => {
                    const topic = item.querySelector('.session-topic').textContent.toLowerCase();
                    const preview = item.querySelector('.session-preview').textContent.toLowerCase();
                    if (topic.includes(searchTerm) || preview.includes(searchTerm)) {
                        item.style.display = 'block';
                    } else {
                        item.style.display = 'none';
                    }
                });
            });
        }
    },

    // Función para renderizar el historial de conversación
    renderConversationHistory(history) {
        const container = document.getElementById('conversation-container');
        const noConversationMessage = document.getElementById('no-conversation-message');
        
        // Verificar si los elementos existen antes de manipularlos
        if (!container) return;
        
        if (!history || history.length === 0) {
            if (noConversationMessage) {
                noConversationMessage.style.display = 'flex';
            }
            container.innerHTML = '';
            return;
        }
        
        if (noConversationMessage) {
            noConversationMessage.style.display = 'none';
        }
        
        container.innerHTML = '';
        
        // Crear contenedor para las burbujas
        const bubblesContainer = document.createElement('div');
        bubblesContainer.classList.add('conversation-container');
        
        history.forEach((message, index) => {
            // Filtrar mensajes de sistema
            if (message.role === "system") return;

            const bubble = document.createElement('div');
            bubble.classList.add('message-bubble');
            bubble.classList.add(message.role === 'user' ? 'user-bubble' : 'assistant-bubble');
            
            // Añadir animación con retardo escalonado
            bubble.style.animationDelay = `${index * 0.1}s`;
            
            // Contenido del mensaje
            const content = document.createElement('div');
            content.classList.add('message-content');
            content.innerHTML = formatMessage(message.content); // Formatear el contenido del message.content;
            
            // Información adicional (tokens y timestamp)
            const info = document.createElement('div');
            info.classList.add('message-info');
            
                        
            const time = document.createElement('span');
            time.classList.add('message-time');
            
            // Verificar si timestamp existe y es válido
            if (message.timestamp) {
                time.textContent = new Date(message.timestamp * 1000).toLocaleTimeString([], {
                    hour: '2-digit', 
                    minute: '2-digit'
                });
            } else {
                time.textContent = '--:--';
            }
            
            info.appendChild(time);
            
            bubble.appendChild(content);
            bubble.appendChild(info);
            bubblesContainer.appendChild(bubble);
        });
        
        container.appendChild(bubblesContainer);
        
        // Scroll al final de la conversación
        container.scrollTop = container.scrollHeight;
    },



};

// Inicializar el dashboard cuando el documento esté listo
document.addEventListener('DOMContentLoaded', () => dashboard.init());

