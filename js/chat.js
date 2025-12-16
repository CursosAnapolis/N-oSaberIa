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
