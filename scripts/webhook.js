class WebhookClient {
    constructor() {
        this.baseURL = 'https://discord.com/api/webhooks';
    }

    async sendMessage(webhookURL, data) {
        try {
            const response = await fetch(webhookURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    }

    async sendVerificationCode(webhookURL, code, username) {
        const data = {
            username: 'Chat Secreto - Sistema de Verificação',
            avatar_url: 'https://cdn-icons-png.flaticon.com/512/3067/3067256.png',
            embeds: [{
                title: '🔐 Código de Verificação',
                description: `Olá ${username}, aqui está seu código de verificação:`,
                color: 9109504, // Cor vermelho sangue em decimal
                fields: [
                    {
                        name: 'Código',
                        value: `**${code}**`,
                        inline: false
                    },
                    {
                        name: 'Validade',
                        value: '10 minutos',
                        inline: false
                    },
                    {
                        name: '⚠️ Atenção',
                        value: 'Não compartilhe este código com ninguém!',
                        inline: false
                    }
                ],
                timestamp: new Date().toISOString(),
                footer: {
                    text: 'Chat Secreto - Sistema de Segurança'
                }
            }]
        };
        
        return await this.sendMessage(webhookURL, data);
    }

    async sendSystemMessage(webhookURL, title, description) {
        const data = {
            username: 'Chat Secreto - Sistema',
            avatar_url: 'https://cdn-icons-png.flaticon.com/512/3067/3067256.png',
            embeds: [{
                title: title,
                description: description,
                color: 9109504,
                timestamp: new Date().toISOString()
            }]
        };
        
        return await this.sendMessage(webhookURL, data);
    }
}

// Instância global
const webhookClient = new WebhookClient();
