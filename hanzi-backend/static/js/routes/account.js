
const accountManagementUrl = '/manage-account';
const logoutUrl = '/logout';

const html = `
<style>
* {
            box-sizing: border-box;
        }
        body {
            font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
            font-family: 'Courier Prime', monospace;
            font-family: 'Noto Sans Mono', monospace;
            margin: 0;
            padding: 20px;
            background-color: var(--background-color);
            color: var(--text-color);
            width: 100%;
            max-width: 100%;
            overflow-x: hidden;
            box-sizing: border-box;
            /* overflow-y: auto;
            scrollbar-width: none;
            -ms-overflow-style: none; */

            
            /* -webkit-font-feature-settings: "liga" 0;
            font-feature-settings: "liga" 0;
            -webkit-text-rendering: geometricPrecision;
            text-rendering: geometricPrecision; */
        }
        body::-webkit-scrollbar {
            display: none;
        }

        /* Hide scrollbar for IE, Edge and Firefox */
        body {
            /* -ms-overflow-style: none;  IE and Edge */
            /* scrollbar-width: none;  Firefox */
        }

        /* Ensure the html and body take up full height */
        html, body {
            /* height: 100%; */
            /* overflow-y: auto; */
        }
        .container {
            position: relative;
            width: 50%;
            margin: 0 auto;
            background-color: var(--background-color);
            color: var(--text-color);
            padding: 2rem;
            border: 2px dashed var(--border-color);
        }
        h1 {
            font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
            color: var(--text-color);
            font-size: 3em;
        }

        h2 {
            font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
            font-size: 2em;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 2em;
            margin-bottom: 1em;
            table-layout: fixed;
        }


        th, td {
            padding: 10px;
            text-align: left;
            max-width: 100px;
            border: 2px solid #000000;
        }
        td {
            font-family: 'Courier Prime', monospace;
            font-family: 'Noto Sans Mono', monospace;
        }
        th {
            font-family: 'Noto Sans Mono', monospace;
            font-weight: bold;
            background-color: var(--lifted-background-color);
        }
        

        table {
            width: 100%;
            max-width: 100%;
            table-layout: fixed;
            white-space: wrap;
        }

        td, th {
            padding: 0;
            overflow-wrap: break-word;
            word-wrap: break-word;
            word-break: break-word;
            white-space: normal;
            border: 2px solid var(--dimmer-border-color-a);
        }

        .character {
            font-size: 1.4em;
            font-weight: 400;
            cursor: pointer;
            text-overflow: none;
        }
        
        /* .container {
            overflow-x: auto;
            scrollbar-width: none;  
            -ms-overflow-style: none; 
        }
        .container::-webkit-scrollbar {
            display: none; 
        } */

        .settings-container {
            width: 90%;
            max-width: 1200px;
            margin: 0 auto 20px auto;
            background-color: #ffffff;
            padding: 1rem;
            border: 2px dashed #000000;
        }
        .settings-form {
            display: flex;
            align-items: center;
            justify-content: flex-start; /* Changed to align items to the left */
            font-size: 16px; /* Increased font size */
        }
        .settings-form label {
            margin-right: 10px;
            /* white-space: nowrap;  */
        }
        .settings-form input {
            width: 80px; /* Slightly increased width */
            padding: 5px 10px;
            border: 2px solid #000000; /* Changed to 2px solid black */
            font-family: 'Noto Sans Mono', monospace;
            font-size: 16px; /* Increased font size */
            margin-right: 10px; /* Added margin to separate from button */
        }
        .settings-form button {
            padding: 5px 10px;
            background-color: #ffffff;
            border: 2px solid #646464;
            cursor: pointer;
            font-family: 'Noto Sans Mono', monospace;
            font-size: 16px;
            -webkit-tap-highlight-color: transparent; /* Removes the tap highlight on iOS */
            user-select: none; /* Prevents text selection */
            touch-action: manipulation; /* Improves touch event handling */
        }

        .settings-form button:active {
            background-color: #ffffff;
            color: #101010;
        }


        /* For browsers that support :focus-visible */
        .settings-form button:focus:not(:focus-visible) {
            outline: none;
        }

        .settings-form button:focus-visible {
            outline: 2px solid #000000;
        }

        .varvar {
            display: none;
        }
/* 
        td:nth-child(1), th:nth-child(1) { width: 20%; }
        td:nth-child(2), th:nth-child(2) { width: 20%; }
        td:nth-child(3), th:nth-child(3) { width: 20%; }
        td:nth-child(4), th:nth-child(4) { width: 20%; }
        td:nth-child(5), th:nth-child(5) { width: 15%; }
        td:nth-child(6), th:nth-child(6) { width: 5%; } */


        td:nth-child(1), th:nth-child(1) { width: 95%; }
        td:nth-child(2), th:nth-child(2) { width: 5%; }

        @media (max-width: 1024px) {
            .container {
                width: 100%;
            }

            h1 {
                font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
                color: var(--text-color);
                font-size: 3em;
            }

            table {
                font-size: 1rem;
            }

            .character {
                font-size: 1.4em;
            }
        }
        
        @media (max-width: 1024px) {
            .settings-container {
                width: 100%;
                padding: 0.5rem;
            }
            .settings-form {
                flex-direction: row;
                flex-wrap: wrap;
                justify-content: space-between;
            }
            .settings-form label {
                width: 100%;
                margin-bottom: 10px;
            }
            .settings-form input {
                width: calc(60% - 5px);
                margin-right: 0;
            }
            .settings-form button {
                width: calc(40% - 5px);
            }
        }

        @media (max-width: 768px) {
            .varvar{
                display: none;
            }

            .container {
                padding: 0;
                border: none;
            }



            td:nth-child(1), th:nth-child(1) { width: 85%; }
            td:nth-child(2), th:nth-child(2) { width: 15%; }
        }

        @media (max-width: 1433px) {

            .container {
                width: 100%;
            }

        }

        ::selection {
        }

        .highlight {
            display: inline-block;
            background-color: #ff3c00; /* Light yellow background */
            padding: 2px 5px;
            font-weight: bold;
            color: #ffffff;
        }

        .deck-highlight {
            display: inline-block;
            background-color: #ff3c00; /* Light blue background */
            padding: 2px 5px;
            font-weight: bold;
            color: #ffffff;
        }

        
        .next-review-date {
            position: relative;
            cursor: pointer;
        }
        a {
        }
        
        .due-date {
            color: #ff0000;
            cursor: default;
        }
        
        .due-date.darkmode {
            color: #ffc1c1;
            cursor: default;
        }



        #saveButton {
            color: rgb(0, 0, 0);
            border-color: #646464;
            background-color: #ffffff;
            width: 7%;
            min-width: 70px;
        }

        .tooltip-header {
            white-space: wrap;
            line-height: 2rem;
            padding-left: .5rem;
        }

        #maxNewCards {
            border-color: #646464;
        }
       
        #pinyin-hover-box {
            position: absolute;
            background-color: var(--dimmer-background-color);
            border: none;
            color: var(--dimmer-text-color);
            padding: 10px;
            border-radius: 4px;
            box-shadow: 0 2px 5px #00000033;
            font-size: .8em;
        }

        #flashcard_overlay {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.27);
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }

        .remove-card {
            cursor: pointer;
            text-align: center;
            align-items: center;
            margin: 0 auto;
            color: var(--dimmer-text-color);
        }

        .trash-iconw {
            display: block;
            width: 1em;
            height: 1em;
            margin: auto;
        }

        .trash-iconb {
            display: none;
            width: 0;
            height: 0;
            padding: 0;
            margin: 0;
        }

        .trash-iconw.darkmode {
            display: none;
            width: 0;
            height: 0;
            padding: 0;
            margin: 0;
        }

        .trash-iconb.darkmode {
            display: block;
            width: 1em;
            height: 1em;
            margin: auto;
        }

        form {
            display: flex;
            flex-direction: row; /* Change from column to row */
            align-items: center; /* Center vertically */
            width: 100%;
        }

        #wordForm {
            margin: 1em 0em;
        }

        #newWords {
            color: var(--text-color);
            outline: none;
            position: relative;
            background-color: var(--newwords-background-color);
            width: 100%;
            max-width: 400px;
            padding: 10px;
            margin-right: .5em;
            border: 2px solid var(--newwords-border-color);
            font-size: 1em;
            font-family: inherit;
        }


        #newWords::placeholder {
            font-style: italic;
            font-size: 0.8em;
            color: var(--text-color);
            opacity: 0.85;
        }

        #newWords.darkmode::placeholder {
            color: var(--text-color);
        }

        #addWordButton {
            padding: 0px;
            background-color: var(--text-color);
            background-color: var(--dimmer-background-color);
            color: var(--dimmer-background-color);
            color: var(--dimmer-text-color);
            border: 2px solid var(--dimmer-border-color);
            cursor: pointer;
            font-size: 1em;
            width: 2em;
            height: 2em;
            opacity: 0.9;
            font-family: inherit;
            -webkit-tap-highlight-color: transparent;
            -webkit-appearance: none;
            appearance: none;
        }

        @media (max-width: 768px) {
            form {
                flex-direction: row;
            }

            #newWords {
                max-width: none;
                width: 80%;
                margin-right: 10px;
            }
        }

        #word-sets {
            background-color: var(--dimmer-background-color);
            padding: 1em;
        }

        .practice-icon {
            display: inline-block;
            text-align: center;
            width: 1.4em;
            min-width: 1.4em;
        }

        .practice-label {
            opacity: .5;
        }


        
        .wlink-wrapper {
            width: 100%;
            margin: .5em 0;
        }

        .alinks {
            display: inline-flex;
            align-items: center; /* Ensures vertical centering */
            color: var(--text-color);
            text-decoration: none;
            background-color: var(--dimmer-background-color);
            padding: 0px 1em; /* Adjust padding for better visual */
        }


        .wlinks {
            color: var(--text-color);
            text-decoration: none;
            background-color: var(--dimmest-background-color);
            display: block;
            padding: 0px .2em;
        }

        .wlinks:hover, .alinks:hover {
            background-color: var(--accent-color);
            color: var(--background-color);
        }

        .stat-row {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            width: 100%;
            padding: .2em .4em;
            line-height: 2rem;
        }

        .oddrow {
            background-color: var(--lifted-background-color);
        }

        .stat-hanzi {
        }

        .stat-pinyin {
            font-style: italic;
        }

        .stat-hanzi-pinyin {
            flex: 1;
            display: flex;
            flex-direction: row;
            justify-content: space-between;
        }

        .stat-pinyin, .stat-english {
            font-size: .8rem;
            transform: translateY(.4em);
            text-align: right;
            opacity: 0.7;
        }

        .stat-english {
            flex: 3;
            padding-left: 10%;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        @media screen and (max-width: 768px) {
            h1 {
                font-size: 2em;
                margin-top: 1em;
            }
            .stat-hanzi-pinyin {
                flex: 1;
            }

            .stat-english {
                flex: 2;
                display: none;
            }
        }

        #logoutButton {
            font-size: 1.5em;
        }

        #logoutButton.mobile {
            /* position: static;
            top: auto;
            right: auto;
            font-size: 1em;
            padding: 0;
            cursor: pointer; */
        }

        #accountLine {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        #addwordInfo {
            font-size: 1em;
            opacity: .35;
            margin-left: 1em;
            cursor: pointer;
        }

        .google-link {
        }


        .google-icon {
            width: 1em; 
            height: 1em;
            vertical-align: middle;
            transform: translateY(-.1em);
        }

        .delete-icon {
            color: var(--delete-icon-color);
        }

        :root {
            --code-color: #584a5f;
            --code-background-color: #93b1a063;
        }

        .darkmode {
            --code-color: #93b1a0;
            --code-background-color: #9881a363;
        }

        .codeBlock {
            padding: .4em;
            background-color: var(--code-background-color);
            color: var(--code-color);
        }

        #wordset-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        #copyList {
            cursor: pointer;
            color: var(--dimmer-text-color);
            font-size: 1.5em;
        }
</style>
<div class="container">
        
<h1 style="display: flex; align-items: center; flex-wrap: wrap;">
    <div style="display: flex; align-items: center; margin-right: 10px;">
        ${profile_pic ? `<img src="${profile_pic}" alt="profile picture" style="width: 1.5em; height: 1.5em; border-radius: 50%;">` : ''}
    </div>
    <span>${username}'s space</span>
</h1>
  
<div style="border-top: 2px dashed var(--dimmer-border-color); margin-bottom: 2em;"></div>
<div style="padding-left: 0.0em; display: flex; justify-content: space-between;">
    <a class="alinks" href="${accountManagementUrl}">Manage account</a>
    <a href="${logoutUrl}" id="logoutButton"><i class="fa-solid fa-right-from-bracket"></i></a>
</div>

<h2>Word lists</h2>

<div id="word-sets">
    
    <div id="wordset-row">
        <div id="wordset-label-container">
            <div id="wordListDropdown" class="custom-dropdown-trigger">
                <span class="dropdown-text">Select a word list</span> <i class="fas fa-caret-right"></i>
            </div>
            <span id="removeListBtn"><i class="fas fa-xmark"></i></span>
            <span id="renameListBtn"><i class="fas fa-file-signature"></i></span>
        </div>
        <div id="copyList"><i class="fa-solid fa-copy"></i></div>
    </div>
    <div id="dropdown-options" class="dropdown-menu" style="display: none;"></div>

    <form id="wordForm" onsubmit="handleAddCards(event)">
        <label for="newWords" style="padding-right: 1em;">Add: </label>
        <input type="text" name="query" id="newWords" placeholder="a word or a list of words">
        <input id="addWordButton" type="submit" value="+">
        <span id="addwordInfo"><i class="fa-solid fa-circle-question"></i></span>
    </form>

    <div style="padding-left: 0.0em; display: none;" id="numcards">Words in list: </div>

    <div class="wlink-wrapper">
        <a class="wlinks" id="listLink">
            <span class="practice-icon"><i class="fas fa-list"></i></span> <span class="practice-label">Table view</span>
        </a>
    </div>

    <div class="wlink-wrapper">
        <a class="wlinks" id="gridLink">
            <span class="practice-icon"><i class="fas fa-braille"></i></span> <span class="practice-label">Grid view</span>
        </a>
    </div>

    <div style="padding-top: .5em;"></div>

    <div class="wlink-wrapper">
        <a class="wlinks" id="flashcardsLink">
            <span class="practice-icon"><i class="fas fa-eye"></i></span> <span class="practice-label">Flashcards </span>
        </a>
    </div>
    <div class="wlink-wrapper">
        <a class="wlinks" id="hanziWritingLink">
            <span class="practice-icon"><i class="fas fa-pen"></i></span> <span class="practice-label">Writing </span>
        </a>
    </div>

    <div class="wlink-wrapper">
        <a class="wlinks" id="pinyinChoiceLink">
            <span class="practice-icon"><i class="fas fa-keyboard"></i></span> <span class="practice-label">Choice puzzle </span>
        </a>
    </div>
    <div class="wlink-wrapper">
        <a class="wlinks" id="pinyinTableLink">
            <span class="practice-icon"><i class="fas fa-i-cursor"></i></span> <span class="practice-label">Input puzzle </span>
        </a>
    </div>

    <table id="wordlist-table">
        <tr>
            <th class="tooltip-header" data-tooltip="The Chinese character being learned">Characters</th>
            <th class="tooltip-header varvar" data-tooltip="Current learning stage of the character (%)">Learned</th>
            <!-- <th class="tooltip-header" data-tooltip="Measure of how challenging this character is for the user">Difficulty</th> -->
            <th class="tooltip-header varvar" data-tooltip="Number of consecutive correct answers">Streak</th>
            <th class="tooltip-header varvar" data-tooltip="Total number of incorrect answers for this character">Incorrect</th>
            <th class="tooltip-header varvar" data-tooltip="Scheduled date and time for the next review">Next Review</th>
        </tr>
           
    </table>
</div>
</div>
`

// routes/account.js
export function renderAccount() {
    return html;
}
