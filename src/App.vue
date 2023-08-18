<script lang="ts" setup>
import {onMounted} from "vue";
import DrawMapLeaflet from "./components/drawMap";


onMounted(() => {
  new DrawMapLeaflet({
    el: document.getElementById('mapContainer'),
    drawType: "polygon",
    drawOptions: {
      value: {
        "type": "FeatureCollection",
        "features": [
          {
            "type": "Feature",
            "properties": {
              "fill-color": "rgba(29,252,0,1)",
              "fill-opacity": 0.8,
              "line-color": "rgba(252, 106, 0,1)",
              "line-opacity": 1,
              "line-width": 2,
              "center": "{\"wgs84\":[106.5457535,29.578972],\"bd09\":[106.55591133089942,29.58241438029955],\"gcj02\":[106.54948307600513,29.576140909826528]}"
            },
            "geometry": {
              "type": "Polygon",
              "coordinates": [
                [
                  [
                    106.580772,
                    29.621818
                  ],
                  [
                    106.638451,
                    29.584206
                  ],
                  [
                    106.564636,
                    29.536126
                  ],
                  [
                    106.458549,
                    29.540606
                  ],
                  [
                    106.453056,
                    29.569874
                  ],
                  [
                    106.461983,
                    29.596148
                  ],
                  [
                    106.514511,
                    29.603909
                  ],
                  [
                    106.540947,
                    29.620624
                  ],
                  [
                    106.580772,
                    29.621818
                  ]
                ]
              ]
            }
          }
        ]
      }
    },

    onChange: (data) => {
      console.log(data);
    }
  })
})
</script>

<template>
  <div id="mapContainer" style="width: 100vw;height: 100vh"></div>
</template>

<style scoped>

</style>
