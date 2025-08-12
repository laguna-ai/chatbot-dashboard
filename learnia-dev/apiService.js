// Configuración de la URL base
const baseUrl = "http://localhost:7071";

// Función para obtener sesiones
export const getSessions = async () => {
    try {
        const response = await fetch(`${baseUrl}/api/get_sessions`);
        if (!response.ok) {
            throw new Error('Error obteniendo sesiones');
        }
        return await response.json();
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
};

// Función para obtener usuarios
export const getUsers = async () => {
    try {
        const response = await fetch(`${baseUrl}/api/get_users`);
        if (!response.ok) {
            throw new Error('Error obteniendo usuarios');
        }
        return await response.json();
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
};