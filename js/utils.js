// Utilitários gerais para o sistema
class Utils {
    constructor() {
        this.toastContainer = null;
        this.initToastContainer();
    }

    // Sistema de notificações Toast
    initToastContainer() {
        this.toastContainer = document.createElement('div');
        this.toastContainer.className = 'toast-container';
        document.body.appendChild(this.toastContainer);
    }

    showToast(message, type = 'info', title = '', duration = 5000) {
        if (!this.toastContainer) {
            this.initToastContainer();
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };

        toast.innerHTML = `
            <div class="toast-icon">
                <i class="${icons[type] || icons.info}"></i>
            </div>
            <div class="toast-content">
                ${title ? `<div class="toast-title">${title}</div>` : ''}
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">
                <i class="fas fa-times"></i>
            </button>
        `;

        this.toastContainer.appendChild(toast);

        // Remove toast após duração
        setTimeout(() => {
            toast.classList.add('hiding');
            setTimeout(() => {
                if (toast.parentNode === this.toastContainer) {
                    this.toastContainer.removeChild(toast);
                }
            }, 300);
        }, duration);

        // Botão de fechar
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.classList.add('hiding');
            setTimeout(() => {
                if (toast.parentNode === this.toastContainer) {
                    this.toastContainer.removeChild(toast);
                }
            }, 300);
        });

        return toast;
    }

    // Sistema de modais
    showModal(options) {
        const {
            title,
            content,
            buttons = [],
            size = 'medium',
            closable = true
        } = options;

        const modalId = 'modal-' + Date.now();
        const modalBackdrop = document.createElement('div');
        modalBackdrop.className = 'modal-backdrop';
        modalBackdrop.id = modalId;

        const sizes = {
            small: '300px',
            medium: '500px',
            large: '800px',
            full: '95vw'
        };

        modalBackdrop.innerHTML = `
            <div class="modal-wrapper" style="max-width: ${sizes[size] || sizes.medium};">
                <div class="modal-header">
                    <h3>${title}</h3>
                    ${closable ? '<button class="modal-close">&times;</button>' : ''}
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                ${buttons.length > 0 ? `
                    <div class="modal-footer">
                        ${buttons.map(btn => `
                            <button class="btn ${btn.type || 'secondary'}" 
                                    data-action="${btn.action || 'close'}"
                                    ${btn.disabled ? 'disabled' : ''}>
                                ${btn.text}
                            </button>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;

        document.body.appendChild(modalBackdrop);

        // Forçar reflow para animação
        modalBackdrop.offsetHeight;
        modalBackdrop.classList.add('active');

        // Event listeners
        const closeModal = () => {
            modalBackdrop.classList.remove('active');
            setTimeout(() => {
                if (modalBackdrop.parentNode) {
                    modalBackdrop.parentNode.removeChild(modalBackdrop);
                }
            }, 300);
        };

        if (closable) {
            modalBackdrop.querySelector('.modal-close').addEventListener('click', closeModal);
            modalBackdrop.addEventListener('click', (e) => {
                if (e.target === modalBackdrop) {
                    closeModal();
                }
            });
        }

        // Event listeners para botões
        modalBackdrop.querySelectorAll('[data-action]').forEach(button => {
            button.addEventListener('click', () => {
                const action = button.dataset.action;
                if (action === 'close') {
                    closeModal();
                }
                // Outras ações podem ser tratadas pelos callbacks
            });
        });

        return {
            close: closeModal,
            element: modalBackdrop
        };
    }

    // Validação de formulários
    validateForm(formData, rules) {
        const errors = {};

        for (const field in rules) {
            const value = formData[field];
            const fieldRules = rules[field];

            for (const rule of fieldRules) {
                if (rule.required && !value) {
                    errors[field] = rule.message || 'Este campo é obrigatório';
                    break;
                }

                if (rule.minLength && value && value.length < rule.minLength) {
                    errors[field] = rule.message || `Mínimo ${rule.minLength} caracteres`;
                    break;
                }

                if (rule.maxLength && value && value.length > rule.maxLength) {
                    errors[field] = rule.message || `Máximo ${rule.maxLength} caracteres`;
                    break;
                }

                if (rule.pattern && value && !rule.pattern.test(value)) {
                    errors[field] = rule.message || 'Formato inválido';
                    break;
                }

                if (rule.validate && value) {
                    const customError = rule.validate(value, formData);
                    if (customError) {
                        errors[field] = customError;
                        break;
                    }
                }
            }
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }

    // Formatação de dados
    formatDate(date, format = 'dd/MM/yyyy HH:mm') {
        const d = new Date(date);
        const pad = (num) => num.toString().padStart(2, '0');

        const formats = {
            dd: pad(d.getDate()),
            MM: pad(d.getMonth() + 1),
            yyyy: d.getFullYear(),
            HH: pad(d.getHours()),
            mm: pad(d.getMinutes()),
            ss: pad(d.getSeconds())
        };

        return format.replace(/dd|MM|yyyy|HH|mm|ss/g, match => formats[match]);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Manipulação de strings
    truncate(text, length = 100) {
        if (text.length <= length) return text;
        return text.substring(0, length) + '...';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // LocalStorage com segurança
    secureStorage = {
        set(key, value) {
            try {
                const encrypted = btoa(encodeURIComponent(JSON.stringify(value)));
                localStorage.setItem(key, encrypted);
                return true;
            } catch (error) {
                console.error('Erro ao salvar no localStorage:', error);
                return false;
            }
        },

        get(key) {
            try {
                const encrypted = localStorage.getItem(key);
                if (!encrypted) return null;
                return JSON.parse(decodeURIComponent(atob(encrypted)));
            } catch (error) {
                console.error('Erro ao ler do localStorage:', error);
                return null;
            }
        },

        remove(key) {
            localStorage.removeItem(key);
        },

        clear() {
            localStorage.clear();
        }
    };

    // Debounce para eventos
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Throttle para eventos
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Carregamento de recursos
    loadScript(url) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    loadStyle(url) {
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = url;
            link.onload = resolve;
            link.onerror = reject;
            document.head.appendChild(link);
        });
    }

    // Copiar para clipboard
    copyToClipboard(text) {
        return new Promise((resolve, reject) => {
            if (navigator.clipboard) {
                navigator.clipboard.writeText(text).then(resolve).catch(reject);
            } else {
                // Fallback para navegadores mais antigos
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                try {
                    document.execCommand('copy');
                    resolve();
                } catch (err) {
                    reject(err);
                }
                document.body.removeChild(textarea);
            }
        });
    }

    // Verificar conexão
    checkConnection() {
        return navigator.onLine;
    }

    // Gerar IDs únicos
    generateId(prefix = 'id') {
        return prefix + '-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    // Deep clone de objetos
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    // Mesclar objetos
    mergeObjects(...objects) {
        return objects.reduce((result, current) => {
            return { ...result, ...current };
        }, {});
    }
}

// Inicializar utilitários
const utils = new Utils();

// Exportar para uso global
window.utils = utils;
