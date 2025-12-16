class AuthSystem {
    constructor() {
        this.users = this.loadUsers();
        this.currentUser = null;
        this.verificationCodes = new Map();
        this.init();
    }

    loadUsers() {
        const defaultUsers = {
            'carlinhos': {
                username: 'carlinhos',
                password: '1234',
                displayName: 'Gabriel',
                webhook: 'https://discord.com/api/webhooks/1425044577080836228/BpIwVskxVoWoqBAaFxYJI9gVj9s1JGGamhtdC-huBcUrWWufq2-bI1EcX_QAeLfkU7q2',
                role: 'user'
            },
            'MatheusCosta': {
                username: 'MatheusCosta',
                password: '89a2k}k2pu{U&Dwlb#)lo[}ap2Sy}DpGE_.eVf=;xzo1al[%he',
                displayName: 'Matheus',
                webhook: 'https://discord.com/api/webhooks/1425044577080836228/BpIwVskxVoWoqBAaFxYJI9gVj9s1JGGamhtdC-huBcUrWWufq2',
                role: 'user'
            },
            'ErikSlava': {
                username: 'ErikSlava',
                password: '55676209-1',
                displayName: 'Erik',
                webhook: 'https://discord.com/api/webhooks/1425044577080836228/BpIwVskxVoWoqBAaFxYJI9gVj9s1JGGamhtdC-huBcUrWWufq2',
                role: 'admin'
            }
        };

        const savedUsers = localStorage.getItem('chat_secreto_users');
        return savedUsers ? { ...defaultUsers, ...JSON.parse(savedUsers) } : defaultUsers;
    }

    init() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        const loginBtn = document.getElementById('loginBtn');
        const statusMessage = document.getElementById('statusMessage');
        const captchaSection = document.getElementById('captchaSection');
        
        if (!usernameInput || !passwordInput) return;
        
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        
        // Verifica se está banido
        const banStatus = securitySystem.checkBanStatus(username, securitySystem.getIP());
        if (banStatus.banned) {
            if (banStatus.permanent) {
                this.showError('ACESSO BLOQUEADO PERMANENTEMENTE');
            } else {
                this.showError(`Conta bloqueada por ${banStatus.hours} horas`);
            }
            return;
        }
        
        // Verifica captcha após primeira falha
        const remainingAttempts = securitySystem.getRemainingAttempts(username);
        if (remainingAttempts < 3) {
            captchaSection.style.display = 'block';
            const captchaInput = document.getElementById('captchaInput');
            const captchaCode = captchaInput?.value.trim();
            
            if (!captchaCode || !captcha.validate(captchaCode)) {
                this.showError('Código de verificação incorreto');
                return;
            }
        }
        
        // Desabilita botão durante processamento
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> VERIFICANDO...';
        
        try {
            // Valida credenciais
            const user = this.validateCredentials(username, password);
            
            if (user) {
                // Gera código de verificação
                const verificationCode = securitySystem.generateVerificationCode();
                this.verificationCodes.set(username, {
                    code: verificationCode,
                    expires: Date.now() + 5 * 60 * 1000 // 5 minutos
                });
                
                // Envia código via webhook
                await securitySystem.sendVerificationCode(username, verificationCode);
                
                // Limpa tentativas
                securitySystem.resetAttempts(username);
                
                // Mostra input para código
                this.showVerificationPrompt(username);
            } else {
                // Registra tentativa falha
                const failedCount = securitySystem.recordFailedAttempt(username);
                securitySystem.logLoginAttempt(username, false, 'Credenciais inválidas');
                
                if (failedCount >= securitySystem.maxAttempts) {
                    this.showError('Conta bloqueada temporariamente. Tente novamente mais tarde.');
                    captchaSection.style.display = 'none';
                } else {
                    this.showError(`Credenciais inválidas. ${securitySystem.getRemainingAttempts(username)} tentativa(s) restante(s)`);
                }
                
                // Atualiza contador
                updateAttemptsCounter();
            }
        } catch (error) {
            this.showError('Erro durante autenticação');
            console.error('Login error:', error);
        } finally {
            // Restaura botão
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> ACESSAR';
        }
    }

    validateCredentials(username, password) {
        const user = this.users[username];
        if (!user) return null;
        
        // Verifica senha
        if (user.password === password) {
            return user;
        }
        
        return null;
    }

    showVerificationPrompt(username) {
        const loginForm = document.getElementById('loginForm');
        if (!loginForm) return;
        
        loginForm.innerHTML = `
            <div class="verification-section">
                <h3><i class="fas fa-shield-alt"></i> VERIFICAÇÃO DE SEGURANÇA</h3>
                <p class="verification-info">
                    Um código de verificação foi enviado para o webhook configurado.<br>
                    Digite o código abaixo para completar o login.
                </p>
                
                <div class="input-group">
                    <label for="verificationCode"><i class="fas fa-code"></i> Código de Verificação</label>
                    <input type="text" id="verificationCode" placeholder="Digite o código de 8 caracteres" autocomplete="off" maxlength="8">
                </div>
                
                <div class="timer" id="timer">
                    ⏰ Tempo restante: <span id="countdown">05:00</span>
                </div>
                
                <button type="button" class="login-btn" id="verifyBtn">
                    <i class="fas fa-check"></i> VERIFICAR
                </button>
                
                <button type="button" class="secondary-btn" id="resendBtn">
                    <i class="fas fa-redo"></i> REENVIAR CÓDIGO
                </button>
                
                <button type="button" class="secondary-btn" id="backBtn">
                    <i class="fas fa-arrow-left"></i> VOLTAR
                </button>
                
                <div class="status-message" id="verificationStatus"></div>
            </div>
        `;
        
        this.startCountdown(username);
        this.setupVerificationListeners(username);
    }

    startCountdown(username) {
        const countdownElement = document.getElementById('countdown');
        const timerElement = document.getElementById('timer');
        const verificationData = this.verificationCodes.get(username);
        
        if (!verificationData) {
            this.showVerificationError('Código expirado. Volte e tente novamente.');
            return;
        }
        
        const endTime = verificationData.expires;
        
        const updateTimer = () => {
            const now = Date.now();
            const remaining = endTime - now;
            
            if (remaining <= 0) {
                clearInterval(timerInterval);
                countdownElement.textContent = '00:00';
                timerElement.style.color = '#ff0000';
                this.showVerificationError('Código expirado. Clique em "Reenviar Código".');
                return;
            }
            
            const minutes = Math.floor(remaining / 60000);
            const seconds = Math.floor((remaining % 60000) / 1000);
            countdownElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            if (remaining < 60000) { // Menos de 1 minuto
                timerElement.style.color = '#ff6b6b';
            }
        };
        
        updateTimer();
        const timerInterval = setInterval(updateTimer, 1000);
        
        // Salva o interval para limpar depois
        this.countdownInterval = timerInterval;
    }

    setupVerificationListeners(username) {
        const verifyBtn = document.getElementById('verifyBtn');
        const resendBtn = document.getElementById('resendBtn');
        const backBtn = document.getElementById('backBtn');
        const verificationCodeInput = document.getElementById('verificationCode');
        
        if (verifyBtn) {
            verifyBtn.addEventListener('click', async () => {
                const code = verificationCodeInput?.value.trim().toUpperCase();
                const verificationData = this.verificationCodes.get(username);
                
                if (!verificationData || Date.now() > verificationData.expires) {
                    this.showVerificationError('Código expirado');
                    return;
                }
                
                if (code === verificationData.code) {
                    // Login bem sucedido
                    this.currentUser = this.users[username];
                    securitySystem.logLoginAttempt(username, true);
                    
                    // Salva sessão
                    const session = {
                        user: this.currentUser,
                        loginTime: Date.now(),
                        token: this.generateSessionToken()
                    };
                    localStorage.setItem('chat_secreto_session', JSON.stringify(session));
                    
                    // Redireciona para chat
                    window.location.href = 'chat.html';
                } else {
                    this.showVerificationError('Código incorreto');
                }
            });
        }
        
        if (resendBtn) {
            resendBtn.addEventListener('click', async () => {
                resendBtn.disabled = true;
                resendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ENVIANDO...';
                
                try {
                    const newCode = securitySystem.generateVerificationCode();
                    this.verificationCodes.set(username, {
                        code: newCode,
                        expires: Date.now() + 5 * 60 * 1000
                    });
                    
                    await securitySystem.sendVerificationCode(username, newCode);
                    this.startCountdown(username);
                    
                    const status = document.getElementById('verificationStatus');
                    status.className = 'status-message success';
                    status.textContent = 'Novo código enviado com sucesso!';
                    status.style.display = 'block';
                    
                    setTimeout(() => {
                        status.style.display = 'none';
                    }, 3000);
                } catch (error) {
                    this.showVerificationError('Erro ao reenviar código');
                } finally {
                    resendBtn.disabled = false;
                    resendBtn.innerHTML = '<i class="fas fa-redo"></i> REENVIAR CÓDIGO';
                }
            });
        }
        
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                location.reload();
            });
        }
    }

    showError(message) {
        const statusMessage = document.getElementById('statusMessage');
        if (statusMessage) {
            statusMessage.className = 'status-message error';
            statusMessage.textContent = message;
            statusMessage.style.display = 'block';
            
            setTimeout(() => {
                statusMessage.style.display = 'none';
            }, 5000);
        }
    }

    showVerificationError(message) {
        const status = document.getElementById('verificationStatus');
        if (status) {
            status.className = 'status-message error';
            status.textContent = message;
            status.style.display = 'block';
        }
    }

    generateSessionToken() {
        return btoa(Date.now() + Math.random().toString(36).substr(2)).slice(0, 32);
    }

    checkSession() {
        const sessionData = localStorage.getItem('chat_secreto_session');
        if (!sessionData) return null;
        
        try {
            const session = JSON.parse(sessionData);
            
            // Verifica se a sessão expirou (24 horas)
            if (Date.now() - session.loginTime > 24 * 60 * 60 * 1000) {
                localStorage.removeItem('chat_secreto_session');
                return null;
            }
            
            // Verifica se o usuário ainda existe
            if (!this.users[session.user.username]) {
                localStorage.removeItem('chat_secreto_session');
                return null;
            }
            
            return session;
        } catch (error) {
            localStorage.removeItem('chat_secreto_session');
            return null;
        }
    }

    logout() {
        localStorage.removeItem('chat_secreto_session');
        this.currentUser = null;
        window.location.href = 'index.html';
    }

    // Métodos para administração
    addUser(username, password, displayName, role = 'user') {
        if (this.currentUser?.role !== 'admin') {
            throw new Error('Permissão negada');
        }
        
        this.users[username] = {
            username,
            password,
            displayName,
            webhook: 'https://discord.com/api/webhooks/1425044577080836228/BpIwVskxVoWoqBAaFxYJI9gVj9s1JGGamhtdC-huBcUrWWufq2-bI1EcX_QAeLfkU7q2',
            role
        };
        
        this.saveUsers();
        return true;
    }

    updateUser(username, updates) {
        if (this.currentUser?.role !== 'admin' && this.currentUser?.username !== username) {
            throw new Error('Permissão negada');
        }
        
        if (this.users[username]) {
            this.users[username] = { ...this.users[username], ...updates };
            this.saveUsers();
            return true;
        }
        
        return false;
    }

    saveUsers() {
        // Salva apenas usuários adicionais, não os padrões
        const defaultUsernames = ['carlinhos', 'MatheusCosta', 'ErikSlava'];
        const additionalUsers = {};
        
        for (const username in this.users) {
            if (!defaultUsernames.includes(username)) {
                additionalUsers[username] = this.users[username];
            }
        }
        
        localStorage.setItem('chat_secreto_users', JSON.stringify(additionalUsers));
    }
}

// Inicializa sistema de autenticação
const authSystem = new AuthSystem();

// Verifica sessão ao carregar
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('chat.html')) {
        const session = authSystem.checkSession();
        if (!session) {
            window.location.href = 'index.html';
        }
    }
});
