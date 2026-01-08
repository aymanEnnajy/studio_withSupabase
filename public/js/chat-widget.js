/**
 * FotoGenius Chatbot Widget
 * Automatically injected into all pages
 * Syncs with logic from standalone chat.html
 */

(function () {
    // 1. Inject Styles (Converted from Tailwind to standard CSS to ensure global compatibility)
    const style = document.createElement('style');
    style.textContent = `
        @keyframes chatFadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes chatSlideIn {
            from { opacity: 0; transform: translateX(-20px); }
            to { opacity: 1; transform: translateX(0); }
        }
        @keyframes chatBounce {
            0%, 80%, 100% { transform: scale(0); }
            40% { transform: scale(1); }
        }

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

        #chatWidgetWindow {
            width: 380px;
            height: 600px;
            max-height: calc(100vh - 100px);
            background: white;
            border-radius: 1rem;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            border: 1px solid #e5e7eb;
            margin-bottom: 1rem;
            transform-origin: bottom left;
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

        /* Mobile Responsive */
        @media (max-width: 640px) {
            .chat-widget-wrapper {
                left: 0;
                right: 0;
                bottom: 0;
                width: 100%;
                align-items: center;
            }

            #chatWidgetWindow {
                width: 100%;
                height: 100vh;
                max-height: 100vh;
                border-radius: 0;
                margin-bottom: 0;
                position: fixed;
                top: 0;
                left: 0;
                z-index: 10000;
            }

            #chatWidgetToggle {
                position: fixed;
                bottom: 20px;
                left: 20px;
                z-index: 10001;
            }
        }

        /* Utility Classes replacement */
        .chat-header {
            background: linear-gradient(to right, #2563eb, #7e22ce); /* blue-600 to purple-700 */
            color: white;
            padding: 1rem;
        }
        
        .chat-messages-area {
            flex: 1;
            padding: 1rem;
            overflow-y: auto;
            background-color: #f9fafb; /* gray-50 */
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
        }

        .msg-bubble {
            max-width: 85%;
            padding: 1rem;
            border-radius: 1rem;
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
            animation: chatFadeIn 0.3s ease-in-out;
        }

        .msg-bot {
            align-self: flex-start;
            background: white;
            border: 1px solid #e5e7eb;
            color: #374151; /* gray-700 */
            border-top-left-radius: 0.5rem;
        }

        .msg-user {
            align-self: flex-end;
            background: linear-gradient(to right, #2563eb, #7e22ce);
            color: white;
            border-top-right-radius: 0.5rem;
        }

        .chat-input-area {
            padding: 1rem;
            background: white;
            border-top: 1px solid #e5e7eb;
            display: flex;
            gap: 0.75rem;
        }
        
        .chat-input-field {
            flex: 1;
            padding: 0.75rem 1rem;
            border-radius: 0.75rem;
            border: 1px solid #d1d5db;
            outline: none;
            font-size: 0.95rem;
        }
        
        .chat-input-field:focus {
            border-color: #3b82f6;
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
        }

        .chat-send-btn {
            padding: 0 1.5rem;
            background: linear-gradient(to right, #2563eb, #7e22ce);
            color: white;
            border-radius: 0.75rem;
            font-weight: 500;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s;
        }

        .chat-send-btn:hover {
            opacity: 0.9;
        }

        .typing-dot {
            width: 0.5rem;
            height: 0.5rem;
            background-color: #2563eb;
            border-radius: 50%;
            animation: chatBounce 1.4s infinite ease-in-out both;
        }
    `;
    document.head.appendChild(style);

    // 2. Configuration (Matches chat.html)
    const CONFIG = {
        N8N_ENDPOINT: 'https://n8n.zackdev.io/webhook/0414cfcc-6e2d-48d3-9f6c-af7895f2142d/chat',
        SESSION_ID: 'ac816a4dd4a0408a935bae156f008631'
    };

    // 3. Chat Logic
    class FotoGeniusChatbot {
        constructor() {
            this.sessionId = CONFIG.SESSION_ID;
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
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div style="display: flex; align-items: center; gap: 0.75rem;">
                                <div style="font-size: 1.5rem;">📸</div>
                                <div>
                                    <div style="font-weight: 700; font-size: 1.125rem;">FotoGenius</div>
                                    <div style="font-size: 0.875rem; opacity: 0.9;">AI Photography Assistant</div>
                                </div>
                            </div>
                            <button id="chatWidgetClose" style="width: 2rem; height: 2rem; border-radius: 50%; background: transparent; color: white; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; cursor: pointer;">
                                ×
                            </button>
                        </div>
                    </div>
                    
                    <!-- Messages -->
                    <div id="chatWidgetMessages" class="chat-messages-area">
                        <div class="msg-bubble msg-bot">
                            <div style="font-weight: 700; color: #2563eb; margin-bottom: 0.25rem;">📸 FotoGenius</div>
                            <div style="line-height: 1.5;">
                                Hello! I'm your AI photography expert. I can help you with:
                                <ul style="margin-top: 0.5rem; margin-left: 1rem; list-style: none;">
                                    <li>• Camera & equipment recommendations</li>
                                    <li>• Photography techniques & settings</li>
                                    <li>• Studio information & services</li>
                                </ul>
                                What would you like to know about photography?
                            </div>
                        </div>
                    </div>
                    
                    <!-- Quick Actions -->
                    <div style="padding: 0.75rem 1rem; background: #f3f4f6; border-top: 1px solid #e5e7eb;">
                        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                            <button class="quick-action-btn" data-q="What is your studio address?" style="padding: 0.5rem 0.75rem; background: white; color: #374151; font-size: 0.875rem; border-radius: 0.5rem; border: 1px solid #d1d5db; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;">
                                <span>📍</span> Address
                            </button>
                            <button class="quick-action-btn" data-q="Best camera for beginners?" style="padding: 0.5rem 0.75rem; background: white; color: #374151; font-size: 0.875rem; border-radius: 0.5rem; border: 1px solid #d1d5db; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;">
                                <span>📷</span> Camera
                            </button>
                            <button class="quick-action-btn" data-q="Photography services?" style="padding: 0.5rem 0.75rem; background: white; color: #374151; font-size: 0.875rem; border-radius: 0.5rem; border: 1px solid #d1d5db; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;">
                                <span>💼</span> Services
                            </button>
                        </div>
                    </div>
                    
                    <!-- Input -->
                    <div class="chat-input-area">
                        <input type="text" id="chatWidgetInput" class="chat-input-field" placeholder="Ask about photography..." autocomplete="off">
                        <button id="chatWidgetSend" class="chat-send-btn">Send</button>
                    </div>
                </div>
                
                <!-- Toggle Button -->
                <button id="chatWidgetToggle" style="width: 4rem; height: 4rem; background: linear-gradient(to right, #2563eb, #7e22ce); color: white; border-radius: 50%; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; cursor: pointer; transition: transform 0.2s;">
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
                sendBtn: document.getElementById('chatWidgetSend'),
                quickBtns: document.querySelectorAll('.quick-action-btn')
            };

            // Listeners
            this.elements.toggleBtn.addEventListener('click', () => this.toggleChat());
            this.elements.closeBtn.addEventListener('click', () => this.closeChat());
            this.elements.sendBtn.addEventListener('click', () => this.sendMessage());
            this.elements.input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.sendMessage();
                }
            });

            this.elements.quickBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const q = e.currentTarget.dataset.q;
                    this.elements.input.value = q;
                    this.sendMessage();
                });
            });

            // Auto-open logic (optional, keep false/check localStorage to avoid annoyance)
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
            this.elements.input.focus();
            this.isOpen = true;
        }

        closeChat() {
            this.elements.window.classList.remove('visible');
            this.elements.window.classList.add('hidden');
            this.isOpen = false;
        }

        async sendMessage() {
            const text = this.elements.input.value.trim();
            if (!text) return;

            this.addMessage('user', text);
            this.elements.input.value = '';
            this.showTyping();

            try {
                const response = await this.callN8nDirect(text);
                this.hideTyping();
                this.addMessage('bot', response);
            } catch (error) {
                console.error('Chat Error:', error);
                this.hideTyping();
                this.addMessage('bot', '⚠️ Connection error. Please try again.');
            }
        }

        async callN8nDirect(message) {
            const payload = {
                chatInput: message,
                sessionId: this.sessionId
            };

            const response = await fetch(CONFIG.N8N_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error(`n8n error: ${response.status}`);
            const data = await response.json();
            return this.extractResponse(data);
        }

        extractResponse(data) {
            if (data === this.sessionId) return "Connected to n8n.";
            if (typeof data === 'string') return data;
            if (typeof data === 'object') {
                if (data.response) return data.response;
                if (data.message) return data.message;
                if (data.text) return data.text;
                if (data.output) return data.output;
                if (data.choices && data.choices[0]?.message) return data.choices[0].message.content;

                try {
                    const str = JSON.stringify(data);
                    if (str.length > 50 && !str.includes(this.sessionId)) return str;
                } catch (e) { }
            }
            return "AI response received.";
        }

        addMessage(sender, text) {
            const div = document.createElement('div');
            div.className = `msg-bubble ${sender === 'bot' ? 'msg-bot' : 'msg-user'}`;

            if (sender === 'bot') {
                div.innerHTML = `
                    <div style="font-weight: 700; color: #2563eb; margin-bottom: 0.25rem;">📸 FotoGenius</div>
                    <div style="line-height: 1.5; color: #374151;">${this.formatText(text)}</div>
                `;
            } else {
                div.textContent = text;
            }

            this.elements.messages.appendChild(div);

            // Scroll to bottom
            setTimeout(() => {
                this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
            }, 10);
        }

        formatText(text) {
            if (!text) return '';
            return text
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/\n/g, '<br>')
                .replace(/^- (.*?)(?=\n|$)/gm, '• $1<br>')
                .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" style="color: #2563eb; text-decoration: underline;">$1</a>');
        }

        showTyping() {
            if (this.isTyping) return;
            this.isTyping = true;

            const div = document.createElement('div');
            div.id = 'typingIndicator';
            div.className = 'msg-bubble msg-bot';
            div.style.display = 'flex';
            div.style.alignItems = 'center';
            div.style.gap = '0.25rem';

            div.innerHTML = `
                <div class="typing-dot" style="animation-delay: -0.32s"></div>
                <div class="typing-dot" style="animation-delay: -0.16s"></div>
                <div class="typing-dot"></div>
                <span style="font-size: 0.875rem; color: #6b7280; margin-left: 0.5rem;">Typing...</span>
            `;

            this.elements.messages.appendChild(div);
            setTimeout(() => {
                this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
            }, 10);
        }

        hideTyping() {
            this.isTyping = false;
            const el = document.getElementById('typingIndicator');
            if (el) el.remove();
        }
    }

    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => new FotoGeniusChatbot());
    } else {
        new FotoGeniusChatbot();
    }

})();
