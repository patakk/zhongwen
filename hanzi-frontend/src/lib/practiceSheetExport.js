// src/lib/practiceSheetExport.js
// Utility for generating practice sheet SVG and PDF

export function toAccentedPinyin(input) {

    if (!input) return input;

    const toneMap = {
        '1': 'āēīōūǖ',
        '2': 'áéíóúǘ',
        '3': 'ǎěǐǒǔǚ',
        '4': 'àèìòùǜ',
        '5': 'aeiouü'
    };
    
    function applyToneMark(syllable, tone) {
        if (!tone) return syllable;
        
        const vowels = ['a', 'e', 'i', 'o', 'u', 'ü'];
        let syllableLower = syllable.toLowerCase();
        
        if (syllableLower.includes('a')) {
            let index = syllableLower.indexOf('a');
            let result = syllable.split('');
            result[index] = toneMap[tone][0];
            return result.join('');
        }
        
        if (syllableLower.includes('e')) {
            let index = syllableLower.indexOf('e');
            let result = syllable.split('');
            result[index] = toneMap[tone][1];
            return result.join('');
        }
        
        if (syllableLower.includes('ou')) {
            let index = syllableLower.indexOf('o');
            let result = syllable.split('');
            result[index] = toneMap[tone][3];
            return result.join('');
        }
        
        for (let i = syllableLower.length - 1; i >= 0; i--) {
            let char = syllableLower[i];
            let vowelIndex = vowels.indexOf(char);
            if (vowelIndex !== -1) {
                let result = syllable.split('');
                result[i] = toneMap[tone][vowelIndex];
                return result.join('');
            }
        }
        
        return syllable;
    }

    let result = input.replace(/\[([a-z]+)([1-5])?\]/gi, (match, syllable, tone) => {
        return '[' + applyToneMark(syllable, tone) + ']';
    });
    
    result = result.replace(/\b([a-z]+)([1-5])?\b/gi, (match, syllable, tone) => {
        return applyToneMark(syllable, tone);
    });
    
    return result;
}


