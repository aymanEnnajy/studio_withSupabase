/**
 * FotoGenius Chatbot Widget
 * Automatically injected into pages
 */

(function () {
    // 1. Inject Styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { opacity: 0; transform: translateX(20px); }
            to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes messageAppear {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes bounce {
            0%, 80%, 100% { transform: scale(0); }
            40% { transform: scale(1); }
        }
        
        .chat-widget-container {
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

        .chat-widget-container > * {
            pointer-events: auto;
        }

        #chatWindow {
            width: 380px; 
            height: 75vh; 
            max-height: calc(100vh - 120px);
            background-color: white;
            border-radius: 1rem;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            border: 1px solid #e5e7eb;
            margin-bottom: 1rem;
            transition: all 0.3s ease;
        }

        .chat-open-anim {
            animation: slideInRight 0.3s ease;
        }
        
        .message-appear {
            animation: messageAppear 0.3s ease;
        }

        /* Mobile Responsive Styles */
        @media (max-width: 640px) {
            .chat-widget-container {
                right: 0;
                bottom: 0;
                left: 0;
                width: 100%;
                height: 0;
                overflow: visible;
                display: block;
            }

            #chatToggleBtn {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 10000;
            }

            #chatWindow {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                width: 100% !important;
                height: 100% !important;
                max-height: 100% !important;
                border-radius: 0;
                margin: 0;
                border: none;
                z-index: 10001;
            }
        }
    `;
    document.head.appendChild(style);

    // 2. Chatbot Logic & HTML
    const CONFIG = {
        N8N_ENDPOINT: 'https://n8n.zackdev.io/webhook/8fb77b0d-5185-4a6b-8640-de0f04cedbb4/chat',
        SESSION_ID: 'ac816a4dd4a0408a935bae156f008631',
        STUDIO: {
            name: 'Marrakech Photo Studio',
            phone: '+212 XXX-XXXX',
            email: 'info@studiorakech.ma'
        }
    };

    class FotoGeniusChatbot {
        constructor() {
            this.sessionId = CONFIG.SESSION_ID;
            this.isOpen = false;
            this.isTyping = false;
            this.messageHistory = [];
            this.injectHTML();
            this.init();
        }

        injectHTML() {
            const container = document.createElement('div');
            container.className = 'chat-widget-container';
            container.innerHTML = `
                <!-- Chat Window -->
                <div id="chatWindow" class="hidden" style="display: none;">
                    <!-- Header -->
                    <div class="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 flex justify-between items-center" style="background: linear-gradient(to right, #3bf6ff, #6366f1); color: white;">
                        <div class="flex items-center gap-3" style="display: flex; align-items: center; gap: 0.75rem;">
                            <div class="text-2xl" style="font-size: 1.5rem;">📸</div>
                            <div>
                                <div class="font-semibold text-sm" style="font-weight: 600; font-size: 0.875rem;">FotoGenius Assistant</div>
                                <div class="text-xs opacity-90" style="font-size: 0.75rem; opacity: 0.9;">AI Photography Expert</div>
                            </div>
                        </div>
                        <button id="closeChatBtn" style="width: 2rem; height: 2rem; border-radius: 9999px; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; cursor: pointer; border: none; color: white;">
                            ×
                        </button>
                    </div>
                    
                    <!-- Messages Container -->
                    <div id="chatMessages" class="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-3" style="flex: 1 1 0%; padding: 1rem; overflow-y: auto; background-color: #f9fafb; display: flex; flex-direction: column; gap: 0.75rem;">
                        <!-- Welcome Message -->
                        <div class="message-appear" style="max-width: 85%; align-self: flex-start;">
                            <div class="bg-white p-3 rounded-2xl rounded-tl-sm border border-gray-200 text-gray-800 text-sm shadow-sm" style="background-color: white; padding: 0.75rem; border-radius: 1rem; border-top-left-radius: 0.125rem; border: 1px solid #e5e7eb; color: #1f2937; font-size: 0.875rem; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);">
                                <span class="font-semibold" style="font-weight: 600;">📸 FotoGenius:</span> Hello! I'm your AI photography expert. I can help you with:
                                <ul class="mt-2 ml-4 space-y-1" style="margin-top: 0.5rem; margin-left: 1rem; list-style: none;">
                                    <li>• Camera & gear recommendations</li>
                                    <li>• Photography techniques & settings</li>
                                    <li>• Studio information & services</li>
                                    <li>• Lighting & composition advice</li>
                                    <li>• Photo editing tips</li>
                                </ul>
                                What photography question can I help with today?
                            </div>
                        </div>
                    </div>
                    
                    <!-- Quick Suggestions -->
                    <div class="p-3 bg-blue-50 border-t border-gray-200 flex flex-wrap gap-2" style="padding: 0.75rem; background-color: #eff6ff; border-top: 1px solid #e5e7eb; display: flex; flex-wrap: wrap; gap: 0.5rem;">
                        <button class="quick-btn px-3 py-1.5 bg-white text-gray-700 text-xs rounded-full border border-gray-300 hover:bg-blue-500 hover:text-white transition-colors cursor-pointer" data-question="What is your studio address in Marrakech?" style="padding: 0.375rem 0.75rem; background: white; color: #374151; font-size: 0.75rem; border-radius: 9999px; border: 1px solid #d1d5db; cursor: pointer;">
                            📍 Studio Address
                        </button>
                        <button class="quick-btn px-3 py-1.5 bg-white text-gray-700 text-xs rounded-full border border-gray-300 hover:bg-blue-500 hover:text-white transition-colors cursor-pointer" data-question="What camera should I buy for portrait photography?" style="padding: 0.375rem 0.75rem; background: white; color: #374151; font-size: 0.75rem; border-radius: 9999px; border: 1px solid #d1d5db; cursor: pointer;">
                            📷 Camera Advice
                        </button>
                        <button class="quick-btn px-3 py-1.5 bg-white text-gray-700 text-xs rounded-full border border-gray-300 hover:bg-blue-500 hover:text-white transition-colors cursor-pointer" data-question="What photography services do you offer?" style="padding: 0.375rem 0.75rem; background: white; color: #374151; font-size: 0.75rem; border-radius: 9999px; border: 1px solid #d1d5db; cursor: pointer;">
                            💼 Services
                        </button>
                    </div>
                    
                    <!-- Input Area -->
                    <div class="p-4 border-t border-gray-200 bg-white flex gap-3" style="padding: 1rem; border-top: 1px solid #e5e7eb; background: white; display: flex; gap: 0.75rem;">
                        <input 
                            type="text" 
                            id="chatInput"
                            class="flex-1 px-4 py-3 rounded-full border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Ask about photography..."
                            autocomplete="off"
                            style="flex: 1; padding: 0.75rem 1rem; border-radius: 9999px; border: 1px solid #d1d5db; font-size: 0.875rem; outline: none;"
                        >
                        <button id="sendBtn" class="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center text-lg hover:from-blue-600 hover:to-purple-700 transition-all cursor-pointer" style="width: 3rem; height: 3rem; background: linear-gradient(to right, #3b82f6, #9333ea); color: white; border-radius: 9999px; display: flex; align-items: center; justify-content: center; font-size: 1.125rem; border: none; cursor: pointer;">
                            ↑
                        </button>
                    </div>
                    
                    <!-- Footer -->
                    <div class="px-4 py-2 text-center bg-gray-50 border-t border-gray-200 text-xs text-gray-600" style="padding: 0.5rem 1rem; text-align: center; background-color: #f9fafb; border-top: 1px solid #e5e7eb; font-size: 0.75rem; color: #4b5563;">
                        <div class="flex items-center justify-center gap-2" style="display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                            <span>Powered by</span>
                            <span class="font-semibold text-blue-500" style="font-weight: 600; color: #3b82f6;">n8n + OpenRouter AI</span>
                        </div>
                    </div>
                </div>
                
                <!-- Toggle Button -->
                <button id="chatToggleBtn" class="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full text-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all cursor-pointer flex items-center justify-center" style="width: 4rem; height: 4rem; background: linear-gradient(to right, #3b82f6, #9333ea); color: white; border-radius: 9999px; font-size: 1.5rem; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); cursor: pointer; border: none; display: flex; align-items: center; justify-content: center; margin-left: auto;">
                    📸
                </button>
            `;
            document.body.appendChild(container);
        }

        init() {
            // Initialize DOM elements
            this.elements = {
                toggleBtn: document.getElementById('chatToggleBtn'),
                closeBtn: document.getElementById('closeChatBtn'),
                chatWindow: document.getElementById('chatWindow'),
                messages: document.getElementById('chatMessages'),
                input: document.getElementById('chatInput'),
                sendBtn: document.getElementById('sendBtn'),
                quickBtns: document.querySelectorAll('.quick-btn')
            };

            // Event listeners
            this.elements.toggleBtn.addEventListener('click', () => this.toggleChat());
            this.elements.closeBtn.addEventListener('click', () => this.closeChat());
            this.elements.sendBtn.addEventListener('click', () => this.sendMessage());
            this.elements.input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });

            this.elements.quickBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const question = e.currentTarget.dataset.question;
                    this.elements.input.value = question;
                    this.sendMessage();
                });
            });

            // Auto-open after 3 seconds if not previously opened
            setTimeout(() => {
                if (!localStorage.getItem('fotogeniusChatOpened')) {
                    // Optional: don't auto open on every page load to be less annoying, 
                    // or check session storage instead
                    // this.openChat();
                    // localStorage.setItem('fotogeniusChatOpened', 'true');
                }
            }, 3000);
        }

        toggleChat() {
            this.isOpen = !this.isOpen;
            if (this.isOpen) {
                this.openChat();
            } else {
                this.closeChat();
            }
        }

        openChat() {
            this.elements.chatWindow.classList.remove('hidden');
            this.elements.chatWindow.style.display = 'flex'; // Override hidden class
            this.elements.chatWindow.classList.add('chat-open-anim');
            this.elements.input.focus();
            this.isOpen = true;
        }

        closeChat() {
            this.elements.chatWindow.classList.add('hidden');
            this.elements.chatWindow.style.display = 'none';
            this.elements.chatWindow.classList.remove('chat-open-anim');
            this.isOpen = false;
        }

        async sendMessage() {
            const message = this.elements.input.value.trim();
            if (!message) return;

            // Add user message
            this.addMessage('user', message);
            this.elements.input.value = '';

            // Save to history
            this.messageHistory.push({
                role: 'user',
                content: message,
                timestamp: new Date().toISOString()
            });

            // Show typing
            this.showTyping();

            try {
                // Get AI response
                const aiResponse = await this.getAIResponse(message);

                // Hide typing
                this.hideTyping();

                // Add bot response
                this.addMessage('bot', aiResponse);

                // Save to history
                this.messageHistory.push({
                    role: 'bot',
                    content: aiResponse,
                    timestamp: new Date().toISOString()
                });

            } catch (error) {
                console.error('Chat error:', error);
                this.hideTyping();

                // Fallback
                const fallback = this.getSmartResponse(message);
                this.addMessage('bot', fallback);
            }
        }

        async getAIResponse(message) {
            const payload = {
                sessionId: this.sessionId,
                action: 'sendMessage',
                chatInput: message
            };

            const response = await fetch(CONFIG.N8N_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`n8n returned ${response.status}`);
            }

            let data;
            try {
                data = await response.json();
            } catch (error) {
                throw new Error('Invalid JSON from n8n');
            }

            return this.extractAIResponse(data);
        }

        extractAIResponse(data) {
            if (data === this.sessionId) {
                return this.generateSmartResponse();
            }
            if (typeof data === 'string') return data;

            if (typeof data === 'object') {
                const responseFields = ['response', 'message', 'text', 'answer', 'output', 'chatOutput', 'result', 'content'];
                for (const field of responseFields) {
                    if (data[field] && typeof data[field] === 'string') return data[field];
                }
                if (data.choices && data.choices[0]?.message?.content) return data.choices[0].message.content;
            }

            return this.generateSmartResponse();
        }

        generateSmartResponse(question = '') {
            const q = question.toLowerCase();
            if (q.includes('address') || q.includes('location')) {
                return `Our studio is in Marrakech. Contact: **${CONFIG.STUDIO.phone}**.`;
            }
            if (q.includes('phone') || q.includes('contact')) {
                return `Call us at **${CONFIG.STUDIO.phone}** or email **${CONFIG.STUDIO.email}**.`;
            }
            return `Thank you for your question! Please contact us at **${CONFIG.STUDIO.phone}** for immediate assistance.`;
        }

        getSmartResponse(question) {
            return this.generateSmartResponse(question);
        }

        addMessage(sender, text) {
            const messagesContainer = this.elements.messages;
            const messageDiv = document.createElement('div');
            messageDiv.className = `message-appear`;
            messageDiv.style.maxWidth = '85%';
            messageDiv.style.alignSelf = sender === 'bot' ? 'flex-start' : 'flex-end';
            messageDiv.style.marginBottom = '10px';

            const contentDiv = document.createElement('div');
            contentDiv.style.padding = '0.75rem';
            contentDiv.style.borderRadius = '1rem';
            contentDiv.style.boxShadow = '0 1px 2px rgba(0,0,0,0.1)';

            if (sender === 'bot') {
                contentDiv.style.backgroundColor = 'white';
                contentDiv.style.border = '1px solid #e5e7eb';
                contentDiv.style.color = '#1f2937';
                contentDiv.style.borderTopLeftRadius = '0.125rem';
                contentDiv.innerHTML = `<span style="font-weight: 600;">📸 FotoGenius:</span> ${this.formatMessage(text)}`;
            } else {
                contentDiv.style.background = 'linear-gradient(to right, #3b82f6, #9333ea)';
                contentDiv.style.color = 'white';
                contentDiv.style.borderTopRightRadius = '0.125rem';
                contentDiv.textContent = text;
            }

            messageDiv.appendChild(contentDiv);
            messagesContainer.appendChild(messageDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        formatMessage(text) {
            if (!text) return '';
            return text
                .replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: 600;">$1</strong>')
                .replace(/\*(.*?)\*/g, '<em style="font-style: italic;">$1</em>')
                .replace(/\n/g, '<br>')
                .replace(/^- (.*?)(?=\n|$)/gm, '• $1<br>')
                .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" style="color: #3b82f6; text-decoration: underline;">$1</a>');
        }

        showTyping() {
            if (this.isTyping) return;
            this.isTyping = true;
            const messagesContainer = this.elements.messages;

            const typingDiv = document.createElement('div');
            typingDiv.className = 'message-appear';
            typingDiv.id = 'typingIndicator';
            typingDiv.style.maxWidth = '85%';
            typingDiv.style.alignSelf = 'flex-start';

            typingDiv.innerHTML = `
                <div style="background: white; padding: 0.75rem; border-radius: 1rem; border-top-left-radius: 0.125rem; border: 1px solid #e5e7eb; display: flex; align-items: center; gap: 0.25rem;">
                    <div style="width: 0.5rem; height: 0.5rem; background: #3b82f6; border-radius: 9999px; animation: bounce 1s infinite -0.32s;"></div>
                    <div style="width: 0.5rem; height: 0.5rem; background: #3b82f6; border-radius: 9999px; animation: bounce 1s infinite -0.16s;"></div>
                    <div style="width: 0.5rem; height: 0.5rem; background: #3b82f6; border-radius: 9999px; animation: bounce 1s infinite;"></div>
                </div>
            `;

            messagesContainer.appendChild(typingDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        hideTyping() {
            this.isTyping = false;
            const typingIndicator = document.getElementById('typingIndicator');
            if (typingIndicator) typingIndicator.remove();
        }
    }

    // Initialize
    document.addEventListener('DOMContentLoaded', () => {
        window.fotoGeniusChatbot = new FotoGeniusChatbot();
    });

})();
