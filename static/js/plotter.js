
function drawStrokes(context, progressData={progress: 1, strokeIndex: Infinity}){
    let {progress, strokeIndex} = progressData;

    progress = Math.min(1, progress);
    let fac = Math.min(1., (Date.now() - context.starttime) / 555);

    // context.strokes.forEach((stroke, strokeIndex) => {
    strokeIndex = Math.min(strokeIndex, context.strokes.length-1)

    function drawLines(shorter){
        
        context.ctx.save();
        context.ctx.fillStyle = "transparent";
        context.ctx.clearRect(0, 0, context.ctx.canvas.width, context.ctx.canvas.height);
        context.ctx.restore();
        for (let i = 0; i <= strokeIndex; i++) {
            let stroke = context.strokes[i];

            let strokeProgress = i < strokeIndex ? 1 : progress;
            context.ctx.beginPath();
            fac = 1;
            let a = 0
            let b = stroke.length*strokeProgress - 1;
            if(shorter){
                a = 2;
                b = stroke.length*strokeProgress - 2;
            }
            context.ctx.moveTo((stroke[a].x + context.offsetX) * context.sscale, context.cheight - (stroke[a].y + context.offsetY) * context.sscale);
            for(let k = a; k < b; k++){
                let p0 = k > 0 ? stroke[k - 1] : stroke[k];
                let p1 = stroke[k];
                let p2 = stroke[k + 1];
                let p3 = k < stroke.length - 2 ? stroke[k + 2] : p2;
                
                let cx1 = p1.x + (p2.x - p0.x) / 6;
                let cy1 = p1.y + (p2.y - p0.y) / 6;
                let cx2 = p2.x - (p3.x - p1.x) / 6;
                let cy2 = p2.y - (p3.y - p1.y) / 6;
                
                cx1 = (cx1 + context.offsetX) * context.sscale;
                cy1 = context.cheight - (cy1 + context.offsetY) * context.sscale;
                cx2 = (cx2 + context.offsetX) * context.sscale;
                cy2 = context.cheight - (cy2 + context.offsetY) * context.sscale;
                let x = (p2.x + context.offsetX) * context.sscale;
                let y = context.cheight - (p2.y + context.offsetY) * context.sscale;
                
                context.ctx.bezierCurveTo(cx1, cy1, cx2, cy2, x, y);
            }
            
            context.ctx.stroke();
        }
    }


    let oldOffsetX = context.offsetX;
    let oldOffsetY = context.offsetY;
    
    // context.offsetX += 0.1 * context.cwidth*1.3;
    // context.offsetY -= 0.071 * context.cwidth*1.3;
    // context.ctx.strokeStyle = `rgba(${255},${55},${166})`;
    // context.ctx.lineWidth = 19;
    // drawLines();
    // context.offsetX = oldOffsetX;
    // context.offsetY = oldOffsetY;
    // drawLines();
    
    // context.ctx.lineCap = 'round';
    
    context.offsetX += 0.1 * context.cwidth*1.3*0;
    context.offsetY -= 0.071 * context.cwidth*1.3*0;
    context.ctx.strokeStyle = `rgba(${11},${11},${11})`;
    context.ctx.lineWidth = 25;
    // drawLines();
    context.offsetX = oldOffsetX;
    context.offsetY = oldOffsetY;

    // context.ctx.lineWidth = 15;
    // context.ctx.strokeStyle = `rgba(${233},${1},${1})`;
    // context.ctx.strokeStyle = `rgba(${55},${55},${55})`;
    // drawLines();

    let lw0 = context.baseThickness || 68;
    if(isMobileOrTablet()){
        lw0 = lw0*1;
    }
    let lw = lw0*context.sscale;

    context.ctx.strokeStyle = `rgba(${233},${1},${1})`;
    context.ctx.strokeStyle = `rgba(${255},${22},${22})`;
    context.ctx.strokeStyle = `rgba(${11},${11},${11})`;

    context.ctx.lineWidth = lw;

    if(isDarkMode){
        context.ctx.strokeStyle = `rgba(${222},${222},${222})`;
    }

    drawLines();

    for(let k = 0; k < lw0/2; k++){
        context.ctx.lineWidth = 1.4*power(noise(1534+k+context.seed*11, 133), 3);
        context.ctx.lineWidth = .6;
        
        let oldOffsetX = context.offsetX;
        let oldOffsetY = context.offsetY;
        context.offsetX += lw0*.57*(2*power(noise(1534+k+context.seed*11, 33),3)-1);
        context.offsetY += lw0*.57*(2*power(noise(231+k+context.seed*11, 43),3)-1);
        let br = 0 + power(noise(5542+k+context.seed*11, 3),53) * 4;
        if(isDarkMode){
            br = 240 + power(noise(8643+k+context.seed*11, 3),73) * 15;
        }
        context.ctx.strokeStyle = `rgba(${br},${br},${br})`;
        // set multiplymode
        // drawLines(shorter=true);
        // drawPoints(context);
        context.offsetX = oldOffsetX;
        context.offsetY = oldOffsetY;
    }
}

