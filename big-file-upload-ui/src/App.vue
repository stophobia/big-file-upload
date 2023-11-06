<script setup lang="ts">
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://vuejs.org/api/sfc-script-setup.html#script-setup
// import HelloWorld from './components/HelloWorld-store.vue'
</script>

<template>
  <!-- <HelloWorld /> -->
  <!-- <p> -->
    <!-- Navigation using router-link component -->
    <!-- Specify the link by passing `to` -->
    <!-- `<router-link>` will render a `<a>` tag with the correct `href` attribute -->
    <!-- <router-link to="/">Go to Home</router-link>
    <router-link to="/about">Go to About</router-link>
  </p> -->
  <!-- routing exit -->
  <!-- Components matched by the route will be rendered here -->
  <router-view></router-view>
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
}

.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}

.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
