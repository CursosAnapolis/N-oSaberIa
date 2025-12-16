* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: #0a0a0a;
    color: #fff;
    height: 100vh;
    overflow: hidden;
}

.chat-container {
    display: flex;
    height: 100vh;
    background: 
        radial-gradient(circle at 20% 50%, rgba(139, 0, 0, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(139, 0, 0, 0.05) 0%, transparent 50%);
}

/* Sidebar */
.sidebar {
    width: 300px;
    background: rgba(20, 20, 20, 0.95);
    border-right: 1px solid #8b0000;
    display: flex;
    flex-direction: column;
    box-shadow: 5px 0 20px rgba(0, 0, 0, 0.5);
    z-index: 10;
}

.sidebar-header {
    padding: 25px;
    border-bottom: 1px solid rgba(139, 0, 0, 0.3);
}

.sidebar-header h2 {
    color: #8b0000;
    font-size: 20px;
    margin-bottom: 20px;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.user-info {
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(30, 30, 30, 0.9);
    padding: 15px;
    border-radius: 10px;
    border: 1px solid #333;
    transition: all 0.3s;
}

.user-info:hover {
    border-color: #8b0000;
}

.user-info i {
    color: #8b0000;
    font-size: 18px;
}

.user-info span {
    font-weight: bold;
    color: #fff;
}

.online-users {
    padding: 25px;
    border-bottom: 1px solid rgba(139, 0, 0, 0.3);
    flex: 1;
}

.online-users h3 {
    color: #ccc;
    font-size: 14px;
    text-transform: uppercase;
    margin-bottom: 20px;
    letter-spacing: 1px;
}

.users-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.user-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: rgba(30, 30, 30, 0.9);
    border-radius: 8px;
    border: 1px solid transparent;
    transition: all 0.3s;
    cursor: pointer;
}

.user-item:hover {
    border-color: #8b0000;
    transform: translateX(5px);
}

.user-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, #8b0000, #660000);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    color: white;
}

.user-details {
    flex: 1;
}

.user-name {
    font-weight: bold;
    color: #fff;
}

.user-status {
    font-size: 12px;
    color: #666;
}

.user-status.active {
    color: #00cc00;
}

.settings-section {
    padding: 25px;
}

.settings-section h3 {
    color: #ccc;
    font-size: 14px;
    text-transform: uppercase;
    margin-bottom: 20px;
    letter-spacing: 1px;
}

.settings-options {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.settings-btn {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 15px;
    background: rgba(30, 30, 30, 0.9);
    border: 1px solid #333;
    border-radius: 8px;
    color: #ccc;
    cursor: pointer;
    transition: all 0.3s;
    text-align: left;
    font-size: 14px;
}

.settings-btn:hover {
    border-color: #8b0000;
    color: #fff;
    background: rgba(139, 0, 0, 0.1);
}

.settings-btn i {
    width: 20px;
    text-align: center;
}

.admin-section {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid rgba(139, 0, 0, 0.3);
}

.admin-section h4 {
    color: #8b0000;
    font-size: 12px;
    text-transform: uppercase;
    margin-bottom: 15px;
    letter-spacing: 1px;
}

.settings-btn.admin-btn {
    background: rgba(139, 0, 0, 0.1);
    border-color: rgba(139, 0, 0, 0.3);
}

.settings-btn.admin-btn:hover {
    background: rgba(139, 0, 0, 0.2);
}

.settings-btn.logout-btn {
    margin-top: 10px;
    background: rgba(139, 0, 0, 0.2);
    border-color: #8b0000;
    color: #ff6b6b;
}

.settings-btn.logout-btn:hover {
    background: rgba(139, 0, 0, 0.3);
}

/* Chat Area */
.chat-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: rgba(10, 10, 10, 0.95);
}

