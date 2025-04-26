const PERLIN_YWRAPB = 4;
const PERLIN_YWRAP = 1 << PERLIN_YWRAPB;
const PERLIN_ZWRAPB = 8;
const PERLIN_ZWRAP = 1 << PERLIN_ZWRAPB;
const PERLIN_SIZE = 4095;

let perlin_octaves = 4;
let perlin_amp_falloff = 0.5;

const scaled_cosine = i => 0.5 * (1.0 - Math.cos(i * Math.PI));
let perlin;

let isDarkMode = false;
        
function isMobileOrTablet() {
    let check = false;
    (function (a) { if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true; })(navigator.userAgent || navigator.vendor || window.opera);
    return check || /iPad|iPhone|iPod/.test(navigator.platform) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

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


function drawBg(ctx, dbg1, dbg2, lineType, writerSize, colors) {
    if (!dbg1 && !dbg2) {
        return;
    }
    ctx.save();
    ctx.lineWidth = Math.max(0.6, ctx.canvas.width / 128)*.6;
    ctx.strokeStyle = colors[1];
    ctx.strokeStyle = `rgba(${111},${111},${111}, .215)`;
    ctx.strokeRect(2, 2, ctx.canvas.width-4, ctx.canvas.height-4);

    if (dbg1) {
        ctx.save();
        ctx.lineCap = lineType;
        ctx.lineJoin = lineType;
        let d1 = 25;
        let k = 16;
        let d2 = (writerSize - d1*k) / (k-1);
        let dd2 = (writerSize*Math.sqrt(2) - d1*k) / (k-1);
        let q1 = 25;
        let w = Math.round(17*Math.sqrt(2)/2)*2-1;
        let q2 = (writerSize - q1*w) / (w-1);
        let qq2 = (writerSize*Math.sqrt(2) - q1*w) / (w-1);
        // ctx.setLineDash([d1, d2]);
        ctx.strokeStyle = `rgba(${111},${111},${111}, .215)`;
        // ctx.setLineDash([q1, qq2]);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(ctx.canvas.width, ctx.canvas.height);
        // ctx.setLineDash([q1, qq2]);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(ctx.canvas.width, 0);
        ctx.lineTo(0, ctx.canvas.height);
        ctx.stroke();
        // ctx.setLineDash([d1, d2]);
        ctx.beginPath();
        ctx.moveTo(ctx.canvas.width / 2, 0);
        ctx.lineTo(ctx.canvas.width / 2, ctx.canvas.height);
        ctx.stroke();
        // ctx.setLineDash([d1, d2]);
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

        ctx.strokeStyle = colors[1];
        ctx.beginPath();
        ctx.lineCap = lineType;
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

function smoothCurve(line, smoothFactor = 0.5) {
    let smoothed = [line[0]]; // Always keep the first point

    for (let i = 1; i < line.length - 1; i++) {
        let prev = line[i - 1];
        let curr = line[i];
        let next = line[i + 1];

        // Apply a simple smoothing algorithm (weighted average)
        let smoothedPoint = {
            x: curr.x + smoothFactor * (prev.x + next.x - 2 * curr.x),
            y: curr.y + smoothFactor * (prev.y + next.y - 2 * curr.y)
        };

        smoothed.push(smoothedPoint);
    }

    smoothed.push(line[line.length - 1]); // Always keep the last point
    return smoothed;
}

function subdivideCurve(line, divisions = 2) {
    let subdivided = [];

    for (let i = 0; i < line.length - 1; i++) {
        let p1 = line[i];
        let p2 = line[i + 1];

        subdivided.push(p1);

        // Insert additional points between p1 and p2
        for (let j = 1; j <= divisions; j++) {
            let t = j / (divisions + 1);
            let x = p1.x + t * (p2.x - p1.x);
            let y = p1.y + t * (p2.y - p1.y);

            subdivided.push({ x, y });
        }
    }

    subdivided.push(line[line.length - 1]); // Always keep the last point
    return subdivided;
}


function fix(strokes) {
    let nstrokes = strokes.map(stroke => {
        stroke = removeShortSegments(stroke, 30);
        stroke = subdivideCurve(stroke, 4); // Subdivide the curve
        stroke = smoothCurve(stroke, 0.5); // Apply smoothing
        // let length = calculatePolylineLength(stroke).totalLength;
        // let numPoints = Math.min(10, Math.floor(length / 30));
        // stroke = resamplePolyline(stroke, numPoints);
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

function calculatePolylineLength(line) {
    let totalLength = 0;
    let segmentLengths = [];
    for (let i = 0; i < line.length - 1; i++) {
        let p1 = line[i];
        let p2 = line[i + 1];
        let dx = p2.x - p1.x;
        let dy = p2.y - p1.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        totalLength += distance;
        segmentLengths.push(distance);
    }
    return { totalLength, segmentLengths };
}


function getPointAtPercentage(line, percentage) {
    let polylen = calculatePolylineLength(line);
    let totalLength = polylen.totalLength;
    let segmentLengths = polylen.segmentLengths;

    let targetLength = totalLength * percentage;
    let accumulatedLength = 0;
    for (let i = 0; i < segmentLengths.length; i++) {
        accumulatedLength += segmentLengths[i];
        if (accumulatedLength >= targetLength) {
            let p1 = line[i];
            let p2 = line[i + 1];
            let remainingLength = targetLength - (accumulatedLength - segmentLengths[i]);
            let t = remainingLength / segmentLengths[i];
            return {
                x: p1.x + t * (p2.x - p1.x),
                y: p1.y + t * (p2.y - p1.y)
            };
        }
    }
    return line[line.length - 1];
}


function resamplePolyline(line, numPoints) {
    let resampledLine = [];
    for (let i = 0; i < numPoints; i++) {
        let percentage = i / (numPoints - 1);
        let point = getPointAtPercentage(line, percentage);
        resampledLine.push(point);
    }
    return resampledLine;
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

function drawMask(maskRegion, pathData, offX = 0, offY = 0, dimension=800) {
    // Normalize the path data first to ensure consistent spacing
    pathData = pathData.replace(/([A-Za-z])/g, ' $1 ')
                 .replace(/\s+/g, ' ')
                 .trim();
    const commands = pathData.split(' ');
    let x = 0, y = 0;   // Current position
    let startX = 0, startY = 0;  // Start position for 'z' command
    
    let i = 0;
    while (i < commands.length) {
      const cmd = commands[i++];
      
      // Skip empty elements
      if (!cmd) continue;
      
      switch (cmd.toUpperCase()) {
        case 'M': // moveto
          startX = x = parseFloat(commands[i++]);
          startY = y = parseFloat(commands[i++]);
          x = x/1000*dimension + offX*dimension/1000;
          y = dimension - y/1000*dimension + offY*dimension/1000;
          maskRegion.moveTo(x, y);
          
          // In SVG, after a moveto, subsequent coordinate pairs are treated as implicit lineto commands
          while (i < commands.length && !isNaN(parseFloat(commands[i]))) {
            x = parseFloat(commands[i++]);
            y = parseFloat(commands[i++]);
            x = x/1000*dimension + offX*dimension/1000;
            y = dimension - y/1000*dimension + offY*dimension/1000;
            maskRegion.lineTo(x, y);
          }
          break;
          
        case 'L': // lineto
          while (i < commands.length && !isNaN(parseFloat(commands[i]))) {
            x = parseFloat(commands[i++]);
            y = parseFloat(commands[i++]);
            x = x/1000*dimension + offX*dimension/1000;
            y = dimension - y/1000*dimension + offY*dimension/1000;
            maskRegion.lineTo(x, y);
          }
          break;
          
        case 'Q': // quadratic curve
          while (i + 3 < commands.length && !isNaN(parseFloat(commands[i]))) {
          const cx = parseFloat(commands[i++]);
            const cy = parseFloat(commands[i++]);
            x = parseFloat(commands[i++]);
            y = parseFloat(commands[i++]);
            const scaledCx = cx/1000*dimension + offX*dimension/1000;
            const scaledCy = dimension - cy/1000*dimension + offY*dimension/1000;
            const scaledX = x/1000*dimension + offX*dimension/1000;
            const scaledY = dimension - y/1000*dimension + offY*dimension/1000;
            maskRegion.quadraticCurveTo(scaledCx, scaledCy, scaledX, scaledY);
        }
          break;
          
        case 'C': // cubic curve
          while (i + 5 < commands.length && !isNaN(parseFloat(commands[i]))) {
            const cx1 = parseFloat(commands[i++]);
            const cy1 = parseFloat(commands[i++]);
            const cx2 = parseFloat(commands[i++]);
            const cy2 = parseFloat(commands[i++]);
            x = parseFloat(commands[i++]);
            y = parseFloat(commands[i++]);
            const scaledCx1 = cx1/1000*dimension + offX*dimension/1000;
            const scaledCy1 = dimension - cy1/1000*dimension + offY*dimension/1000;
            const scaledCx2 = cx2/1000*dimension + offX*dimension/1000;
            const scaledCy2 = dimension - cy2/1000*dimension + offY*dimension/1000;
            const scaledX = x/1000*dimension + offX*dimension/1000;
            const scaledY = dimension - y/1000*dimension + offY*dimension/1000;
            maskRegion.bezierCurveTo(scaledCx1, scaledCy1, scaledCx2, scaledCy2, scaledX, scaledY);
          }
          break;
          
        case 'Z': // closepath
          maskRegion.closePath();
          x = startX;
          y = startY;
          break;
          
        default:
          // If we encounter a command we don't recognize, it's safer to stop or log an error
          console.warn(`Unrecognized SVG path command: ${cmd}`);
          break;
      }
    }
  }
  



const IDLE = 'idle';
const ANIMATING = 'animating';
const QUIZ = 'quiz';
const ANIMATING_STROKE = 'animating_stroke';


export default class HanziPlotter {
    constructor({
        character,
        strokes,
        masks,
        dimension = 100,
        speed = 1,
        lineThickness = 2,
        jitterAmp = 0,
        colors = ['#0f0'],
        lineType = "round",
        showDiagonals = false,
        showGrid = false,
        state = IDLE,
        clickAnimation = true,
        clearBackground = true,
        useMask = false,
        canvas = null,
        blendMode = 'normal',
    }) {
        this.character = character;
        this.strokes_ = strokes;
        this.masks_ = masks;
        this.dimension = dimension;
        this.speed = speed;
        this.seed = Math.random() * 1000;
        this.lineThickness = lineThickness;
        this.jitterAmp = jitterAmp;
        this.colors = colors;
        this.lineType = lineType;
        this.clickAnimation = clickAnimation;
        this.strokeAttempts = 0;
        this.state = state;
        this.clearBackground = clearBackground;
        this.loadPromise = null;
        this.blendMode = blendMode;

        this.demoMode = false;

        this.useMask = useMask;
        this.userStrokes = [];
        this.currentStroke = null;
        this.isDrawing = false;
        this.quizComplete = false;
        this.isQuizing = false;
        this.isDestroyed = false;

        this.mouseDownWhileQuizing = false;

        this.showDiagonals = showDiagonals;
        this.showGrid = showGrid;
        this.clickListener = null;
        
        this.lastX = null;
        this.lastY = null;
        this.easingFactor = 0.4;
        
        if(canvas){
            this.canvas = canvas;
            this.ctx = this.canvas.getContext('2d');
        }else{
            this.canvas = document.createElement('canvas');
            this.canvas.width = this.dimension;
            this.canvas.height = this.dimension;
            this.canvas.style.width = this.dimension/2 + 'px';
            this.canvas.style.height = this.dimension/2 + 'px';
            this.ctx = this.canvas.getContext('2d');
        }
        this.init();
    }

    replaceStrokes(character, strokes, masks) {
        this.character = character;
        this.strokes_ = strokes;
        this.masks_ = masks;
        this.totalLength = null;
        this.init();
    }

    init() {
        this.originalStrokes = undefined;
        if (this.strokes_) {
            this.processStrokes(this.strokes_);
            this.processMasks(this.masks_);
            this.setupDrawingEvents();
            this.isAnimating = false;
            this.isAnimatingStroke = false;
            this.isAnimatingInterp = false;
            this.animationProgress = 0;
            this.animationFrame = null;
            this.loadPromise = Promise.resolve();
        } else {
            this.loadPromise = this.loadStrokeData(this.onDataReady.bind(this));
        }
    }   

    processMasks(masks){
        this.masks_ = masks;
    }

    onDataReady(){
        if(this.data === undefined || this.data === null){
            return;
        }
        this.processStrokes(this.data.medians);
        this.processMasks(this.data.strokes);
        this.setupDrawingEvents();

        // Animation properties
        this.isAnimating = false;
        this.isAnimatingStroke = false;
        this.isAnimatingInterp = false;
        this.animationProgress = 0;
        this.animationFrame = null;

        if(this.clickAnimation){
            if(isMobileOrTablet()){
                this.clickListener = this.canvas.addEventListener('touchstart', this.startAnimation.bind(this));
            }
            else{
                this.clickListener = this.canvas.addEventListener('click', this.startAnimation.bind(this));
            }
        }

    }

    destroyy() {
        this.canvas.removeEventListener('click', this.startAnimation);
        this.isDestroyed = true;
        // check event listeners
        cancelAnimationFrame(this.animationFrame);
        this.animationFrame = null;
        this.isAnimating = false;
        //remove all click event listeners on canvas

    }

    setupDrawingEvents() {
        // Mouse events
        this.canvas.addEventListener('mousedown', this.startUserDrawing.bind(this));
        this.canvas.addEventListener('mousemove', this.userStrokeMove.bind(this));
        this.canvas.addEventListener('mouseup', this.userStrokeEnded.bind(this));
        this.canvas.addEventListener('mouseout', this.userStrokeEnded.bind(this));

        // Touch events
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
    }

    setState(state) {
        console.log('Transitioning from', this.state, 'to', state);
        
    }

    handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        this.canvas.dispatchEvent(mouseEvent);
    }
    
    handleTouchMove(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        this.canvas.dispatchEvent(mouseEvent);
    }
    
    handleTouchEnd(e) {
        e.preventDefault();
        const mouseEvent = new MouseEvent('mouseup', {});
        this.canvas.dispatchEvent(mouseEvent);
    }
    
    startUserDrawing(e) {
        if (!this.isQuizing) return;
        if (this.isAnimatingStroke) return;
        if (this.isAnimatingInterp) return;

        this.mouseDownWhileQuizing = true;
        
        this.isDrawing = true;
        this.currentStroke = [];
        
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (this.canvas.height / rect.height);
        
        this.lastX = x;
        this.lastY = y;
        
        this.currentStroke.push({ x, y });
        this.drawUserStrokes();
    }
    
    userStrokeMove(e) {
        if (!this.isDrawing || !this.isQuizing) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const rawX = (e.clientX - rect.left) * (this.canvas.width / rect.width);
        const rawY = (e.clientY - rect.top) * (this.canvas.height / rect.height);
        
        // Apply simple smoothing formula
        const x = this.lastX + (rawX - this.lastX) * this.easingFactor;
        const y = this.lastY + (rawY - this.lastY) * this.easingFactor;
        
        // Update last position
        this.lastX = x;
        this.lastY = y;
        
        this.currentStroke.push({ x, y });
        this.drawUserStrokes();
    }
    
    compareToReal(userStroke, realStroke) {
        const scaledRealStroke = realStroke.map(pt => ({
            x: pt.x / 1000,
            y: pt.y / 1000,
        }));
        const scaledUserStroke = userStroke.map(pt => ({
            x: pt.x / this.dimension,
            y: pt.y / this.dimension,
        }));
    
        // Get the vector from the first to the last point for both strokes
        const realVector = {
            x: scaledRealStroke[scaledRealStroke.length - 1].x - scaledRealStroke[0].x,
            y: scaledRealStroke[scaledRealStroke.length - 1].y - scaledRealStroke[0].y
        };
    
        const userVector = {
            x: scaledUserStroke[scaledUserStroke.length - 1].x - scaledUserStroke[0].x,
            y: scaledUserStroke[scaledUserStroke.length - 1].y - scaledUserStroke[0].y
        };
    
        // Normalize the vectors
        const normalize = (vector) => {
            const length = Math.hypot(vector.x, vector.y);
            return { x: vector.x / length, y: vector.y / length };
        };
    
        const normalizedRealVector = normalize(realVector);
        const normalizedUserVector = normalize(userVector);
    
        const dotProduct = normalizedRealVector.x * normalizedUserVector.x + normalizedRealVector.y * normalizedUserVector.y;
    
    
        // Check if the first points are relatively close
        const distFirst = Math.hypot(scaledUserStroke[0].x - scaledRealStroke[0].x, scaledUserStroke[0].y - scaledRealStroke[0].y);
        const firstPointThreshold = 0.35;
    
        // Check if the length of the user stroke is within 10% of the real stroke
        const realLength = Math.hypot(realVector.x, realVector.y);
        const userLength = Math.hypot(userVector.x, userVector.y);
        const lengthThreshold = 0.5; // 10% difference allowed
    
        const lengthRatio = Math.abs(userLength - realLength) / realLength;
    
        const threshold = 0.8; // Cosine similarity threshold for direction comparison

        if(dotProduct < threshold){
            console.log('dot product failed');
        }
        else{
        }
        if(distFirst > firstPointThreshold){
            console.log('distFirst failed');
        }
        else{
        }
        if(realLength < 0.16)
            return dotProduct > threshold && distFirst < firstPointThreshold;
        if(lengthRatio > lengthThreshold){
            console.log('lengthRatio failed');
        }
        return dotProduct > threshold && distFirst < firstPointThreshold && lengthRatio < lengthThreshold;
    }
    
    
    startStrokeAnimation() {
        if(!this.isQuizing){
            return;
        }
        this.isAnimatingStroke = true;
        this.strokeStartTime = Date.now();
        let numPoints = this.strokes[this.userStrokes.length].length;
        const duration = numPoints / this.speed * 1; // duration in milliseconds
        const animate = () => {
    
            const elapsed = Date.now() - this.strokeStartTime;
            const progress = Math.min(elapsed / duration, 1);
    
            this.clearBg();
            this.drawUserStrokes();

            this.ctx.save();
            this.ctx.lineCap = this.lineType;
            this.ctx.lineJoin = this.lineType;
            this.ctx.strokeStyle = this.colors[0];
            this.ctx.lineWidth = this.lineThickness * 1.24;
            if(isDarkMode){
                this.ctx.strokeStyle = this.colors[1];
            }
            this.drawStroke(this.strokes[this.userStrokes.length], progress);

            this.ctx.restore();

    
            if (progress < 1) {
                this.strokeAnimationFrame = requestAnimationFrame(animate);
            } else {
                cancelAnimationFrame(this.strokeAnimationFrame);
                this.clearBg();
                this.isAnimatingStroke = false;
                this.drawUserStrokes(false);
            }

        };
        
        this.clearBg();
        this.strokeAnimationFrame = requestAnimationFrame(animate);
    }

    restartQuiz() {
        this.userStrokes = [];
        this.currentStroke = null;
        this.strokeAttempts = 0;
        this.quizComplete = false;
        this.quiz({onComplete: this.onCompleteQuiz});
    }
    
    userStrokeEnded() {
        if (!this.isDrawing || !this.isQuizing) return;
        if (this.userStrokes.length >= this.strokes.length) return;

        
        this.isDrawing = false;
        if (this.currentStroke && this.currentStroke.length > 0) {
            const isGoodMatch = this.compareToReal(this.currentStroke, this.strokes[this.userStrokes.length]);
            // Provide feedback based on match
            if (isGoodMatch) {
                console.log("Good stroke!");
                
                let resampled = resamplePolyline(this.currentStroke, this.strokes[this.userStrokes.length].length);
                // this.userStrokes.push(resampled);
                
                const scaledRealStroke = this.strokes[this.userStrokes.length].map(pt => ({
                    x: pt.x / 1000 * this.dimension,
                    y: pt.y / 1000 * this.dimension,
                }));
                this.userStrokes.push(scaledRealStroke);
                this.strokeAttempts = 0;
            } else if (this.strokeAttempts < 2) {
                console.log("Try again");
                this.strokeAttempts++;
            } else {
                console.log("Demoing stroke");
                // You could show a hint or the correct stroke here
                this.strokeAttempts++;
                this.startStrokeAnimation();
                this.isAnimatingStroke = true;
            }
            
            // Check if quiz is complete
            if (this.userStrokes.length === this.strokes.length) {
                console.log("Quiz complete!");
                // Handle quiz completion
                this.quizComplete = true;
                this.clearBg();
                // this.draw(1, false, () => {this.drawUserStrokes(false, false);});
                // this.drawUserStrokes(false, false);
                // this.draw(1, false);
                this.demoMode = false;
                cancelAnimationFrame(this.demoAnimationFrame);
                this.startInterpol();
                //     setTimeout(() => {
                //     this.isQuizing = false;
                // }, 1777);
                this.onCompleteQuiz({'strokes': this.userStrokes, 'character': this.character});
            }
            this.currentStroke = null;
        }
        if(!this.quizComplete){
            this.drawUserStrokes();
        }
        // this.drawUserStrokes();
    }

    helpMode(){
        if(this.quizComplete)
            return;
        this.demoMode = true;

        let oalpha = 0.5;
        const anim = () => {
            this.clearBg(oalpha);
            oalpha -= 0.004;
            if(oalpha > 0){
                this.demoAnimationFrame = requestAnimationFrame(anim);
            }
        }
        this.demoAnimationFrame = requestAnimationFrame(anim);
    }

    startInterpol(){
        this.isAnimatingInterp = true;
        console.log("this.userStrokes.length");
        console.log("this.strokes.length");
        console.log(this.userStrokes.length);
        console.log(this.strokes.length);
        // let resampleUserStrokes = this.userStrokes.map((stroke, sidx) => {
        //         let numPts = this.strokes[sidx].length;
        //         return resamplePolyline(stroke, numPts);
        //     }
        // );
        let resampleUserStrokes = this.userStrokes;

        let factor = 0.0;
        let frame = 0.0;

        const aanim = () => {
            frame++;
            factor = .5 + Math.cos(frame / 50 * Math.PI) * 0.5;
            let interpolatedStrokes = this.strokes.map((stroke, sidx) => {
                let interpolated = stroke.map((point, pidx) => {
                    let userPoint = resampleUserStrokes[sidx][pidx];
                    return {
                        x: userPoint.x * factor * 1000 / this.dimension + point.x * (1 - factor),
                        y: userPoint.y * factor * 1000 / this.dimension + point.y * (1 - factor),
                    };
                });
                return interpolated;
            });

            let interlength = interpolatedStrokes.reduce((total, stroke) => {
                return total + this.getStrokeLength(stroke);
            }, 0);

            this.draw({ progress: 1, clearbg: true, onDrawComplete: null, alpha: 1, strokes_in: interpolatedStrokes, strokes_in_length: interlength });
            this.interpAnimFrame = requestAnimationFrame(aanim);

           if(frame==50){
                cancelAnimationFrame(this.interpAnimFrame);
                this.clearBg();
                this.isAnimatingInterp = false;
            }
           if(frame==40){
                this.isQuizing = false;
            }
        }

        aanim();
    }


    
    
    drawUserStrokes(clearbg=true, drawFake=false) {
        if (!this.isQuizing) return;
        
        if(clearbg)
            this.clearBg();
        
        // Set stroke style for user drawing
        this.ctx.save();
        this.ctx.strokeStyle = this.colors[2];
        if(isDarkMode){
            this.ctx.strokeStyle = this.colors[3];
        }
        this.ctx.lineWidth = this.lineThickness;
        this.ctx.lineCap = this.lineType;
        // this.ctx.lineJoin = 'round';
        
        // Draw all completed strokes
        //for (const stroke of this.userStrokes) {
        if(drawFake){
            this.ctx.save();
            this.ctx.lineCap = this.lineType;
            this.ctx.lineJoin = this.lineType;
            this.ctx.strokeStyle = this.colors[0];
            this.ctx.lineWidth = this.useMask
              ? this.lineThickness * 6
              : this.lineThickness * 1;
            if(isDarkMode){
                this.ctx.strokeStyle = this.colors[1];
            }

            for (let idx = 0; idx < this.userStrokes.length; idx++) {
                const stroke = this.strokes[idx];
    
                if (stroke.length < 2) continue;
                
                if (this.useMask && this.masks_ && idx < this.masks_.length) {
                    this.ctx.save();
                    let maskregion = new Path2D();
                    drawMask(maskregion, this.masks_[idx], this.offsetX, this.offsetY, this.dimension);
                    this.ctx.clip(maskregion);
                }
                
                this.ctx.beginPath();
                this.ctx.moveTo(stroke[0].x/1000*this.dimension, stroke[0].y/1000*this.dimension);
                
                for (let i = 1; i < stroke.length; i++) {
                    this.ctx.lineTo(stroke[i].x/1000*this.dimension, stroke[i].y/1000*this.dimension);
                }
                
                this.ctx.stroke();
                
                if (this.useMask && this.masks_ && idx < this.masks_.length) {
                    this.ctx.restore();
                }
            }
            this.ctx.restore();
        }
        else{
            this.ctx.save();
            this.ctx.strokeStyle = this.colors[0];
            this.ctx.lineWidth = this.lineThickness * .5;
            this.ctx.lineWidth = this.lineThickness * 1.24;
            // this.ctx.globalAlpha = 0.6;
            this.ctx.lineWidth = this.useMask
            ? this.lineThickness * 6
            : this.lineThickness * 1;
            if(isDarkMode){
                this.ctx.strokeStyle = this.colors[1];
                // this.ctx.globalAlpha = 0.64;
            }
                console.log(this.colors[1]);
                // replace alpha with 88
            for (let idx = 0; idx < this.userStrokes.length; idx++) {
                const stroke = this.userStrokes[idx];
    
                if (stroke.length < 2) continue;
                
                if (this.useMask && this.masks_ && idx < this.masks_.length) {
                    this.ctx.save();
                    let maskregion = new Path2D();
                    drawMask(maskregion, this.masks_[idx], this.offsetX, this.offsetY, this.dimension);
                    this.ctx.clip(maskregion);
                }
                
                this.ctx.beginPath();
                this.ctx.moveTo(stroke[0].x, stroke[0].y);
                
                for (let i = 1; i < stroke.length; i++) {
                    this.ctx.lineTo(stroke[i].x, stroke[i].y);
                }
                
                this.ctx.stroke();
                
                if (this.useMask && this.masks_ && idx < this.masks_.length) {
                    this.ctx.restore();
                }
            }
            this.ctx.restore();
        }
        
        // Draw the current stroke being drawn - without masking
        if (this.currentStroke && this.currentStroke.length > 1 && this.quizComplete === false) {
            this.ctx.save();
            this.ctx.lineCap = this.lineType;
            this.ctx.lineJoin = this.lineType;
            this.ctx.strokeStyle = this.colors[2];
            if(isDarkMode){
                this.ctx.strokeStyle = this.colors[3];
            }
            this.ctx.lineWidth = this.lineThickness * 1;
            this.ctx.lineWidth = this.lineThickness * 1;
            
            // No masking for current stroke being drawn
            this.ctx.beginPath();
            this.ctx.moveTo(this.currentStroke[0].x, this.currentStroke[0].y);
            
            for (let i = 1; i < this.currentStroke.length; i++) {
                this.ctx.lineTo(this.currentStroke[i].x, this.currentStroke[i].y);
            }
            
            this.ctx.stroke();
            this.ctx.restore();
        }
        this.ctx.restore();
    }
    
    async quiz(props) {
        this.onCompleteQuiz = props.onComplete;
        await this.loadPromise;

        // Reset user strokes when entering quiz mode
        this.userStrokes = [];
        this.currentStroke = null;
        this.isQuizing = true;
        
        // Clear canvas and draw background
        
        this.clearBg();
        
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
        this.offsetX = offsetX;
        this.offsetY = offsetY;
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

    displayGrid() {
        this.showGrid = true;
    }

    displayDiagonals() {
        this.showDiagonals = true;
    }

    hideGrid() {
        this.showGrid = false;
    }

    hideDiagonals() {
        this.showDiagonals = false;
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

    isState(state) {
        return this.state === state;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.dimension, this.dimension);
    }

    clearBg(oalpha=0) {


        this.clear();

        // draw black bg
        if(!this.clearBackground){
            this.ctx.fillStyle = isDarkMode ? '#212121' : '#f3f3f3';
            this.ctx.fillRect(0, 0, this.dimension, this.dimension);
        }
        
        drawBg(this.ctx, this.showDiagonals, this.showGrid, this.lineType, this.dimension, this.colors);

        if(this.demoMode && !this.isAnimatingInterp){
            
            this.draw({
                progress: 1,
                clearbg: false,
                onDrawComplete: null,
                alpha: oalpha,
                strokes_in: null,
                strokes_in_length: null
            });
            this.drawUserStrokes(false);
        }
    }

    giveUp(){
        this.isQuizing = false;
        this.clearBg();
        this.startAnimation();
    }

    async startAnimationOld() {
        if (this.isAnimating) return; // Prevent multiple calls
        this.isAnimating = true;
    
        for (let i = 0; i < this.originalStrokes.length; i++) {
            console.log(`Stroke ${i + 1} completed`);
            await this.animateSingleStroke(i);
            // Wait 400ms after each stroke
            await new Promise(resolve => setTimeout(resolve, 400));
        }
    
        this.isAnimating = false;
    }
    
    animateSingleStroke(index) {
        return new Promise(resolve => {
            const stroke = this.originalStrokes[index];
            const numPoints = stroke.length;
            const duration = numPoints / this.speed; // duration in ms
            console.log(duration)
    
            const startTime = Date.now();
    
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
    
                this.clearBg();
                this.draw({ progress: 1, clearbg: false, alpha: 0.35 }); // draw completed strokes with some alpha
                this.drawStroke(stroke, progress);
    
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };
    
            animate();
        });
    }

    async startAnimation() {
        await this.loadPromise;
      
        let workingStrokes = this.originalStrokes?.map(stroke =>
          stroke.map(({ x, y }) => ({ x, y }))
        );
      
        let strokes = this.applyJitter(workingStrokes, this.jitterAmp);
      
        this.ctx.save();
        this.ctx.lineCap = this.lineType;
        this.ctx.lineJoin = this.lineType;
        this.ctx.globalCompositeOperation = this.blendMode;
        this.ctx.strokeStyle = this.colors[0];
        this.ctx.lineWidth = this.useMask
          ? this.lineThickness * 6
          : this.lineThickness * 1.24;
      
        this.clearBg();
      
        const numStrokes = this.originalStrokes.length;
        this.isAnimating = true;
      
        // Helper function to animate a single stroke from 0 to 1
        const animateStroke = (strokeIndex) =>
          new Promise(resolve => {
            let startTime = null;

            let progressDuration = 10 * strokes[strokeIndex].length;
      
            const animate = timestamp => {
              if (!startTime) startTime = timestamp;
              const elapsed = timestamp - startTime;
              let progress = Math.min(elapsed / progressDuration, 1);
      
              this.clearBg();
              this.draw({ progress: 1, clearbg: false, alpha: 0.35 });
              this.drawPartial(strokes, strokeIndex, progress, 1);
      
              if (progress < 1) {
                if(!this.isAnimating){
                  return;
                }
                this.animationFrame = requestAnimationFrame(animate);
              } else {

                resolve();
              }
            };
      
            if(!this.isAnimating){
                return;
              }
            this.animationFrame = requestAnimationFrame(animate);
          });
      
        for (let currentStrokeIndex = 0; currentStrokeIndex < numStrokes; currentStrokeIndex++) {
          // Animate current stroke over 600ms (adjust as needed)
          if(!this.isAnimating){
            return;
          }
          await animateStroke(currentStrokeIndex);
          // Wait 400ms delay before next stroke
          await new Promise(r => setTimeout(r, 160));
        }
      
        this.stopAnimation();
        this.ctx.restore();
      }
      

    async startAnimationOOld() {    
        if(this.isQuizing){
            return;
        }
        if(this.isDestroyed){
            return;
        }
        this.isAnimating = true;
        this.startTime = Date.now();
        let numPoints = 0;
        this.originalStrokes.forEach(stroke => numPoints += stroke.length);
        const duration = numPoints / this.speed;
        let framenum = 0;
        let delay = 600;
        const animate = () => {
            if (!this.isAnimating) return;
            const elapsed = Date.now() - this.startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const underlay = Math.max(.35, Math.min(progress*4, 0.35))
            this.clearBg();
            this.draw({ progress: 1, clearbg: false, onDrawComplete: null, alpha: underlay });
            this.draw({ progress: progress, clearbg: false, onDrawComplete: null, alpha: 1 });

            if (progress < 1) {
                // this.animationFrame = requestAnimationFrame(animate);
                this.animationFrame = requestAnimationFrame(animate);
            } else {
                this.stopAnimation();
            }
            framenum++;
        };
        this.animationFrame = requestAnimationFrame(animate);
    }

    stopAnimation() {
        this.isAnimating = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        if(this.strokeAnimationFrame){
            cancelAnimationFrame(this.strokeAnimationFrame);
            this.clearBg();
            this.isAnimatingStroke = false;
        }
        if(this.interpAnimFrame){
            cancelAnimationFrame(this.interpAnimFrame);
            this.clearBg();
            this.isAnimatingInterp = false;
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

    async draw(config = {}) {
        const {
            progress = 1,
            clearbg = true,
            onDrawComplete = null,
            alpha = 1,
            strokes_in = null,
            strokes_in_length = null
        } = config;

        await this.loadPromise;
        
        let workingStrokes = strokes_in || this.originalStrokes?.map(stroke => 
            stroke.map(({ x, y }) => ({ x, y }))
        );
        
        if (!workingStrokes) {
            let span = document.createElement('span');
            span.textContent = this.character;
            Object.assign(span.style, {
                fontSize: '10em',
                fontFamily: 'Kaiti',
                margin: '0em',
                display: 'inline-block'
            });
            this.canvas = span;
            return;
        }
        
        
        if(clearbg) this.clearBg();


        // Calculate total length of all strokes
        this.totalLength = workingStrokes.reduce((total, stroke) => {
            return total + this.getStrokeLength(stroke);
        }, 0);
        let workingStrokesLength = workingStrokes.reduce((total, stroke) => {
            return total + this.getStrokeLength(stroke);
        }, 0);
        if(strokes_in_length){
            workingStrokesLength = strokes_in_length;
        }
    
        // Find which stroke we're on and its progress based on distance
        let distanceTarget = workingStrokesLength * progress;
        let distanceCovered = 0;
        let d = 0;
        let currentStrokeProgress = 0;
    
        for (let i = 0; i < workingStrokes.length; i++) {
            const strokeLength = this.getStrokeLength(workingStrokes[i]);
            if (distanceCovered + strokeLength > distanceTarget) {
                d = i;
                currentStrokeProgress = (distanceTarget - distanceCovered) / strokeLength;
                break;
            }
            distanceCovered += strokeLength;
            d = i;
            currentStrokeProgress = 1;
        }
    
        let strokes = this.applyJitter(workingStrokes, this.jitterAmp);
        this.ctx.save();
        this.ctx.lineCap = this.lineType;
        this.ctx.lineJoin = this.lineType;
        this.ctx.globalAlpha = alpha;
        this.ctx.globalCompositeOperation = this.blendMode;
        if(this.colors[0]){
            this.ctx.strokeStyle = this.colors[0];
            if(isDarkMode){
                this.ctx.strokeStyle = this.colors[1];
            }
            this.ctx.lineWidth = this.lineThickness * 1.24;
            if(this.useMask){
                this.ctx.lineWidth = this.lineThickness * 5;
            }
            this.drawPartial(strokes, d, currentStrokeProgress, alpha);
        }
        this.ctx.restore();
        // strokes = this.jitteredStrokes;
    
        // strokes = this.applyJitter(workingStrokes, this.jitterAmp+111);
        
        // strokes = this.applyJitter(workingStrokes, this.jitterAmp+45);

        if(onDrawComplete){
            onDrawComplete();
        }

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

    drawPartial(strokes, d, currentStrokeProgress, alpha=1){
        // if (this.useMask) {
        //     let maskregion = new Path2D();
        //     this.ctx.save(); 
        //     for (let i = 0; i < d && i < strokes.length; i++) {
        //         drawMask(maskregion, this.masks_[i], this.offsetX, this.offsetY);
        //     }
        //     this.ctx.clip(maskregion);
        // }

        // for (let i = 0; i < d && i < strokes.length; i++) {
        //     this.drawStroke(strokes[i]);
        // }

        // if (this.useMask) {
        //     this.ctx.restore();
        // }

        let maskregion;
        if (this.useMask) {
           maskregion = new Path2D();
        }

        for (let i = 0; i < d && i < strokes.length; i++) {
            if (this.useMask) {
                this.ctx.save(); 
                maskregion = new Path2D();
                drawMask(maskregion, this.masks_[i], this.offsetX, this.offsetY, this.dimension);
                this.ctx.clip(maskregion);
                // this.ctx.stroke(maskregion);
            }
            this.drawStroke(strokes[i], 1, false, alpha);
            if (this.useMask) {
                this.ctx.restore();
            }
        }

        if (d >= 0 && d < strokes.length) {
            if (this.useMask) {
                this.ctx.save(); 
                let maskregion = new Path2D();
                drawMask(maskregion, this.masks_[d], this.offsetX, this.offsetY, this.dimension);
                this.ctx.clip(maskregion);
                // this.ctx.stroke(maskregion);
            }

            this.drawStroke(strokes[d], currentStrokeProgress, false, alpha);
            
            if (this.useMask) {
                this.ctx.restore();
            }
        }
    }
    
    drawStroke(stroke, progress = 1, smooth = false, alpha=1) {
        if (!stroke || stroke.length < 2) return;
    
        // Ensure progress is between 0 and 1
        progress = Math.min(1, Math.max(0, progress));
    
        this.ctx.beginPath();
    
        const scaledStroke = stroke.map(pt => ({
            x: pt.x * this.dimension / 1000,
            y: pt.y * this.dimension / 1000
        }));
    
        // Calculate total distance and the target length based on progress
        let totalDistance = 0;
        let segmentLengths = [0];
    
        // Calculate segment lengths
        for (let i = 1; i < scaledStroke.length; i++) {
            const dx = scaledStroke[i].x - scaledStroke[i - 1].x;
            const dy = scaledStroke[i].y - scaledStroke[i - 1].y;
            totalDistance += Math.sqrt(dx * dx + dy * dy);
            segmentLengths.push(totalDistance);
        }
    
        const targetLength = progress * totalDistance;
    
        // Draw the stroke up to the target length
        this.ctx.moveTo(scaledStroke[0].x, scaledStroke[0].y);
    
        let accumulatedLength = 0;
        for (let i = 1; i < scaledStroke.length; i++) {
            const p1 = scaledStroke[i - 1];
            const p2 = scaledStroke[i];
            const segmentDistance = segmentLengths[i] - segmentLengths[i - 1];
    
            accumulatedLength += segmentDistance;
    
            // Check if we've reached or surpassed the target length
            if (accumulatedLength >= targetLength) {
                // Interpolate the position on this segment based on progress
                const remainingLength = targetLength - (accumulatedLength - segmentDistance);
                const ratio = remainingLength / segmentDistance;
    
                const x = p1.x + (p2.x - p1.x) * ratio;
                const y = p1.y + (p2.y - p1.y) * ratio;
    
                if (smooth) {
                    // Bezier curve control points
                    const p0 = i > 1 ? scaledStroke[i - 2] : p1;
                    const p3 = i < scaledStroke.length - 1 ? scaledStroke[i + 1] : p2;
                    const cx1 = p1.x + (p2.x - p0.x) / 6;
                    const cy1 = p1.y + (p2.y - p0.y) / 6;
                    const cx2 = p2.x - (p3.x - p1.x) / 6;
                    const cy2 = p2.y - (p3.y - p1.y) / 6;
    
                    // Use the bezier curve to interpolate the stroke
                    this.ctx.bezierCurveTo(cx1, cy1, cx2, cy2, x, y);
                } else {
                    // For straight line, simply draw up to the interpolated point
                    this.ctx.lineTo(x, y);
                }
                break;
            } else {
                if (smooth) {
                    // Draw a bezier curve between the current segment
                    const p0 = i > 1 ? scaledStroke[i - 2] : p1;
                    const p3 = i < scaledStroke.length - 1 ? scaledStroke[i + 1] : p2;
                    const cx1 = p1.x + (p2.x - p0.x) / 6;
                    const cy1 = p1.y + (p2.y - p0.y) / 6;
                    const cx2 = p2.x - (p3.x - p1.x) / 6;
                    const cy2 = p2.y - (p3.y - p1.y) / 6;
    
                    this.ctx.bezierCurveTo(cx1, cy1, cx2, cy2, p2.x, p2.y);
                } else {
                    // Draw the entire segment as a straight line
                    this.ctx.lineTo(p2.x, p2.y);
                }
            }
        }
    
        this.ctx.stroke();
    }
    
    
    
    async loadStrokeData(onReady=null) {
        console.log('onReady');
        try {
            this.originalStrokes = undefined;
            const response = await fetch(`/api/getStrokes/${this.character}`);
            if (!response.ok) {
                console.log('Strokes doesn\'t exist, will be rendered using text.', this.character);  
                return;
            }
            const data = await response.json();
            this.data = data;
            if(onReady){
                onReady();
            }
        } catch (error) {
            console.error('Error loading character data:', error);
            throw error;
        }
    }

}
