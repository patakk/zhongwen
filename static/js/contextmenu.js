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
            
            setTranslate(currentX, currentY, chatbox);
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


function isMobileOrTablet() {
    let check = false;
    (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
    return check || /iPad|iPhone|iPod/.test(navigator.platform) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
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
        chatOpened = true;
    
        if (isMobileOrTablet()) {
            // For mobile, set the position to the top of the screen
            chatbox.style.left = '10%';
            chatbox.style.bottom = '10%';
            chatbox.style.width = '80%';
            chatbox.style.height = '40vh';
        } else {
            // For desktop, keep the existing positioning logic
            let left = e.pageX;
            let top = e.pageY;
            let chatboxWidth = 400;
            let chatboxHeight = 300;
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
    
            if (left + chatboxWidth > windowWidth) {
                left = windowWidth - chatboxWidth - 20;
            }
            if (top + chatboxHeight > windowHeight) {
                top = windowHeight - chatboxHeight - 20;
            }
    
            chatbox.style.left = left + 'px';
            chatbox.style.top = top + 'px';
        }
    
        const chatinput = document.getElementById('chat-input');
        chatinput.focus();
        document.getElementById('custom-context-menu').style.display = 'none';
        initializeChat();
    });

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd);


    function handleContextMenu(e) {
        e.preventDefault();
        showContextMenu(e.clientX, e.clientY);
    }

    let touchStartX, touchStartY;
    let touchTimeout;
    let longPressDuration = 500; // milliseconds
    let menuShown = false;

    function handleTouchStart(e) {
        if (touchTimeout) clearTimeout(touchTimeout);

        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;

        touchTimeout = setTimeout(() => {
            const selection = window.getSelection();
            if (selection && selection.toString().trim().length > 0) {
                showContextMenu(touchStartX, touchStartY);
                menuShown = true;
            }
        }, longPressDuration);
    }

    function handleTouchMove(e) {
        if (touchTimeout) {
            // If the user moves their finger, cancel the long press
            clearTimeout(touchTimeout);
            touchTimeout = null;
        }
    }

    function handleTouchEnd(e) {
        if (touchTimeout) {
            // If the touch ends before longPressDuration, clear the timeout
            clearTimeout(touchTimeout);
            touchTimeout = null;
        }

        // Don't hide the menu immediately after showing it
        if (!menuShown) {
            const menu = document.getElementById('custom-context-menu');
            if (menu && menu.style.display === 'block') {
                // Only hide the menu if the touch end is outside the menu
                if (!menu.contains(e.target)) {
                    menu.style.display = 'none';
                }
            }
        }
        
        // Reset menuShown flag
        menuShown = false;
    }



    function showContextMenu(clientX, clientY) {
        selectedText = window.getSelection().toString().trim();
        if (selectedText && isMobileOrTablet() || !isMobileOrTablet()) {
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
                let left = clientX;
                let top = clientY;
    
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
                document.addEventListener('touchstart', preventDefaultTouch, { passive: false });
            }
        }
    }
    
    function preventDefaultTouch(e) {
        const menu = document.getElementById('custom-context-menu');
        if (menu && menu.style.display === 'block') {
            if (!menu.contains(e.target)) {
                e.preventDefault();
                menu.style.display = 'none';
            }
        }
    }

    document.addEventListener('click', function(event) {
        const chatbox = document.getElementById('chatbox');
        const menu = document.getElementById('custom-context-menu');
        if (chatbox && !menu.contains(event.target) && !chatbox.contains(event.target)) {
            chatbox.style.display = 'none';
            chatOpened = false;
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
