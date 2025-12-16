document.addEventListener('DOMContentLoaded', function() {
    const security = new SecuritySystem();
    const loginForm = document.getElementById('loginForm');
    const showPasswordBtn = document.getElementById('showPassword');
    const passwordInput = document.getElementById('password');
    const codeGroup = document.getElementById('codeGroup');
    const codeInput = document.getElementById('code');
    const attemptsCount = document.getElementById('attemptsCount');
    const banMessage = document.getElementById('banMessage');
    
    let currentUsername = '';
    let verificationCode = '';
    let webhookClient = null;

    // Inicializar webhook
    if (typeof WebhookClient !== 'undefined') {
        webhookClient = new WebhookClient();
    }

    // Mostrar/esconder senha
    showPasswordBtn.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
    });

    // Atualizar contador de tentativas
    function updateAttemptsDisplay(username) {
        const remaining = security.getRemainingAttempts(username);
        attemptsCount.textContent = `Tentativas restantes: ${remaining}`;
        
        if (remaining === 0) {
            attemptsCount.style.color = 'var(--error)';
        } else if (remaining === 1) {
            attemptsCount.style.color = '#ff9900';
        } else {
            attemptsCount.style.color = 'var(--white)';
        }
    }

    // Verificar banimento
    function checkBan(username) {
        const banInfo = security.isUserBanned(username);
        
        if (banInfo.banned) {
            banMessage.textContent = `Usuário banido! Tempo restante: ${banInfo.remaining}`;
            banMessage.classList.add('error-message');
            loginForm.querySelector('button[type="submit"]').disabled = true;
            return true;
        }
        
        banMessage.textContent = '';
        loginForm.querySelector('button[type="submit"]').disabled = false;
        return false;
    }

    // Enviar código de verificação
    async function sendVerificationCode(username) {
        verificationCode = security.generateVerificationCode();
        security.storeVerificationCode(username, verificationCode);
        
        // Obter webhook do usuário
        const users = security.getUsers();
        const user = users.find(u => u.username === username);
        
        if (user && webhookClient) {
            try {
                await webhookClient.sendVerificationCode(user.webhook, verificationCode, username);
                return true;
            } catch (error) {
                console.error('Erro ao enviar código:', error);
                return false;
            }
        }
        
        return false;
    }

    // Processar login
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        
        // Verificar banimento
        if (checkBan(username)) {
            return;
        }
        
        // Primeira etapa: verificar credenciais
        if (!codeGroup.style.display || codeGroup.style.display === 'none') {
            currentUsername = username;
            updateAttemptsDisplay(username);
            
            if (security.validateCredentials(username, password)) {
                // Enviar código de verificação
                const codeSent = await sendVerificationCode(username);
                
                if (codeSent) {
                    codeGroup.style.display = 'block';
                    codeGroup.classList.add('fade-in');
                    banMessage.textContent = 'Código de verificação enviado para seu webhook!';
                    banMessage.style.color = 'var(--success)';
                } else {
                    banMessage.textContent = 'Erro ao enviar código de verificação.';
                    banMessage.style.color = 'var(--error)';
                }
            } else {
                security.recordFailedAttempt(username);
                updateAttemptsDisplay(username);
                
                const remaining = security.getRemainingAttempts(username);
                if (remaining === 0) {
                    security.banUser(username);
                    checkBan(username);
                } else {
                    banMessage.textContent = `Credenciais inválidas! ${remaining} tentativa(s) restante(s).`;
                    banMessage.style.color = 'var(--error)';
                }
            }
        }
        // Segunda etapa: verificar código
        else {
            const code = codeInput.value.trim();
            
            if (security.verifyCode(currentUsername, code)) {
                // Login bem-sucedido
                security.resetAttempts(currentUsername);
                
                // Armazenar sessão
                const users = security.getUsers();
                const user = users.find(u => u.username === currentUsername);
                
                sessionStorage.setItem('currentUser', JSON.stringify({
                    username: currentUsername,
                    displayName: user.displayName,
                    role: user.role,
                    webhook: user.webhook
                }));
                
                sessionStorage.setItem('loggedIn', 'true');
                sessionStorage.setItem('loginTime', Date.now());
                
                // Redirecionar para o chat
                window.location.href = 'chat.html';
            } else {
                banMessage.textContent = 'Código de verificação inválido ou expirado!';
                banMessage.style.color = 'var(--error)';
                codeInput.value = '';
                codeInput.focus();
            }
        }
    });

    // Inicializar
    const urlParams = new URLSearchParams(window.location.search);
    const usernameParam = urlParams.get('username');
    
    if (usernameParam) {
        document.getElementById('username').value = usernameParam;
        checkBan(usernameParam);
        updateAttemptsDisplay(usernameParam);
    }
});
