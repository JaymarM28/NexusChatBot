// SCRIPT.JS - Frontend VideoLearn con configuración dinámica
// Detecta automáticamente desarrollo vs producción

// ========== CONFIGURACIÓN DINÁMICA ==========
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = isDevelopment ? 'http://localhost:8080' : '';

const CONFIG = {
    API_URL: `${API_BASE_URL}/api/chat`,
    HEALTH_URL: `${API_BASE_URL}/api/health`,
    TRANSCRIPTION_URL: `${API_BASE_URL}/api/transcription`,
    MODEL: 'claude-sonnet-4-20250514',
    MAX_TOKENS: 1000
};

let conversationHistory = [];
let transcriptionText = '';
let autoTranscriptionLoaded = false;

// ========== INICIALIZACIÓN ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log(`🌍 Entorno: ${isDevelopment ? 'Desarrollo (localhost)' : 'Producción'}`);
    console.log(`📡 API Base: ${API_BASE_URL || 'Same origin'}`);
    
    loadAutoTranscription();  // Intentar cargar transcripción automática
    loadTranscription();      // Cargar transcripción manual si existe
    loadConversationHistory();
    checkServerHealth();
    limpliarChat()
    
    console.log('✅ VideoLearn inicializado');
});

// ========== CARGA AUTOMÁTICA DE TRANSCRIPCIÓN ==========
async function loadAutoTranscription() {
    try {
        const response = await fetch(CONFIG.TRANSCRIPTION_URL);
        
        if (!response.ok) {
            console.log('ℹ️ No hay transcripción automática disponible');
            return;
        }
        
        const data = await response.json();
        
        if (data.loaded && data.transcription && data.transcription.length > 50) {
            transcriptionText = data.transcription;
            autoTranscriptionLoaded = true;
            
            const textarea = document.getElementById('transcriptionText');
            textarea.value = data.transcription;
            textarea.disabled = true;
            textarea.style.backgroundColor = '#f0f8ff';
            
            // Actualizar mensaje de bienvenida
            updateWelcomeMessage(data.length);
            
            // Ocultar el botón de guardar transcripción
            const saveBtn = document.querySelector('.save-transcription');
            if (saveBtn) {
                saveBtn.style.display = 'none';
            }
        }
    } catch (error) {
        console.log('ℹ️ Transcripción automática no disponible');
    }
}

function updateWelcomeMessage(charCount) {
    const welcomeMsg = document.querySelector('.welcome-message .message-content');
    if (welcomeMsg) {
        welcomeMsg.innerHTML = `
            <p>¡Hola! Soy Nexus tu asistente virtual.</p>
            <p class="message-tip">💡 <strong>Tip:</strong> Haz preguntas específicas sobre el contenido del video.</p>
        `;
    }
}

// ========== FUNCIONES DE TRANSCRIPCIÓN MANUAL ==========
function toggleTranscription() {
    const content = document.getElementById('transcriptionContent');
    content.classList.toggle('active');
}

function saveTranscription() {
    if (autoTranscriptionLoaded) {
        showNotification('La transcripción ya está cargada automáticamente', 'info');
        return;
    }
    
    const textarea = document.getElementById('transcriptionText');
    transcriptionText = textarea.value.trim();
    
    if (transcriptionText) {
        localStorage.setItem('videoTranscription', transcriptionText);
        showNotification('Transcripción guardada correctamente', 'success');
        addBotMessage('¡Perfecto! He guardado la transcripción del video. Ahora puedo responder preguntas específicas sobre el contenido. ¿Qué te gustaría saber?');
    } else {
        showNotification('Por favor, escribe la transcripción primero', 'error');
    }
}

function loadTranscription() {
    // Solo cargar del localStorage si no hay transcripción automática
    if (!autoTranscriptionLoaded) {
        const saved = localStorage.getItem('videoTranscription');
        if (saved) {
            document.getElementById('transcriptionText').value = saved;
            transcriptionText = saved;
        }
    }
}

// ========== VERIFICACIÓN DEL SERVIDOR ==========
async function checkServerHealth() {
    try {
        const response = await fetch(CONFIG.HEALTH_URL);
        const data = await response.json();
        
        if (data.status === 'ok') {
            console.log('✅ Servidor conectado');
            
            if (!data.api_key_configured) {
                showNotification('⚠️ API key no configurada en server.py', 'error');
            }
            
            if (data.transcription_loaded) {
                console.log(`✅ Transcripción en servidor: ${data.transcription_length} caracteres`);
            }
        }
    } catch (error) {
        console.error('❌ Error conectando al servidor:', error);
        if (isDevelopment) {
            showNotification('⚠️ Servidor no disponible. Ejecuta: python3 server.py', 'error');
        }
    }
}

