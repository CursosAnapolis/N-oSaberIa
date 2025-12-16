document.addEventListener('DOMContentLoaded', function() {
    const security = new SecuritySystem();
    let currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    
    // Verificar autenticação
    if (!sessionStorage.getItem('loggedIn') || !currentUser) {
        window.location.href = 'index.html';
        return;
    }
    
    // Elementos do DOM
    const currentUserSpan = document.getElementById('currentUser');
    const logoutBtn = document.getElementById('logoutBtn');
    const messagesContainer = document.getElementById('messagesContainer');
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    const imageBtn = document.getElementById('imageBtn');
    const imageInput = document.getElementById('imageInput');
    const onlineUsersList = document.getElementById('onlineUsers');
    const editProfileBtn = document.getElementById('editProfileBtn');
    const changeWebhookBtn = document.getElementById('changeWebhookBtn');
    const addUserBtn = document.getElementById('addUserBtn');
    const settingsModal = document.getElementById('settingsModal');
    const addUserModal = document.getElementById('addUserModal');
    const profileForm = document.getElementById('profileForm');
    const addUserForm = document.getElementById('addUserForm');
    const closeModals = document.querySelectorAll('.close-modal');
    
    // Inicializar usuário atual
    currentUserSpan.textContent = currentUser.displayName;
    
    // Mostrar botão de adicionar usuário apenas para admin (Erik)
    if (currentUser.role === 'admin') {
        addUserBtn.style.display = 'block';
    }
    
    // Carregar usuários online
    function loadOnlineUsers() {
        const users = security.getUsers();
        onlineUsersList.innerHTML = '';
        
        users.forEach(user => {
            const li = document.createElement('li');
            li.innerHTML = `
                <i class="fas fa-user-circle"></i>
                <span>${user.displayName}</span>
                ${user.username === currentUser.username ? '<span class="you">(você)</span>' : ''}
            `;
            onlineUsersList.appendChild(li);
        });
    }
    
    // Formatar data
    function formatDate(date) {
        return new Date(date).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit'
        });
    }
    
    // Adicionar mensagem ao chat
    function addMessage(username, message, isImage = false, timestamp = Date.now()) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${username === currentUser.username ? 'sent' : 'received'}`;
        
        if (isImage) {
            messageDiv.innerHTML = `
                <div class="message-header">
                    <span class="message-sender">${username}</span>
                    <span class="message-time">${formatDate(timestamp)}</span>
                </div>
                <div class="message-content">
                    <img src="${message}" alt="Imagem enviada" class="chat-image">
                </div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="message-header">
                    <span class="message-sender">${username}</span>
                    <span class="message-time">${formatDate(timestamp)}</span>
                </div>
                <div class="message-content">
                    ${message}
                </div>
            `;
        }
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        updateMessageCount();
    }
    
    // Atualizar contador de mensagens
    function updateMessageCount() {
        const messageCount = messagesContainer.querySelectorAll('.message').length;
        document.getElementById('messageCount').textContent = `${messageCount} mensagens`;
    }
    
    // Enviar mensagem
    async function sendMessage(content, isImage = false) {
        if (!content.trim()) return;
        
        const users = security.getUsers();
        const user = users.find(u => u.username === currentUser.username);
        
        if (user && typeof WebhookClient !== 'undefined') {
            try {
                await webhookClient.sendMessage(user.webhook, {
                    username: currentUser.displayName,
                    content: isImage ? `📸 Imagem enviada: ${content}` : content,
                    avatar: `https://ui-avatars.com/api/?name=${currentUser.displayName}&background=${encodeURIComponent('8B0000')}&color=fff`
                });
                
                addMessage(currentUser.displayName, content, isImage);
                messageInput.value = '';
                
                // Atualizar última atualização
                document.getElementById('lastSeen').textContent = 'Última atualização: agora';
            } catch (error) {
                console.error('Erro ao enviar mensagem:', error);
                alert('Erro ao enviar mensagem. Verifique sua conexão.');
            }
        }
    }
    
    // Event Listeners
    sendBtn.addEventListener('click', () => sendMessage(messageInput.value));
    
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage(messageInput.value);
        }
    });
    
    imageBtn.addEventListener('click', () => imageInput.click());
    
    imageInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                sendMessage(e.target.result, true);
            };
            reader.readAsDataURL(file);
            imageInput.value = '';
        }
    });
    
    logoutBtn.addEventListener('click', () => {
        sessionStorage.clear();
        window.location.href = 'index.html';
    });
    
    // Modal de configurações
    editProfileBtn.addEventListener('click', () => {
        settingsModal.style.display = 'block';
    });
    
    changeWebhookBtn.addEventListener('click', () => {
        document.getElementById('newUsername').value = currentUser.displayName;
        settingsModal.style.display = 'block';
    });
    
    addUserBtn.addEventListener('click', () => {
        addUserModal.style.display = 'block';
    });
    
    closeModals.forEach(btn => {
        btn.addEventListener('click', () => {
            settingsModal.style.display = 'none';
            addUserModal.style.display = 'none';
        });
    });
    
    // Fechar modal ao clicar fora
    window.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.style.display = 'none';
        }
        if (e.target === addUserModal) {
            addUserModal.style.display = 'none';
        }
    });
    
    // Atualizar perfil
    profileForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const newUsername = document.getElementById('newUsername').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (newPassword && newPassword !== confirmPassword) {
            alert('As senhas não coincidem!');
            return;
        }
        
        // Atualizar usuário atual
        if (newUsername) {
            currentUser.displayName = newUsername;
            currentUserSpan.textContent = newUsername;
        }
        
        // Em produção, atualizaria no servidor
        alert('Perfil atualizado com sucesso!');
        settingsModal.style.display = 'none';
        profileForm.reset();
    });
    
    // Adicionar novo usuário (apenas admin)
    addUserForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('newUserUsername').value;
        const password = document.getElementById('newUserPassword').value;
        const webhook = document.getElementById('newUserWebhook').value;
        
        // Validar webhook
        if (!webhook.includes('discord.com/api/webhooks/')) {
            alert('URL do webhook inválida!');
            return;
        }
        
        // Adicionar usuário
        const newUser = {
            username: username,
            password: security.hashPassword(password),
            displayName: username,
            webhook: webhook,
            role: 'user'
        };
        
        const additionalUsers = JSON.parse(localStorage.getItem('additionalUsers')) || [];
        additionalUsers.push(newUser);
        localStorage.setItem('additionalUsers', JSON.stringify(additionalUsers));
        
        alert('Usuário adicionado com sucesso!');
        addUserModal.style.display = 'none';
        addUserForm.reset();
        loadOnlineUsers();
    });
    
    // Inicializar
    loadOnlineUsers();
    updateMessageCount();
    
    // Atualizar última atualização periodicamente
    setInterval(() => {
        const now = new Date();
        document.getElementById('lastSeen').textContent = 
            `Última atualização: ${now.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}`;
    }, 60000);
    
    // Adicionar estilos para o chat
    const style = document.createElement('style');
    style.textContent = `
        .chat-container {
            display: flex;
            height: 100vh;
            background: linear-gradient(135deg, var(--black) 0%, #1a0000 100%);
        }
        
        .sidebar {
            width: 280px;
            background: var(--dark-gray);
            border-right: 2px solid var(--blood-red);
            display: flex;
            flex-direction: column;
        }
        
        .sidebar-header {
            padding: 20px;
            border-bottom: 1px solid var(--gray);
        }
        
        .sidebar-header h2 {
            color: var(--blood-red);
            margin-bottom: 15px;
        }
        
        .user-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .logout-btn {
            background: var(--blood-red);
            color: white;
            border: none;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            cursor: pointer;
            transition: background 0.3s;
        }
        
        .logout-btn:hover {
            background: var(--dark-red);
        }
        
        .users-list {
            padding: 20px;
            flex-grow: 1;
            overflow-y: auto;
        }
        
        .users-list h3 {
            margin-bottom: 15px;
            color: var(--blood-red);
        }
        
        .users-list ul {
            list-style: none;
        }
        
        .users-list li {
            padding: 10px 15px;
            margin: 5px 0;
            background: var(--gray);
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .users-list li .you {
            margin-left: auto;
            font-size: 0.8em;
            color: var(--blood-red);
        }
        
        .settings {
            padding: 20px;
            border-top: 1px solid var(--gray);
        }
        
        .settings h3 {
            margin-bottom: 15px;
            color: var(--blood-red);
        }
        
        .settings-btn {
            width: 100%;
            padding: 12px;
            margin: 8px 0;
            background: var(--gray);
            border: 1px solid var(--light-gray);
            color: var(--white);
            border-radius: 8px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 10px;
            transition: all 0.3s;
        }
        
        .settings-btn:hover {
            background: var(--light-gray);
            border-color: var(--blood-red);
        }
        
        .main-chat {
            flex-grow: 1;
            display: flex;
            flex-direction: column;
        }
        
        .chat-header {
            padding: 20px;
            border-bottom: 1px solid var(--gray);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .chat-header h2 {
            color: var(--blood-red);
        }
        
        .chat-info {
            display: flex;
            gap: 20px;
            font-size: 0.9em;
            color: var(--light-gray);
        }
        
        .messages-container {
            flex-grow: 1;
            padding: 20px;
            overflow-y: auto;
            background: rgba(10, 10, 10, 0.5);
        }
        
        .welcome-message {
            text-align: center;
            padding: 40px;
            color: var(--light-gray);
        }
        
        .welcome-message h3 {
            color: var(--blood-red);
            margin-bottom: 10px;
        }
        
        .message {
            margin: 15px 0;
            padding: 15px;
            border-radius: 10px;
            max-width: 70%;
            animation: fadeIn 0.3s ease-out;
        }
        
        .message.sent {
            margin-left: auto;
            background: linear-gradient(135deg, var(--blood-red) 0%, var(--dark-red) 100%);
        }
        
        .message.received {
            background: var(--gray);
        }
        
        .message-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 0.9em;
        }
        
        .message-sender {
            font-weight: bold;
            color: var(--white);
        }
        
        .message-time {
            color: var(--light-gray);
        }
        
        .chat-image {
            max-width: 300px;
            max-height: 300px;
            border-radius: 8px;
            margin-top: 10px;
        }
        
        .message-input {
            padding: 20px;
            border-top: 1px solid var(--gray);
            display: flex;
            gap: 10px;
            align-items: center;
        }
        
        .input-options {
            display: flex;
            gap: 10px;
        }
        
        .option-btn {
            background: var(--gray);
            border: none;
            color: var(--white);
            width: 40px;
            height: 40px;
            border-radius: 50%;
            cursor: pointer;
            transition: background 0.3s;
        }
        
        .option-btn:hover {
            background: var(--light-gray);
        }
        
        #messageInput {
            flex-grow: 1;
            padding: 15px 20px;
            background: var(--gray);
            border: 1px solid var(--light-gray);
            border-radius: 25px;
            color: var(--white);
            font-size: 16px;
        }
        
        #messageInput:focus {
            outline: none;
            border-color: var(--blood-red);
        }
        
        .send-btn {
            background: linear-gradient(135deg, var(--blood-red) 0%, var(--dark-red) 100%);
            color: white;
            border: none;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 20px;
            transition: transform 0.3s;
        }
        
        .send-btn:hover {
            transform: scale(1.1);
        }
        
        @media (max-width: 768px) {
            .sidebar {
                width: 80px;
            }
            
            .sidebar-header h2,
            .users-list h3,
            .settings h3,
            .users-list li span:not(.you),
            .settings-btn span {
                display: none;
            }
            
            .message {
                max-width: 90%;
            }
        }
    `;
    document.head.appendChild(style);
});
