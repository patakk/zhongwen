function createContextMenu() {
    const menuHtml = `
        <div id="custom-context-menu" class="context-menu">
            <ul>
                <li id="copy-option">Copy</li>
                <li id="search-google">Search on Google</li>
                <li id="start-chat">Start chat</li>
                <li class="has-submenu">
                    Dropdown Option
                    <ul class="submenu">
                        <li id="sub-option-1">Sub Option 1</li>
                        <li id="sub-option-2">Sub Option 2</li>
                    </ul>
                </li>
            </ul>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', menuHtml);
}


let selectedText = '';



function createChatbox() {
    // Add the style for hiding scrollbar
    const style = document.createElement('style');
    style.textContent = `
        #chat-messages::-webkit-scrollbar {
            display: none;
        }
    `;
    document.head.appendChild(style);

    const chatboxHtml = `
        <div id="chatbox">
            <div id="chat-messages"></div>
            <input type="text" id="chat-input" placeholder="Type your message...">
        </div>
    `;


    document.body.insertAdjacentHTML('beforeend', chatboxHtml);

    const chatInput = document.getElementById('chat-input');

    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && this.value.trim() !== '') {
            const userMessage = this.value.trim();
            addMessage('user', userMessage);
            this.value = '';

            // Simple bot response
            // setTimeout(() => {
            //     addMessage('bot', 'Hello '+userMessage);
            // }, 500);
            //addMessage('bot', "hello");
            fetchOpenAIStreamedResponse(userMessage);
        }
    });
}

let openAiApiKey; // Global variable to store the API key
let chatHistory = []; // Array to store chat history

function getApiKey() {
    return fetch(`./get_api_key`)
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        openAiApiKey = data.api_key;
    })
    .catch(error => {
        console.error('There was a problem with the fetch operation:', error);
    });
}

function addMessage(sender, message) {
    const chatMessages = document.getElementById('chat-messages');
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.classList.add(sender === 'user' ? 'user-message' : 'bot-message');
    messageElement.textContent = message;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Add message to chat history
    chatHistory.push({"role": sender === 'user' ? "user" : "assistant", "content": message});

    return messageElement;
}

function fetchOpenAIResponse(prompt) {
    if (!openAiApiKey) {
        console.error('API key not set');
        return;
    }

    const botMessageElement = addMessage('bot', 'Thinking...');

    // Prepare messages array for API call
    const messages = [
        {"role": "system", "content": "You are a helpful assistant."},
        ...chatHistory.slice(-10), // Include last 10 messages for context
        {"role": "user", "content": prompt}
    ];

    console.log("Chat history:");
    chatHistory.forEach(message => {
        console.log(message.role + ": " + message.content);
    });

    fetch("https://api.openai.com/v1/chat/completions", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openAiApiKey}`
        },
        body: JSON.stringify({
            model: "gpt-4-turbo-2024-04-09",
            messages: messages,
            max_tokens: 400,
            stream: false // Set to false for non-streaming response
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        if (data.choices && data.choices[0] && data.choices[0].message) {
            const botResponse = data.choices[0].message.content;
            console.log("Bot response:", botResponse);
            botMessageElement.textContent = botResponse;

            // Update chat history with full bot response
            chatHistory.push({"role": "assistant", "content": botResponse});
        } else {
            throw new Error('Unexpected response structure');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        botMessageElement.textContent = 'Error: Unable to fetch response';
    });
}


