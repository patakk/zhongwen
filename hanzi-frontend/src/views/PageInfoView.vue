<template>
  <BasePage page_title="Info" /> 
 <div class="content">hell</div> 
</template>

<script>
import PreloadWrapper from '../components/shared/PreloadWrapper.vue';
import BasePage from '../components/layout/BasePage.vue';

export default {
  name: 'PageInfoView',
  components: {
    PreloadWrapper,
    BasePage
  }
}
</script>

<style scoped>
.content {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}
</style>
