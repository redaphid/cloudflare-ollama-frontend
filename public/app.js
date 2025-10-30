class OllamaChat {
	constructor() {
		this.chatContainer = document.getElementById('chat-container');
		this.messageInput = document.getElementById('message-input');
		this.sendButton = document.getElementById('send-button');
		this.inputForm = document.getElementById('input-form');
		this.modelSelect = document.getElementById('model-select');
		this.conversationHistory = [];

		this.init();
	}

	async init() {
		this.inputForm.addEventListener('submit', (e) => this.handleSubmit(e));
		this.messageInput.addEventListener('input', () => this.autoResize());

		await this.loadModels();
	}

	async loadModels() {
		try {
			const response = await fetch('/api/models');
			const data = await response.json();

			if (data.models && data.models.length > 0) {
				this.modelSelect.innerHTML = '';
				data.models.forEach((model) => {
					const option = document.createElement('option');
					option.value = model.name;
					option.textContent = model.name;
					this.modelSelect.appendChild(option);
				});
			} else {
				this.modelSelect.innerHTML = '<option value="">No models available</option>';
			}
		} catch (error) {
			console.error('Failed to load models:', error);
			this.modelSelect.innerHTML = '<option value="">Error loading models</option>';
		}
	}

	autoResize() {
		this.messageInput.style.height = 'auto';
		this.messageInput.style.height = this.messageInput.scrollHeight + 'px';
	}

	async handleSubmit(e) {
		e.preventDefault();

		const message = this.messageInput.value.trim();
		if (!message || !this.modelSelect.value) return;

		this.messageInput.value = '';
		this.messageInput.style.height = 'auto';
		this.sendButton.disabled = true;

		this.addMessage('user', message);
		this.conversationHistory.push({ role: 'user', content: message });

		const loadingId = this.showLoading();

		try {
			const response = await fetch('/api/chat', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					model: this.modelSelect.value,
					messages: this.conversationHistory,
					stream: true,
				}),
			});

			this.removeLoading(loadingId);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const reader = response.body.getReader();
			const decoder = new TextDecoder();
			let assistantMessage = '';
			const messageElement = this.addMessage('assistant', '');

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				const chunk = decoder.decode(value);
				const lines = chunk.split('\n').filter((line) => line.trim());

				for (const line of lines) {
					try {
						const data = JSON.parse(line);
						if (data.message && data.message.content) {
							assistantMessage += data.message.content;
							this.updateMessage(messageElement, assistantMessage);
						}
					} catch (e) {
						console.error('Error parsing chunk:', e);
					}
				}
			}

			this.conversationHistory.push({ role: 'assistant', content: assistantMessage });
		} catch (error) {
			this.removeLoading(loadingId);
			this.addMessage('assistant', `Error: ${error.message}`, true);
			console.error('Chat error:', error);
		} finally {
			this.sendButton.disabled = false;
			this.messageInput.focus();
		}
	}

	addMessage(role, content, isError = false) {
		const messageDiv = document.createElement('div');
		messageDiv.className = `message ${role}`;

		const avatar = document.createElement('div');
		avatar.className = 'message-avatar';
		avatar.textContent = role === 'user' ? '👤' : '🤖';

		const contentDiv = document.createElement('div');
		contentDiv.className = 'message-content';
		if (isError) contentDiv.classList.add('error');
		contentDiv.textContent = content;

		messageDiv.appendChild(avatar);
		messageDiv.appendChild(contentDiv);

		this.chatContainer.appendChild(messageDiv);
		this.scrollToBottom();

		return contentDiv;
	}

	updateMessage(element, content) {
		element.textContent = content;
		this.scrollToBottom();
	}

	showLoading() {
		const loadingDiv = document.createElement('div');
		const id = 'loading-' + Date.now();
		loadingDiv.id = id;
		loadingDiv.className = 'message assistant';

		const avatar = document.createElement('div');
		avatar.className = 'message-avatar';
		avatar.textContent = '🤖';

		const contentDiv = document.createElement('div');
		contentDiv.className = 'message-content';

		const loading = document.createElement('div');
		loading.className = 'loading';
		loading.innerHTML = '<div class="loading-dot"></div><div class="loading-dot"></div><div class="loading-dot"></div>';

		contentDiv.appendChild(loading);
		loadingDiv.appendChild(avatar);
		loadingDiv.appendChild(contentDiv);

		this.chatContainer.appendChild(loadingDiv);
		this.scrollToBottom();

		return id;
	}

	removeLoading(id) {
		const element = document.getElementById(id);
		if (element) element.remove();
	}

	scrollToBottom() {
		this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
	}
}

// Initialize the chat app
new OllamaChat();
