<template>
  <!-- Empty template - nothing to render -->
</template>

<script>
export default {
  name: 'KofiWidget',
  mounted() {
    // Add global styles to directly control Ko-fi visibility
    this.addKofiStyles();
    
    // Initialize Ko-fi widget once
    this.initKofi();
  },
  methods: {
    // Add direct CSS control styles to document head
    addKofiStyles() {
      // Create style element if it doesn't exist
      if (!document.getElementById('kofi-direct-style')) {
        const style = document.createElement('style');
        style.id = 'kofi-direct-style';
        style.textContent = `
          /* Hide Ko-fi widget by default everywhere */
          .floatingchat-container-wrap {
            display: none !important;
          }
          
          /* Only show Ko-fi widget on About page */
          body.about-page .floatingchat-container-wrap {
            display: block !important;
          }
        `;
        document.head.appendChild(style);
      }
    },
    
    // Initialize Ko-fi widget just once
    initKofi() {
      if (document.getElementById('kofi-widget-script')) {
        return; // Already loaded
      }
      
      const script = document.createElement('script');
      script.id = 'kofi-widget-script';
      script.src = 'https://storage.ko-fi.com/cdn/scripts/overlay-widget.js';
      
      script.onload = () => {
        if (window.kofiWidgetOverlay) {
          window.kofiWidgetOverlay.draw('patakk', {
            'type': 'floating-chat',
            'floating-chat.donateButton.text': 'Contribute',
            'floating-chat.donateButton.background-color': '#222',
            'floating-chat.donateButton.text-color': '#fff',
            'floating-chat.donateButton.windowPosition': 'right'
          });
        }
      };
      
      document.head.appendChild(script);
    }
  }
};
</script>