// --- SVG Generation ---
export function generatePracticeSheetSVG(words, strokesData, options = {}) {
  // Extract options
  const selectedPracticeOption = options.selectedPracticeOption || 'one_row';
  const windowHeight = options.windowHeight || 900;
  const noAccents = options.noAccents || false;
  const page = options.page || 0;
  const excludedChars = options.excludedChars || [];
  const excludedSet = new Set(excludedChars);
  // SVG constants for A4 (210mm x 297mm at 96dpi: 794x1123px)
  const DPI = 96;
  const A4_WIDTH = windowHeight/1.414; // px (A4 aspect ratio)
  const A4_HEIGHT = windowHeight; // px (A4 aspect ratio)
  const SQUARE_SIZE = windowHeight/25; // px
  const PADDING_X = windowHeight/20;
  const PADDING_Y = windowHeight/20;
  const ROW_HEIGHT = SQUARE_SIZE + windowHeight/30; // 40px for pinyin
  const FONT_SIZE_PINYIN = windowHeight/60;
  const FONT_SIZE_CHAR = 36;
  const OPACITY_FADED = 0.4;
  // let svg = `<svg width="${A4_WIDTH}" height="${A4_HEIGHT}" viewBox="0 0 ${A4_WIDTH} ${A4_HEIGHT}" xmlns="http://www.w3.org/2000/svg">`;
  let svg = `<svg viewBox="0 0 ${A4_WIDTH} ${A4_HEIGHT}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<rect width='100%' height='100%' fill='white'/>`;

  // Gather all unique characters from the wordlist
  const uniqueChars = new Set();
  words.forEach(word => {
    [...word.character].forEach(char => {if(char !== '，') uniqueChars.add(char);});
  });
  // Filter out excluded characters
  const charList = Array.from(uniqueChars).filter(char => !excludedSet.has(char));
  console.log(charList);
  // Preprocess: calculate vertical centering offsets for each character
  const charYOffsetMap = {};
  for (const char of charList) {
    if (strokesData[char] && strokesData[char].strokes && strokesData[char].strokes.length > 0) {
      let minY = Infinity, maxY = -Infinity;
      strokesData[char].strokes.forEach(path => {
        const matches = path.match(/[-+]?[0-9]*\.?[0-9]+/g);
        if (matches && matches.length > 1) {
          for (let i = 1; i < matches.length; i += 2) {
            const y = parseFloat(matches[i]);
            if (!isNaN(y)) {
              minY = Math.min(minY, y);
              maxY = Math.max(maxY, y);
            }
          }
        }
      });
      if (minY < maxY && isFinite(minY) && isFinite(maxY)) {
        const centerY = (maxY + minY) / 2;
        charYOffsetMap[char] = 500 - centerY;
      } else {
        charYOffsetMap[char] = 0;
      }
    } else {
      charYOffsetMap[char] = 0;
    }
  }

  // Calculate how many rows and columns fit vertically and horizontally
  const availableWidth = A4_WIDTH - 2 * PADDING_X;
  const availableHeight = A4_HEIGHT - 2 * PADDING_Y;
  const ROWS_PER_PAGE = Math.floor(availableHeight / ROW_HEIGHT);
  const SQUARES_PER_ROW = Math.floor(availableWidth / SQUARE_SIZE);
  const totalGridWidth = SQUARES_PER_ROW * SQUARE_SIZE;
  const totalGridHeight = ROWS_PER_PAGE * ROW_HEIGHT;
  const gridOffsetX = PADDING_X + (availableWidth - totalGridWidth) / 2;
  const gridOffsetY = PADDING_Y + (availableHeight - totalGridHeight) / 2;
  const adjustedRowHeight = (A4_HEIGHT - 2 * gridOffsetY) / (ROWS_PER_PAGE - .5);

  // Calculate how many chars fit per page
  const rowsForChar = selectedPracticeOption === 'two_rows' ? 2 : 1;
  const charsPerPage = Math.floor(ROWS_PER_PAGE / rowsForChar);
  const totalPages = Math.ceil(charList.length / charsPerPage);
  const startCharIdx = page * charsPerPage;
  const endCharIdx = Math.min(startCharIdx + charsPerPage, charList.length);
  const pageCharList = charList.slice(startCharIdx, endCharIdx);

  let row = 0;
  const PINYIN_GAP = FONT_SIZE_PINYIN + 4; // vertical space reserved for pinyin
  const SECOND_ROW_GAP = PINYIN_GAP * 0.5; // reduce gap for second row
  pageCharList.forEach((char, idx) => {
    for (let r = 0; r < rowsForChar; r++) {
      if (row >= ROWS_PER_PAGE) {
        return;
      }
      // For the second row, reduce the vertical gap since there's no pinyin
      let y = gridOffsetY + row * adjustedRowHeight;
      if (rowsForChar === 2 && r === 1) {
        y -= (PINYIN_GAP - SECOND_ROW_GAP); // move second row up
      }
      let fadedPinyinSVG = '';
      const wordObj = words.find(w => w.character.includes(char));
      if (wordObj && wordObj.pinyin && wordObj.pinyin[0]) {
        const pinyinSyllables = wordObj.pinyin[0].split(/\s+/);
        const chars = [...wordObj.character];
        const charIndices = chars.reduce((arr, c, i) => {
          if (c === char) arr.push(i);
          return arr;
        }, []);
        // Calculate total syllable width for the word
        let totalSyllableWidth = 0;
        for (let j = 0; j < pinyinSyllables.length; j++) {
          if (pinyinSyllables[j]) {
            totalSyllableWidth += pinyinSyllables[j].length * FONT_SIZE_PINYIN * 0.6;
          }
        }

        for (let i = 0; i < chars.length; i++) {
          if (pinyinSyllables[i]) {
            // Estimate x by accumulating syllable lengths, scaled by 0.6
            let syllableWidth = FONT_SIZE_PINYIN * 0.6;
            let x = gridOffsetX;
            for (let j = 0; j < i; j++) {
              if (pinyinSyllables[j]) {
            x += pinyinSyllables[j].length * syllableWidth;
              }
            }
            x += (pinyinSyllables[i].length * syllableWidth) / 2;
            const isCurrent = charIndices.includes(i);
            const pinyinText = noAccents ? pinyinSyllables[i] : toAccentedPinyin(pinyinSyllables[i]);
            fadedPinyinSVG += `<text x="${x}" y="${y - 8}" font-size="${FONT_SIZE_PINYIN}" fill="#222" font-family="sans-serif" opacity="${isCurrent ? 1 : OPACITY_FADED}" text-anchor="middle">${pinyinText}</text>`;
            // --- Breakdown SVGs ---
            if (isCurrent && strokesData[char] && strokesData[char].strokes && r === 0) {
              const breakdownCount = strokesData[char].strokes.length;
              const breakdownSize = FONT_SIZE_PINYIN * 1.2;
              let breakdownX = gridOffsetX*1.1+totalSyllableWidth; // start a bit to the right of pinyin
              for (let b = 1; b <= breakdownCount; b++) {
            fadedPinyinSVG += `<g transform="translate(${breakdownX},${y - 4}) scale(${breakdownSize/1000}, ${-breakdownSize/1000})">`;
            for (let s = 0; s < breakdownCount; s++) {
              fadedPinyinSVG += `<path d='${strokesData[char].strokes[s]}' fill="#222" stroke="none" opacity="${s < b ? 1 : OPACITY_FADED}"/>`;
            }
            fadedPinyinSVG += `</g>`;
            breakdownX += breakdownSize * 1.1; // space between breakdowns
              }
            }
          }
        }
      }
      if(r === 0) {
        svg += fadedPinyinSVG;
      }
      for (let i = 0; i < SQUARES_PER_ROW; i++) {
        const x = gridOffsetX + i * SQUARE_SIZE;
        svg += `<rect x="${x}" y="${y}" width="${SQUARE_SIZE}" height="${SQUARE_SIZE}" fill="none" stroke="#888" stroke-width="1.5"/>`;
        // Add diagonals and cross lines
        svg += `<line x1="${x}" y1="${y}" x2="${x + SQUARE_SIZE}" y2="${y + SQUARE_SIZE}" stroke="#bbb" stroke-width="1"/>`;
        svg += `<line x1="${x + SQUARE_SIZE}" y1="${y}" x2="${x}" y2="${y + SQUARE_SIZE}" stroke="#bbb" stroke-width="1"/>`;
        svg += `<line x1="${x + SQUARE_SIZE/2}" y1="${y}" x2="${x + SQUARE_SIZE/2}" y2="${y + SQUARE_SIZE}" stroke="#bbb" stroke-width="1"/>`;
        svg += `<line x1="${x}" y1="${y + SQUARE_SIZE/2}" x2="${x + SQUARE_SIZE}" y2="${y + SQUARE_SIZE/2}" stroke="#bbb" stroke-width="1"/>`;
        // ...existing code...
        if (r === 0 && i === 0) {
          if (strokesData[char] && strokesData[char].strokes) {
            svg += `<g transform="translate(${x + SQUARE_SIZE/2},${y + SQUARE_SIZE/2}) scale(0.9) translate(${-SQUARE_SIZE/2},${-SQUARE_SIZE/2})">`;
            svg += `<g transform=\"translate(0,${SQUARE_SIZE}) scale(${SQUARE_SIZE/1000},-${SQUARE_SIZE/1000}) translate(0,${charYOffsetMap[char]})\">`;
            strokesData[char].strokes.forEach(path => {
              svg += `<path d=\"${path}\" fill=\"#222\" stroke=\"none\"/>`;
            });
            svg += `</g></g>`;
          }
        } else if (r === 0 && i > 0 && i <= Math.min(6, strokesData[char]?.strokes?.length/2+1 || 2)) {
          if (strokesData[char] && strokesData[char].strokes) {
            svg += `<g transform="translate(${x + SQUARE_SIZE/2},${y + SQUARE_SIZE/2}) scale(0.9) translate(${-SQUARE_SIZE/2},${-SQUARE_SIZE/2})" opacity="${OPACITY_FADED}">`;
            svg += `<g transform=\"translate(0,${SQUARE_SIZE}) scale(${SQUARE_SIZE/1000},-${SQUARE_SIZE/1000}) translate(0,${charYOffsetMap[char]})\">`;
            strokesData[char].strokes.forEach(path => {
              svg += `<path d=\"${path}\" fill=\"#222\" stroke=\"none\"/>`;
            });
            svg += `</g></g>`;
          }
        } else if (r === 1) {
          // Second row: always empty
        }
      }
      row++;
    }
  });
  svg += '</svg>';
  return { svg, totalPages };
}

