const html = `
<div class="home-container">
<!-- <div class="title">中文</div> -->
<div id="homeTitle">汉字</div>
<div class="link-container">
    ${!username ? 
    '<a class="mainlink" id="progressUrl" href="/login" data-link><span class="homeLink">login</span> <i class="fa-solid fa-person-through-window"></i></a>' :
    '<a class="mainlink" id="progressUrl" href="/account" data-link><span class="homeLink">account</span> <i class="fa-solid fa-user"></i></a>'
    }
    <a class="mainlink" href="/grid" data-link><span class="homeLink">grid</span> <i class="fas fa-th-large"></i></a>
    <a class="mainlink" id="flashcardsUrlMain" href="/flashcards" data-link> <span class="homeLink">flashcards</span> <i class="fa-solid fa-arrow-right-arrow-left"></i></a>
    <a class="mainlink" href="/puzzles" data-link><span class="homeLink">puzzles</span> <i class="fa-solid fa-puzzle-piece"></i></a>
    <a class="mainlink" href="/hanziwriting" data-link><span class="homeLink">practice writing</span> <i class="fas fa-pen-fancy"></i></a>
    <a class="mainlink" href="/search" data-link><span class="homeLink">search</span> <i class="fa-solid fa-magnifying-glass"></i></a>
    <a class="mainlink" href="/pageinfo" data-link><span class="homeLink">page info</span> <i class="fa-solid fa-circle-info"></i></a>
</div>
</div>
`

// routes/home.js
export function renderHome() {
    return html;
}
