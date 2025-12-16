class AdminSystem {
    constructor() {
        this.init();
    }

    init() {
        // Verifica se o usuário atual é admin
        const sessionData = localStorage.getItem('chat_secreto_session');
        if (!sessionData) return;

        try {
            const session = JSON.parse(sessionData);
            if (session.user.role === 'admin') {
                this.setupAdminFeatures();
            }
        } catch (error) {
            console.error('Erro ao verificar admin:', error);
        }
    }

    setupAdminFeatures() {
        // Botão para adicionar usuário
        const addUserBtn = document.getElementById('addUserBtn');
        if (addUserBtn) {
            addUserBtn.addEventListener('click', () => this.showAddUserModal());
        }

        // Botão para ver logs
        const viewLogsBtn = document.getElementById('viewLogsBtn');
        if (viewLogsBtn) {
            viewLogsBtn.addEventListener('click', () => this.showLogsModal());
        }
    }

    showAddUserModal() {
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-user-plus"></i> ADICIONAR USUÁRIO</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="input-group">
                        <label for="newUsername">Nome de Usuário</label>
                        <input type="text" id="newUsername" placeholder="username">
                    </div>
                    <div class="input-group">
                        <label for="newDisplayName">Nome de Exibição</label>
                        <input type="text" id="newDisplayName" placeholder="Nome Completo">
                    </div>
                    <div class="input-group">
                        <label for="newUserPassword">Senha</label>
                        <input type="password" id="newUserPassword" placeholder="Senha forte">
                        <button type="button" class="show-password" id="showNewPassword">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                    <div class="input-group">
                        <label for="confirmNewPassword">Confirmar Senha</label>
                        <input type="password" id="confirmNewPassword" placeholder="Confirme a senha">
                    </div>
                    <div class="input-group">
                        <label for="userRole">Tipo de Usuário</label>
                        <select id="userRole">
                            <option value="user">Usuário Normal</option>
                            <option value="admin">Administrador</option>
                        </select>
                    </div>
                    <div class="password-strength" id="passwordStrength">
                        <div class="strength-bar"></div>
                        <span class="strength-text">Força da senha: <span id="strengthValue">Fraca</span></span>
                    </div>
                    <div class="modal-actions">
                        <button class="modal-btn secondary" data-action="cancel">Cancelar</button>
                        <button class="modal-btn primary" data-action="confirm" id="confirmAddUser" disabled>Adicionar</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const closeModal = () => modal.remove();

        modal.querySelector('.close-modal').addEventListener('click', closeModal);
        modal.querySelector('[data-action="cancel"]').addEventListener('click', closeModal);

        // Mostrar/esconder senha
        const showPasswordBtn = modal.querySelector('#showNewPassword');
        const passwordInput = modal.querySelector('#newUserPassword');
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

        // Verificação de força da senha
        passwordInput?.addEventListener('input', () => this.checkPasswordStrength(passwordInput.value));

        // Validação em tempo real
        const inputs = modal.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('input', () => this.validateNewUserForm());
        });

        // Confirmação
        modal.querySelector('[data-action="confirm"]').addEventListener('click', () => {
            this.addNewUser();
            closeModal();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }

    checkPasswordStrength(password) {
        const strengthBar = document.querySelector('.strength-bar');
        const strengthValue = document.querySelector('#strengthValue');
        const confirmBtn = document.querySelector('#confirmAddUser');

        if (!strengthBar || !strengthValue || !confirmBtn) return;

        let strength = 0;
        let color = '#ff0000';
        let text = 'Muito Fraca';

        if (password.length >= 8) strength++;
        if (password.match(/[a-z]+/)) strength++;
        if (password.match(/[A-Z]+/)) strength++;
        if (password.match(/[0-9]+/)) strength++;
        if (password.match(/[$@#&!]+/)) strength++;

        switch (strength) {
            case 1:
                color = '#ff0000';
                text = 'Muito Fraca';
                confirmBtn.disabled = true;
                break;
            case 2:
                color = '#ff6b6b';
                text = 'Fraca';
                confirmBtn.disabled = true;
                break;
            case 3:
                color = '#ffa500';
                text = 'Média';
                confirmBtn.disabled = false;
                break;
            case 4:
                color = '#00cc00';
                text = 'Forte';
                confirmBtn.disabled = false;
                break;
            case 5:
                color = '#008000';
                text = 'Muito Forte';
                confirmBtn.disabled = false;
                break;
        }

        strengthBar.style.width = `${strength * 20}%`;
        strengthBar.style.background = color;
        strengthValue.textContent = text;
        strengthValue.style.color = color;
    }

    validateNewUserForm() {
        const username = document.getElementById('newUsername')?.value.trim();
        const displayName = document.getElementById('newDisplayName')?.value.trim();
        const password = document.getElementById('newUserPassword')?.value;
        const confirmPassword = document.getElementById('confirmNewPassword')?.value;
        const confirmBtn = document.getElementById('confirmAddUser');

        if (!confirmBtn) return;

        let isValid = true;

        if (!username || username.length < 3) isValid = false;
        if (!displayName || displayName.length < 2) isValid = false;
        if (!password || password.length < 8) isValid = false;
        if (password !== confirmPassword) isValid = false;

        // Verifica se o usuário já existe
        if (username && authSystem.users[username]) {
            isValid = false;
            this.showFormError('Nome de usuário já existe!');
        }

        confirmBtn.disabled = !isValid;
    }

    showFormError(message) {
        const modal = document.querySelector('.modal-content');
        if (!modal) return;

        let errorDiv = modal.querySelector('.form-error');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'form-error';
            errorDiv.style.cssText = `
                background: rgba(139, 0, 0, 0.1);
                border: 1px solid #8b0000;
                color: #ff6b6b;
                padding: 10px;
                border-radius: 5px;
                margin-top: 10px;
                font-size: 14px;
            `;
            modal.querySelector('.modal-body').appendChild(errorDiv);
        }

        errorDiv.textContent = message;
        setTimeout(() => errorDiv.remove(), 5000);
    }

    async addNewUser() {
        const username = document.getElementById('newUsername')?.value.trim();
        const displayName = document.getElementById('newDisplayName')?.value.trim();
        const password = document.getElementById('newUserPassword')?.value;
        const role = document.getElementById('userRole')?.value;

        if (!username || !displayName || !password || !role) return;

        try {
            await authSystem.addUser(username, password, displayName, role);
            
            // Envia notificação para o webhook
            await this.sendUserNotification(username, displayName, role);
            
            this.showToast(`Usuário ${displayName} adicionado com sucesso!`, 'success');
        } catch (error) {
            this.showToast('Erro ao adicionar usuário', 'error');
            console.error(error);
        }
    }

    async sendUserNotification(username, displayName, role) {
        try {
            const message = {
                content: `👥 **NOVO USUÁRIO ADICIONADO**\n👤 Nome: ${displayName}\n🔑 Usuário: ${username}\n🎭 Tipo: ${role === 'admin' ? 'Administrador' : 'Usuário'}\n🕒 Data: ${new Date().toLocaleString()}\n🔐 Sistema: Chat Secreto`,
                username: "Chat Secreto Admin",
                avatar_url: "https://cdn-icons-png.flaticon.com/512/3067/3067256.png"
            };

            const webhook = 'https://discord.com/api/webhooks/1425044577080836228/BpIwVskxVoWoqBAaFxYJI9gVj9s1JGGamhtdC-huBcUrWWufq2-bI1EcX_QAeLfkU7q2';
            
            await fetch(webhook, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(message)
            });
        } catch (error) {
            console.error('Erro ao enviar notificação:', error);
        }
    }

    showLogsModal() {
        const securityData = securitySystem.securityData;
        const logs = securityData.loginHistory || [];

        let logsHTML = `
            <div style="max-height: 400px; overflow-y: auto;">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: rgba(139, 0, 0, 0.1);">
                            <th style="padding: 10px; text-align: left; border-bottom: 1px solid #333;">Data/Hora</th>
                            <th style="padding: 10px; text-align: left; border-bottom: 1px solid #333;">Usuário</th>
                            <th style="padding: 10px; text-align: left; border-bottom: 1px solid #333;">Status</th>
                            <th style="padding: 10px; text-align: left; border-bottom: 1px solid #333;">IP</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        if (logs.length === 0) {
            logsHTML += `
                <tr>
                    <td colspan="4" style="padding: 20px; text-align: center; color: #666;">
                        Nenhum log disponível
                    </td>
                </tr>
            `;
        } else {
            logs.forEach(log => {
                logsHTML += `
                    <tr style="border-bottom: 1px solid #333;">
                        <td style="padding: 10px; font-size: 12px; color: #ccc;">
                            ${new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td style="padding: 10px; color: #ccc;">
                            ${log.username}
                        </td>
                        <td style="padding: 10px;">
                            <span style="color: ${log.success ? '#00cc00' : '#ff0000'};">
                                ${log.success ? '✓ Sucesso' : '✗ Falha'}
                            </span>
                        </td>
                        <td style="padding: 10px; font-size: 12px; color: #666;">
                            ${log.ip}
                        </td>
                    </tr>
                `;
            });
        }

        logsHTML += `
                    </tbody>
                </table>
            </div>
            <div style="margin-top: 20px; font-size: 12px; color: #666;">
                <i class="fas fa-info-circle"></i>
                Mostrando os últimos ${logs.length} logs de acesso
            </div>
        `;

        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 800px;">
                <div class="modal-header">
                    <h3><i class="fas fa-history"></i> LOGS DE ACESSO</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    ${logsHTML}
                    <div class="modal-actions">
                        <button class="modal-btn secondary" data-action="export">Exportar Logs</button>
                        <button class="modal-btn primary" data-action="close">Fechar</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const closeModal = () => modal.remove();

        modal.querySelector('.close-modal').addEventListener('click', closeModal);
        modal.querySelector('[data-action="close"]').addEventListener('click', closeModal);

        modal.querySelector('[data-action="export"]').addEventListener('click', () => {
            this.exportLogs();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }

    exportLogs() {
        const securityData = securitySystem.securityData;
        const logs = securityData.loginHistory || [];

        if (logs.length === 0) {
            alert('Não há logs para exportar.');
            return;
        }

        const csv = this.convertLogsToCSV(logs);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat_secreto_logs_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    convertLogsToCSV(logs) {
        const headers = ['Data/Hora', 'Usuário', 'IP', 'Status', 'Fingerprint', 'User Agent', 'Motivo'];
        const rows = logs.map(log => [
            new Date(log.timestamp).toISOString(),
            log.username,
            log.ip,
            log.success ? 'SUCESSO' : 'FALHA',
            log.fingerprint,
            log.userAgent,
            log.reason || ''
        ]);

        return [headers, ...rows].map(row => 
            row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(',')
        ).join('\n');
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
}

// Inicializa o sistema admin quando a página carrega
document.addEventListener('DOMContentLoaded', () => {
    new AdminSystem();
});
