class ChatSystem {
    constructor() {
        this.messages = JSON.parse(localStorage.getItem('chat_secreto_messages')) || [];
        this.currentUser = null;
        this.init();
    }

    async init() {
        // Verifica sessão
        const sessionData = localStorage.getItem('chat_secreto_session');
        if (!sessionData) {
            window.location.href = 'index.html';
            return;
        }

        try {
            const session = JSON.parse(sessionData);
            this.currentUser = session.user;
            this.updateUI();
            this.loadMessages();
            this.setupEventListeners();
            this.simulateOtherUsers();
        } catch (error) {
            console.error('Erro ao carregar sessão:', error);
            window.location.href = 'index.html';
        }
    }

    updateUI() {
        // Atualiza informações do usuário atual
        const userInfo = document.getElementById('currentUserInfo');
        if (userInfo) {
            userInfo.innerHTML = `
                <i class="fas fa-user-secret"></i>
                <div>
                    <div class="user-name">${this.currentUser.displayName}</div>
                    <div class="user-status">@${this.currentUser.username}</div>
                </div>
            `;
        }

        // Mostra seções de admin
        if (this.currentUser.role === 'admin') {
            const adminSection = document.getElementById('adminSection');
            if (adminSection) {
                adminSection.style.display = 'block';
            }
        }
    }

    setupEventListeners() {
        // Botão de enviar mensagem
        const sendBtn = document.getElementById('sendBtn');
        const messageInput = document.getElementById('messageInput');
        
        if (sendBtn && messageInput) {
            sendBtn.addEventListener('click', () => this.sendMessage());
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });

