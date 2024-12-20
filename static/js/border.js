

let bordercanvas = null;
let borderctx = null;
const useBackgroundCanvas = true; // Set this to false to disable the canvas
    


function renderBorder() {
    let globalSeed = Math.round(Math.random()*100000);
    noiseSeed(globalSeed);
    const flashcard = document.getElementById('flashcard_container');
    if(!useBackgroundCanvas){
        flashcard.style.border = '2px dashed #000';
        return;
    }
    bordercanvas.width = window.innerWidth*2;
    bordercanvas.height = window.innerHeight*2;
    borderctx.scale(2, 2);
    borderctx.fillStyle = 'rgba(255, 255, 255, 1)';
    borderctx.clearRect(0, 0, bordercanvas.width, bordercanvas.height);
    // borderctx.fillRect(0, 0, bordercanvas.width, bordercanvas.height);
    // drawDots();
    // borderctx.filter = 'blur(2px)';
    // drawWigglyBorder();
    borderctx.filter = 'none';
    drawWigglyBorder();
    // drawMarks();
    flashcard.style.border = '2px dashed #f000';
}

function rand(min, max) {
    return Math.random() * (max - min) + min;
}

function drawWigglyBorder() {
    const flashcard = document.getElementById('flashcard_container');
    flashcard.style.backgroundColor = 'rgba(255, 255, 255, 0)';
    const rect = flashcard.getBoundingClientRect();
    let scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    scrollLeft = scrollTop = 0;
    const vertices = [
        {x: rect.left + scrollLeft, y: rect.top + scrollTop},
        {x: rect.right + scrollLeft, y: rect.top + scrollTop},
        {x: rect.right + scrollLeft, y: rect.bottom + scrollTop},
        {x: rect.left + scrollLeft, y: rect.bottom + scrollTop}
    ];

    let density = 33 / Math.min(rect.width, rect.height);

    
    let allPoints = [];
    for (let i = 0; i < vertices.length; i++) {
        const start = vertices[i];
        const end = vertices[(i + 1) % vertices.length];
        let steps = Math.floor(Math.hypot(end.x - start.x, end.y - start.y) * density);
        
        for (let j = 0; j <= steps; j++) {
            const t = j / steps;
            allPoints.push(getWigglyPoint(start, end, t));
        }
    }

    // Start from the last point to close the loop
    borderctx.fillStyle = '#fff';
    borderctx.beginPath();
    borderctx.lineJoin = 'round';
    borderctx.moveTo(allPoints[0].x, allPoints[0].y);
    for (let i = 1; i < allPoints.length - 2; i++) {
        const xc = (allPoints[i].x + allPoints[i + 1].x) / 2;
        const yc = (allPoints[i].y + allPoints[i + 1].y) / 2;
        borderctx.quadraticCurveTo(allPoints[i].x, allPoints[i].y, xc, yc);
    }
    borderctx.quadraticCurveTo(
        allPoints[allPoints.length - 2].x,
        allPoints[allPoints.length - 2].y,
        allPoints[allPoints.length - 1].x,
        allPoints[allPoints.length - 1].y
    );
    borderctx.fill();
    
    // borderctx.beginPath();
    // borderctx.strokeStyle = 'rgba(0, 0, 0, .9)';
    // borderctx.lineJoin = 'round';
    // borderctx.moveTo(allPoints[0].x, allPoints[0].y);
    // for (let i = 1; i < allPoints.length - 2; i++) {
    //     const xc = (allPoints[i].x + allPoints[i + 1].x) / 2;
    //     const yc = (allPoints[i].y + allPoints[i + 1].y) / 2;
    //     borderctx.quadraticCurveTo(allPoints[i].x, allPoints[i].y, xc, yc);
    // }
    // borderctx.quadraticCurveTo(
    //     allPoints[allPoints.length - 2].x,
    //     allPoints[allPoints.length - 2].y,
    //     allPoints[allPoints.length - 1].x,
    //     allPoints[allPoints.length - 1].y
    // );
    // borderctx.stroke();

    // draw all vertices as dots
    // allPoints.forEach(vertex => {
    //     borderctx.fillStyle = 'rgba(222, 222, 222, 1)';
    //     borderctx.fillRect(-6+vertex.x, -6+vertex.y, 12, 12);
    // });

}


