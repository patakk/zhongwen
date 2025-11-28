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
  const dateStr = options.dateStr || null;
  const dateStrokesData = options.dateStrokesData || null;
  const showFadedPinyin = options.showFadedPinyin !== undefined ? options.showFadedPinyin : false;
  // SVG constants for A4 (210mm x 297mm at 96dpi: 794x1123px)
  const DPI = 96;
  const A4_WIDTH = windowHeight/1.414; // px (A4 aspect ratio)
  const A4_HEIGHT = windowHeight; // px (A4 aspect ratio)
  const SQUARE_SIZE = windowHeight/25; // px
  const PADDING_X = windowHeight/20;
  const PADDING_Y = windowHeight/20;
  const ROW_HEIGHT = SQUARE_SIZE + windowHeight/30; // 40px for pinyin
  const FONT_SIZE_PINYIN = windowHeight/80;
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
  if(words.length === 1){
    strokesData[words[0].character] = strokesData;
  }
  // Filter out excluded characters
  const charList = Array.from(uniqueChars).filter(char => !excludedSet.has(char));
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
  const rowsForChar = Math.max(1, Number(selectedPracticeOption) || 1);
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
      let pinyinAndBreakdownSVG = '';
      const wordObj = words.find(w => w.character.includes(char));
      if (wordObj && wordObj.pinyin && wordObj.pinyin[0]) {
        const pinyinSyllables = wordObj.pinyin;
        const sylString = pinyinSyllables.join(' / ').replace(/[^a-zA-ZüÜ0-9\/ ]/g, ''); // Clean first syllable
        // Calculate total syllable width for the word
        let totalSyllableWidth = 0;
        let syllablePositions = [];
          let width = sylString.length * FONT_SIZE_PINYIN * 0.6;
          syllablePositions.push(width);
          totalSyllableWidth += width;
        let x = gridOffsetX;
        const pinyinText = noAccents ? sylString.replace("5", "") : toAccentedPinyin(sylString);
        pinyinAndBreakdownSVG += `<text x="${x}" y="${y - 5}" font-size="${FONT_SIZE_PINYIN}" fill="#000" font-family="sans-serif" font-style="italic" opacity="1" text-anchor="left">${pinyinText}</text>`;

        if (strokesData[char] && strokesData[char].strokes && r === 0) {
          const breakdownCount = strokesData[char].strokes.length;
          const breakdownSize = FONT_SIZE_PINYIN * 1.2;
          let breakdownX = gridOffsetX+totalSyllableWidth*0.6 + 20; // start a bit to the right of pinyin
          for (let b = 1; b <= breakdownCount; b++) {
            pinyinAndBreakdownSVG += `<g transform="translate(${breakdownX},${y - 3}) scale(${breakdownSize/1000}, ${-breakdownSize/1000})">`;
            //pinyinAndBreakdownSVG += `<rect y="-100" width="${1000}" height="${1000}" fill="none" stroke="#000" opacity="1" stroke-width="33"/>`;
            for (let s = 0; s < breakdownCount; s++) {
              if(s < b){
                pinyinAndBreakdownSVG += `<path d='${strokesData[char].strokes[s]}' fill="#000" stroke="none" opacity="1"/>`;
              }
              else{
                pinyinAndBreakdownSVG += `<path d='${strokesData[char].strokes[s]}' fill="#000" stroke="none" opacity="0.2"/>`;
              }
            }
            pinyinAndBreakdownSVG += `</g>`;
            breakdownX += breakdownSize * 1.1; // space between breakdowns
          }
        }
      }
      if(r === 0) {
        svg += pinyinAndBreakdownSVG;
      }
      for (let i = 0; i < SQUARES_PER_ROW; i++) {
        const x = gridOffsetX + i * SQUARE_SIZE;
        svg += `<rect x="${x}" y="${y}" width="${SQUARE_SIZE}" height="${SQUARE_SIZE}" fill="none" stroke="#888" stroke-width=".8"/>`;
        // Add diagonals and cross lines
        svg += `<line x1="${x}" y1="${y}" x2="${x + SQUARE_SIZE}" y2="${y + SQUARE_SIZE}" stroke="#bbb" stroke-width="0.4"/>`;
        svg += `<line x1="${x + SQUARE_SIZE}" y1="${y}" x2="${x}" y2="${y + SQUARE_SIZE}" stroke="#bbb" stroke-width="0.4"/>`;
        svg += `<line x1="${x + SQUARE_SIZE/2}" y1="${y}" x2="${x + SQUARE_SIZE/2}" y2="${y + SQUARE_SIZE}" stroke="#bbb" stroke-width="0.4"/>`;
        svg += `<line x1="${x}" y1="${y + SQUARE_SIZE/2}" x2="${x + SQUARE_SIZE}" y2="${y + SQUARE_SIZE/2}" stroke="#bbb" stroke-width="0.4"/>`;
        if (r === 0 && i === 0) {
          if (strokesData[char] && strokesData[char].strokes) {
            svg += `<g transform="translate(${x + SQUARE_SIZE/2},${y + SQUARE_SIZE/2}) scale(0.9) translate(${-SQUARE_SIZE/2},${-SQUARE_SIZE/2})">`;
            svg += `<g transform=\"translate(0,${SQUARE_SIZE}) scale(${SQUARE_SIZE/1000},-${SQUARE_SIZE/1000}) translate(0,${charYOffsetMap[char]})\">`;
            strokesData[char].strokes.forEach(path => {
              svg += `<path d=\"${path}\" fill=\"#000\" stroke=\"none\"/>`;
            });
            svg += `</g></g>`;
          }
        // } else if (r === 0 && i > 0 && i <= Math.min(6, strokesData[char]?.strokes?.length/2+1 || 2)) {
        } else if (r === 0 && i > 0 && i <= 3) {
          if (strokesData[char] && strokesData[char].strokes) {
            svg += `<g transform="translate(${x + SQUARE_SIZE/2},${y + SQUARE_SIZE/2}) scale(0.9) translate(${-SQUARE_SIZE/2},${-SQUARE_SIZE/2})" opacity="${OPACITY_FADED}">`;
            svg += `<g transform=\"translate(0,${SQUARE_SIZE}) scale(${SQUARE_SIZE/1000},-${SQUARE_SIZE/1000}) translate(0,${charYOffsetMap[char]})\">`;
            strokesData[char].strokes.forEach(path => {
              svg += `<path d=\"${path}\" fill=\"#000\" stroke=\"none\"/>`;
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
  // Render the date in the top right corner if provided
  if (dateStr) {
    // Render each character of the date horizontally, right-aligned
    const dateChars = [...dateStr];
    const dateSize = SQUARE_SIZE * 0.25; // smaller size for date
    const margin = SQUARE_SIZE * 0.05;
    let totalDateWidth = dateChars.length * dateSize + (dateChars.length - 1) * margin;
    // let startX = A4_WIDTH - .25*PADDING_X - totalDateWidth;
    let startX = .25*PADDING_X;
    let y = A4_HEIGHT - .25*PADDING_Y;
    dateChars.forEach((char, i) => {
      if (dateStrokesData && dateStrokesData[char] && dateStrokesData[char].strokes) {
        svg += `<g transform="translate(${startX + i * (dateSize + margin)},${y}) scale(${dateSize/1000},-${dateSize/1000})">`;
        dateStrokesData[char].strokes.forEach(path => {
          svg += `<path d='${path}' fill="#000" stroke="none"/>`;
        });
        svg += `</g>`;
      } else {
        // fallback: render as text if no stroke data
        svg += `<text x="${startX + i * (dateSize + margin) + dateSize/2}" y="${y-dateSize/4}" font-size="${dateSize * 0.9}" fill="#000" text-anchor="middle" alignment-baseline="middle">${char}</text>`;
      }
    });
  }
  // Render page number in bottom right if multiple pages
  if (totalPages > 1) {
    const pageNum = page + 1;
    const pageText = `${pageNum} / ${totalPages}`;
    const fontSize = SQUARE_SIZE * 0.22;
    svg += `<text x="${A4_WIDTH - .25*PADDING_X}" y="${A4_HEIGHT - .25*PADDING_Y}" font-size="${fontSize}" fill="#000" text-anchor="end" alignment-baseline="middle">${pageText}</text>`;
  }
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
