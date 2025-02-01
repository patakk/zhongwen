
function confirmDarkmode(){
    if(isDarkMode){
        document.body.classList.add('darkmode');
    }
    else{
        document.body.classList.remove('darkmode');
    }
    document.querySelectorAll('*').forEach(element => {
        if(isDarkMode){
            if(!element.classList.contains('darkmode')){
                element.classList.add('darkmode');
            }
        }
        else{
            if(element.classList.contains('darkmode')){
                element.classList.remove('darkmode');
            }
        }
    });

    try{
        function changeAllSvgStrokeColors(newColor) {
            const svgs = document.querySelectorAll('svg');
            svgs.forEach(svg => {
                const elements = svg.querySelectorAll('line, rect');
                elements.forEach(element => {
                    element.setAttribute('stroke', newColor);
                });
            });
        }
        if(isDarkMode && currentWriters){
            //changeAllSvgStrokeColors('#F7A5');7e779155
            changeAllSvgStrokeColors('#7e779155');
            currentWriters.forEach(writer => {
                writer.updateColor('strokeColor', '#ccc');
                writer.updateColor('radicalColor', '#ccc');
                writer.updateColor('outlineColor', '#222');
                //writer.updateColor('drawingColor', '#7e7791');
                writer.updateColor('drawingColor', '#ccc');
            });
        }
        else if (currentWriters){
            //changeAllSvgStrokeColors('#A005');
            changeAllSvgStrokeColors('#aea5c955');
            currentWriters.forEach(writer => {
                writer.updateColor('strokeColor', '#111');
                writer.updateColor('radicalColor', '#111');
                writer.updateColor('outlineColor', '#BBB');
                //writer.updateColor('drawingColor', '#aea5c9');
                writer.updateColor('drawingColor', '#111');
            });
        }

    }
    catch(e){
        //console.log(e)
    }

    try{
        let bg = document.getElementById('plottersWrapper');
        // set bg to random paste color
        bg.style.backgroundColor = `hsl(${Math.random() * 360}, 8%, 87%)`;
        if(isDarkMode){
            bg.style.backgroundColor = `hsl(${Math.random() * 360}, 8%, 17%)`;
        }
    }
    catch(e){
    }

    try{
        currentGridPlotters.forEach(child => {
            let colors = ["#151511aa", "#151511aa", "#151511aa"];
            if(isDarkMode){
                colors = ["#e5ddedaa", "#e5ddedaa", "#e5ddedaa"];
            }
            child.plotter.setColors(colors);
            child.plotter.draw();
        });
    }
    catch(e){
    }


    try{
        currentFlashcardPlotters.forEach(child => {
            let colors = ["#151511aa", "#151511aa", "#151511aa"];
            if(isDarkMode){
                colors = ["#e5ddedaa", "#e5ddedaa", "#e5ddedaa"];
            }
            child.plotter.setColors(colors);
            child.plotter.draw();
        });
    }
    catch(e){
    }

    try{
        nextFlashcardPlotters.forEach(child => {
            let colors = ["#151511aa", "#151511aa", "#151511aa"];
            if(isDarkMode){
                colors = ["#e5ddedaa", "#e5ddedaa", "#e5ddedaa"];
            }
            child.plotter.setColors(colors);
            child.plotter.draw();
        });
    }
    catch(e){
    }

    try{
        plotters.forEach(child => {
            if(child.plotter){
                child.plotter.draw();
            }
        });
        // plotterElement.plotters.forEach(hanziplotter => {
        //     console.log("hanziplotter.plotter.getContext()");
        //     console.log(hanziplotter.plotter);
        //     console.log(hanziplotter.plotter.getContext());
            
        //     let context = hanziplotter.plotter.getContext();
        //     context.ctx.canvas.classList.add('plotter');
        //     animateStrokes(context);
        // });
    }
    catch(e){
        //console.log(e)
    }
}

document.addEventListener('keydown', function(event) {
   
});

