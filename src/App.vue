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
              "center": "{\"wgs84\":[106.5388842359667,29.57652632225334],\"bd09\":[106.54908004761572,29.579908206543568],\"gcj02\":[106.54262829682304,29.573710200401873],\"zoom\":12}"
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
          },
          {
            "type": "Feature",
            "properties": {
              "fill-color": "rgba(0,252,231,1)",
              "fill-opacity": 1,
              "line-color": "rgba(252, 106, 0,1)",
              "line-opacity": 1,
              "line-width": 2,
              "center": "{\"wgs84\":[106.69389211056607,29.63899672992342],\"bd09\":[106.70423778196084,29.64244692965087],\"gcj02\":[106.69779456456307,29.6362570512301],\"zoom\":12}"
            },
            "geometry": {
              "type": "Polygon",
              "coordinates": [
                [
                  [
                    106.672783,
                    29.652852
                  ],
                  [
                    106.721535,
                    29.649869
                  ],
                  [
                    106.704712,
                    29.623609
                  ],
                  [
                    106.675529,
                    29.625101
                  ],
                  [
                    106.672783,
                    29.652852
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
