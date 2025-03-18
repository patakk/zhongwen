let isDarkMode = false;
let DIMS = 128;

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function saveData(data) {
    fetch('./api/save_stroke_data', {
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

function drawStrokes(canvas, strokes) {
    const ctx = canvas.getContext('2d');
  
    drawLinesBg(canvas);

    ctx.strokeStyle = 'black';
    ctx.fillStyle = 'black';
    if(isDarkMode) {
        ctx.strokeStyle = 'white';
        ctx.fillStyle = 'white';
    }

    let fixy = 0.05;
    // strokes.forEach(stroke => {
    //     ctx.beginPath();
    //     stroke.forEach((point, index) => {
    //       const x = point.x * positioner.width * scale;
    //       const y = (1. - point.y - fixy) * positioner.height * scale;
    //       if (index === 0) {
    //         ctx.moveTo(x, y);
    //       } else {
    //         ctx.lineTo(x, y);
    //       }
    //     });
    //     ctx.stroke();
    //   });

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round'; 
    ctx.lineWidth = 3;

    strokes.forEach(stroke => {
        ctx.beginPath();
        stroke.forEach((point, index) => {
            var x = point[0] * canvas.width;
            var y = point[1] * canvas.height;
            x = (x-canvas.width*.5) * .9 + canvas.width*.5;
            y = (y-canvas.height*.5) * .9 + canvas.height*.5;
            const radius = canvas.width*.0142 + canvas.width*.02 * (1.-index / stroke.length);
            // ctx.beginPath();
            // ctx.arc(x, y, radius*.5, 0, 2 * Math.PI);
            // ctx.fill();
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();
    });
  }

let isGridView = false;

function toggleView() {
    isGridView = !isGridView;
    const container = document.getElementById('characters-container');
    if (isGridView) {
        container.classList.add('grid-view');
        initGrid();
    } else {
        container.classList.remove('grid-view');
        initList();
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
    const charcontainer = document.getElementById('characters-container');

    const characters = await fetchCharacterList();
    const container = document.createElement('div');
    container.id = 'character-animations';
    charcontainer.parentNode.insertBefore(container, charcontainer);

    for (const character of characters) {
        try {
            const response = await fetch(`./api/character_animation/${character}`);
            
            // Skip characters with insufficient data or other issues
            if (!response.ok || response.status === 204) {
                console.log(`Skipping animation for ${character}: insufficient data`);
                continue;
            }
            console.log(`Creating animation for ${character}`);
            
            const charDiv = document.createElement('div');
            charDiv.className = 'character-animation';
            
            const img = document.createElement('img');
            img.alt = `Animation for ${character}`;
            img.src = URL.createObjectURL(await response.blob());
            
            charDiv.appendChild(img);
            container.appendChild(charDiv);
        } catch (error) {
            console.error(`Error loading animation for ${character}:`, error);
        }
    }
}


function createInvisibleHanziWriter(char, func) {
    const offScreenDiv = document.createElement('div');
    offScreenDiv.style.position = 'absolute';
    offScreenDiv.style.left = '-9999px';
    offScreenDiv.style.top = '-9999px';
    document.body.appendChild(offScreenDiv);
    var writer2 = HanziWriter.create(offScreenDiv, char, {
        width: 100,
        height: 100,
        onLoadCharDataSuccess: (data) => {
            try{
                setTimeout(() => {
                    writer2.animateCharacter();
                    func(writer2._character.strokes);
                }, 1000);
            }
            catch(err){
            }
        },
        onLoadCharDataError: function(reason) {
          console.log('Oh No! Something went wrong :(');
        },
        charDataLoader: function(char) {
            return fetch(`/static/strokes_data/${char}.json`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .catch(error => {
                    console.error('Error loading character data:', error);
                    return null;
                });
        }
    });
    document.body.removeChild(offScreenDiv);
    return writer2;
}

function initGrid(){
    
    const charactersContainer = document.getElementById('characters-container');

    charactersContainer.innerHTML = '';


    Object.entries(strokes_per_character).forEach(([character, attempts]) => {
        const characterLabel = document.createElement('div');
        characterLabel.className = 'character-label';
        characterLabel.textContent = character;
    

        const canvasContainer = document.createElement('div');
        canvasContainer.className = 'canvas-container';

        attempts.forEach((attempt, index) => {
            const canvas = document.createElement('canvas');
            canvas.width = DIMS;
            canvas.height = canvas.width;
            // canvas.style.width = canvas.width/2 + 'px';
            // canvas.style.height = canvas.height/2 + 'px';
            canvas.className = 'character-canvas';
            canvasContainer.appendChild(canvas);

            let dict_of_strokes = attempt.strokes;
            let strokes = [];
            for (let key in dict_of_strokes) {
                strokes.push(dict_of_strokes[key]);
            }
            drawStrokes(canvas, strokes, attempt.positioner);
        });

        charactersContainer.appendChild(canvasContainer);
    });
}

function initList(){
    
    const charactersContainer = document.getElementById('characters-container');

    charactersContainer.innerHTML = '';


    Object.entries(strokes_per_character).forEach(([character, attempts]) => {
        const characterRow = document.createElement('div');
        characterRow.className = 'character-row';
        
        const characterLabel = document.createElement('div');
        characterLabel.className = 'character-label';
        characterLabel.textContent = character;
        characterRow.appendChild(characterLabel);
    

        const canvasContainer = document.createElement('div');
        canvasContainer.className = 'canvas-container';
        const canvas = document.createElement('canvas')
        canvas.width = 100;
        canvas.height = 100;
        function func(strokes) {
            // let trueStrokeData = [];
            // trueStrokeData = strokes.map(stroke => {
            //     stroke.forEach(point => {
            //         point.x = point.x / 1000;
            //         point.y = point.y / 1000;
            //     });
            //     return stroke;
            // });
            // drawStrokes(canvas, trueStrokeData);
        }
        // var wwriter = createInvisibleHanziWriter(character, func);
        // canvasContainer.appendChild(canvas);

        attempts.forEach((attempt, index) => {
            const canvas = document.createElement('canvas');
            canvas.width = DIMS;
            canvas.height = canvas.width;
            // canvas.style.width = canvas.width/2 + 'px';
            // canvas.style.height = canvas.height/2 + 'px';
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
  
let alreadloadedanims = false;

document.addEventListener('DOMContentLoaded', () => {
    getDarkmode(initList);
    
    const toggleViewElement = document.getElementById('toggle-view');
    toggleViewElement.addEventListener('click', toggleView);

    document.addEventListener('keydown', (event) => {
        if (event.key === 'b' && event.ctrlKey && !alreadloadedanims) {
            initList();
            loadAllCharacterAnimations();
            alreadloadedanims = true;
        }
    });
});