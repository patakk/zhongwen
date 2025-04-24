const html = `
    <a href="/" id="backLink" data-link>&lt;&lt; home</a>

        <h1 id="search-title" class="title">Search</h1>
        <div id="search-container">
        <form id="searchForm" onsubmit="handleSearch(event)">
            <input type="text" name="query" id="searchQuery">
            <input id="srch-btn" type="submit" value="Search">
        </form>
        <div id="search-info">
        </div>
        
        <div id="results">
           
        </div>
        
    </div>
`


// routes/search.js
export function renderSearch() {
    return html;
  }
  