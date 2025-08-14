// Función para mostrar elementos
export const showElement = (elementId) => {
    const element = document.getElementById(elementId);
    if (element) {
        element.classList.remove('hidden');
    }
};

// Función para ocultar elementos
export const hideElement = (elementId) => {
    const element = document.getElementById(elementId);
    if (element) {
        element.classList.add('hidden');
    }
};

// Función para mostrar errores
export const showError = (message) => {
    const errorMessageElement = document.getElementById('error-message');
    if (errorMessageElement) {
        errorMessageElement.textContent = message;
    }
    showElement('error');
};

// Función para configurar la fecha actual
export const setCurrentDate = () => {
    const currentDateElement = document.getElementById('current-date');
    if (currentDateElement) {
        currentDateElement.textContent = new Date().toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
};

// Función para agregar event listeners
export const addEventListeners = (retryCallback, refreshCallback) => {
    const retryBtn = document.getElementById('retry-btn');
    const refreshBtn = document.getElementById('refresh-btn');
    
    if (retryBtn) {
        retryBtn.addEventListener('click', retryCallback);
    }
    
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshCallback);
    }
};

// función para formatear fechas en widget de sesiones
export const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};