let isDarkMode = false;
let DIMS = 66;

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function saveData(data) {
    fetch('./save_stroke_data', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        console.log('Data saved successfully');
    })
    .catch(error => {
        console.error('There was a problem saving the data:', error);
    });
}


function drawLinesBg(canvas) {
    let ctx = canvas.getContext('2d');
  
    ctx.strokeStyle = 'rgb(233, 233, 233)';
    ctx.lineWidth = 2;
    if(isDarkMode) {
        ctx.strokeStyle = 'rgb(44, 44, 44)';
    }

    // border
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    // cross
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();

    ctx.strokeStyle = 'rgb(255, 233, 233)';
    ctx.lineWidth = 2;
    if(isDarkMode) {
        ctx.strokeStyle = 'rgb(55, 0, 0)';
    }
    // left diagonal
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.stroke();
    // right diagonal
    ctx.beginPath();
    ctx.moveTo(canvas.width, 0);
    ctx.lineTo(0, canvas.height);
    ctx.stroke();

}

function drawStrokes(canvas, strokes, positioner) {
    const ctx = canvas.getContext('2d');
    const scale = canvas.width / positioner.width;
  
    drawLinesBg(canvas);

    ctx.strokeStyle = 'black';
    ctx.fillStyle = 'black';
    ctx.lineWidth = 3;
    if(isDarkMode) {
        ctx.strokeStyle = 'white';
        ctx.fillStyle = 'white';
    }

    let fixy = 0.05;
    strokes.forEach(stroke => {
        ctx.beginPath();
        stroke.forEach((point, index) => {
          const x = point.x * positioner.width * scale;
          const y = (1. - point.y - fixy) * positioner.height * scale;
          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });
        ctx.stroke();
      });


    strokes.forEach(stroke => {
        stroke.forEach((point, index) => {
            const x = point.x * positioner.width * scale;
            const y = (1. - point.y - fixy) * positioner.height * scale;
            const radius = canvas.width*.0142 + canvas.width*.02 * (1.-index / stroke.length);
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI);
            ctx.fill();
        });
    });
  }

let isGridView = false;

function toggleView() {
    isGridView = !isGridView;
    const container = document.getElementById('characters-container');
    if (isGridView) {
        container.classList.add('grid-view');
    } else {
        container.classList.remove('grid-view');
    }
}

async function fetchCharacterList() {
    const response = await fetch('/hanzi_strokes_charlist');
    if (!response.ok) {
        throw new Error('Failed to fetch character list');
    }
    return response.json();
}

  
async function loadAllCharacterAnimations() {
    const characters = await fetchCharacterList();
    const container = document.createElement('div');
    container.id = 'character-animations';
    document.body.appendChild(container);

    for (const character of characters) {
        const charDiv = document.createElement('div');
        charDiv.className = 'character-animation';
        
        const img = document.createElement('img');
        img.alt = `Animation for ${character}`;
        
        const response = await fetch(`/character_animation/${character}`);
        if (response.ok) {
            img.src = URL.createObjectURL(await response.blob());
            charDiv.appendChild(img);
            container.appendChild(charDiv);
        }
    }
}


function initStats(){
    
    const charactersContainer = document.getElementById('characters-container');

    charactersContainer.innerHTML = '';

    Object.entries(strokes_per_character).forEach(([character, attempts]) => {
        const characterRow = document.createElement('div');
        characterRow.className = 'character-row';
        
        const characterLabel = document.createElement('h2');
        characterLabel.textContent = character;
        characterRow.appendChild(characterLabel);
    
        const canvasContainer = document.createElement('div');
        canvasContainer.className = 'canvas-container';

        attempts.forEach((attempt, index) => {
            const canvas = document.createElement('canvas');
            canvas.width = DIMS;
            canvas.height = canvas.width;
            canvas.style.width = canvas.width/2 + 'px';
            canvas.style.height = canvas.height/2 + 'px';
            canvas.className = 'character-canvas';
            canvasContainer.appendChild(canvas);

            let dict_of_strokes = attempt.strokes;
            let strokes = [];
            for (let key in dict_of_strokes) {
                strokes.push(dict_of_strokes[key]);
            }

            drawStrokes(canvas, strokes, attempt.positioner);
        });

        characterRow.appendChild(canvasContainer);
        charactersContainer.appendChild(characterRow);
    });
}
  
document.addEventListener('DOMContentLoaded', () => {
    getDarkmode(initStats);
    
    const toggleViewElement = document.getElementById('toggle-view');
    toggleViewElement.addEventListener('click', toggleView);

    document.addEventListener('keydown', (event) => {
        if (event.key === 'b' && event.ctrlKey) {
            loadAllCharacterAnimations();
        }
    });
});