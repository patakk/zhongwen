

const PERLIN_YWRAPB = 4;
const PERLIN_YWRAP = 1 << PERLIN_YWRAPB;
const PERLIN_ZWRAPB = 8;
const PERLIN_ZWRAP = 1 << PERLIN_ZWRAPB;
const PERLIN_SIZE = 4095;

let perlin_octaves = 4;
let perlin_amp_falloff = 0.5;

const scaled_cosine = i => 0.5 * (1.0 - Math.cos(i * Math.PI));
let perlin;

var noise = function (x, y = 0, z = 0) {
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

var noiseDetail = function (lod, falloff) {
    if (lod > 0) {
        perlin_octaves = lod;
    }
    if (falloff > 0) {
        perlin_amp_falloff = falloff;
    }
};

var noiseSeed = function (seed) {
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


function drawBg(ctx, dbg1, dbg2) {
    if (!dbg1 && !dbg2) {
        return;
    }
    ctx.save();
    ctx.lineWidth = Math.max(0.6, ctx.canvas.width / 128);
    if (isDarkMode) {
        ctx.strokeStyle = `rgba(${222},${222},${222}, .5)`;
    }
    else {
        ctx.strokeStyle = `rgba(${33},${33},${33}, .5)`;
    }
    ctx.strokeRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    if (dbg1) {
        ctx.save();
        ctx.setLineDash([6, 4]);
        if (isDarkMode) {
            ctx.strokeStyle = `rgba(${222},${222},${222}, .25)`;
        }
        else {
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
        ctx.moveTo(ctx.canvas.width / 2, 0);
        ctx.lineTo(ctx.canvas.width / 2, ctx.canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, ctx.canvas.height / 2);
        ctx.lineTo(ctx.canvas.width, ctx.canvas.height / 2);
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

    if (dbg2) {

        if (isDarkMode) {
            ctx.strokeStyle = `rgba(${111},${111},${222}, .5)`;
        }
        else {
            ctx.strokeStyle = `rgba(${222},${11},${66}, .3)`;
        }
        ctx.beginPath();
        ctx.moveTo(ctx.canvas.width / 3, 0);
        ctx.lineTo(ctx.canvas.width / 3, ctx.canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(ctx.canvas.width * 2 / 3, 0);
        ctx.lineTo(ctx.canvas.width * 2 / 3, ctx.canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, ctx.canvas.height / 3);
        ctx.lineTo(ctx.canvas.width, ctx.canvas.height / 3);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, ctx.canvas.height * 2 / 3);
        ctx.lineTo(ctx.canvas.width, ctx.canvas.height * 2 / 3);
        ctx.stroke();
    }
    ctx.restore();
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

function fix(strokes) {
    let nstrokes = strokes.map(stroke => {
        stroke = removeShortSegments(stroke, 30);
        stroke = evenOutPoints(stroke, 150);
        return stroke;
    });
    return nstrokes;
}

function power(p, g) {
    if (p < 0.5)
        return 0.5 * Math.pow(2 * p, g);
    else
        return 1 - 0.5 * Math.pow(2 * (1 - p), g);
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
        Math.hypot(newLine[i + 1].x - p.x, newLine[i + 1].y - p.y) > maxLength
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


class HanziPlotter {
    constructor({
        character,
        strokes,
        dimension = 100,
        speed = 1,
        lineThickness = 2,
        jitterAmp = 0,
        colors = ['#0f06'],
        lineType = 'miter',
        showDiagonals = false,
        showGrid = false,
        clickAnimation = true,
    }) {
        this.character = character;
        this.strokes_ = strokes;
        if (strokes) {
            this.processStrokes(strokes);
            this.loadPromise = Promise.resolve();
        } else {
            this.loadPromise = this.loadStrokeData();
        }
        this.dimension = dimension;
        this.speed = speed;
        this.seed = Math.random() * 1000;
        this.lineThickness = lineThickness;
        this.jitterAmp = jitterAmp;
        this.colors = colors;
        this.lineType = lineType;

        this.showDiagonals = showDiagonals;
        this.showGrid = showGrid;

        // Create canvas
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.dimension;
        this.canvas.height = this.dimension;
        this.canvas.style.width = this.dimension/2 + 'px';
        this.canvas.style.height = this.dimension/2 + 'px';
        this.ctx = this.canvas.getContext('2d');

        // Animation properties
        this.isAnimating = false;
        this.animationProgress = 0;
        this.animationFrame = null;

        // Bind methods
        this.clickAnimation = clickAnimation;
        if(this.clickAnimation){
            this.canvas.addEventListener('click', () => this.startAnimation());
        }
    }

    processStrokes(strokes) {
        strokes.map(stroke => {
            stroke.map(point => {
                point.x = point[0];
                point.y = 1000-point[1];
            });
        });

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        strokes.forEach(stroke => {
            stroke.forEach(point => {
                minX = Math.min(minX, point.x);
                minY = Math.min(minY, point.y);
                maxX = Math.max(maxX, point.x);
                maxY = Math.max(maxY, point.y);
            });
        });
        const offsetX = (1000 - (maxX - minX)) / 2 - minX;
        const offsetY = (1000 - (maxY - minY)) / 2 - minY;
        strokes = strokes.map(stroke => stroke.map(point => ({
            x: point.x + offsetX,
            y: point.y + offsetY
        })));

        this.strokes = fix(strokes);
        this.originalStrokes = this.strokes;
    }

    applyJitter(strokes, amplitude) {
        return strokes.map(stroke => {
            // stroke.map(point => ({
            //     x: point.x + (Math.random() * 2 - 1) * amplitude,
            //     y: point.y + (Math.random() * 2 - 1) * amplitude
            // }))
            let frq = 0.001;
            
            return stroke.map((point, idx) => {
                let factor = .1 + Math.pow(idx / stroke.length, 1);
                // Low-frequency noise
                let lowNoiseX = factor * amplitude * (2 * noise(frq * point.x, frq * point.y, this.seed + 821.31) - 1);
                let lowNoiseY = factor * amplitude * (2 * noise(frq * point.x, frq * point.y, this.seed + 912.31) - 1);
                // lowNoiseX = factor * scaleLow * (2 * noise(idx*.1, idx*.1+23, 821.31 + time*frqLow + idx*12.3) - 1);
                // lowNoiseY = .6*factor * scaleLow * (2 * noise(idx*.1, idx*.1+23, 912.31 + time*frqLow + idx*12.3) - 1);
                return {
                    x: point.x + lowNoiseX,
                    y: point.y + lowNoiseY,
                }
            });
        });
    }

    setSpeed(speed) {
        this.speed = speed;
    }

    setColors(colors) {
        this.colors = colors;
    }

    setLineThickness(thickness) {
        this.lineThickness = thickness;
    }

    async setJitterAmp(amplitude) {
        await this.loadPromise;
        this.jitterAmp = amplitude;
        this.jitteredStrokes = this.applyJitter(this.originalStrokes, this.jitterAmp);
    }

    getCanvas() {
        return this.canvas;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.dimension, this.dimension);
    }

    startAnimation() {
        // if (this.isAnimating) return;
        if(this.isAnimating){
            this.stopAnimation();
        }
        this.isAnimating = true;
        this.startTime = Date.now();
        let numPoints = 0;
        this.originalStrokes.forEach(stroke => numPoints += stroke.length);
        const duration = numPoints / this.speed ; // duration in milliseconds

        const animate = () => {
            if (!this.isAnimating) return;
    
            const elapsed = Date.now() - this.startTime;
            const progress = Math.min(elapsed / duration, 1);
    
            this.draw(progress);
    
            if (progress < 1) {
                this.animationFrame = requestAnimationFrame(animate);
            } else {
                this.isAnimating = false;
            }
        };
    
        this.animationFrame = requestAnimationFrame(animate);
    }

    stopAnimation() {
        this.isAnimating = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        this.seed = Math.random() * 1000;
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

    async draw(progress = 1) {
        await this.loadPromise;
        this.clear();
        
        drawBg(this.ctx, this.showDiagonals, this.showGrid);
        // Calculate total length of all strokes
        if (!this.totalLength) {
            this.totalLength = this.originalStrokes.reduce((total, stroke) => {
                return total + this.getStrokeLength(stroke);
            }, 0);
        }
    
        // Find which stroke we're on and its progress based on distance
        let distanceTarget = this.totalLength * progress;
        let distanceCovered = 0;
        let currentStrokeIndex = 0;
        let currentStrokeProgress = 0;
    
        for (let i = 0; i < this.originalStrokes.length; i++) {
            const strokeLength = this.getStrokeLength(this.originalStrokes[i]);
            if (distanceCovered + strokeLength > distanceTarget) {
                currentStrokeIndex = i;
                currentStrokeProgress = (distanceTarget - distanceCovered) / strokeLength;
                break;
            }
            distanceCovered += strokeLength;
            currentStrokeIndex = i;
            currentStrokeProgress = 1;
        }
    
        let strokes = this.applyJitter(this.originalStrokes, this.jitterAmp);
        this.ctx.lineCap = this.lineType;
        // this.ctx.lineJoin = this.lineType;
        if(this.colors[0]){
            this.ctx.strokeStyle = this.colors[0];
            this.ctx.lineWidth = this.lineThickness*2;
            // strokes = this.applyJitter(this.originalStrokes, this.jitterAmp+135);
            // this.drawPartial(strokes, currentStrokeIndex, currentStrokeProgress);
        }

        this.jitteredStrokes = this.applyJitter(this.originalStrokes, this.jitterAmp);
        if(this.colors[0]){
            this.ctx.strokeStyle = this.colors[0];
            this.ctx.lineWidth = this.lineThickness;
            this.drawPartial(strokes, currentStrokeIndex, currentStrokeProgress);
        }
        strokes = this.jitteredStrokes;
    
        strokes = this.applyJitter(this.originalStrokes, this.jitterAmp+111);
        // if(this.colors[2]){
            // this.ctx.strokeStyle = this.colors[2];
            // this.ctx.lineWidth = Math.max(0.5, this.lineThickness/1);
            // this.drawPartial(strokes, currentStrokeIndex, currentStrokeProgress);
        // }
    
        // for(let i = 0; i < 10; i++){
        //     strokes = this.applyJitter(this.originalStrokes, this.jitterAmp-111/2+111*i/9*(.8+.4*power(noise(i*.1, this.seed), 4)));
        //     if(this.colors[2]){
        //         this.ctx.strokeStyle = this.colors[2];
        //         this.ctx.lineWidth = Math.max(0.5, this.lineThickness/5);
        //         this.drawPartial(strokes, currentStrokeIndex, currentStrokeProgress);
        //     }
        // }
    
        strokes = this.applyJitter(this.originalStrokes, this.jitterAmp+45);
        if(isDarkMode){
            // this.ctx.strokeStyle = '#fff7';
        }
        // if(this.colors[0] == null && this.colors[2] == null){
        //     this.ctx.lineWidth = this.lineThickness/3;
        //     this.ctx.strokeStyle = this.colors[1];
        //     this.ctx.strokeStyle = "#fff5";
        //     if(parseInt(this.colors[1][2]) < 9){
        //         this.ctx.strokeStyle = "#333a";
        //         if(isDarkMode){
        //             this.ctx.strokeStyle = "#5555";
        //         }
        //     }
            // this.drawPartial(strokes, currentStrokeIndex, currentStrokeProgress);
        // }
    }
    
    getStrokeLength(stroke) {
        let length = 0;
        for (let i = 1; i < stroke.length; i++) {
            const dx = stroke[i].x - stroke[i-1].x;
            const dy = stroke[i].y - stroke[i-1].y;
            length += Math.sqrt(dx*dx + dy*dy);
        }
        return length;
    }

    drawPartial(strokes, currentStrokeIndex, currentStrokeProgress){
        for (let i = 0; i < currentStrokeIndex && i < strokes.length; i++) {
            this.drawStroke(strokes[i]);
        }
        if (currentStrokeIndex >= 0 && currentStrokeIndex < strokes.length) {
            this.drawStroke(strokes[currentStrokeIndex], currentStrokeProgress);
        }
    }

    drawStroke(stroke, progress = 1) {
        if (!stroke || stroke.length < 2) return;
    
        // Ensure progress is between 0 and 1
        progress = Math.min(1, Math.max(0, progress));
    
        this.ctx.beginPath();
    
        const scaledStroke = stroke.map(pt => ({
            x: pt.x * this.dimension / 1000,
            y: pt.y * this.dimension / 1000
        }));
    
        // Calculate how many points to draw based on progress
        const maxPoints = progress * scaledStroke.length - 1;
        
        // Start from the first point
        this.ctx.moveTo(scaledStroke[0].x, scaledStroke[0].y);
    
        // Draw bezier curves through points
        for (let i = 0; i < maxPoints; i++) {
            // Get the points needed for the bezier curve
            const p0 = i > 0 ? scaledStroke[i - 1] : scaledStroke[i];
            const p1 = scaledStroke[i];
            const p2 = scaledStroke[i + 1];
            const p3 = i < scaledStroke.length - 2 ? scaledStroke[i + 2] : p2;
    
            // Calculate control points
            const cx1 = p1.x + (p2.x - p0.x) / 6;
            const cy1 = p1.y + (p2.y - p0.y) / 6;
            const cx2 = p2.x - (p3.x - p1.x) / 6;
            const cy2 = p2.y - (p3.y - p1.y) / 6;
    
            // If this is the last segment and we're not at full progress,
            // interpolate the final point
            if (i === Math.floor(maxPoints) && maxPoints % 1 !== 0) {
                const t = maxPoints % 1;
                // Bezier interpolation
                const mt = 1 - t;
                const mt2 = mt * mt;
                const mt3 = mt2 * mt;
                const t2 = t * t;
                const t3 = t2 * t;
                
                const x = mt3 * p1.x + 
                            3 * mt2 * t * cx1 +
                            3 * mt * t2 * cx2 +
                            t3 * p2.x;
                const y = mt3 * p1.y + 
                            3 * mt2 * t * cy1 +
                            3 * mt * t2 * cy2 +
                            t3 * p2.y;
                            
                this.ctx.bezierCurveTo(cx1, cy1, cx2, cy2, x, y);
            } else {
                this.ctx.bezierCurveTo(cx1, cy1, cx2, cy2, p2.x, p2.y);
            }
            // this.ctx.fillStyle = '#000a';
            // this.ctx.fillRect(p2.x-2.1/2, p2.y-2.1/2, 2.1, 2.1);
        }
    
        this.ctx.stroke();
    }
    
    async loadStrokeData() {
        try {
            const response = await fetch(`/static/strokes_data/${this.character}.json`);
            if (!response.ok) {
                throw new Error('Network response was not ok for character:', this.character);  
            }
            const data = await response.json();
            this.processStrokes(data.medians);
        } catch (error) {
            console.error('Error loading character data:', error);
            throw error;
        }
    }

}
