
let isDarkMode = false;


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

// document.addEventListener('DOMContentLoaded', function() {
// });

// document.addEventListener('keydown', function(event) {
//     if (event.ctrlKey && event.key === 'i') {
//         toggleInvertAllElements();
//     }
// });