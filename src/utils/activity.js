// src/utils/activity.js

export const addActivity = (message, type = 'info') => {
    try {
        const history = JSON.parse(localStorage.getItem('app_activity_log') || '[]');
        const newEvent = {
            id: Date.now(),
            message,
            type, // 'upload', 'folder', 'vault', 'info', 'pinata'
            timestamp: new Date().toISOString()
        };
        const updatedHistory = [newEvent, ...history].slice(0, 10); // Keep last 10
        localStorage.setItem('app_activity_log', JSON.stringify(updatedHistory));
    } catch (e) {
        console.error("Failed to save activity log", e);
    }
};

export const getActivities = () => {
    try {
        return JSON.parse(localStorage.getItem('app_activity_log') || '[]');
    } catch (e) {
        return [];
    }
};