            // Contador de caracteres
            messageInput.addEventListener('input', () => {
                const charCount = document.getElementById('charCount');
                if (charCount) {
                    charCount.textContent = `${messageInput.value.length}/2000`;
                    
                    if (messageInput.value.length > 1900) {
                        charCount.style.color = '#ff6b6b';
                    } else if (messageInput.value.length > 1800) {
                        charCount.style.color = '#ffa500';
                    } else {
                        charCount.style.color = '#666';
                    }
                }
            });
        }

        // Upload de imagem
        const imageBtn = document.getElementById('imageBtn');
        const fileUpload = document.getElementById('fileUpload');
        
        if (imageBtn && fileUpload) {
            imageBtn.addEventListener('click', () => fileUpload.click());
            fileUpload.addEventListener('change', (e) => this.handleImageUpload(e));
        }

        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => authSystem.logout());
        }

        // Configurações
        const profileBtn = document.getElementById('profileBtn');
        if (profileBtn) {
            profileBtn.addEventListener('click', () => this.showProfileModal());
        }

        const webhookBtn = document.getElementById('webhookBtn');
        if (webhookBtn) {
            webhookBtn.addEventListener('click', () => this.showWebhookModal());
        }
    }

    async sendMessage() {
        const messageInput = document.getElementById('messageInput');
        const sendBtn = document.getElementById('sendBtn');
        
        if (!messageInput || !sendBtn) return;

        const content = messageInput.value.trim();
        if (!content) return;

        // Desabilita botão durante envio
        sendBtn.disabled = true;
        sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

        try {
            const message = {
                id: Date.now().toString(36) + Math.random().toString(36).substr(2),
                sender: this.currentUser.username,
                senderName: this.currentUser.displayName,
                content: this.encryptMessage(content),
                timestamp: Date.now(),
                type: 'text'
            };

            // Adiciona mensagem localmente
            this.messages.push(message);
            this.saveMessages();
            this.displayMessage(message);

            // Simula resposta após 1-3 segundos
            setTimeout(() => this.simulateResponse(content), Math.random() * 2000 + 1000);

            // Limpa input
            messageInput.value = '';
            document.getElementById('charCount').textContent = '0/2000';

        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
        } finally {
            // Restaura botão
            sendBtn.disabled = false;
            sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
        }
    }

    async handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Valida tamanho (5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Imagem muito grande. Máximo 5MB.');
            return;
        }

        // Valida tipo
        if (!file.type.startsWith('image/')) {
            alert('Por favor, selecione apenas imagens.');
            return;
        }

        // Mostra modal de preview
        this.showImageModal(file);
    }

    showImageModal(file) {
        const modal = document.getElementById('imageModal');
        const uploadArea = document.getElementById('uploadArea');
        const imagePreview = document.getElementById('imagePreview');
        const confirmBtn = document.getElementById('confirmUpload');

        if (!modal || !uploadArea || !imagePreview || !confirmBtn) return;

        // Cria preview
        const reader = new FileReader();
        reader.onload = (e) => {
            uploadArea.style.display = 'none';
            imagePreview.style.display = 'block';
            imagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
            confirmBtn.disabled = false;
        };
        reader.readAsDataURL(file);

        // Mostra modal
        modal.style.display = 'flex';

        // Configura botões do modal
        const closeBtn = modal.querySelector('.close-modal');
        const cancelBtn = document.getElementById('cancelUpload');

        const closeModal = () => {
            modal.style.display = 'none';
            uploadArea.style.display = 'block';
            imagePreview.style.display = 'none';
            imagePreview.innerHTML = '';
            confirmBtn.disabled = true;
            document.getElementById('fileUpload').value = '';
        };

        closeBtn?.addEventListener('click', closeModal);
        cancelBtn?.addEventListener('click', closeModal);

        confirmBtn?.addEventListener('click', async () => {
            await this.sendImage(file);
            closeModal();
        });
    }

    async sendImage(file) {
        const sendBtn = document.getElementById('sendBtn');
        if (sendBtn) {
            sendBtn.disabled = true;
            sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        }

        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const message = {
                    id: Date.now().toString(36) + Math.random().toString(36).substr(2),
                    sender: this.currentUser.username,
                    senderName: this.currentUser.displayName,
                    content: e.target.result,
                    timestamp: Date.now(),
                    type: 'image',
                    fileName: file.name,
                    fileSize: this.formatFileSize(file.size)
                };

                // Adiciona mensagem localmente
                this.messages.push(message);
                this.saveMessages();
                this.displayMessage(message);

                // Simula resposta após 2-4 segundos
                setTimeout(() => this.simulateImageResponse(), Math.random() * 2000 + 2000);
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Erro ao enviar imagem:', error);
        } finally {
            if (sendBtn) {
                sendBtn.disabled = false;
                sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
            }
        }
    }

    simulateResponse(originalMessage) {
        const otherUsers = Object.values(authSystem.users).filter(
            user => user.username !== this.currentUser.username
        );
        
        if (otherUsers.length === 0) return;

        const randomUser = otherUsers[Math.floor(Math.random() * otherUsers.length)];
        const responses = [
            "Interessante...",
            "Concordo plenamente.",
            "Precisamos falar sobre isso.",
            "Mantenha isso em segredo.",
            "Entendido.",
            "Mensagem recebida.",
            "Continua..."
        ];

        const response = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2),
            sender: randomUser.username,
            senderName: randomUser.displayName,
            content: this.encryptMessage(responses[Math.floor(Math.random() * responses.length)]),
            timestamp: Date.now(),
            type: 'text'
        };

        this.messages.push(response);
        this.saveMessages();
        this.displayMessage(response);
    }

    simulateImageResponse() {
        const otherUsers = Object.values(authSystem.users).filter(
            user => user.username !== this.currentUser.username
        );
        
        if (otherUsers.length === 0) return;

        const randomUser = otherUsers[Math.floor(Math.random() * otherUsers.length)];
        const responses = [
            "Imagem recebida.",
            "Visualizado.",
            "Interessante...",
            "Guarde isso com cuidado."
        ];

        const response = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2),
            sender: randomUser.username,
            senderName: randomUser.displayName,
            content: this.encryptMessage(responses[Math.floor(Math.random() * responses.length)]),
            timestamp: Date.now(),
            type: 'text'
        };

        this.messages.push(response);
        this.saveMessages();
        this.displayMessage(response);
    }

    simulateOtherUsers() {
        // Simula usuários online
        const usersList = document.getElementById('usersList');
        if (!usersList) return;

        const allUsers = Object.values(authSystem.users);
        usersList.innerHTML = '';

        allUsers.forEach(user => {
            if (user.username === this.currentUser.username) return;

            const userElement = document.createElement('div');
            userElement.className = 'user-item';
            userElement.innerHTML = `
                <div class="user-avatar">${user.displayName.charAt(0)}</div>
                <div class="user-details">
                    <div class="user-name">${user.displayName}</div>
                    <div class="user-status active">Online</div>
                </div>
            `;
            usersList.appendChild(userElement);
        });
    }

    loadMessages() {
        const container = document.getElementById('messagesContainer');
        if (!container) return;

        // Remove mensagem de boas-vindas
        const welcomeMsg = container.querySelector('.welcome-message');
        if (welcomeMsg) {
            welcomeMsg.remove();
        }

        // Carrega mensagens salvas
        this.messages.forEach(message => this.displayMessage(message));
        
        // Rola para a última mensagem
        this.scrollToBottom();
    }

    displayMessage(message) {
        const container = document.getElementById('messagesContainer');
        if (!container) return;

        const isCurrentUser = message.sender === this.currentUser.username;
        const messageElement = document.createElement('div');
        messageElement.className = `message ${isCurrentUser ? 'sent' : 'received'}`;
        messageElement.dataset.id = message.id;

        let content = message.type === 'image' 
            ? `<img src="${message.content}" alt="${message.fileName}" data-action="view-image">`
            : this.decryptMessage(message.content);

        const time = new Date(message.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });

        messageElement.innerHTML = `
            <div class="message-header">
                <span class="message-sender">${message.senderName}</span>
                <span class="message-time">${time}</span>
            </div>
            <div class="message-content">${content}</div>
            <div class="message-actions">
                ${message.type === 'image' ? 
                    `<button class="action-btn" data-action="download-image" data-filename="${message.fileName}">
                        <i class="fas fa-download"></i> Baixar
                    </button>` : ''}
                <button class="action-btn" data-action="copy-message">
                    <i class="fas fa-copy"></i> Copiar
                </button>
                ${isCurrentUser ? 
                    `<button class="action-btn" data-action="delete-message">
                        <i class="fas fa-trash"></i> Excluir
                    </button>` : ''}
            </div>
        `;

        container.appendChild(messageElement);
        this.scrollToBottom();

        // Adiciona event listeners para ações
        this.setupMessageActions(messageElement, message);
    }

    setupMessageActions(element, message) {
        // Copiar mensagem
        const copyBtn = element.querySelector('[data-action="copy-message"]');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                const content = message.type === 'image' 
                    ? message.content 
                    : this.decryptMessage(message.content);
                
                navigator.clipboard.writeText(content).then(() => {
                    this.showToast('Mensagem copiada!');
                });
            });
        }

        // Download de imagem
        const downloadBtn = element.querySelector('[data-action="download-image"]');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                const link = document.createElement('a');
                link.href = message.content;
                link.download = message.fileName || 'imagem_chat.png';
                link.click();
            });
        }

        // Visualizar imagem
        const image = element.querySelector('[data-action="view-image"]');
        if (image) {
            image.addEventListener('click', () => {
                this.showImagePreview(message.content);
            });
        }

        // Excluir mensagem
        const deleteBtn = element.querySelector('[data-action="delete-message"]');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                if (confirm('Tem certeza que deseja excluir esta mensagem?')) {
                    this.deleteMessage(message.id);
                }
            });
        }
    }

    showImagePreview(src) {
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 800px;">
                <div class="modal-header">
                    <h3><i class="fas fa-expand"></i> VISUALIZAR IMAGEM</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body" style="text-align: center; padding: 0;">
                    <img src="${src}" style="max-width: 100%; border-radius: 0 0 15px 15px;">
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    deleteMessage(messageId) {
        this.messages = this.messages.filter(msg => msg.id !== messageId);
        this.saveMessages();
        
        const messageElement = document.querySelector(`[data-id="${messageId}"]`);
        if (messageElement) {
            messageElement.remove();
        }
    }

    saveMessages() {
        // Mantém apenas as últimas 500 mensagens
        if (this.messages.length > 500) {
            this.messages = this.messages.slice(-500);
        }
        
        localStorage.setItem('chat_secreto_messages', JSON.stringify(this.messages));
    }

    scrollToBottom() {
        const container = document.getElementById('messagesContainer');
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }

    showProfileModal() {
        this.showModal('Perfil', `
            <div class="input-group">
                <label for="profileName">Nome de Exibição</label>
                <input type="text" id="profileName" value="${this.currentUser.displayName}">
            </div>
            <div class="input-group">
                <label for="currentPassword">Senha Atual</label>
                <input type="password" id="currentPassword" placeholder="Digite sua senha atual">
            </div>
            <div class="input-group">
                <label for="newPassword">Nova Senha</label>
                <input type="password" id="newPassword" placeholder="Nova senha (opcional)">
            </div>
            <div class="input-group">
                <label for="confirmPassword">Confirmar Nova Senha</label>
                <input type="password" id="confirmPassword" placeholder="Confirme a nova senha">
            </div>
        `, 'Salvar Alterações', () => this.updateProfile());
    }

    showWebhookModal() {
        this.showModal('Configurar Webhook', `
            <div class="input-group">
                <label for="webhookUrl">URL do Webhook</label>
                <input type="text" id="webhookUrl" value="${this.currentUser.webhook}" placeholder="https://discord.com/api/webhooks/...">
            </div>
            <p style="font-size: 12px; color: #666; margin-top: 10px;">
                <i class="fas fa-info-circle"></i> O webhook é usado apenas para enviar códigos de verificação
            </p>
        `, 'Salvar', () => this.updateWebhook());
    }

    showModal(title, content, confirmText, confirmAction) {
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-cog"></i> ${title}</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    ${content}
                    <div class="modal-actions">
                        <button class="modal-btn secondary" data-action="cancel">Cancelar</button>
                        <button class="modal-btn primary" data-action="confirm">${confirmText}</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const closeModal = () => modal.remove();

        modal.querySelector('.close-modal').addEventListener('click', closeModal);
        modal.querySelector('[data-action="cancel"]').addEventListener('click', closeModal);

        modal.querySelector('[data-action="confirm"]').addEventListener('click', () => {
            confirmAction();
            closeModal();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }

    async updateProfile() {
        const nameInput = document.getElementById('profileName');
        const currentPassword = document.getElementById('currentPassword');
        const newPassword = document.getElementById('newPassword');
        const confirmPassword = document.getElementById('confirmPassword');

        if (!nameInput || !currentPassword) return;

        const newName = nameInput.value.trim();
        const currentPass = currentPassword.value;
        const newPass = newPassword.value;
        const confirmPass = confirmPassword.value;

        // Valida senha atual
        if (currentPass !== this.currentUser.password) {
            this.showToast('Senha atual incorreta!');
            return;
        }

        // Valida nova senha
        if (newPass && newPass !== confirmPass) {
            this.showToast('As novas senhas não coincidem!');
            return;
        }

        try {
            const updates = {
                displayName: newName
            };

            if (newPass) {
                updates.password = newPass;
            }

            await authSystem.updateUser(this.currentUser.username, updates);
            this.currentUser = { ...this.currentUser, ...updates };
            
            // Atualiza sessão
            const session = JSON.parse(localStorage.getItem('chat_secreto_session'));
            session.user = this.currentUser;
            localStorage.setItem('chat_secreto_session', JSON.stringify(session));

            this.updateUI();
            this.showToast('Perfil atualizado com sucesso!');
        } catch (error) {
            this.showToast('Erro ao atualizar perfil');
            console.error(error);
        }
    }

    async updateWebhook() {
        const webhookInput = document.getElementById('webhookUrl');
        if (!webhookInput) return;

        const newWebhook = webhookInput.value.trim();
        
        // Validação básica de URL
        if (newWebhook && !newWebhook.startsWith('https://')) {
            this.showToast('URL do webhook inválida!');
            return;
        }

        try {
            await authSystem.updateUser(this.currentUser.username, { webhook: newWebhook });
            this.currentUser.webhook = newWebhook;
            
            // Atualiza sessão
            const session = JSON.parse(localStorage.getItem('chat_secreto_session'));
            session.user = this.currentUser;
            localStorage.setItem('chat_secreto_session', JSON.stringify(session));

            this.showToast('Webhook atualizado com sucesso!');
        } catch (error) {
            this.showToast('Erro ao atualizar webhook');
            console.error(error);
        }
    }

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? 'rgba(0, 100, 0, 0.9)' : 'rgba(139, 0, 0, 0.9)'};
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            border-left: 4px solid ${type === 'success' ? '#00cc00' : '#ff0000'};
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    encryptMessage(text) {
        // Criptografia simples (em produção usar algo mais seguro)
        return btoa(encodeURIComponent(text).split('').reverse().join(''));
    }

    decryptMessage(encrypted) {
        try {
            return decodeURIComponent(atob(encrypted).split('').reverse().join(''));
        } catch {
            return '[Mensagem criptografada]';
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Inicializa o chat quando a página carrega
document.addEventListener('DOMContentLoaded', () => {
    new ChatSystem();
});

// Adiciona estilos para animações
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .toast {
        animation: slideIn 0.3s ease;
    }
`;
document.head.appendChild(style);
