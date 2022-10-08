<script setup lang="ts">


</script>

<template>
  <div>
    <p>
      <!--使用 router-link 组件进行导航 -->
      <!--通过传递 `to` 来指定链接 -->
      <!--`<router-link>` 将呈现一个带有正确 `href` 属性的 `<a>` 标签-->
      <!-- <router-link to="/">Go to Home</router-link> -->
      <router-link to="/serial">big file upload serial</router-link>
    <p></p>
    <router-link to="/concurrent">big file upload concurrent</router-link>
    <p></p>
    <router-link to="/queue">big file upload queue</router-link>
    <p></p>
    <router-link to="/hook">big file upload hook</router-link>
    <p></p>
    <router-link to="/task">big file upload task</router-link>
    <p></p>
    <router-link to="/store">big file upload store</router-link>
    </p>
  </div>
</template>