.chat-header {
    padding: 25px;
    border-bottom: 1px solid rgba(139, 0, 0, 0.3);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.chat-title h1 {
    color: #8b0000;
    font-size: 24px;
    margin-bottom: 5px;
    text-transform: uppercase;
    letter-spacing: 2px;
}

.chat-subtitle {
    color: #666;
    font-size: 14px;
}

.chat-status {
    display: flex;
    align-items: center;
    gap: 10px;
    background: rgba(30, 30, 30, 0.9);
    padding: 10px 20px;
    border-radius: 20px;
    border: 1px solid #333;
}

.status-indicator {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #00cc00;
}

.status-indicator.active {
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}

.messages-container {
    flex: 1;
    overflow-y: auto;
    padding: 25px;
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.welcome-message {
    text-align: center;
    padding: 50px 20px;
    color: #666;
}

.welcome-message i {
    font-size: 48px;
    color: #8b0000;
    margin-bottom: 20px;
}

.welcome-message h3 {
    color: #ccc;
    margin-bottom: 10px;
}

.message {
    max-width: 70%;
    padding: 20px;
    border-radius: 15px;
    position: relative;
    animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

.message.received {
    align-self: flex-start;
    background: rgba(30, 30, 30, 0.9);
    border: 1px solid #333;
    border-left: 4px solid #8b0000;
}

.message.sent {
    align-self: flex-end;
    background: rgba(139, 0, 0, 0.1);
    border: 1px solid rgba(139, 0, 0, 0.3);
    border-right: 4px solid #8b0000;
}

.message-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

.message-sender {
    font-weight: bold;
    color: #8b0000;
}

.message-time {
    font-size: 12px;
    color: #666;
}

.message-content {
    line-height: 1.5;
    color: #ccc;
}

.message-content img {
    max-width: 100%;
    border-radius: 10px;
    margin-top: 10px;
    border: 1px solid #333;
}

.message-actions {
    display: flex;
    gap: 10px;
    margin-top: 15px;
    opacity: 0;
    transition: opacity 0.3s;
}

.message:hover .message-actions {
    opacity: 1;
}

.action-btn {
    background: none;
    border: none;
    color: #666;
    cursor: pointer;
    font-size: 12px;
    transition: color 0.3s;
}

.action-btn:hover {
    color: #8b0000;
}

/* Message Input Area */
.message-input-area {
    padding: 25px;
    border-top: 1px solid rgba(139, 0, 0, 0.3);
    background: rgba(20, 20, 20, 0.95);
}

.input-tools {
    display: flex;
    gap: 10px;
    margin-bottom: 15px;
}

.tool-btn {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    background: rgba(30, 30, 30, 0.9);
    border: 1px solid #333;
    color: #666;
    cursor: pointer;
    transition: all 0.3s;
    display: flex;
    align-items: center;
    justify-content: center;
}

.tool-btn:hover {
    border-color: #8b0000;
    color: #fff;
}

.message-input-wrapper {
    display: flex;
    gap: 15px;
    align-items: flex-end;
}

.message-input-wrapper textarea {
    flex: 1;
    padding: 20px;
    background: rgba(30, 30, 30, 0.9);
    border: 1px solid #333;
    border-radius: 10px;
    color: #fff;
    font-size: 14px;
    resize: none;
    min-height: 60px;
    max-height: 150px;
    transition: all 0.3s;
    font-family: inherit;
}

.message-input-wrapper textarea:focus {
    outline: none;
    border-color: #8b0000;
    box-shadow: 0 0 15px rgba(139, 0, 0, 0.2);
}

.send-btn {
    width: 60px;
    height: 60px;
    border-radius: 10px;
    background: linear-gradient(135deg, #8b0000, #660000);
    border: none;
    color: white;
    cursor: pointer;
    transition: all 0.3s;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
}

.send-btn:hover {
    background: linear-gradient(135deg, #a00000, #770000);
    transform: scale(1.05);
    box-shadow: 0 0 20px rgba(139, 0, 0, 0.4);
}

.send-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
}

.input-info {
    display: flex;
    justify-content: space-between;
    margin-top: 10px;
    font-size: 12px;
    color: #666;
}

.encryption-info {
    color: #00cc00;
}

/* Modal */
.modal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    z-index: 1000;
    align-items: center;
    justify-content: center;
}

.modal.show {
    display: flex;
}

.modal-content {
    background: rgba(20, 20, 20, 0.95);
    border: 1px solid #8b0000;
    border-radius: 15px;
    width: 90%;
    max-width: 500px;
    box-shadow: 0 0 50px rgba(139, 0, 0, 0.3);
}

.modal-header {
    padding: 25px;
    border-bottom: 1px solid rgba(139, 0, 0, 0.3);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.modal-header h3 {
    color: #8b0000;
    font-size: 18px;
}

.close-modal {
    background: none;
    border: none;
    color: #666;
    font-size: 24px;
    cursor: pointer;
    transition: color 0.3s;
}

.close-modal:hover {
    color: #8b0000;
}

.modal-body {
    padding: 25px;
}

.upload-area {
    border: 2px dashed #8b0000;
    border-radius: 10px;
    padding: 40px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s;
    margin-bottom: 20px;
}

.upload-area:hover {
    background: rgba(139, 0, 0, 0.05);
}

.upload-area i {
    font-size: 48px;
    color: #8b0000;
    margin-bottom: 20px;
}

.upload-area p {
    color: #ccc;
    margin-bottom: 5px;
}

.upload-info {
    color: #666;
    font-size: 12px;
}

.image-preview {
    margin-bottom: 20px;
    display: none;
}

.image-preview img {
    max-width: 100%;
    border-radius: 10px;
    border: 1px solid #333;
}

.modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 15px;
}

.modal-btn {
    padding: 12px 25px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    font-weight: bold;
    transition: all 0.3s;
}

.modal-btn.secondary {
    background: rgba(30, 30, 30, 0.9);
    border: 1px solid #333;
    color: #ccc;
}

.modal-btn.secondary:hover {
    border-color: #8b0000;
    color: #fff;
}

.modal-btn.primary {
    background: linear-gradient(135deg, #8b0000, #660000);
    color: white;
}

.modal-btn.primary:hover {
    background: linear-gradient(135deg, #a00000, #770000);
}

.modal-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* Responsividade */
@media (max-width: 1024px) {
    .sidebar {
        width: 250px;
    }
}

@media (max-width: 768px) {
    .chat-container {
        flex-direction: column;
    }
    
    .sidebar {
        width: 100%;
        height: auto;
        border-right: none;
        border-bottom: 1px solid #8b0000;
    }
    
    .online-users {
        display: none;
    }
    
    .message {
        max-width: 90%;
    }
        }