// ========== GESTIÓN DEL CHAT ==========
function clearChat() {
    if (confirm('¿Estás seguro de que quieres limpiar el historial del chat?')) {
        conversationHistory = [];
        localStorage.removeItem('chatHistory');
        
        const chatMessages = document.getElementById('chatMessages');
        const charCount = autoTranscriptionLoaded ? transcriptionText.length : 0;
        
        chatMessages.innerHTML = `
            <div class="message bot-message welcome-message">
                <div class="message-avatar bot-avatar">🤖</div>
                <div class="message-content">
                    <p>¡Hola! Soy tu asistente virtual. ${autoTranscriptionLoaded ? 'He cargado la transcripción del video automáticamente y estoy' : 'Estoy'} listo para responder cualquier pregunta que tengas sobre el contenido.</p>
                    ${autoTranscriptionLoaded ? `<p class="message-tip">✅ <strong>Transcripción:</strong> ${charCount} caracteres cargados automáticamente.</p>` : '<p class="message-tip">💡 <strong>Tip:</strong> Primero pega la transcripción del video arriba para que pueda ayudarte mejor.</p>'}
                </div>
            </div>
        `;
        
        showNotification('Chat limpiado', 'success');
    }
}

function limpliarChat() {
            conversationHistory = [];
        localStorage.removeItem('chatHistory');
        
        const chatMessages = document.getElementById('chatMessages');
        const charCount = autoTranscriptionLoaded ? transcriptionText.length : 0;
        
        chatMessages.innerHTML = `
            <div class="message bot-message welcome-message">
                <div class="message-avatar bot-avatar">🤖</div>
                <div class="message-content">
                    <p>¡Hola! Soy tu asistente virtual. ${autoTranscriptionLoaded ? 'He cargado la transcripción del video automáticamente y estoy' : 'Estoy'} listo para responder cualquier pregunta que tengas sobre el contenido.</p>
                    ${autoTranscriptionLoaded ? `<p class="message-tip">✅ <strong>Transcripción:</strong> ${charCount} caracteres cargados automáticamente.</p>` : '<p class="message-tip">💡 <strong>Tip:</strong> Primero pega la transcripción del video arriba para que pueda ayudarte mejor.</p>'}
                </div>
            </div>
        `;        
}

async function sendMessage(event) {
    event.preventDefault();
    
    const input = document.getElementById('userInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    input.value = '';
    addUserMessage(message);
    showTypingIndicator();
    
    try {
        const response = await sendToClaudeAPI(message);
        removeTypingIndicator();
        addBotMessage(response);
        saveConversationHistory();
    } catch (error) {
        removeTypingIndicator();
        handleError(error);
    }
}

function handleError(error) {
    let errorMessage = 'Lo siento, hubo un error. ';
    
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        errorMessage += isDevelopment 
            ? '⚠️ No se puede conectar al servidor.\n\n✅ Solución:\n1. Abre una terminal\n2. Ve a la carpeta del proyecto\n3. Ejecuta: python3 server.py\n4. Recarga esta página'
            : '⚠️ Error de conexión. Por favor, recarga la página.';
    } else if (error.message.includes('401') || error.message.includes('authentication')) {
        errorMessage += '🔑 Error de autenticación. Verifica la API key en server.py';
    } else if (error.message.includes('429')) {
        errorMessage += '⏱️ Límite de solicitudes excedido. Espera un momento.';
    } else {
        errorMessage += error.message;
    }
    
    addBotMessage(errorMessage);
    console.error('Error completo:', error);
}

