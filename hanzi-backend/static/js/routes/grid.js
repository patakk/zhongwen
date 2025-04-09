export async function renderGrid() {
    const decknames = decknames_sorted_with_name;

    let deckMenuHtml = '';
    for (const key in decknames) {
      deckMenuHtml += `
        <li class="menu-option-parent">
          <a class="deck-option deck-change" data-deck="${key}">${decknames[key]}</a>
        </li>`;
    }
  
    const html = `
      <h1 id="grid-title" class="title">Character Grid</h1>
      <h3 id="title_word_count"></h3>
  
      <div class="has-submenu" id="deckMenu">
        <span class="submenuName" id="deckSubmenuName">sets</span>
        <ul class="gridSubmenu" id="deckSubmenu">
          ${deckMenuHtml}
        </ul>
      </div>
  
      <div class="has-submenu" id="fontMenu">
        <span class="submenuName" id="fontSubmenuName">fonts</span>
        <ul class="gridSubmenu" id="fontSubmenu">
          <li class="menu-option-parent"><a class="deck-option font-change" data-font="Noto Sans Mono">Noto Sans</a></li>
          <li class="menu-option-parent"><a class="deck-option font-change" data-font="Noto Serif SC">Noto Serif</a></li>
          <li class="menu-option-parent"><a class="deck-option font-change" data-font="Kaiti">Kaiti</a></li>
        </ul>
      </div>
  
      <div id="grid-cont" class="grid-container">
        <div class="grid" id="character-grid"></div>
      </div>
      <div id="lcontainer"></div>
    `;
  
    return html;
  }
  