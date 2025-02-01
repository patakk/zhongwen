

const PERLIN_YWRAPB = 4;
const PERLIN_YWRAP = 1 << PERLIN_YWRAPB;
const PERLIN_ZWRAPB = 8;
const PERLIN_ZWRAP = 1 << PERLIN_ZWRAPB;
const PERLIN_SIZE = 4095;

let perlin_octaves = 4; 
let perlin_amp_falloff = 0.5; 

const scaled_cosine = i => 0.5 * (1.0 - Math.cos(i * Math.PI));
let perlin;

var noise = function(x, y = 0, z = 0) {
    if (perlin == null) {
      perlin = new Array(PERLIN_SIZE + 1);
      for (let i = 0; i < PERLIN_SIZE + 1; i++) {
        perlin[i] = Math.random();
      }
    }
  
    if (x < 0) {
      x = -x;
    }
    if (y < 0) {
      y = -y;
    }
    if (z < 0) {
      z = -z;
    }
  
    let xi = Math.floor(x),
      yi = Math.floor(y),
      zi = Math.floor(z);
    let xf = x - xi;
    let yf = y - yi;
    let zf = z - zi;
    let rxf, ryf;
  
    let r = 0;
    let ampl = 0.5;
  
    let n1, n2, n3;
  
    for (let o = 0; o < perlin_octaves; o++) {
      let of = xi + (yi << PERLIN_YWRAPB) + (zi << PERLIN_ZWRAPB);
  
      rxf = scaled_cosine(xf);
      ryf = scaled_cosine(yf);
  
      n1 = perlin[of & PERLIN_SIZE];
      n1 += rxf * (perlin[(of + 1) & PERLIN_SIZE] - n1);
      n2 = perlin[(of + PERLIN_YWRAP) & PERLIN_SIZE];
      n2 += rxf * (perlin[(of + PERLIN_YWRAP + 1) & PERLIN_SIZE] - n2);
      n1 += ryf * (n2 - n1);
  
      of += PERLIN_ZWRAP;
      n2 = perlin[of & PERLIN_SIZE];
      n2 += rxf * (perlin[(of + 1) & PERLIN_SIZE] - n2);
      n3 = perlin[(of + PERLIN_YWRAP) & PERLIN_SIZE];
      n3 += rxf * (perlin[(of + PERLIN_YWRAP + 1) & PERLIN_SIZE] - n3);
      n2 += ryf * (n3 - n2);
  
      n1 += scaled_cosine(zf) * (n2 - n1);
  
      r += n1 * ampl;
      ampl *= perlin_amp_falloff;
      xi <<= 1;
      xf *= 2;
      yi <<= 1;
      yf *= 2;
      zi <<= 1;
      zf *= 2;
  
      if (xf >= 1.0) {
        xi++;
        xf--;
      }
      if (yf >= 1.0) {
        yi++;
        yf--;
      }
      if (zf >= 1.0) {
        zi++;
        zf--;
      }
    }
    return r;
  };
  
  var noiseDetail = function(lod, falloff) {
    if (lod > 0) {
      perlin_octaves = lod;
    }
    if (falloff > 0) {
      perlin_amp_falloff = falloff;
    }
  };
  
  var noiseSeed = function(seed) {
    const lcg = (() => {
      const m = 4294967296;
      const a = 1664525;
      const c = 1013904223;
      let seed, z;
      return {
        setSeed(val) {
          z = seed = (val == null ? fxrand() * m : val) >>> 0;
        },
        getSeed() {
          return seed;
        },
        rand() {
          z = (a * z + c) % m;
          return z / m;
        }
      };
    })();
  
    lcg.setSeed(seed);
    perlin = new Array(PERLIN_SIZE + 1);
    for (let i = 0; i < PERLIN_SIZE + 1; i++) {
      perlin[i] = lcg.rand();
    }
  };