// ========== COMUNICACIÓN CON LA API ==========
async function sendToClaudeAPI(userMessage) {
    let systemPrompt = 'Eres un asistente virtual educativo amigable y profesional. Ayudas a estudiantes a comprender mejor el contenido del video educativo. Responde de manera clara, concisa y útil. Usa un tono cercano pero profesional.';
    
    // Si hay transcripción (automática o manual)
    if (transcriptionText) {
        systemPrompt += `\n\n=== TRANSCRIPCIÓN DEL VIDEO ===\n${transcriptionText}\n\n=== INSTRUCCIONES ===\nResponde las preguntas del usuario basándote EXCLUSIVAMENTE en el contenido de esta transcripción. Si la pregunta no está relacionada con el contenido del video, indícalo amablemente y pregunta si hay algo del video sobre lo que quiera aprender más.`;
    } else {
        systemPrompt += '\n\n⚠️ IMPORTANTE: Aún no se ha proporcionado la transcripción del video. Recuérdale amablemente al usuario que debe:\n1. Hacer clic en el botón "📝 Ver transcripción del video"\n2. Pegar el texto de la transcripción del video\n3. Hacer clic en "Guardar transcripción"\n\nExplica que sin la transcripción, no puedes dar respuestas precisas sobre el contenido específico del video.';
    }
    
    const messages = conversationHistory
        .filter(msg => msg.role !== 'system')
        .map(msg => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
        }));
    
    messages.push({
        role: 'user',
        content: userMessage
    });
    
    console.log('📤 Enviando petición al servidor...');
    
    const response = await fetch(CONFIG.API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            messages: messages,
            system: systemPrompt,
            model: CONFIG.MODEL,
            max_tokens: CONFIG.MAX_TOKENS,
            use_auto_transcription: !autoTranscriptionLoaded  // Solo usar auto si no tenemos ya
        })
    });
    
    if (!response.ok) {
        let errorData;
        try {
            errorData = await response.json();
        } catch (e) {
            throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
        }
        
        const errorMsg = errorData.error || 'Error desconocido';
        throw new Error(`${errorMsg}`);
    }
    
    const data = await response.json();
    console.log('📥 Respuesta recibida');
    console.log(`📊 Tokens: ${data.usage.input_tokens} entrada, ${data.usage.output_tokens} salida`);
    
    return data.content[0].text;
}

// ========== FUNCIONES DE UI ==========
function addUserMessage(message) {
    const chatMessages = document.getElementById('chatMessages');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user-message';
    messageDiv.innerHTML = `
        <div class="message-avatar user-avatar">👤</div>
        <div class="message-content">
            <p>${escapeHtml(message)}</p>
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
    
    conversationHistory.push({
        role: 'user',
        content: message
    });
}

function addBotMessage(message) {
    const chatMessages = document.getElementById('chatMessages');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot-message';
    messageDiv.innerHTML = `
        <div class="message-avatar bot-avatar">🤖</div>
        <div class="message-content">
            <p>${formatBotMessage(message)}</p>
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
    
    conversationHistory.push({
        role: 'assistant',
        content: message
    });
}

function showTypingIndicator() {
    const chatMessages = document.getElementById('chatMessages');
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot-message typing-message';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = `
        <div class="message-avatar bot-avatar">🤖</div>
        <div class="message-content">
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        </div>
    `;
    
    chatMessages.appendChild(typingDiv);
    scrollToBottom();
}

function removeTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) indicator.remove();
}

// ========== PERSISTENCIA ==========
function saveConversationHistory() {
    localStorage.setItem('chatHistory', JSON.stringify(conversationHistory));
}

function loadConversationHistory() {
    const saved = localStorage.getItem('chatHistory');
    if (!saved) return;
    
    try {
        conversationHistory = JSON.parse(saved);
        const chatMessages = document.getElementById('chatMessages');
        
        conversationHistory.forEach(msg => {
            const messageDiv = document.createElement('div');
            messageDiv.className = msg.role === 'user' ? 'message user-message' : 'message bot-message';
            messageDiv.innerHTML = `
                <div class="message-avatar ${msg.role === 'user' ? 'user-avatar' : 'bot-avatar'}">${msg.role === 'user' ? '👤' : '🤖'}</div>
                <div class="message-content">
                    <p>${msg.role === 'user' ? escapeHtml(msg.content) : formatBotMessage(msg.content)}</p>
                </div>
            `;
            chatMessages.appendChild(messageDiv);
        });
    } catch (error) {
        console.error('Error cargando historial:', error);
    }
}

// ========== UTILIDADES ==========
function formatBotMessage(text) {
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    text = text.replace(/\n\n/g, '</p><p>');
    text = text.replace(/\n/g, '<br>');
    return text;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function scrollToBottom() {
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 1000;
        animation: slideInRight 0.3s ease-out;
        font-family: var(--font-body);
        max-width: 400px;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// ========== ANIMACIONES ==========
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// ========== EVENT LISTENERS ==========
document.getElementById('userInput')?.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage(e);
    }
});
