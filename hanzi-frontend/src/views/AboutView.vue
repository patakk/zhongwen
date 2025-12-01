<template>
  <BasePage page_title="About" />
  <div class="container">
    <div class="about-section">
      <div>
        <i>hanzi.abcrgb.xyz</i> is a work in progress and may contain errors or incomplete features.  <br />
        Your feedback, suggestions and contributions are welcome!
      </div>
      <br />
      <a href='https://ko-fi.com/U7U01BB9OI' target='_blank'><img height='36' style='border:0px;height:36px;' src='https://storage.ko-fi.com/cdn/brandasset/v2/kofi_symbol.png' border='0' alt='contribute' /></a>
      <br />
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
      <div class="licensing">Licensing and Attribution</div>
      <ul>
        <li>
          <div class="about-section">
            <div>
              <span class="smallh">Chinese-English translations:</span><br />
              <p style="margin-left:20px;">
                CC-CEDICT database, licensed under a 
                <a class="links" href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank">
                  Creative Commons Attribution-ShareAlike 4.0 International License
                </a>. <br />
                Dictionary operations performed using a modified version of the 
                <a class="links" href="https://github.com/Synkied/hanzipy" target="_blank">hanzipy</a> library.
              </p>
              <br />
              <span class="smallh">Character animations and Hanzi writing:</span>
              <p style="margin-left:20px;">
                Custom implementation using data from 
                <a class="links" href="https://github.com/chanind/hanzi-writer-data" target="_blank">hanzi-writer-data</a> and the 
                <a class="links" href="https://github.com/skishore/makemeahanzi" target="_blank">Make Me A Hanzi project</a>, using Arphic Technology fonts under the 
                <a class="links" href="/licenses/ARPHICPL.TXT" target="_blank">Arphic Public License</a>.
              </p>
              <p style="margin-left:20px;">
                For character recognition, 
                <a class="links" href="https://github.com/gugray/HanziLookupJS/tree/master">HanziLookupJS</a> by 
                <a class="links" href="https://github.com/gugray">gugray</a> is used. It is based on Jordan Kiang's 
                <a class="links" href="https://kiang.org/jordan/software/hanzilookup/">HanziLookup</a>, which is under 
                <a class="links" href="https://www.gnu.org/licenses/gpl-3.0.html">GNU GPL</a>.
              </p>
              <br />
              <span class="smallh">Chinese-English examples:</span><br />
              <p style="margin-left:20px;">
                Provided by <a class="links" href="https://tatoeba.org" target="_blank">Tatoeba.org</a>, licensed under 
                <a class="links" href="https://creativecommons.org/licenses/by/2.0/fr/" target="_blank">Creative Commons Attribution 2.0 FR</a>.
              </p>
              <br />
              <span class="smallh">OCR (Optical Character Recognition):</span><br />
              <p style="margin-left:20px;">
                <a class="links" href="https://github.com/naptha/tesseract.js" target="_blank">Tesseract.js</a>, a JavaScript port of the Tesseract OCR engine, licensed under
                <a class="links" href="/licenses/Apache-2.0.txt" target="_blank">Apache License 2.0</a>.
              </p>
              <br />
              <span class="smallh">Fonts:</span><br />
              <p style="margin-left:20px;">
                Fusion Pixel font from the <a class="links" href="https://github.com/TakWolf/fusion-pixel-font" target="_blank">fusion-pixel-font</a> project, used under SIL Open Font License 1.1 and MIT (see the project licenses).
              </p>
            </div>
          </div>
        </li>
      </ul>
    </div>
    <div class="commit-info" title="Latest commit hash">
      {{ commitHash }}
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
  data() {
    return {
      commitHash: 'loading...'
    }
  },
  mounted() {
    document.body.classList.add('about-page');
    fetch('/api/version')
      .then(r => r.ok ? r.json() : { commit: 'unknown' })
      .then(data => {
        this.commitHash = data.commit || 'unknown'
      })
      .catch(() => {
        this.commitHash = 'unknown'
      })
  },
  beforeUnmount() {
    document.body.classList.remove('about-page');
  }
};
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.about-section {
  background-color: color-mix(in oklab, var(--fg) 5%, var(--bg) 80%);
  padding: 1rem;

}
.container {
  width: 60%;
  max-width: 1200px;
  padding: 2rem;
  margin: 0 auto;
  box-sizing: border-box;
  scrollbar-width: none; /* For Firefox */
  /* background: color-mix(in oklab, var(--fg) 5%, var(--bg) 80%); */
}

.container::-webkit-scrollbar {
}

h1 {
  font-family: var(--second-font);
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
  border: var(--thin-border-width) solid var(--fg);
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
  width: 100%;
  /* margin: 20px auto; */
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
  padding-left: 0;
}

.subheader {
  margin-top: 2em;
  margin-bottom: 1em;
  font-size: 1.3rem;
  font-weight: 600;
  color: var(--heading-color, var(--fg));
}

.links {
  color: var(--orange);
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

@media (max-width: 1024px) {
  .container {
    width: 95%;
    height: 100%;
    border: none;
    max-height: none;
    padding: 1rem;
    margin-top: 1em;
    margin-bottom: 12em;
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

.licensing {
  border: 0;
  border-top: 2px solid color-mix(in oklab, var(--fg) 11%, var(--bg) 11%);
  font-size: 2em;
  text-align: center;
  font-weight: bold;
  margin: 0;
  padding: 0;
  margin-top: 1em;
  padding-top: 1em;
}

.commit-info {
  text-align: center;
  margin-top: 2em;
  opacity: .6;
  position: fixed;
  bottom: 0;
  right: 0;
  padding: 1em;
  /* left: 50%;
  transform: translateX(-50%); */
}
</style>
