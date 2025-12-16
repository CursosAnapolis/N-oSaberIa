class SecuritySystem {
    constructor() {
        this.failedAttempts = JSON.parse(localStorage.getItem('failedAttempts')) || {};
        this.banStatus = JSON.parse(localStorage.getItem('banStatus')) || {};
        this.maxAttempts = 3;
        this.banLevels = [
            { hours: 3 },
            { hours: 24 },
            { hours: 120 },
            { permanent: true }
        ];
    }

    hashPassword(password) {
        // Simulação de hash - Em produção, use uma biblioteca como bcrypt
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(16);
    }

    validateCredentials(username, password) {
        const users = this.getUsers();
        const user = users.find(u => u.username === username);
        
        if (!user) return false;
        
        const hashedInput = this.hashPassword(password);
        return user.password === hashedInput;
    }

    getUsers() {
        const users = [
            {
                username: "carlinhos",
                password: this.hashPassword("1234"),
                displayName: "Gabriel",
                webhook: "https://discord.com/api/webhooks/1425044577080836228/BpIwVskxVoWoqBAaFxYJI9gVj9s1JGGamhtdC-huBcUrWWufq2-bI1EcX_QAeLfkU7q2",
                role: "user"
            },
            {
                username: "MatheusCosta",
                password: this.hashPassword("89a2k}k2pu{U&Dwlb#)lo[}ap2Sy}DpGE_.eVf=;xzo1al[%he"),
                displayName: "Matheus",
                webhook: "https://discord.com/api/webhooks/1425044577080836228/BpIwVskxVoWoqBAaFxYJI9gVj9s1JGGamhtdC-huBcUrWWufq2-bI1EcX_QAeLfkU7q2",
                role: "user"
            },
            {
                username: "ErikSlava",
                password: this.hashPassword("55676209-1"),
                displayName: "Erik",
                webhook: "https://discord.com/api/webhooks/1425044577080836228/BpIwVskxVoWoqBAaFxYJI9gVj9s1JGGamhtdC-huBcUrWWufq2-bI1EcX_QAeLfkU7q2",
                role: "admin"
            }
        ];

        const storedUsers = JSON.parse(localStorage.getItem('additionalUsers')) || [];
        return [...users, ...storedUsers];
    }

    recordFailedAttempt(username) {
        if (!this.failedAttempts[username]) {
            this.failedAttempts[username] = {
                count: 0,
                timestamps: []
            };
        }

        this.failedAttempts[username].count++;
        this.failedAttempts[username].timestamps.push(Date.now());
        
        // Manter apenas os últimos 5 registros
        if (this.failedAttempts[username].timestamps.length > 5) {
            this.failedAttempts[username].timestamps.shift();
        }

        localStorage.setItem('failedAttempts', JSON.stringify(this.failedAttempts));
        
        if (this.failedAttempts[username].count >= this.maxAttempts) {
            this.banUser(username);
        }
    }

    banUser(username) {
        const attemptCount = this.failedAttempts[username]?.count || 0;
        const banLevel = Math.min(attemptCount - this.maxAttempts, this.banLevels.length - 1);
        
        if (this.banLevels[banLevel].permanent) {
            this.banStatus[username] = {
                permanent: true,
                bannedAt: Date.now()
            };
        } else {
            this.banStatus[username] = {
                permanent: false,
                bannedAt: Date.now(),
                duration: this.banLevels[banLevel].hours * 60 * 60 * 1000
            };
        }

        localStorage.setItem('banStatus', JSON.stringify(this.banStatus));
    }

    isUserBanned(username) {
        const ban = this.banStatus[username];
        
        if (!ban) return false;
        
        if (ban.permanent) {
            return { banned: true, remaining: "PERMANENTE" };
        }
        
        const remainingTime = ban.bannedAt + ban.duration - Date.now();
        
        if (remainingTime <= 0) {
            delete this.banStatus[username];
            localStorage.setItem('banStatus', JSON.stringify(this.banStatus));
            return false;
        }
        
        return {
            banned: true,
            remaining: this.formatTime(remainingTime)
        };
    }

    formatTime(ms) {
        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    }

    getRemainingAttempts(username) {
        const attempts = this.failedAttempts[username]?.count || 0;
        return Math.max(0, this.maxAttempts - attempts);
    }

    resetAttempts(username) {
        if (this.failedAttempts[username]) {
            delete this.failedAttempts[username];
            localStorage.setItem('failedAttempts', JSON.stringify(this.failedAttempts));
        }
    }

    generateVerificationCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    storeVerificationCode(username, code) {
        sessionStorage.setItem(`verification_${username}`, code);
        sessionStorage.setItem(`verification_time_${username}`, Date.now());
        
        // Expira em 10 minutos
        setTimeout(() => {
            sessionStorage.removeItem(`verification_${username}`);
            sessionStorage.removeItem(`verification_time_${username}`);
        }, 10 * 60 * 1000);
    }

    verifyCode(username, code) {
        const storedCode = sessionStorage.getItem(`verification_${username}`);
        const codeTime = sessionStorage.getItem(`verification_time_${username}`);
        
        if (!storedCode || !codeTime) return false;
        
        // Verificar se o código expirou (10 minutos)
        if (Date.now() - parseInt(codeTime) > 10 * 60 * 1000) {
            sessionStorage.removeItem(`verification_${username}`);
            sessionStorage.removeItem(`verification_time_${username}`);
            return false;
        }
        
        return storedCode === code;
    }
          }
