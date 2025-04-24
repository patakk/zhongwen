<template>
  <BasePage page_title="About" />
  <div class="container">
    <div class="about-section">
      <p>
        This is a personal learning tool I'm developing alongside my Mandarin Chinese 
        studies. 
        I've made it public hoping others might find it useful too, but please keep in mind that this is a work in progress and may contain errors or incomplete features. Your feedback and contributions are welcome!
      </p>
      <br />
      <p>
        <!-- Start <router-link class="links" to="/">here</router-link> to access the main features of the website. -->
      </p>
      <br />
      <div class="contact-info">
        <div>Contact:</div>
        <ul>
          <li>Email: <a class="links" href="mailto:paolo@patakk.xyz">paolo@patakk.xyz</a></li>
          <li style="padding-top:5px;">Twitter: <a class="links" href="https://twitter.com/patakk" target="_blank">@patakk</a></li>
        </ul>
      </div>
    </div>
    <div class="attribution-section">
      <h1>Licensing and Attribution</h1>
      <ul>
        <li>
          <div class="subheader">Data Sources and Licensing</div>
          <div class="flashcard-guide">
            <p>
              <span class="smallh">Chinese-English translations:</span><br />
              <p style="margin-left:20px;">CC-CEDICT database, licensed under a <a class="links" href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank">Creative Commons Attribution-ShareAlike 4.0 International License</a>. <br> Dictionary operations perfomed using a modified version of the <a class="links" href="https://github.com/Synkied/hanzipy" target="_blank">hanzipy</a> library.</p>
              <br />
              <span class="smallh">Character animations and Hanzi writing:</span>
              <p style="margin-left:20px;">Custom implementation using data from <a class="links" href="https://github.com/chanind/hanzi-writer-data" target="_blank">hanzi-writer-data</a> and the <a class="links" href="https://github.com/skishore/makemeahanzi" target="_blank">Make Me A Hanzi project</a>, using Arphic Technology fonts under the <a class="links" href="/static/licenses/ARPHICPL.TXT" target="_blank">Arphic Public License</a>.</p>
              <br />
              <span class="smallh">Chinese-English examples:</span><br />
              <p style="margin-left:20px;">Provided by <a class="links" href="https://tatoeba.org" target="_blank">Tatoeba.org</a>, licensed under <a class="links" href="https://creativecommons.org/licenses/by/2.0/fr/" target="_blank">Creative Commons Attribution 2.0 FR</a>.</p>
            </p>
          </div>
        </li>
        
        <!-- <li> <div class="subheader">Content Generation and Disclaimer</div>
          <div class="flashcard-guide">
            <p>
              Character descriptions and examples are generated using Claude AI by Anthropic. While we strive for accuracy, all content on this website is provided "as is" without warranty
              of any kind. Users are encouraged to independently verify information for their specific needs.
            </p>
            <p>
              By using this website, you acknowledge and accept these terms.
            </p>
          </div>
        </li> -->
        <li>
          <div class="subheader">Project License</div>
          <div class="flashcard-guide">
            <p>
              This project is available under the <a class="links" href="/static/licenses/MIT-LICENSE.TXT" target="_blank">MIT License</a>. You are free to use, modify, and distribute it, provided you include the original copyright notice and license terms.
            </p>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import BasePage from '../components/BasePage.vue';

export default {
  name: 'AboutView',
  components: {
    BasePage
  },
}
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.container {
  width: 60%;
  max-width: 1200px;
  padding: 2rem;
  overflow-y: auto;
  max-height: 90vh;
  margin: 2em auto;
  scrollbar-width: none; /* For Firefox */
  background: color-mix(in oklab, var(--fg) 5%, var(--bg) 80%);
  -ms-overflow-style: none; /* For Internet Explorer and Edge */
}

.container::-webkit-scrollbar {
  display: none; /* For Chrome, Safari, and Opera */
}

h1 {
  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
  color: var(--fg);
  font-size: 2em;
  margin-top: 0;
}

li:not(:last-child) {
  margin-bottom: 0px;
}

.btn-container {
  text-align: center;
  margin-top: 1rem;
}

.btn {
  display: inline-block;
  padding: 10px 20px;
  background-color: var(--bg);
  color: var(--fg);
  text-decoration: none;
  border: 2px solid var(--fg);
  font-weight: bold;
}

.btn:hover {
  background-color: var(--fg);
  color: var(--bg);
}

.flashcard-guide {
  background-color: color-mix(in oklab, var(--fg) 5%, var(--bg) 80%);
  border: none;
  padding: 10px;
  width: 90%;
  margin: 20px auto;
  opacity: 0.8;
}

.smallh {
  opacity: 0.65;
  font-weight: 600;
}

.flashcard-guide li:not(:last-child) {
  margin-bottom: 4px;
}

.flashcard-guide h4,
.flashcard-guide h5 {
  margin-top: 0;
}

.flashcard-guide ul {
  /* padding-left: 20px; */
}

ul {
  list-style-type: none;
  /* padding-left: 1.5em; */
}

.subheader {
  margin-top: 2em;
  margin-bottom: 1em;
  font-size: 1.3rem;
  font-weight: 600;
  color: var(--heading-color, var(--fg));
}

.links {
  color: var(--secondary-color);
  text-decoration: none;
}

.links:hover {
  text-decoration: underline;
}

.contact-info ul {
  list-style-type: none;
  padding-left: 1rem;
  margin-top: 0.5rem;
}

@media (max-width: 784px) {
  .container {
    width: 95%;
    height: 100%;
    border: none;
    max-height: none;
    padding: 1rem;
    margin: auto;
    margin-top: 2em;
  }

  .btn {
    padding: 8px 16px;
  }

  .flashcard-guide {
    width: 100%;
    padding: 1em;
    margin: 5px auto;
    margin-bottom: 14px;
  }

  .flashcard-guide ul {
    padding-left: 5px;
  }

  ul {
    padding-left: 0em;
  }
}
</style>