function drawBg(ctx, dbg1, dbg2){
    if(!dbg1 && !dbg2){
        return;
    }
    ctx.save();
    ctx.lineWidth = Math.max(0.6, ctx.canvas.width/128);
    if(isDarkMode){
        ctx.strokeStyle = `rgba(${222},${222},${222}, .5)`;
    }
    else{
        ctx.strokeStyle = `rgba(${33},${33},${33}, .5)`;
    }
    ctx.strokeRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    if(dbg1){
        ctx.save();
        ctx.setLineDash([6, 4]);
        if(isDarkMode){
            ctx.strokeStyle = `rgba(${222},${222},${222}, .25)`;
        }
        else{
            ctx.strokeStyle = `rgba(${33},${33},${33}, .5)`;
        }
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(ctx.canvas.width, ctx.canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(ctx.canvas.width, 0);
        ctx.lineTo(0, ctx.canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(ctx.canvas.width/2, 0);
        ctx.lineTo(ctx.canvas.width/2, ctx.canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, ctx.canvas.height/2);
        ctx.lineTo(ctx.canvas.width, ctx.canvas.height/2);
        ctx.stroke();
        ctx.restore();
    }


    // ctx.beginPath();
    // ctx.moveTo(ctx.canvas.width/2, 0);
    // ctx.lineTo(ctx.canvas.width/2, ctx.canvas.height);
    // ctx.stroke();
    // ctx.beginPath();
    // ctx.moveTo(0, ctx.canvas.height/2);
    // ctx.lineTo(ctx.canvas.width, ctx.canvas.height/2);
    // ctx.stroke();

    if(dbg2){

        if(isDarkMode){
            ctx.strokeStyle = `rgba(${111},${111},${222}, .5)`;
        }
        else{
            ctx.strokeStyle = `rgba(${222},${11},${66}, .3)`;
        }
        ctx.beginPath();
        ctx.moveTo(ctx.canvas.width/3, 0);
        ctx.lineTo(ctx.canvas.width/3, ctx.canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(ctx.canvas.width*2/3, 0);
        ctx.lineTo(ctx.canvas.width*2/3, ctx.canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, ctx.canvas.height/3);
        ctx.lineTo(ctx.canvas.width, ctx.canvas.height/3);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, ctx.canvas.height*2/3);
        ctx.lineTo(ctx.canvas.width, ctx.canvas.height*2/3);
        ctx.stroke();
    }
    ctx.restore();
}

function drawStrokes(context, progressData={progress: 1, strokeIndex: Infinity}){
    let {progress, strokeIndex} = progressData;

    progress = Math.min(1, progress);
    let fac = Math.min(1., (Date.now() - context.starttime) / 555);

    // context.strokes.forEach((stroke, strokeIndex) => {
    strokeIndex = Math.min(strokeIndex, context.strokes.length-1)

    function drawLines(shorter){
        
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
    
    drawLines();

}

function prepBg(context, clear=true){
    let lw0 = context.baseThickness || 68;
    if(isMobileOrTablet()){
        lw0 = lw0*1;
    }
    let lw = lw0*context.sscale;

    // context.ctx.strokeStyle = `rgba(${233},${1},${1})`;
    // context.ctx.strokeStyle = `rgba(${255},${22},${22})`;
    // context.ctx.strokeStyle = `rgba(${66},${11},${11}, 0.8)`;

    context.ctx.lineWidth = lw;

    if(isDarkMode){
        context.ctx.strokeStyle = `rgba(${222},${222},${222}, 0.8)`;
    }

    context.ctx.lineCap = 'round';
    context.ctx.lineJoin = 'round';
    if(clear){
        context.ctx.save();
        context.ctx.fillStyle = "transparent";
        context.ctx.clearRect(0, 0, context.ctx.canvas.width, context.ctx.canvas.height);
        context.ctx.restore();
        drawBg(context.ctx, context.drawBackground, context.drawBackground2);
    
    }
}

function drawCanvas(context, clear=true) {

    // Find the bounding box of all points

    prepBg(context, clear);

        
    if(isDarkMode){
        context.ctx.strokeStyle = `rgba(${222},${222},${222}, 0.8)`;
    }

    drawStrokes(context);

    // prepBg(context, clear);
    // context.ctx.strokeStyle = `rgba(${11},${11},${66}, 0.8)`;
    // if(isDarkMode){
    //     context.ctx.strokeStyle = `rgba(${222},${222},${222}, 0.8)`;
    // }
    // context.plotter.frames++;
    // context.baseThickness = inputThickness || this.baseThickness;
    // context.noiseAmp = inputThickness || this.noiseAmp;
    // this.jitteredContext = addJitter(context, inputNoiseAmp, 0.0011);

    // drawStrokes(this.jitteredContext);
    
    let flashcard_plotter = document.getElementById('flashcard_plotter');
    
    context = fix(context)
    context.plotter.frames++;
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
    const jitteredStrokes = context.strokes.map((stroke, sidx) => {
        let seed = context.seed;
        return stroke.map((point, idx) => {
            let factor = .1+Math.pow(idx / stroke.length, 1);
            // Low-frequency noise
            let lowNoiseX = factor * scaleLow * (2 * noise(frqLow * point.x, frqLow * point.y, seed+821.31 + context.plotter.frames*21. + sidx*12.310) - 1);
            let lowNoiseY = factor * scaleLow * (2 * noise(frqLow * point.x, frqLow * point.y, seed+912.31 + context.plotter.frames*21. + sidx*12.310) - 1);
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


// # flask code
// @app.route('/get_simple_char_data')
// @session_required
// def get_simple_char_data():
//     character = request.args.get('character')
    
//     data = {}
//     if character in flashcard_app.cards[session['deck']]:
//         data = flashcard_app.get_card_examples(session['deck'], character)
//     else: # look into all decks
//         for deck_name in flashcard_app.cards:
//             if character in flashcard_app.cards[deck_name]:
//                 data = flashcard_app.get_card_examples(deck_name, character)
//                 break
//     # session['deck'] = foundDeck
//     cdata = {
//         "character": character,
//         "pinyin": data.get('pinyin', ''),
//         "english": data.get('english', ''),
//     }
    
//     return  jsonify({'message': 'success', **cdata})


async function getPinyinEnglishFor(character) {
    try {
        const response = await fetch(`./get_simple_char_data?character=${encodeURIComponent(character)}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}

function bbb(context, {progress, strokeIndex}= {progress: 1, strokeIndex: Infinity}){
    
    context.plotter.frames = 111;
    let tempc1 = addJitter(context, context.inputNoiseAmp, 0.00001);
    tempc1.ctx.strokeStyle = `rgba(${111},${3},${3}, 0.5)`;

    prepBg(tempc1, true);
    if(isDarkMode){
        tempc1.ctx.strokeStyle = `rgba(${222},${222},${222}, 0.8)`;
    }
    drawStrokes(tempc1, {progress, strokeIndex});

    
    context.plotter.frames = 111;
    tempc1 = addJitter(tempc1, 45, 0.00001);
    tempc1.ctx.strokeStyle = `rgba(${3},${3},${122}, 0.5)`;

    prepBg(tempc1, false);
    if(isDarkMode){
        tempc1.ctx.strokeStyle = `rgba(${222},${222},${222}, 0.8)`;
    }
    drawStrokes(tempc1, {progress, strokeIndex});

}

class HanziPlotter {
    constructor({char, size=256, animateOnClick=false, baseSpeed=2, speedSlider=null, baseThickness=66, noiseAmp=66, drawBackground=false, drawBackground2=false, lineIndex=0, createPinyinElement=true}) {
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

        this.canvas = document.createElement('canvas');
        this.canvas.width = this.cwidth;
        this.canvas.height = this.cheight;
        this.canvas.style.width = this.cwidth/2 + 'px';
        this.canvas.style.height = this.cheight/2 + 'px';
        this.canvas.classList.add('plotter');
        this.canvas.dataset.character = char;

        let plotterref = this;

        this.lineIndex = lineIndex;

        this.canvasContainer = document.createElement('div');
        this.canvasContainer.style.position = 'relative';
        this.canvasContainer.style.display = 'inline-block';
        this.canvasContainer.classList.add('plotterContainer');

        this.canvasContainer.classList.add('line_'+this.lineIndex);
        
        // Create pinyin element
        if(createPinyinElement){
            this.pinyinElement = document.createElement('div');
            this.pinyinElement.style.textAlign = 'center';
            this.pinyinElement.style.height = '20px';
            // this.pinyinElement.style.visibility = 'visible';
            if(!showAllPinyin){
                this.pinyinElement.classList.add('hidden');
            }
            this.pinyinElement.classList.add('pinyinLabel');
            this.pinyinElement.classList.add('line_'+this.lineIndex);
            
            this.canvasContainer.appendChild(this.pinyinElement);
        }
        this.canvasContainer.appendChild(this.canvas);
        
        if(typeof dataPerCharacter === 'undefined'){
            this.readyPromise = this.loadStrokeData();
            if(createPinyinElement){
                console.log('loading data for', char);
                this.loadPinyinEnglish();
            }
        }
        else{
            if(char in dataPerCharacter){
                this.strokes = dataPerCharacter[char].strokes.medians.map(stroke => {
                    stroke.map(point => {
                        point.x = point[0];
                        point.y = point[1];
                    });
                    let spoints = evenOutPoints(stroke, 22);
                    return spoints;
                });
                if(createPinyinElement){
                    this.pinyinAndEnglish = {pinyin: dataPerCharacter[char].pinyin, english: null};
                    if (this.pinyinAndEnglish && this.pinyinAndEnglish.pinyin) {
                        this.pinyinElement.textContent = this.pinyinAndEnglish.pinyin;
                    }
                }
            }
            else{
                this.readyPromise = this.loadStrokeData();
                if(createPinyinElement){
                    console.log('loading data for', char);
                    this.loadPinyinEnglish();
                }
            }
        }

        this.ctx = this.canvas.getContext('2d');
        this.animateOnClick = animateOnClick;
        this.baseSpeed = baseSpeed;
        this.baseThickness = baseThickness;
        this.noiseAmp = noiseAmp;
        this.drawBackground = drawBackground;
        this.drawBackground2 = drawBackground2;
        this.prepare(speedSlider);
    }

    async loadPinyinEnglish() {
        try {
            this.pinyinAndEnglish = await getPinyinEnglishFor(this.char);
            
            if (this.pinyinAndEnglish && this.pinyinAndEnglish.pinyin) {
                this.pinyinElement.textContent = this.pinyinAndEnglish.pinyin;
            }
        } catch (error) {
            console.error('Error getting pinyin and English:', error);
        }
    }

    async prepare(speedSlider=null) {
        await this.readyPromise;

        this.context = {ctx: this.ctx, strokes: this.strokes, paths: this.paths, cwidth: this.cwidth, cheight: this.cheight, frames: this.frames, maxframes: this.maxframes, starttime: this.starttime, color: null, plotter: this, plotterAnimationInterval: null, seed: Math.random(), baseSpeed: this.baseSpeed, baseThickness: this.baseThickness, noiseAmp: this.noiseAmp, drawBackground: this.drawBackground, drawBackground2: this.drawBackground2, lineIndex: this.lineIndex};

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

        let theplotter = this;
        if(this.animateOnClick){
            this.canvas.addEventListener('click', ()=>{this.animate(theplotter.getContext(), speedSlider);});
        }


    }

    async animate(plotter_ctx, speedSlider=null) {
        await this.readyPromise;
        cancelAnimationFrame(plotter_ctx.plotterAnimationInterval);
        plotter_ctx.seed = Math.random()*1000;
        if(speedSlider){
            plotter_ctx.baseSpeed = speedSlider.value;
        }
        this.animateStrokes(plotter_ctx);
    }

    
    animateStrokes(context) {
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

        function lanimate() {
            let currentTime = Date.now();
            let elapsedTime = currentTime - startTime;
            let currentStroke = context.strokes[strokeIndex];
            let strokeLength = calculateStrokeLength(currentStroke);
            let strokeDuration = (strokeLength / totalLength) * (totalLength / baseSpeed);
            
            progress = Math.min(1, elapsedTime / strokeDuration);
            // context.ctx.save();
            // context.ctx.fillStyle = "transparent";
            // context.ctx.clearRect(0, 0, context.ctx.canvas.width, context.ctx.canvas.height);
            // context.ctx.restore();
            // prepBg(context);
            // drawStrokes(context, {progress, strokeIndex});
            
            
            // prepBg(context, true);
            // context.ctx.strokeStyle = `rgba(${66},${11},${11}, 0.8)`;
            // let tempc = addJitter(context, context.inputNoiseAmp, 0.0011);
            // drawStrokes(tempc, {progress, strokeIndex});

            bbb(context, {progress, strokeIndex});
            
            if (progress >= 1) {
                strokeIndex++;
                if (strokeIndex < context.strokes.length) {
                    startTime = currentTime;
                    progress = 0;
                    context.plotterAnimationInterval = requestAnimationFrame(lanimate);
                }
            } else if (strokeIndex < context.strokes.length) {
                context.plotterAnimationInterval = requestAnimationFrame(lanimate);
            }
        }
        context.plotter.frames = 0;

        lanimate();
    }

    async draw(inputThickness=null, inputNoiseAmp=0) {
        await this.readyPromise;
        this.context.inputNoiseAmp = inputNoiseAmp;
        bbb(this.context);


        // ;
        // // this.context = addJitter(this.context, inputNoiseAmp, 0.0011);
        // this.context.plotter.frames++;
        // this.context.baseThickness = inputThickness || this.baseThickness;
        // this.context.noiseAmp = inputThickness || this.noiseAmp;
        // let tempc1 = addJitter(this.context, inputNoiseAmp, 0.0011);
        // tempc1.ctx.strokeStyle = `rgba(${77},${3},${3}, 0.5)`;
        // drawCanvas(tempc1, true);
        
        // tempc1.plotter.frames++;
        // tempc1 = addJitter(tempc1, inputNoiseAmp*1.5, 0.0011);
        // tempc1.ctx.strokeStyle = `rgba(${11},${11},${88}, 0.5)`;
        // drawCanvas(tempc1, false);
        // this.jitteredContext = tempc1;
        // prepBg(tempContext);
        // drawStrokes(tempContext);
    }

    async ddraw(inputThickness=null, noiseAmp=0) {
        await this.readyPromise;
        
        // this.context = fix(this.context)
        // 
        // this.context.baseThickness = 22;
        // let tempContext = addJitter(this.context, 133, 0.0011);
        // prepBg(tempContext);
        // drawStrokes(tempContext);
    }

    getContext(color=null) {
        // await this.readyPromise;
        let context = {...this.context};
        context.seed = Math.random();
        return context;
    }

    getJitteredContext(color=null) {
        // await this.readyPromise;
        let context = {...this.jitteredContext};
        context.seed = Math.random();
        return context;
    }

    async loadStrokeData() {
        try {
            const response = await fetch(`/static/strokes_data/${this.char}.json`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            let data = await response.json();
            this.strokes = data.medians.map(stroke => {
                stroke.map(point => {
                    point.x = point[0];
                    point.y = point[1];
                });
                let spoints = evenOutPoints(stroke, 22);
                return spoints;
            });
        } catch (error) {
            console.error('Error loading character data:', error);
            throw error;
        }
    }
}