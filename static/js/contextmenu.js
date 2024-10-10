function createContextMenu() {
    const menuHtml = `
        <div id="custom-context-menu" class="context-menu">
            <ul>
                <li id="copy-option">Copy</li>
                <li id="search-here">Lookup</li>
                <li id="start-chat">Start chat</li>
                <li id="search-google">Search on Google</li>
                <!-- <li class="has-submenu">
                    Dropdown Option
                    <ul class="submenu">
                         <li id="sub-option-1">Sub Option 1</li>
                         <li id="sub-option-2">Sub Option 2</li>
                     </ul>
                </li> -->
            </ul>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', menuHtml);
}


let selectedText = '';
let chatOpened = false;


function createChatbox() {
    const style = document.createElement('style');
    style.textContent = `
        #chat-messages::-webkit-scrollbar {
            display: none;
        }
        #chatbox {
            box-shadow: 6px 4px 0px rgba(0, 0, 0, 0.815);
        }
        .no-select {
            user-select: none;
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
        }
    `;
    document.head.appendChild(style);

    const chatboxHtml = `
        <div id="chatbox">
            <div id="chat-header"></div>
            <div id="chat-messages"></div>
            <input type="text" id="chat-input" placeholder="Type your message...">
        </div>
    `;
    // transition: box-shadow 0.3s ease;

    document.body.insertAdjacentHTML('beforeend', chatboxHtml);

    const chatInput = document.getElementById('chat-input');
    const chatbox = document.getElementById('chatbox');
    const chatHeader = document.getElementById('chat-header');

    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && this.value.trim() !== '') {
            const userMessage = this.value.trim();
            addMessage('user', userMessage);
            this.value = '';
            fetchOpenAIStreamedResponse(userMessage);
        }
    });

    // Dragging and shadow adjustment functionality
    let isDragging = false;
    let currentX = 0, currentY = 0;
    let initialX, initialY;
    let xOffset = 0, yOffset = 0;
    let currentShadowX = 6, currentShadowY = 4;
    let targetShadowX = 6, targetShadowY = 4;
    const easingFactor = 0.15;
    const shadowEasingFactor = 0.33;
    const maxShadowOffset = 12;
    const shadowBounceStrength = 7;

    chatHeader.addEventListener("mousedown", dragStart);
    document.addEventListener("mousemove", drag);
    document.addEventListener("mouseup", dragEnd);

    function dragStart(e) {
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;

        if (e.target === chatHeader) {
            isDragging = true;
            document.body.classList.add('no-select');
            // requestAnimationFrame(animate);
        }
    }

    function drag(e) {
        if (isDragging) {
            e.preventDefault();
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;

            xOffset = currentX;
            yOffset = currentY;

            // Calculate shadow offset based on movement direction
            let dx = e.movementX;
            let dy = e.movementY;
            targetShadowX = 6 - dx * shadowBounceStrength;
            targetShadowY = 4 - dy * shadowBounceStrength;
        }
    }

    function dragEnd(e) {
        initialX = currentX;
        initialY = currentY;
        isDragging = false;
        document.body.classList.remove('no-select');
        targetShadowX = 6;
        targetShadowY = 4;
    }

    // function animate() {
    //     if (isDragging) {
    //         setTranslate(currentX, currentY, chatbox);
    //     }

    //     // Always animate shadow
    //     currentShadowX += (targetShadowX - currentShadowX) * shadowEasingFactor;
    //     currentShadowY += (targetShadowY - currentShadowY) * shadowEasingFactor;
    //     chatbox.style.boxShadow = `${currentShadowX}px ${currentShadowY}px 0px rgba(0, 0, 0, 0.815)`;

    //     if (isDragging || Math.abs(currentShadowX - targetShadowX) > 0.1 || Math.abs(currentShadowY - targetShadowY) > 0.1) {
    //         requestAnimationFrame(animate);
    //     }
    // }

    function setTranslate(xPos, yPos, el) {
        el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
    }
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
    const chatMessagesElement = document.getElementById('chat-messages');
    let isStreaming = true;

    // Prepare messages array for API call
    const messages = [
        {"role": "system", "content": "You are a helpful assistant."},
        ...chatHistory.slice(-10), // Include last 10 messages for context
        {"role": "user", "content": prompt}
    ];

    chatHistory.forEach(message => {
        console.log(message.role + ": " + message.content);
    });

    // Function to scroll to bottom
    function scrollToBottom() {
        if (isStreaming) {
            chatMessagesElement.scrollTop = chatMessagesElement.scrollHeight;
        }
    }

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
                isStreaming = false;
                return;
            }

            const chunk = new TextDecoder("utf-8").decode(value);
            const lines = chunk.split('\n');
            
            lines.forEach(line => {
                if (line.startsWith('data: ')) {
                    const jsonString = line.slice(5);
                    if (jsonString.trim() === '[DONE]') {
                        isStreaming = false;
                        return; // Stream finished
                    }
                    try {
                        const data = JSON.parse(jsonString);
                        if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
                            const content = data.choices[0].delta.content;
                            accumulatedText += content;
                            botMessageElement.textContent = accumulatedText;
                            scrollToBottom();
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
        isStreaming = false;
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

function addMenuListeners() {
    
    document.getElementById('copy-option').addEventListener('click', async function() {
        navigator.clipboard.writeText(selectedText);
        console.log(selectedText)
        document.getElementById('custom-context-menu').style.display = 'none';
    });

    document.getElementById('search-google').addEventListener('click', function() {
        window.open(`https://www.google.com/search?q=${encodeURIComponent(selectedText)}`, '_blank');
    });

    document.getElementById('search-here').addEventListener('click', function() {
        window.open(`./search?query=${encodeURIComponent(selectedText)}`, '_blank');
    });

    // document.getElementById('sub-option-1').addEventListener('click', function() {
    //     console.log('Sub option 1 clicked');
    // });

    // document.getElementById('sub-option-2').addEventListener('click', function() {
    //     console.log('Sub option 2 clicked');
    // });

    document.getElementById('start-chat').addEventListener('click', function(e) {
        const chatbox = document.getElementById('chatbox');
        chatbox.style.display = 'block';
        
        // Position the chatbox near the cursor
        let left = e.pageX;
        let top = e.pageY;
        chatOpened = true;
        // Ensure the chatbox doesn't go off-screen
        const chatboxWidth = 400; // Width of the chatbox
        const chatboxHeight = 300; // Height of the chatbox
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
    
                // Get the visible viewport dimensions
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;
    
                // Get the scroll position
                const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
                const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    
                // Calculate position relative to the viewport
                let left = e.clientX;
                let top = e.clientY;
    
                // Ensure the menu doesn't go off-screen
                const menuWidth = menu.offsetWidth;
                const menuHeight = menu.offsetHeight;
    
                if (left + menuWidth > viewportWidth) {
                    left = viewportWidth - menuWidth;
                }
                if (top + menuHeight > viewportHeight) {
                    top = viewportHeight - menuHeight;
                }
    
                // Set the position, adding the scroll offset back
                menu.style.left = (left + scrollX) + 'px';
                menu.style.top = (top + scrollY) + 'px';
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
