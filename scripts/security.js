class SecuritySystem {
    constructor() {
        this.maxAttempts = 3;
        this.banDurations = [3, 24, 120, -1]; // horas, -1 = permanente
        this.storageKey = 'chat_secreto_security';
        this.webhookURL = 'https://discord.com/api/webhooks/1425044577080836228/BpIwVskxVoWoqBAaFxYJI9gVj9s1JGGamhtdC-huBcUrWWufq2-bI1EcX_QAeLfkU7q2';
        this.loadSecurityData();
    }

    loadSecurityData() {
        const data = localStorage.getItem(this.storageKey);
        if (data) {
            this.securityData = JSON.parse(data);
        } else {
            this.securityData = {
                attempts: {},
                bans: {},
                loginHistory: []
            };
            this.saveSecurityData();
        }
    }

    saveSecurityData() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.securityData));
    }

    getIP() {
        // Simulação de IP (em produção usar serviço de IP real)
        return localStorage.getItem('user_ip') || '127.0.0.1';
    }

    getClientFingerprint() {
        const navigatorInfo = {
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
            deviceMemory: navigator.deviceMemory || 'unknown'
        };
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillStyle = '#f00';
        ctx.fillText('SecurityFingerprint', 2, 2);
        const canvasFingerprint = canvas.toDataURL();
        
        return btoa(JSON.stringify(navigatorInfo) + canvasFingerprint).slice(0, 50);
    }

    async sendVerificationCode(user, code) {
        try {
            const message = {
                content: `🔐 **NOVO CÓDIGO DE VERIFICAÇÃO**\n👤 Usuário: ${user}\n🔢 Código: ||${code}||\n⏰ Validade: 5 minutos\n🌐 IP: ${this.getIP()}`,
                username: "Chat Secreto Security",
                avatar_url: "https://cdn-icons-png.flaticon.com/512/3067/3067256.png"
            };

            await fetch(this.webhookURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(message)
            });
        } catch (error) {
            console.error('Erro ao enviar código:', error);
        }
    }

    async logLoginAttempt(username, success, reason = '') {
        const fingerprint = this.getClientFingerprint();
        const ip = this.getIP();
        
        const logEntry = {
            timestamp: new Date().toISOString(),
            username,
            ip,
            fingerprint,
            success,
            reason,
            userAgent: navigator.userAgent
        };

        this.securityData.loginHistory.unshift(logEntry);
        this.securityData.loginHistory = this.securityData.loginHistory.slice(0, 100); // Mantém últimos 100 logs
        
        this.saveSecurityData();

        // Envia log para Discord
        if (!success) {
            try {
                const logMessage = {
                    content: `⚠️ **TENTATIVA DE LOGIN FALHADA**\n👤 Usuário: ${username}\n❌ Motivo: ${reason}\n🌐 IP: ${ip}\n🕒 Horário: ${new Date().toLocaleString()}`,
                    username: "Chat Secreto Security",
                    avatar_url: "https://cdn-icons-png.flaticon.com/512/5969/5969046.png"
                };

                await fetch(this.webhookURL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(logMessage)
                });
            } catch (error) {
                console.error('Erro ao enviar log:', error);
            }
        }
    }

    checkBanStatus(username, ip) {
        const fingerprint = this.getClientFingerprint();
        const now = Date.now();
        
        // Verifica ban por username
        if (this.securityData.bans[username]) {
            const ban = this.securityData.bans[username];
            if (ban.expires === -1) return { banned: true, permanent: true };
            if (ban.expires > now) {
                const remaining = Math.ceil((ban.expires - now) / (1000 * 60 * 60));
                return { banned: true, hours: remaining };
            }
            delete this.securityData.bans[username];
        }

        // Verifica ban por IP
        if (this.securityData.bans[ip]) {
            const ban = this.securityData.bans[ip];
            if (ban.expires === -1) return { banned: true, permanent: true };
            if (ban.expires > now) {
                const remaining = Math.ceil((ban.expires - now) / (1000 * 60 * 60));
                return { banned: true, hours: remaining };
            }
            delete this.securityData.bans[ip];
        }

        // Verifica ban por fingerprint
        if (this.securityData.bans[fingerprint]) {
            const ban = this.securityData.bans[fingerprint];
            if (ban.expires === -1) return { banned: true, permanent: true };
            if (ban.expires > now) {
                const remaining = Math.ceil((ban.expires - now) / (1000 * 60 * 60));
                return { banned: true, hours: remaining };
            }
            delete this.securityData.bans[fingerprint];
        }

        return { banned: false };
    }

    recordFailedAttempt(username) {
        const ip = this.getIP();
        const fingerprint = this.getClientFingerprint();
        
        // Contagem por username
        if (!this.securityData.attempts[username]) {
            this.securityData.attempts[username] = { count: 0, timestamp: Date.now() };
        }
        this.securityData.attempts[username].count++;
        this.securityData.attempts[username].timestamp = Date.now();

        // Contagem por IP
        if (!this.securityData.attempts[ip]) {
            this.securityData.attempts[ip] = { count: 0, timestamp: Date.now() };
        }
        this.securityData.attempts[ip].count++;

        // Contagem por fingerprint
        if (!this.securityData.attempts[fingerprint]) {
            this.securityData.attempts[fingerprint] = { count: 0, timestamp: Date.now() };
        }
        this.securityData.attempts[fingerprint].count++;

        // Limpa tentativas antigas (mais de 24 horas)
        this.cleanOldAttempts();

        // Aplica ban se necessário
        const maxCount = Math.max(
            this.securityData.attempts[username]?.count || 0,
            this.securityData.attempts[ip]?.count || 0,
            this.securityData.attempts[fingerprint]?.count || 0
        );

        if (maxCount <= this.maxAttempts + this.banDurations.length) {
            const banLevel = maxCount - this.maxAttempts - 1;
            if (banLevel >= 0) {
                this.applyBan(username, ip, fingerprint, banLevel);
            }
        }

        this.saveSecurityData();
        return maxCount;
    }

    cleanOldAttempts() {
        const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
        
        for (const key in this.securityData.attempts) {
            if (this.securityData.attempts[key].timestamp < twentyFourHoursAgo) {
                delete this.securityData.attempts[key];
            }
        }
    }

    applyBan(username, ip, fingerprint, level) {
        const duration = this.banDurations[level];
        const expires = duration === -1 ? -1 : Date.now() + (duration * 60 * 60 * 1000);
        
        const banInfo = {
            level,
            expires,
            appliedAt: Date.now(),
            reason: `Excedeu ${this.maxAttempts + level} tentativas de login falhas`
        };

        this.securityData.bans[username] = banInfo;
        this.securityData.bans[ip] = banInfo;
        this.securityData.bans[fingerprint] = banInfo;

        this.saveSecurityData();
    }

    resetAttempts(username) {
        const ip = this.getIP();
        const fingerprint = this.getClientFingerprint();
        
        delete this.securityData.attempts[username];
        delete this.securityData.attempts[ip];
        delete this.securityData.attempts[fingerprint];
        
        this.saveSecurityData();
    }

    getRemainingAttempts(username) {
        const ip = this.getIP();
        const fingerprint = this.getClientFingerprint();
        
        const maxCount = Math.max(
            this.securityData.attempts[username]?.count || 0,
            this.securityData.attempts[ip]?.count || 0,
            this.securityData.attempts[fingerprint]?.count || 0
        );
        
        return Math.max(0, this.maxAttempts - maxCount);
    }

    generateVerificationCode() {
        const chars = 'ABCDEFGHJKLMNPQRRTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }
}