function drawCanvas(context) {

    // Find the bounding box of all points

    drawStrokes(context);

    
    let flashcard_plotter = document.getElementById('flashcard_plotter');
    
    context = fix(context)
    context.plotter.frames++;
}

function animateStrokes(context) {
    let startTime = Date.now();
    let baseSpeed = context.baseSpeed || 2;
    let strokeIndex = 0;
    let progress = 0;

    let totalLength = context.strokes.reduce((sum, stroke) => {
        return sum + calculateStrokeLength(stroke);
    }, 0);

    function calculateStrokeLength(stroke) {
        let length = 0;
        for (let i = 1; i < stroke.length; i++) {
            let dx = stroke[i].x - stroke[i-1].x;
            let dy = stroke[i].y - stroke[i-1].y;
            length += Math.sqrt(dx*dx + dy*dy);
        }
        return length;
    }

    function animate() {
        let currentTime = Date.now();
        let elapsedTime = currentTime - startTime;
        let currentStroke = context.strokes[strokeIndex];
        let strokeLength = calculateStrokeLength(currentStroke);
        let strokeDuration = (strokeLength / totalLength) * (totalLength / baseSpeed);
        
        progress = Math.min(1, elapsedTime / strokeDuration);
        context.ctx.save();
        context.ctx.fillStyle = "transparent";
        context.ctx.clearRect(0, 0, context.ctx.canvas.width, context.ctx.canvas.height);
        context.ctx.restore();

        drawStrokes(context, {progress, strokeIndex});

        if (progress >= 1) {
            strokeIndex++;
            if (strokeIndex < context.strokes.length) {
                startTime = currentTime;
                progress = 0;
                context.plotterAnimationInterval = requestAnimationFrame(animate);
            }
        } else if (strokeIndex < context.strokes.length) {
            context.plotterAnimationInterval = requestAnimationFrame(animate);
        }
    }

    animate();
}


function getToneColor(ipinyin) {
    let colors = ['#58d38f11', '#ffd91c11', '#9f5dc111', '#ff421c11', '#b1cbff11',]; // Corresponds to tones 1, 2, 3, 4, and neutral

    // Function to determine tone from pinyin
    function getToneFromPinyin(pinyin) {
        if (!pinyin) return 4; // Default to neutral tone if no pinyin
        
        // Tone mark to number mapping
        const toneMarks = {
            'ā': 0, 'ē': 0, 'ī': 0, 'ō': 0, 'ū': 0, 'ǖ': 0,
            'á': 1, 'é': 1, 'í': 1, 'ó': 1, 'ú': 1, 'ǘ': 1,
            'ǎ': 2, 'ě': 2, 'ǐ': 2, 'ǒ': 2, 'ǔ': 2, 'ǚ': 2,
            'à': 3, 'è': 3, 'ì': 3, 'ò': 3, 'ù': 3, 'ǜ': 3
        };

        for (let char of pinyin) {
            if (char in toneMarks) {
                return toneMarks[char];
            }
        }
        return 4; // Neutral tone if no tone mark found
    }


    const tone = getToneFromPinyin(ipinyin);
    const color = colors[tone];
    return color;
}