function fetchOpenAIStreamedResponse(prompt) {
    if (!openAiApiKey) {
        console.error('API key not set');
        return;
    }

    const botMessageElement = addMessage('bot', '');

    // Prepare messages array for API call
    const messages = [
        {"role": "system", "content": "You are a helpful assistant."},
        ...chatHistory.slice(-10), // Include last 10 messages for context
        {"role": "user", "content": prompt}
    ];

    chatHistory.forEach(message => {
        console.log(message.role + ": " + message.content);
    });

    fetch("https://api.openai.com/v1/chat/completions", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openAiApiKey}`
        },
        body: JSON.stringify({
            model: "gpt-4-turbo-2024-04-09",
            messages: messages,
            max_tokens: 400,
            stream: true
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const reader = response.body.getReader();
        let accumulatedText = '';

        function processText({ done, value }) {
            if (done) {
                // Update chat history with full bot response
                chatHistory.push({"role": "assistant", "content": accumulatedText});
                return;
            }

            const chunk = new TextDecoder("utf-8").decode(value);
            const lines = chunk.split('\n');
            
            lines.forEach(line => {
                if (line.startsWith('data: ')) {
                    const jsonString = line.slice(5);
                    if (jsonString.trim() === '[DONE]') {
                        return; // Stream finished
                    }
                    try {
                        const data = JSON.parse(jsonString);
                        if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
                            const content = data.choices[0].delta.content;
                            accumulatedText += content;
                            botMessageElement.textContent = accumulatedText;
                        }
                    } catch (error) {
                        console.error('Error parsing JSON:', error);
                    }
                }
            });

            return reader.read().then(processText);
        }

        return reader.read().then(processText);
    })
    .catch(error => {
        console.error('Error:', error);
        botMessageElement.textContent = 'Error: Unable to fetch response';
    });
}


function initializeChat() {
    const chatMessages = document.getElementById('chat-messages');
    chatMessages.innerHTML = ''; // Clear chat display

    // use selectedText
    let bprompt = "You are a professional chinese instructor, I'm a beginner student, act like you are teaching me chinese. If I ever give you something in quotes, translate it!!";
    if (selectedText.length === 0) {
        chatHistory.push({"role": 'user', "content": bprompt});
        addMessage('bot', "Hello, ask me anything about Chinese.");
    }
    else{
        addMessage('user', `explain this to me - ${selectedText}`);
        let prompt = bprompt + "Now, explain/translate the following to me (be concise): " + selectedText;
        fetchOpenAIStreamedResponse(prompt);
    }
}
let chatOpened = false;
// Add event listeners after the menu is created
function addMenuListeners() {
    
    document.getElementById('copy-option').addEventListener('click', async function() {
        navigator.clipboard.writeText(selectedText);
        console.log(selectedText)
        document.getElementById('custom-context-menu').style.display = 'none';
    });

    document.getElementById('search-google').addEventListener('click', function() {
        window.open(`https://www.google.com/search?q=${encodeURIComponent(selectedText)}`, '_blank');
    });

    document.getElementById('sub-option-1').addEventListener('click', function() {
        console.log('Sub option 1 clicked');
    });

    document.getElementById('sub-option-2').addEventListener('click', function() {
        console.log('Sub option 2 clicked');
    });

    document.getElementById('start-chat').addEventListener('click', function(e) {
        const chatbox = document.getElementById('chatbox');
        chatbox.style.display = 'block';
        
        // Position the chatbox near the cursor
        let left = e.pageX;
        let top = e.pageY;
        chatOpened = true;
        // Ensure the chatbox doesn't go off-screen
        const chatboxWidth = 600; // Width of the chatbox
        const chatboxHeight = 500; // Height of the chatbox
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
    
        if (left + chatboxWidth > windowWidth) {
            left = windowWidth - chatboxWidth - 20; // 20px margin from right edge
        }
        if (top + chatboxHeight > windowHeight) {
            top = windowHeight - chatboxHeight - 20; // 20px margin from bottom edge
        }
    
        chatbox.style.left = left + 'px';
        chatbox.style.top = top + 'px';

        const chatinput = document.getElementById('chat-input');
        chatinput.focus();
        document.getElementById('custom-context-menu').style.display = 'none';
        initializeChat();
    });

    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        selectedText = window.getSelection().toString().trim();
        if (selectedText || true) {
            const menu = document.getElementById('custom-context-menu');
            if (menu) {
                menu.style.display = 'block';
                menu.style.zIndex = '9999';

                // Ensure the menu doesn't go off-screen
                const menuWidth = menu.offsetWidth;
                const menuHeight = menu.offsetHeight;
                const windowWidth = window.innerWidth;
                const windowHeight = window.innerHeight;

                let left = e.pageX;
                let top = e.pageY;

                if (left + menuWidth > windowWidth) {
                    left = windowWidth - menuWidth;
                }
                if (top + menuHeight > windowHeight) {
                    top = windowHeight - menuHeight;
                }

                menu.style.left = left + 'px';
                menu.style.top = top + 'px';
            }
        }
    });

    document.addEventListener('click', function(event) {
        const chatbox = document.getElementById('chatbox');
        const menu = document.getElementById('custom-context-menu');
        if (chatbox && !menu.contains(event.target) && !chatbox.contains(event.target)) {
            chatbox.style.display = 'none';
        }

        if (menu) {
            menu.style.display = 'none';
        }
    });
    
}

document.addEventListener('DOMContentLoaded', function() {
    getApiKey();
    createContextMenu();
    createChatbox();
    addMessage('bot', "Hello! How can I assist you today?");

    addMenuListeners();
});
