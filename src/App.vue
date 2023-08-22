<script lang="ts" setup>
import {onMounted} from "vue";
import DrawMapLeaflet from "./components/drawMap";


onMounted(() => {
  new DrawMapLeaflet({
    el: document.getElementById('mapContainer'),
    drawType: "polygon",
    onChange: (data) => {
      console.log(data);
    },
    onError: (type, err) => {
      console.log(type, err);
    },
    onMapLoad: (map, L) => {
      console.log(map, L);
    }
  })
})
</script>

<template>
  <div id="mapContainer" style="width: 100vw;height: 100vh"></div>
</template>

<style scoped>

</style>