function drawPaths(context, fill=true, stroke=true){
    context.paths.forEach(d => {
        context.ctx.beginPath();
        let commands = d.match(/[A-Z][^A-Z]*/g);
        let currentX = 0, currentY = 0;

        commands.forEach(cmd => {
            let type = cmd[0];
            let args = cmd.slice(1).trim().split(/[\s,]+/).map(parseFloat);

            switch(type) {
                case 'M':
                    currentX = (args[0] + context.offsetX) * context.sscale;
                    currentY = context.cheight - (args[1] + context.offsetY) * context.sscale;
                    context.ctx.moveTo(currentX, currentY);
                    break;
                case 'L':
                    currentX = (args[0] + context.offsetX) * context.sscale;
                    currentY = context.cheight - (args[1] + context.offsetY) * context.sscale;
                    context.ctx.lineTo(currentX, currentY);
                    break;
                case 'Q':
                    context.ctx.quadraticCurveTo(
                        (args[0] + context.offsetX) * context.sscale, context.cheight - (args[1] + context.offsetY) * context.sscale,
                        (args[2] + context.offsetX) * context.sscale, context.cheight - (args[3] + context.offsetY) * context.sscale
                    );
                    currentX = (args[2] + context.offsetX) * context.sscale;
                    currentY = context.cheight - (args[3] + context.offsetY) * context.sscale;
                    break;
                case 'C':
                    context.ctx.bezierCurveTo(
                        (args[0] + context.offsetX) * context.sscale, context.cheight - (args[1] + context.offsetY) * context.sscale,
                        (args[2] + context.offsetX) * context.sscale, context.cheight - (args[3] + context.offsetY) * context.sscale,
                        (args[4] + context.offsetX) * context.sscale, context.cheight - (args[5] + context.offsetY) * context.sscale
                    );
                    currentX = (args[4] + context.offsetX) * context.sscale;
                    currentY = context.cheight - (args[5] + context.offsetY) * context.sscale;
                    break;
            }
        });
        context.ctx.closePath();
        if(fill)
            context.ctx.fill();
        if(stroke)
            context.ctx.stroke();
    });
}

function fix(context){
    let {ctx, strokes, paths, cwidth, cheight, offsetX, offsetY, sscale} = context;
    let nstrokes = strokes.map(stroke => {
        stroke = removeShortSegments(stroke, 30);
        stroke = evenOutPoints(stroke, 150);
        return stroke;
    });
    return {...context, strokes: nstrokes};
}

function power(p, g) {
    if (p < 0.5)
        return 0.5 * Math.pow(2*p, g);
    else
        return 1 - 0.5 * Math.pow(2*(1 - p), g);
} 

function evenOutPoints(line, maxLength = 100) {
    let newLine = [];
    for (let i = 0; i < line.length - 1; i++) {
        let p1 = line[i];
        let p2 = line[i + 1];
        newLine.push(p1);
        let dx = p2.x - p1.x;
        let dy = p2.y - p1.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > maxLength) {
            let segments = Math.ceil(distance / maxLength);
            for (let j = 1; j < segments; j++) {
                let t = j / segments;
                newLine.push({
                    x: p1.x + dx * t,
                    y: p1.y + dy * t
                });
            }
        }
    }
    newLine.push(line[line.length - 1]);
    let needsMoreDivision = newLine.some((p, i) => 
        i < newLine.length - 1 && 
        Math.hypot(newLine[i+1].x - p.x, newLine[i+1].y - p.y) > maxLength
    );
    return needsMoreDivision ? this.evenOutPoints(newLine, maxLength) : newLine;
}

function removeShortSegments(line, minLength = 5) {
    if (line.length < 3) return line; // Keep lines with 2 or fewer points unchanged

    let newLine = [line[0]]; // Always keep the first point

    for (let i = 1; i < line.length - 1; i++) {
        let p1 = newLine[newLine.length - 1];
        let p2 = line[i];
        let p3 = line[i + 1];

        let d1 = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        let d2 = Math.hypot(p3.x - p2.x, p3.y - p2.y);

        // Keep the point if either adjacent segment is long enough
        if (d1 >= minLength || d2 >= minLength) {
            newLine.push(p2);
        }
    }

    newLine.push(line[line.length - 1]); // Always keep the last point

    return newLine;
}

function addJitter(context, scaleLow=80, frqLow=0.0011) {
    let time = Date.now() * 20.51; // Slower time progression

    const jitteredStrokes = context.strokes.map((stroke, idx) => {
        return stroke.map((point, idx) => {
            let factor = .1+Math.pow(idx / stroke.length, 1);
            // Low-frequency noise
            let lowNoiseX = factor * scaleLow * (2 * noise(frqLow * point.x, frqLow * point.y, 821.31 + time + idx*.3) - 1);
            let lowNoiseY = factor * scaleLow * (2 * noise(frqLow * point.x, frqLow * point.y, 912.31 + time + idx*.3) - 1);
            // lowNoiseX = factor * scaleLow * (2 * noise(idx*.1, idx*.1+23, 821.31 + time*frqLow + idx*12.3) - 1);
            // lowNoiseY = .6*factor * scaleLow * (2 * noise(idx*.1, idx*.1+23, 912.31 + time*frqLow + idx*12.3) - 1);

            return {
                x: point.x + lowNoiseX,
                y: point.y + lowNoiseY,
            };
        });
    });

    return {...context, strokes: jitteredStrokes};
}

