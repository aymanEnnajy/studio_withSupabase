/**
 * FotoGenius Chatbot Widget
 * Automatically injected into all pages
 * Syncs with logic from standalone chat.html (Strict n8n, Tailwind-style CSS)
 */

(function () {
    // 1. Inject Styles (Converted from new Tailwind design)
    const style = document.createElement('style');
    style.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

        .chat-widget-wrapper {
            position: fixed;
            right: 20px;
            bottom: 90px;
            z-index: 9999;
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            pointer-events: none;
        }

        .chat-widget-wrapper > * {
            pointer-events: auto;
        }

        /* Animated Elements */
        @keyframes chatFadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes chatSlideIn { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes chatBounce { 0%, 100% { transform: scale(0.6); } 50% { transform: scale(1); } }

        /* Window Container */
        #chatWidgetWindow {
            width: 380px;
            height: 600px;
            max-height: calc(100vh - 120px);
            background: #ffffff;
            border-radius: 1rem;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            border: 1px solid rgba(255,255,255,0.5);
            margin-bottom: 1rem;
            transform-origin: bottom right;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        #chatWidgetWindow.hidden {
            display: none;
            opacity: 0;
            transform: scale(0.95);
        }

        #chatWidgetWindow.visible {
            display: flex;
            opacity: 1;
            transform: scale(1);
            animation: chatSlideIn 0.3s ease-out;
        }

        /* Header */
        .chat-header {
            background: linear-gradient(to right, #2563eb, #4f46e5, #9333ea); /* blue-600 to purple-600 */
            color: white;
            padding: 1rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            z-index: 10;
        }

        .chat-header-title {
            font-weight: 700;
            font-size: 1.125rem;
            line-height: 1.25;
        }

        .chat-header-subtitle {
            font-size: 0.75rem;
            color: #eff6ff;
            opacity: 0.9;
        }

        /* Messages Area */
        .chat-messages-area {
            flex: 1;
            padding: 1rem;
            overflow-y: auto;
            background-color: #f8fafc; /* slate-50 */
            display: flex;
            flex-direction: column;
            gap: 1rem;
            scroll-behavior: smooth;
        }

        .msg-container {
            display: flex;
            align-items: flex-start;
            gap: 0.75rem;
            animation: chatFadeIn 0.3s ease-out forwards;
        }

        .msg-container.user {
            justify-content: flex-end;
            align-items: flex-end;
        }

        .msg-bubble {
            max-width: 85%;
            padding: 0.875rem 1rem;
            border-radius: 1rem;
            font-size: 0.875rem;
            line-height: 1.5;
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
            word-break: break-word;
        }

        .msg-bubble.bot {
            background: white;
            border: 1px solid #e2e8f0;
            color: #334155;
            border-top-left-radius: 0.25rem;
        }
        
        .msg-bubble.error {
            background: #fef2f2;
            border: 1px solid #fee2e2;
            color: #dc2626;
        }

        .msg-bubble.user {
            background: linear-gradient(to bottom right, #2563eb, #4f46e5);
            color: white;
            border-top-right-radius: 0.25rem;
        }

        /* Input Area */
        .chat-input-area {
            padding: 1rem;
            background: white;
            border-top: 1px solid #f1f5f9;
            box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.01);
            z-index: 20;
        }
        
        .chat-input-wrapper {
            position: relative;
            display: flex;
            align-items: center;
        }

        .chat-input-field {
            width: 100%;
            padding: 0.75rem 1rem;
            padding-right: 3rem;
            border-radius: 9999px;
            border: 1px solid #e2e8f0;
            background-color: #f8fafc;
            color: #1e293b;
            font-size: 0.875rem;
            outline: none;
            transition: all 0.2s;
        }
        
        .chat-input-field:focus {
            background-color: white;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .chat-send-btn {
            position: absolute;
            right: 0.5rem;
            width: 2rem;
            height: 2rem;
            background: #2563eb;
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s;
            border: none;
        }

        .chat-send-btn:hover {
            background: #1d4ed8;
            transform: scale(1.05);
        }
        
        .chat-send-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        /* Scrollbar */
        .chat-messages-area::-webkit-scrollbar { width: 6px; }
        .chat-messages-area::-webkit-scrollbar-track { background: transparent; }
        .chat-messages-area::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }

        /* Mobile */
        @media (max-width: 640px) {
            .chat-widget-wrapper {
                right: 0; left: 0; bottom: 0;
                width: 100%;
                align-items: center;
            }

            #chatWidgetWindow {
                width: 100%;
                height: 100vh;
                max-height: 100vh;
                border-radius: 0;
                margin-bottom: 0;
            }
            
            #chatWidgetToggle {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 10001;
            }
        }
        
        .typing-dot {
            width: 0.375rem;
            height: 0.375rem;
            background-color: #3b82f6;
            border-radius: 50%;
            animation: chatBounce 1.4s infinite ease-in-out both;
        }
    `;
    document.head.appendChild(style);

    // 2. Configuration
    const CONFIG = {
        N8N_ENDPOINT: 'https://n8n.zackdev.io/webhook/0414cfcc-6e2d-48d3-9f6c-af7895f2142d/chat',
        SESSION_ID: 'widget-session-' + Date.now()
    };

    // 3. Logic
    class FotoGeniusChatbot {
        constructor() {
            this.isOpen = false;
            this.isTyping = false;
            this.injectHTML();
            this.init();
        }

        injectHTML() {
            const wrapper = document.createElement('div');
            wrapper.className = 'chat-widget-wrapper';
            wrapper.innerHTML = `
                <!-- Chat Window -->
                <div id="chatWidgetWindow" class="hidden">
                    <!-- Header -->
                    <div class="chat-header">
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <div style="width: 2.5rem; height: 2.5rem; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">📸</div>
                            <div>
                                <div class="chat-header-title">FotoGenius</div>
                                <div class="chat-header-subtitle">AI Assistant</div>
                            </div>
                        </div>
                        <button id="chatWidgetClose" style="width: 2rem; height: 2rem; border-radius: 50%; background: transparent; color: white; border: none; font-size: 1.5rem; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                            ×
                        </button>
                    </div>
                    
                    <!-- Messages -->
                    <div id="chatWidgetMessages" class="chat-messages-area">
                        <div class="msg-container bot">
                            <div style="width: 2rem; height: 2rem; background: #e0e7ff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.875rem; flex-shrink: 0;">📸</div>
                            <div class="msg-bubble bot">
                                <span style="color: #2563eb; font-weight: 600; display: block; margin-bottom: 0.25rem;">Bonjour!</span>
                                Je suis votre assistant photographe. Comment puis-je vous aider aujourd'hui ?
                            </div>
                        </div>
                    </div>
                    
                    <!-- Loading -->
                    <div id="chatWidgetLoading" style="display: none; padding: 0.5rem 1rem; color: #64748b; font-size: 0.75rem; align-items: center; gap: 0.5rem;">
                        <span style="display: flex; gap: 0.25rem;">
                            <span class="typing-dot" style="animation-delay: -0.32s"></span>
                            <span class="typing-dot" style="animation-delay: -0.16s"></span>
                            <span class="typing-dot"></span>
                        </span>
                        FotoGenius écrit...
                    </div>
                    
                    <!-- Input -->
                    <div class="chat-input-area">
                        <form id="chatWidgetForm" class="chat-input-wrapper">
                            <input type="text" id="chatWidgetInput" class="chat-input-field" placeholder="Posez une question..." autocomplete="off">
                            <button type="submit" id="chatWidgetSend" class="chat-send-btn">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                            </button>
                        </form>
                        <div style="text-align: center; margin-top: 0.5rem; font-size: 0.65rem; color: #94a3b8;">
                            Powered by n8n AI
                        </div>
                    </div>
                </div>
                
                <!-- Toggle Button -->
                <button id="chatWidgetToggle" style="width: 3.5rem; height: 3.5rem; background: linear-gradient(to right, #2563eb, #7e22ce); color: white; border-radius: 50%; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border: none; cursor: pointer; font-size: 1.5rem; display: flex; align-items: center; justify-content: center; transition: transform 0.2s;">
                    📸
                </button>
            `;
            document.body.appendChild(wrapper);
        }

        init() {
            this.elements = {
                toggleBtn: document.getElementById('chatWidgetToggle'),
                closeBtn: document.getElementById('chatWidgetClose'),
                window: document.getElementById('chatWidgetWindow'),
                messages: document.getElementById('chatWidgetMessages'),
                input: document.getElementById('chatWidgetInput'),
                form: document.getElementById('chatWidgetForm'),
                loading: document.getElementById('chatWidgetLoading'),
                sendBtn: document.getElementById('chatWidgetSend')
            };

            this.elements.toggleBtn.addEventListener('click', () => this.toggleChat());
            this.elements.closeBtn.addEventListener('click', () => this.closeChat());
            this.elements.form.addEventListener('submit', (e) => this.handleSubmit(e));

            // Auto open check
            setTimeout(() => {
                if (!localStorage.getItem('chatWidgetOpened')) {
                    this.openChat();
                    localStorage.setItem('chatWidgetOpened', 'true');
                }
            }, 2000);
        }

        toggleChat() {
            this.isOpen ? this.closeChat() : this.openChat();
        }

        openChat() {
            this.elements.window.classList.remove('hidden');
            this.elements.window.classList.add('visible');
            if (window.innerWidth > 640) this.elements.input.focus();
            this.isOpen = true;
        }

        closeChat() {
            this.elements.window.classList.remove('visible');
            this.elements.window.classList.add('hidden');
            this.isOpen = false;
        }

        async handleSubmit(e) {
            e.preventDefault();
            const text = this.elements.input.value.trim();
            if (!text) return;

            // 1. User Message
            this.addMessage('user', text);
            this.elements.input.value = '';
            this.elements.input.disabled = true;
            this.elements.sendBtn.disabled = true;

            // 2. Loading
            this.elements.loading.style.display = 'flex';
            this.scrollToBottom();

            try {
                // 3. API Call
                const response = await this.callN8n(text);

                // 4. Bot Response
                this.elements.loading.style.display = 'none';
                this.addMessage('bot', response);

            } catch (error) {
                console.error('Chat Error:', error);
                this.elements.loading.style.display = 'none';
                this.addMessage('error', "Une erreur est survenue. Veuillez réessayer.");
            } finally {
                this.elements.input.disabled = false;
                this.elements.sendBtn.disabled = false;
                this.elements.input.focus();
            }
        }

        async callN8n(message) {
            const res = await fetch(CONFIG.N8N_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chatInput: message,
                    sessionId: CONFIG.SESSION_ID
                })
            });

            if (!res.ok) throw new Error(`Server Error: ${res.status}`);
            const data = await res.json();

            // Extract
            if (typeof data === 'string') return data;
            if (data.output) return data.output;
            if (data.text) return data.text;
            if (data.message) return data.message;
            if (data.response) return data.response;
            if (data.answer) return data.answer;
            return JSON.stringify(data.output || data);
        }

        addMessage(type, text) {
            const div = document.createElement('div');

            if (type === 'user') {
                div.className = 'msg-container user';
                div.innerHTML = `
                    <div class="msg-bubble user">${this.escapeHtml(text)}</div>
                `;
            } else if (type === 'error') {
                div.className = 'msg-container bot';
                div.innerHTML = `
                    <div style="width: 2rem; height: 2rem; background: #fee2e2; color: #dc2626; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">!</div>
                    <div class="msg-bubble error">${this.escapeHtml(text)}</div>
                `;
            } else {
                div.className = 'msg-container bot';
                div.innerHTML = `
                    <div style="width: 2rem; height: 2rem; background: #e0e7ff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.875rem; flex-shrink: 0;">📸</div>
                    <div class="msg-bubble bot">${this.formatMarkdown(text)}</div>
                `;
            }

            this.elements.messages.appendChild(div);
            this.scrollToBottom();
        }

        scrollToBottom() {
            setTimeout(() => {
                this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
            }, 10);
        }

        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        formatMarkdown(text) {
            if (!text) return '';
            return text
                .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
                .replace(/\*(.*?)\*/g, '<i>$1</i>')
                .replace(/\n/g, '<br>')
                .replace(/^- (.*?)(?=\n|$)/gm, '• $1<br>')
                .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" style="color: #2563eb; text-decoration: underline;">$1</a>');
        }
    }

    // Init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => new FotoGeniusChatbot());
    } else {
        new FotoGeniusChatbot();
    }

})();