document.getElementById('darkmode-toggle').addEventListener('click', function() {
    isDarkMode = !isDarkMode;
    setDarkmode();
});

function setDarkmode() {
    confirmDarkmode();
    fetch(`./api/setdarkmode?darkmode=${isDarkMode}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        else{
            return response.json();
        }

    }).then(data => {
        console.log(data);
    })
    .catch(error => {
        console.error('There was a problem changing darkmode', error);
    });
}


function getDarkmode(func=null) {
    fetch('./api/getdarkmode')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            isDarkMode = data.darkmode;
            confirmDarkmode();
            if(func){
                func();
            }
            console.log('Darkmode set to: ' + isDarkMode);
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
        });
}
// function toggleInvertAllElements() {
//     isDarkMode = !isDarkMode; 
//     const allElements = document.getElementsByTagName('*');
    
//     for (let i = 0; i < allElements.length; i++) {
//         if (isDarkMode) {
//             if(!allElements[i].classList.contains('darkmode')){
//                 allElements[i].classList.add('darkmode');
//             }
//         } else {
//             allElements[i].classList.remove('darkmode');
//         }
//         if(allElements[i].id == 'indicator')
//             allElements[i].classList.remove('darkmode')
//     }
// }

// function mapColor(color) {
//     const colorMap = {
//         '#000000': '#ffffff',
//         '#ffffff': '#000000',
//         '#333333': '#cccccc',
//         '#cccccc': '#333333',
//         '#f2f2f2': '#0d0d0d',
//         '#0d0d0d': '#f2f2f2',
//         '#101010': '#efefef',
//         '#efefef': '#101010',
//         '#ff0000': '#00ffff',
//         '#00ffff': '#ff0000',
//         '#ff3c00': '#00c3ff',
//         '#00c3ff': '#ff3c00',
//         '#110000': '#eeffff',
//         '#eeffff': '#110000',
//         '#e9e9e9': '#161616',
//         '#161616': '#e9e9e9',
//         '#ff5c16': '#00a3e9',
//         '#00a3e9': '#ff5c16',
//         '#0e0e0e': '#f1f1f1',
//         '#f1f1f1': '#0e0e0e',
//         '#c8c8c8': '#373737',
//         '#373737': '#c8c8c8',
//         '#646464': '#9b9b9b',
//         '#9b9b9b': '#646464',
//         '#fafafa': '#050505',
//         '#050505': '#fafafa',
//         '#f7f7f7': '#080808',
//         '#080808': '#f7f7f7'
//     };
//     // Convert rgb to hex if necessary
//     if (color.startsWith('rgb')) {
//         color = rgbToHex(color);
//     }
    
//     // Normalize to lowercase for consistent matching
//     color = color.toLowerCase();
    
//     // Return mapped color if it exists, otherwise return the original color
//     return colorMap[color] || color;
// }

// function rgbToHex(rgb) {
//     // Convert rgb(x, y, z) to hex
//     return "#" + rgb.match(/\d+/g).map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
// }
// function toggleInvertAllElements(){
//     isDarkMode = !isDarkMode; 
//     document.querySelectorAll('*').forEach(element => {
//         const styles = window.getComputedStyle(element);
//         const backgroundColor = styles.getPropertyValue('background-color');
//         const color = styles.getPropertyValue('color');
        
//         if (backgroundColor !== 'rgba(0, 0, 0, 0)') {
//             element.style.backgroundColor = mapColor(backgroundColor);
//             console.log(backgroundColor);
//             console.log(element.style.backgroundColor);
//         }
//         if (color !== 'rgba(0, 0, 0, 0)') {
//             element.style.color = mapColor(color);
//             console.log(color);
//             console.log(element.style.color);
//         }
//     });
// }

document.addEventListener('DOMContentLoaded', function() {
    confirmDarkmode();
});

// document.addEventListener('keydown', function(event) {
//     if (event.ctrlKey && event.key === 'i') {
//         toggleInvertAllElements();
//     }
// });