function renderPlotData(plotterElement, data){
    const chars = data.character.split('');
    if(!plotterElement){
        return;
    }
    chars.forEach((char, index) => {
        let size = 128;
        const plotter = new HanziPlotter({char, size, animateOnClick: true});
        plotter.draw();
        plotterElement.appendChild(plotter.canvas);
    });
}


class HanziPlotter {
    constructor({char, size=256, animateOnClick=false, baseSpeed=2, speedSlider=null, baseThickness=66}) {
        // if(isMobileOrTablet()){
        //     size = 122;
        // }
        this.char = char;
        this.cwidth = size;
        this.cheight = this.cwidth;
        this.renderContext;
        this.animationInterval;
        this.frames = 0;
        this.maxframes = 60;
        this.starttime = Date.now();
        this.readyPromise = new Promise((resolve) => {
            this.writer = this.createInvisibleHanziWriter(char, (data) => {
                this.paths = data.map(stroke => stroke.path);
                
                this.strokes = data.map(stroke => {
                    let spoints = evenOutPoints(stroke.points, 22);
                    return spoints;
                });
                console.log("Strokes loaded");
                resolve();
            });
        });

        this.canvas = document.createElement('canvas');
        this.canvas.width = this.cwidth;
        this.canvas.height = this.cheight;
        this.canvas.style.width = this.cwidth + 'px';
        this.canvas.style.height = this.cheight + 'px';
        this.canvas.classList.add('plotter');
        this.ctx = this.canvas.getContext('2d');
        this.animateOnClick = animateOnClick;
        this.baseSpeed = baseSpeed;
        this.baseThickness = baseThickness;
        this.prepare(speedSlider);
    }

    async prepare(speedSlider=null) {
        await this.readyPromise;

        this.context = {ctx: this.ctx, strokes: this.strokes, paths: this.paths, cwidth: this.cwidth, cheight: this.cheight, frames: this.frames, maxframes: this.maxframes, starttime: this.starttime, color: null, plotter: this, plotterAnimationInterval: null, seed: Math.random(), baseSpeed: this.baseSpeed, baseThickness: this.baseThickness};

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        this.context.strokes.forEach(stroke => {
            stroke.forEach(point => {
                minX = Math.min(minX, point.x);
                minY = Math.min(minY, point.y);
                maxX = Math.max(maxX, point.x);
                maxY = Math.max(maxY, point.y);
            });
        });
        const offsetX = (1000 - (maxX - minX)) / 2 - minX;
        const offsetY = (1000 - (maxY - minY)) / 2 - minY;
        const sscale = this.context.cwidth / 1000;
        this.context = {...this.context, offsetX: offsetX, offsetY: offsetY, sscale: sscale};
        this.context.offsetY -= 0.035 * this.context.cheight;

        let plotter_ctx = this.context;
        if(this.animateOnClick){
            this.canvas.addEventListener('click', ()=>{console.log(plotter_ctx.baseThickness); this.animate(plotter_ctx, speedSlider);});
        }
    }

    async animate(plotter_ctx, speedSlider=null) {
        await this.readyPromise;
        cancelAnimationFrame(plotter_ctx.plotterAnimationInterval);
        plotter_ctx.seed = Math.random();
        if(speedSlider){
            this.context.baseSpeed = speedSlider.value;
        }
        animateStrokes(plotter_ctx);
    }

    async draw(speed=null){
        await this.readyPromise;
        if(speed){
            this.context.baseSpeed = speed;
        }
        drawCanvas(this.context);
    }

    getContext(color=null) {
        // await this.readyPromise;
        let context = {...this.context};
        context.seed = Math.random();
        return context;
    }


    createInvisibleHanziWriter(char, func) {
        const offScreenDiv = document.createElement('div');
        offScreenDiv.style.position = 'absolute';
        offScreenDiv.style.left = '-9999px';
        offScreenDiv.style.top = '-9999px';
        document.body.appendChild(offScreenDiv);
        var writer = HanziWriter.create(offScreenDiv, char, {
            width: 100,
            height: 100,
            onLoadCharDataSuccess: (data) => {
                const checkStrokes = (attempts = 0) => {
                    if (writer._character && writer._character.strokes) {
                        func(writer._character.strokes);
                    } else if (attempts < 10) {
                        setTimeout(() => checkStrokes(attempts + 1), 50);
                    } else {
                        console.error('Failed to load strokes after multiple attempts');
                    }
                };
                checkStrokes();
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
        return writer;
    }
}