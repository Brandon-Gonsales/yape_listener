// Estado global de la aplicación
let appState = {
    isConnected: false,
    notificationCount: 0,
    sentCount: 0,
    successCount: 0,
    errorCount: 0,
    autoNotificationInterval: null,
    nextTransactionId: 1
};

// Datos para generar notificaciones
const sampleSenders = [
    "Ana Rodríguez", "Pedro Martínez", "Lucía Fernández", "Miguel Santos",
    "Carmen Vega", "Roberto Silva", "Elena Castro", "Diego Morales",
    "Juan Pérez", "María García", "Carlos López"
];

const sampleAmounts = [5.50, 10.25, 15.00, 20.75, 25.50, 30.00, 45.25, 50.00, 75.50, 100.00, 150.25, 200.00];

// Referencias a elementos DOM
let elements = {};

// Utilidades
function getCurrentTime() {
    return new Date().toLocaleTimeString('es-PE', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function generateTransactionId() {
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    return `YPE_${today}_${String(appState.nextTransactionId++).padStart(3, '0')}`;
}

// Funciones de logging
function addLogEntry(message, type = 'info') {
    if (!elements.logContainer) return;
    
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry log-${type}`;
    
    const time = document.createElement('span');
    time.className = 'log-time';
    time.textContent = `[${getCurrentTime()}]`;
    
    const messageSpan = document.createElement('span');
    messageSpan.className = 'log-message';
    messageSpan.textContent = message;
    
    logEntry.appendChild(time);
    logEntry.appendChild(messageSpan);
    
    elements.logContainer.insertBefore(logEntry, elements.logContainer.firstChild);
    
    // Mantener solo los últimos 50 logs
    while (elements.logContainer.children.length > 50) {
        elements.logContainer.removeChild(elements.logContainer.lastChild);
    }
}

// Funciones de estadísticas
function updateStats() {
    if (elements.notificationCount) elements.notificationCount.textContent = appState.notificationCount;
    if (elements.sentCount) elements.sentCount.textContent = appState.sentCount;
    if (elements.successCount) elements.successCount.textContent = appState.successCount;
    if (elements.errorCount) elements.errorCount.textContent = appState.errorCount;
}

// Función para generar notificación
function generateNotification() {
    const sender = getRandomElement(sampleSenders);
    const amount = getRandomElement(sampleAmounts);
    const transactionId = generateTransactionId();
    const timestamp = new Date().toISOString();
    
    return {
        id: Date.now(),
        timestamp: timestamp,
        title: "¡Te yapearon!",
        text: `Recibiste S/${amount.toFixed(2)} de ${sender}`,
        packageName: "com.pagoefectivo.yape",
        amount: amount,
        currency: "PEN",
        sender: sender,
        transaction_id: transactionId
    };
}

// Función para mostrar notificación en la UI
function displayNotification(notification) {
    if (!elements.notificationsList) return;
    
    // Remover mensaje de "no hay notificaciones"
    const noNotifications = elements.notificationsList.querySelector('.no-notifications');
    if (noNotifications) {
        noNotifications.remove();
    }
    
    const notificationElement = document.createElement('div');
    notificationElement.className = 'notification-item';
    
    const time = new Date(notification.timestamp).toLocaleTimeString('es-PE', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    
    notificationElement.innerHTML = `
        <div class="notification-content">
            <div class="notification-title">${notification.title}</div>
            <div class="notification-details">
                <span><strong>De:</strong> ${notification.sender}</span>
                <span><strong>ID:</strong> ${notification.transaction_id}</span>
            </div>
        </div>
        <div class="notification-amount">S/${notification.amount.toFixed(2)}</div>
        <div class="notification-time">${time}</div>
    `;
    
    elements.notificationsList.insertBefore(notificationElement, elements.notificationsList.firstChild);
    
    // Mantener solo las últimas 10 notificaciones
    while (elements.notificationsList.children.length > 10) {
        elements.notificationsList.removeChild(elements.notificationsList.lastChild);
    }
}

// Función para generar JSON de Telegram
function generateTelegramJSON(notification) {
    const message = `🔔 <b>Nueva notificación Yape</b>

💰 <b>Monto:</b> S/${notification.amount.toFixed(2)}
👤 <b>Remitente:</b> ${notification.sender}
🆔 <b>ID Transacción:</b> ${notification.transaction_id}
⏰ <b>Hora:</b> ${new Date(notification.timestamp).toLocaleString('es-PE')}

📱 <i>Procesado automáticamente por Monitor Yape</i>`;

    return {
        text: message,
        parse_mode: "HTML",
        chat_id: elements.chatId ? (elements.chatId.value || "-1001234567890") : "-1001234567890"
    };
}

// Función para procesar notificación
function processNotification(notification) {
    appState.notificationCount++;
    
    // Mostrar en la UI
    displayNotification(notification);
    
    // Generar JSON
    const telegramJSON = generateTelegramJSON(notification);
    
    // Mostrar JSON con animación
    if (elements.jsonOutput) {
        elements.jsonOutput.textContent = JSON.stringify(telegramJSON, null, 2);
        elements.jsonOutput.classList.add('updated');
        setTimeout(() => {
            elements.jsonOutput.classList.remove('updated');
        }, 500);
    }
    
    // Simular envío a Telegram
    simulateTelegramSend(notification, telegramJSON);
    
    // Actualizar estadísticas
    updateStats();
    
    // Log
    addLogEntry(`Nueva notificación procesada: S/${notification.amount.toFixed(2)} de ${notification.sender}`, 'info');
}

// Función para simular envío a Telegram
function simulateTelegramSend(notification, telegramJSON) {
    appState.sentCount++;
    updateStats();
    
    // Simular éxito o fallo (90% éxito)
    const isSuccess = Math.random() > 0.1;
    
    setTimeout(() => {
        if (isSuccess) {
            appState.successCount++;
            addLogEntry(`✅ Mensaje enviado exitosamente a Telegram (${notification.transaction_id})`, 'success');
        } else {
            appState.errorCount++;
            addLogEntry(`❌ Error al enviar a Telegram (${notification.transaction_id}): Connection timeout`, 'error');
        }
        updateStats();
    }, 1000 + Math.random() * 2000); // Simular delay de red
}

// Función para alternar servicio
function toggleService() {
    if (!elements.botToken || !elements.chatId) return;
    
    if (!appState.isConnected && (!elements.botToken.value.trim() || !elements.chatId.value.trim())) {
        addLogEntry('❌ Debes configurar el Bot Token y Chat ID antes de conectar', 'error');
        return;
    }
    
    appState.isConnected = !appState.isConnected;
    
    if (appState.isConnected) {
        // Conectar servicio
        if (elements.toggleButtonText) elements.toggleButtonText.textContent = 'Desconectar Servicio';
        if (elements.statusText) elements.statusText.textContent = 'Conectado';
        if (elements.statusIndicator) elements.statusIndicator.classList.add('connected');
        if (elements.toggleService) elements.toggleService.classList.add('processing');
        
        // Deshabilitar campos de configuración
        elements.botToken.disabled = true;
        elements.chatId.disabled = true;
        
        addLogEntry('🔄 Servicio conectado. Iniciando monitoreo automático...', 'success');
        
        // Remover clase processing después de un momento
        setTimeout(() => {
            if (elements.toggleService) elements.toggleService.classList.remove('processing');
        }, 1000);
        
        // Iniciar notificaciones automáticas cada 30 segundos
        appState.autoNotificationInterval = setInterval(() => {
            if (appState.isConnected) {
                const notification = generateNotification();
                processNotification(notification);
                addLogEntry('🤖 Notificación automática detectada', 'info');
            }
        }, 30000);
        
        // Generar primera notificación después de 3 segundos
        setTimeout(() => {
            if (appState.isConnected) {
                const notification = generateNotification();
                processNotification(notification);
                addLogEntry('🤖 Primera notificación automática detectada', 'info');
            }
        }, 3000);
        
    } else {
        // Desconectar servicio
        if (elements.toggleButtonText) elements.toggleButtonText.textContent = 'Conectar Servicio';
        if (elements.statusText) elements.statusText.textContent = 'Desconectado';
        if (elements.statusIndicator) elements.statusIndicator.classList.remove('connected');
        if (elements.toggleService) elements.toggleService.classList.remove('processing');
        
        // Habilitar campos de configuración
        elements.botToken.disabled = false;
        elements.chatId.disabled = false;
        
        // Detener notificaciones automáticas
        if (appState.autoNotificationInterval) {
            clearInterval(appState.autoNotificationInterval);
            appState.autoNotificationInterval = null;
        }
        
        addLogEntry('🔴 Servicio desconectado. Monitoreo automático detenido.', 'warning');
    }
}

// Función para simular notificación manual
function simulateNotification() {
    const notification = generateNotification();
    processNotification(notification);
    addLogEntry('🧪 Notificación simulada manualmente', 'info');
}

// Función para limpiar log - CORREGIDA
function clearLog() {
    if (!elements.logContainer) return;
    
    // Limpiar completamente el contenedor
    while (elements.logContainer.firstChild) {
        elements.logContainer.removeChild(elements.logContainer.firstChild);
    }
    
    // Agregar entrada inicial
    setTimeout(() => {
        addLogEntry('🧹 Log de actividad limpiado. Sistema listo.', 'info');
    }, 100);
}

// Función para inicializar elementos DOM
function initializeElements() {
    elements = {
        botToken: document.getElementById('botToken'),
        chatId: document.getElementById('chatId'),
        toggleService: document.getElementById('toggleService'),
        toggleButtonText: document.getElementById('toggleButtonText'),
        serviceStatus: document.getElementById('serviceStatus'),
        statusIndicator: document.getElementById('statusIndicator'),
        statusText: document.getElementById('statusText'),
        simulateBtn: document.getElementById('simulateBtn'),
        notificationsList: document.getElementById('notificationsList'),
        jsonOutput: document.getElementById('jsonOutput'),
        logContainer: document.getElementById('logContainer'),
        clearLogBtn: document.getElementById('clearLogBtn'),
        notificationCount: document.getElementById('notificationCount'),
        sentCount: document.getElementById('sentCount'),
        successCount: document.getElementById('successCount'),
        errorCount: document.getElementById('errorCount')
    };
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar elementos DOM
    initializeElements();
    
    // Verificar que elementos críticos existen
    if (!elements.logContainer) {
        console.error('Log container not found');
        return;
    }
    
    // Configurar event listeners con verificación
    if (elements.toggleService) {
        elements.toggleService.addEventListener('click', function(e) {
            e.preventDefault();
            toggleService();
        });
    }
    
    if (elements.simulateBtn) {
        elements.simulateBtn.addEventListener('click', function(e) {
            e.preventDefault();
            simulateNotification();
        });
    }
    
    if (elements.clearLogBtn) {
        elements.clearLogBtn.addEventListener('click', function(e) {
            e.preventDefault();
            clearLog();
        });
    }
    
    // Validación en tiempo real de campos
    if (elements.botToken) {
        elements.botToken.addEventListener('input', function() {
            if (this.value.includes(':') && this.value.length > 20) {
                this.style.borderColor = 'var(--color-success-custom)';
            } else {
                this.style.borderColor = '';
            }
        });
    }
    
    if (elements.chatId) {
        elements.chatId.addEventListener('input', function() {
            if (this.value.startsWith('-') && this.value.length > 5) {
                this.style.borderColor = 'var(--color-success-custom)';
            } else {
                this.style.borderColor = '';
            }
            
            // Actualizar JSON cuando cambie el chat ID
            if (elements.jsonOutput) {
                const exampleJSON = {
                    text: "Esperando notificación...",
                    parse_mode: "HTML",
                    chat_id: this.value || "-1001234567890"
                };
                elements.jsonOutput.textContent = JSON.stringify(exampleJSON, null, 2);
            }
        });
    }
    
    // Inicializar JSON de ejemplo
    if (elements.jsonOutput && elements.chatId) {
        elements.jsonOutput.textContent = JSON.stringify({
            text: "Esperando notificación...",
            parse_mode: "HTML",
            chat_id: elements.chatId.value || "-1001234567890"
        }, null, 2);
    }
    
    // Log inicial
    addLogEntry('🚀 Monitor de Notificaciones Yape → Telegram iniciado correctamente', 'success');
    addLogEntry('💡 Configura tu Bot Token y Chat ID, luego conecta el servicio', 'info');
    addLogEntry('🔔 También puedes simular notificaciones manualmente', 'info');
    
    // Actualizar estadísticas iniciales
    updateStats();
});

// Cleanup al cerrar la página
window.addEventListener('beforeunload', function() {
    if (appState.autoNotificationInterval) {
        clearInterval(appState.autoNotificationInterval);
    }
});