function drawDots() {
        
    const flashcard = document.getElementById('flashcard_container');
    const rect = flashcard.getBoundingClientRect();
    let scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    // Get the vertices of the flashcard
    const vertices = [
        {x: rect.left + scrollLeft, y: rect.top + scrollTop},
        {x: rect.right + scrollLeft, y: rect.top + scrollTop},
        {x: rect.right + scrollLeft, y: rect.bottom + scrollTop},
        {x: rect.left + scrollLeft, y: rect.bottom + scrollTop}
    ];

    const maxr = Math.max(rect.width, rect.height) / 2;
    const squaresPerVertex = 2025;

    vertices.forEach(vertex => {
        for (let i = 0; i < squaresPerVertex; i++) {
            let r = Math.random();
            r = r*r;
            let a = Math.random() * Math.PI * 2;
            let x = vertex.x + r * Math.cos(a) * maxr;
            let y = vertex.y + r * Math.sin(a) * maxr;
            const size = Math.floor(Math.random() * 2)*1+1;
            x = Math.round(x);
            y = Math.round(y);
            borderctx.fillStyle = 'rgba(0, 0, 0, 1)';
            borderctx.fillRect(x, y, size, size);
        }
    });
}



let frq = 0.02;
function getWigglyPoint(start, end, t) {
    const x = start.x + (end.x - start.x) * t;
    const y = start.y + (end.y - start.y) * t;
    const randomness = 37;
    // const strength = Math.pow(Math.abs(t - 0.5) * 2, 2);
    const strength = Math.pow(Math.abs(t - 0.5) * 2, 3);
    const randomX = x + (noise(x*frq, y*frq) - 0.5) * randomness * strength;
    const randomY = y + (noise(x*frq, y*frq, 128.31) - 0.5) * randomness * strength;
    return {x: randomX, y: randomY};
}

function drawWigglyLine(startX, startY, endX, endY, steps=30) {
    const points = [];
    borderctx.beginPath();
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = startX + (endX - startX) * t;
        const y = startY + (endY - startY) * t;
        const randomness = 1; // Adjust this value to increase/decrease wiggliness
        const strength = .3+.5*power(1.-Math.abs(t-.5)*2, 2);
        const randomX = x + (Math.random() - 0.5) * randomness * strength;
        const randomY = y + (Math.random() - 0.5) * randomness * strength;
        points.push({x: randomX, y: randomY});
    }
    // borderctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        if(i%2==0){
            borderctx.moveTo(points[i-1].x, points[i-1].y);
            borderctx.lineTo(points[i].x, points[i].y);
        }
    }
    borderctx.stroke();
}



function drawMarks(){
    const flashcard = document.getElementById('flashcard_container');
    const rect = flashcard.getBoundingClientRect();
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    let x1 = rect.left + scrollLeft +  rect.width  * .0;
    let y1 = rect.top + scrollTop +    rect.height * .045;
    let x2 = rect.left + scrollLeft +  rect.width  * 1.;
    let y2 = rect.top + scrollTop    + rect.height * .045;
    
    borderctx.strokeStyle = 'rgba(60,0,30, .25)';
    borderctx.lineWidth = 2;
    // drawWigglyLine(x1, y1, x2, y2, 100);

    for(let k = 0; k < 200; k++){
        let t = Math.random();
        let x = x1 + (x2 - x1) * t;
        let y = y1 + (y2 - y1) * t;
        let size = Math.random()*1+1;
        borderctx.fillStyle = 'rgba(60,0,30, .15)';
        borderctx.fillRect(x, y, size, size);
    }

}

function power(p, g){
    if(p < 0.5){
        return Math.pow(2*p, g);
    } else {
        return 1 - Math.pow(2*(1-p), g);
    }
}

function setupBackgroundCanvas() {
    const flashcardOverlay = document.getElementById('flashcard_overlay');

    if (flashcardOverlay) {
        flashcardOverlay.insertAdjacentHTML('afterbegin', '<canvas id="backgroundCanvas"></canvas>');
    } else {
        document.body.insertAdjacentHTML('afterbegin', '<canvas id="backgroundCanvas"></canvas>');
    }

    bordercanvas = document.getElementById('backgroundCanvas');
    borderctx = bordercanvas.getContext('2d');

    function setCanvasAttributes(canvas) {
        if (canvas) {
            canvas.style.position = 'fixed';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            canvas.style.zIndex = '1005';
            canvas.style.pointerEvents = 'none';
            canvas.style.transition = 'transform 0.2s';
        } 
    }
    

    if (!useBackgroundCanvas) {
        const existingCanvas = document.getElementById('backgroundCanvas');
        if (existingCanvas) {
            existingCanvas.remove();
        }
        return;
    }

    setCanvasAttributes(bordercanvas);
    window.addEventListener('resize', renderBorder);
}