// --- PDF Generation ---
export async function generatePracticeSheetPDF(words, strokesData, options = {}) {
  // Dynamically import jsPDF and svg2pdf.js only when needed
  const { jsPDF } = await import('jspdf');
  await import('svg2pdf.js');

  // Get total pages
  const { totalPages } = generatePracticeSheetSVG(words, strokesData, { ...options, noAccents: true, page: 0, excludedChars: options.excludedChars });

  // PDF constants
  const DPI = 72;
  const A4_WIDTH = 595.28; // pt
  const A4_HEIGHT = 841.89; // pt

  // Create jsPDF document (portrait A4)
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'pt',
    format: [A4_WIDTH, A4_HEIGHT],
  });

  for (let page = 0; page < totalPages; page++) {
    if (page > 0) doc.addPage([A4_WIDTH, A4_HEIGHT], 'p');
    const { svg } = generatePracticeSheetSVG(words, strokesData, { ...options, noAccents: true, page, excludedChars: options.excludedChars });
    // Create a temporary DOM element for the SVG
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'fixed';
    tempDiv.style.left = '-9999px';
    tempDiv.innerHTML = svg;
    document.body.appendChild(tempDiv);
    const svgElement = tempDiv.querySelector('svg');
    // Render SVG into PDF (await for each page)
    await doc.svg(svgElement, {
      x: 0,
      y: 0,
      width: A4_WIDTH,
      height: A4_HEIGHT,
    });
    document.body.removeChild(tempDiv);
  }

  // Return PDF as Blob
  return doc.output('blob');
}
