
document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chatForm');
    const messageInput = document.getElementById('messageInput');
    const chatMessages = document.getElementById('chatMessages');
    const typingIndicator = document.getElementById('typingIndicator');

    // Auto-scroll to bottom of chat
    const scrollToBottom = () => {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const addMessage = (text, sender) => {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender);
        messageDiv.textContent = text;

        // Insert before typing indicator
        chatMessages.insertBefore(messageDiv, typingIndicator);
        scrollToBottom();
    };

    const showTyping = (show) => {
        typingIndicator.style.display = show ? 'flex' : 'none';
        scrollToBottom();
    };

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const text = messageInput.value.trim();
        if (!text) return;

        // Add user message
        addMessage(text, 'user');
        messageInput.value = '';
        messageInput.disabled = true;

        // Show typing indicator
        showTyping(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: text })
            });

            const data = await response.json();

            showTyping(false);
            messageInput.disabled = false;
            messageInput.focus();

            if (response.ok) {
                addMessage(data.reply, 'bot');
            } else {
                console.error('Chat Error:', data);
                if (data.error && data.error.includes('Key')) {
                    addMessage("Désolé, la configuration du serveur (Clé API) est manquante. Veuillez contacter l'administrateur.", 'bot');
                } else {
                    addMessage("Désolé, je rencontre des difficultés techniques pour le moment.", 'bot');
                }
            }

        } catch (error) {
            console.error('Network Error:', error);
            showTyping(false);
            messageInput.disabled = false;
            addMessage("Erreur de connexion au serveur. Veuillez réessayer.", 'bot');
        }
    });
});