// Inicializa o sistema de segurança
const securitySystem = new SecuritySystem();

// Sistema de captcha
class CaptchaSystem {
    constructor() {
        this.canvas = document.getElementById('captchaCanvas');
        this.ctx = this.canvas?.getContext('2d');
        this.code = '';
        this.input = document.getElementById('captchaInput');
        this.refreshBtn = document.getElementById('refreshCaptcha');
        
        if (this.canvas) {
            this.canvas.width = 200;
            this.canvas.height = 80;
            this.init();
        }
    }

    init() {
        if (this.refreshBtn) {
            this.refreshBtn.addEventListener('click', () => this.generateCaptcha());
        }
        this.generateCaptcha();
    }

    generateCaptcha() {
        if (!this.ctx) return;
        
        // Limpa canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Gera código aleatório
        const chars = 'ABCDEFGHJKLMNPQRRTUVWXYZ23456789';
        this.code = '';
        for (let i = 0; i < 6; i++) {
            this.code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        // Desenha texto distorcido
        this.ctx.font = 'bold 40px Arial';
        this.ctx.fillStyle = '#8b0000';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        for (let i = 0; i < this.code.length; i++) {
            const char = this.code[i];
            const x = 30 + i * 30 + Math.random() * 5;
            const y = 40 + Math.sin(Date.now() / 1000 + i) * 10;
            const rotation = (Math.random() - 0.5) * 0.5;
            
            this.ctx.save();
            this.ctx.translate(x, y);
            this.ctx.rotate(rotation);
            this.ctx.fillText(char, 0, 0);
            this.ctx.restore();
        }
        
        // Adiciona ruído
        this.addNoise();
        
        // Adiciona linhas
        this.addLines();
        
        return this.code;
    }

    addNoise() {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const pixels = imageData.data;
        
        for (let i = 0; i < pixels.length; i += 4) {
            if (Math.random() > 0.9) {
                pixels[i] = 139;     // R
                pixels[i + 1] = 0;   // G
                pixels[i + 2] = 0;   // B
            }
        }
        
        this.ctx.putImageData(imageData, 0, 0);
    }

    addLines() {
        this.ctx.strokeStyle = 'rgba(139, 0, 0, 0.3)';
        this.ctx.lineWidth = 1;
        
        for (let i = 0; i < 5; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(Math.random() * this.canvas.width, Math.random() * this.canvas.height);
            this.ctx.lineTo(Math.random() * this.canvas.width, Math.random() * this.canvas.height);
            this.ctx.stroke();
        }
    }

    validate(input) {
        return input.toUpperCase() === this.code.toUpperCase();
    }
}

// Inicializa sistemas quando a página carrega
document.addEventListener('DOMContentLoaded', () => {
    // Sistema de captcha
    const captcha = new CaptchaSystem();
    
    // Mostrar/esconder senha
    const showPasswordBtn = document.getElementById('showPassword');
    const passwordInput = document.getElementById('password');
    
    if (showPasswordBtn && passwordInput) {
        showPasswordBtn.addEventListener('click', () => {
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                showPasswordBtn.innerHTML = '<i class="fas fa-eye-slash"></i>';
            } else {
                passwordInput.type = 'password';
                showPasswordBtn.innerHTML = '<i class="fas fa-eye"></i>';
            }
        });
    }
    
    // Atualiza contador de tentativas
    updateAttemptsCounter();
});

function updateAttemptsCounter() {
    const attemptsLeft = document.getElementById('attemptsLeft');
    if (attemptsLeft) {
        const remaining = securitySystem.getRemainingAttempts('');
        attemptsLeft.textContent = remaining;
        
        if (remaining <= 1) {
            attemptsLeft.style.color = '#ff0000';
        } else if (remaining <= 2) {
            attemptsLeft.style.color = '#ff6b6b';
        } else {
            attemptsLeft.style.color = '#8b0000';
        }
    }
    }
