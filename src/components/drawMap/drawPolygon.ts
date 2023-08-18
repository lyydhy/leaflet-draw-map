import {CrsType} from "./interface.ts";
import {ToolBox} from "./toolBox.ts";
// @ts-ignore
import type {GeoJSON, Marker, Polygon} from "leaflet"

import {initDefaultProps} from "./utils.ts";
import {colorTransform} from './colorUtil.ts'
import {bd09togcj02, bd09towgs84, gcj02tobd09, gcj02towgs84, wgs84tobd09, wgs84togcj02} from "./coord_transform.ts";
import ColorPicker from "./colorPicker.ts";

export interface drawStyle {
  color?: string,
  opacity?: number,
}

export interface polygonStyle extends drawStyle {

}

export interface lineStyle extends drawStyle {
  // 粗细
  width?: number
  // 线条类型
  type?: 'solid' | 'dashed'
}

export interface DrawPolygonOptions {
  map?: any
  // crs
  crs?: CrsType

  style?: {
    lineStyle?: lineStyle,
    polygonStyle?: polygonStyle
  },

  value?: GeoJSON.FeatureCollection

  // change事件
  onChange?: (value: GeoJSON.FeatureCollection | undefined) => void
}

export class DrawPolygon {
  options: DrawPolygonOptions
  points: any[] = [] // 画的过程中的点
  lines: object = {} // 画的过程中生成的多边形
  tempLines: object = {} // 鼠标移动中生成的多边形（实际是一条线段）
  polygonList: Polygon | undefined = undefined // 双击结束生成多边形
  facelines: any[] = [] // 存储画的多边形
  facetempLines: any[] = [] // 存储移动的多边形
  facepolygonList: any[] = [] // 存储结束生成的多边形
  markers: Marker[] = [] // 记录所有的marker
  hoverMarker: Marker | null = null // 鼠标移动时的marker
  polygonStyle: polygonStyle = {} // 多边形样式
  lineStyle: lineStyle = {} // 线段样式

  constructor(options: DrawPolygonOptions) {
    this.options = options
    this.initStyle()
    if (!!options.value) {
      this.initDefaultValue()
    }
    this.createControl()
  }

  /**
   * 初始化默认值
   */
  initDefaultValue() {
    const that = this
    this.initStyle()
    let {features} = this.options.value as GeoJSON.FeatureCollection
    features.forEach((item: any) => {
      let geometry = item.geometry
      let coordinates = geometry?.coordinates
      if (item.properties) {
        if (item.properties['fill-color']) {
          this.polygonStyle.color = item.properties['fill-color']
        }
        if (item.properties['fill-opacity']) {
          this.polygonStyle.opacity = item.properties['fill-opacity']
        }
        if (item.properties['line-color']) {
          this.lineStyle.color = item.properties['line-color']
        }
        if (item.properties['line-opacity']) {
          this.lineStyle.opacity = item.properties['line-opacity']
        }
        if (item.properties['line-width']) {
          this.lineStyle.width = item.properties['line-width']
        }
        initStyle()
      }
      this.points = []
      coordinates.forEach((item1: any) => {
        item1.forEach((item2: any) => {
          let center =item2.reverse()
          switch (this.options.crs) {
            case 'wgs84':
              break;
            case 'gcj02':
              center = gcj02towgs84(center[0], center[1])
              break;
            case 'bd09':
              center = bd09towgs84(center[0], center[1])
              break;
          }
          this.points.push(center)
          // this.lines.addLatLng(item2)
        })
      })
      // this.options.map?.addLayer(this.lines)
      // this.facelines.push(this.lines)
      this.endDraw()
    })
    initStyle()

    function initStyle() {
      that.lineStyle = initDefaultProps(that.lineStyle, {
        color: "rgb(252, 106, 0)",
        opacity: 1,
        type: 'solid',
        width: 2
      })
      that.polygonStyle = initDefaultProps(that.polygonStyle || {}, {
        color: "rgb(252, 106, 0)",
        opacity: 1,
      })
    }
  }


  // 初始化样式
  initStyle() {
    this.lineStyle = initDefaultProps(this.options.style?.lineStyle || {}, {
      color: "rgb(252, 106, 0)",
      opacity: 1,
      type: 'solid',
      width: 2
    })
    this.polygonStyle = initDefaultProps(this.options.style?.polygonStyle || {}, {
      color: "rgb(252, 106, 0)",
      opacity: 1,
    })
  }

  // 2. 绘制
  createFace() {
    let {hoverMarker, options} = this
    this.removePolygon()
    this.lines = window.L.polyline([], {
      color: colorTransform(this.lineStyle.color as string, 1),
    })
    this.tempLines = window.L.polyline([], {
      color: colorTransform(this.lineStyle.color as string, 1),
    })
    this.options.map?.addLayer(this.lines)
    this.options.map?.addLayer(this.tempLines)

    this.options.map?.on('click', (e: any) => {
      if (hoverMarker) {
        this.points.push([hoverMarker.getLatLng().lat, hoverMarker.getLatLng().lng])
        // @ts-ignore
        this.lines.addLatLng(hoverMarker.getLatLng())
        this.options.map?.addLayer(this.lines)
        this.facelines.push(this.lines)
        this.endDraw()
        return
      }
      this.points.push([e.latlng.lat, e.latlng.lng])
      // @ts-ignore
      this.lines.addLatLng(e.latlng)
      this.options.map?.addLayer(this.lines)
      this.facelines.push(this.lines)

      // let icon_child = document.createElement('div')
      // iconBox.appendChild(icon_child)

      let marker = createIcon.call(this, e.latlng)


      this.markers.push(marker)

    })
    this.options.map?.on('mousemove', (e: any) => {

      if (this.points.length > 0) {
        // @ts-ignore
        this.tempLines.setLatLngs([this.points[this.points.length - 1], [e.latlng.lat, e.latlng.lng]])
        this.options.map?.addLayer(this.tempLines)
        this.facetempLines.push(this.tempLines)
      }
    })
    this.options.map?.on('dblclick', () => {
      this.endDraw()
    })

    function createIcon(latlng: any) {
      let iconBox = document.createElement('div')

      let iconDive = window.L.divIcon({
        html: iconBox,
        className: 'polygon_icon',
        iconSize: [12, 12]
      })
      // 绘制起点图标
      let marker = window.L.marker(latlng, {
        icon: iconDive,

      })
      marker.on('mousemove', () => {
        // @ts-ignore
        hoverMarker = marker
      })
      marker.on('mouseout', () => {
        // @ts-ignore
        hoverMarker = null
      })
      // @ts-ignore
      marker.addTo(options.map)
      return marker
    }
  }

  // 完成绘制
  endDraw() {
    this.polygonList = window.L.polygon([this.points], {
      color: colorTransform(this.lineStyle.color as string, 1),
      opacity: this.lineStyle.opacity,
      weight: this.lineStyle.width,
      fillColor: colorTransform(this.polygonStyle.color as string, 1),
      fillOpacity: this.polygonStyle.opacity
    })


    // @ts-ignore
    this.polygonList?.addTo?.(this.options.map)
    this.options.map?.addLayer(this.polygonList)
    this.facepolygonList.push(this.polygonList)
    this.points = []
    // @ts-ignore
    this.tempLines?.setLatLngs?.([])
    // @ts-ignore
    this.lines?.setLatLngs?.([])
    this.endDrawChange()
  }

  /**
   * change
   */
   endDrawChange() {
    if (!this.polygonList) return
    let feature = (this.polygonList as Polygon)?.toGeoJSON()
    feature.properties = {
      ...feature.properties,
      "fill-color": colorTransform(this.polygonStyle.color as string, 1),
      "fill-opacity": this.polygonStyle.opacity,
      "line-color": colorTransform(this.lineStyle.color as string, 1),
      "line-opacity": this.lineStyle.opacity,
      "line-width": this.lineStyle.width,
      "center": {}
    }
    let features = this.featureTransform({
      type: 'FeatureCollection',
      features: [
        feature
      ]
    })
    let centerLatLng = window.L.geoJSON(features).getBounds().getCenter()
    let centerArr = [centerLatLng.lng, centerLatLng.lat]
    let center: {
      [key: string]: number[]
    } = {
      wgs84: [],
      bd09: [],
      gcj02: []
    }
    switch (this.options.crs) {
      case "wgs84":
        center["wgs84"] = centerArr
        center["bd09"] = wgs84tobd09(centerArr[0], centerArr[1])
        center["gcj02"] = wgs84togcj02(centerArr[0], centerArr[1])
        break;
      case "bd09":
        center["wgs84"] = bd09towgs84(centerArr[0], centerArr[1])
        center["bd09"] = centerArr
        center["gcj02"] = bd09togcj02(centerArr[0], centerArr[1])
        break;
      case "gcj02":
        center["wgs84"] = gcj02towgs84(centerArr[0], centerArr[1])
        center["bd09"] = gcj02tobd09(centerArr[0], centerArr[1])
        center["gcj02"] = centerArr
        break;
    }
    // @ts-ignore
    features.features[0].properties.center = JSON.stringify(center)
    this.options.onChange?.(features)
    this.options.map?.off('click')
  }

  // 转换坐标系
  featureTransform(obj: GeoJSON.FeatureCollection): GeoJSON.FeatureCollection {
    if (this.options.crs === 'wgs84') return obj
    obj.features = obj.features.map((item: GeoJSON.Feature) => {
      // @ts-ignore
      item.geometry.coordinates = item.geometry.coordinates.map((item1: any) => {
        item1 = item1.map((item2: number[]) => {
          switch (this.options.crs) {
            case 'gcj02':
              return wgs84togcj02(item2[0], item2[1])
            case 'bd09':
              return wgs84tobd09(item2[0], item2[1])
          }
          return item2
        })
        return item1
      })
      return item
    })
    return obj
  }

  removePolygon() {
    this.points.forEach(item => {
      this.options.map?.removeLayer(item)
    })
    this.facelines.forEach(item => {
      this.options.map?.removeLayer(item)
    })
    this.facetempLines.forEach(item => {
      this.options.map?.removeLayer(item)
    })
    this.facepolygonList.forEach(item => {
      this.options.map?.removeLayer(item)
    })
    this.markers.forEach(item => {
      item?.removeFrom(this.options.map)
    })
    this.points = []
    this.facelines = []
    this.facetempLines = []
    this.facepolygonList = []
    this.markers = []

  }

  createControl() {

    new ToolBox({
      map: this.options.map,
      menus: [
        {
          name: "区域颜色",
          attrs: {
            class: 'polygon_color_btn',
            style: `color: ${this.polygonStyle.color}`
          },
          onClick: (_, _dom) => {
            new ColorPicker(this.polygonStyle.color as string, this.polygonStyle.opacity, (color: string, opacity: number) => {

              this.polygonStyle.color = colorTransform(color, opacity)
              _dom.style.color = colorTransform(color, opacity)
              // @ts-ignore
              this.polygonStyle.opacity = opacity
              this.polygonList?.setStyle({
                color: this.lineStyle.color,
                opacity: this.lineStyle.opacity,
                weight: this.lineStyle.width,
                fillColor: colorTransform(this.polygonStyle.color as string, 1),
                fillOpacity: this.polygonStyle.opacity
              })
              this.endDrawChange()

            })
          }
        },
        {
          name: "线条颜色",
          attrs: {
            class: 'line_color_btn',
            style: `color: ${this.lineStyle.color}`
          },
          onClick: (_, _dom) => {

            new ColorPicker(this.lineStyle.color as string, this.lineStyle.opacity, (color: string, opacity: number) => {

              this.lineStyle.color = colorTransform(color, opacity)
              _dom.style.color = colorTransform(color, opacity)
              // @ts-ignore
              this.lineStyle.opacity = opacity
              this.polygonList?.setStyle({
                color: this.lineStyle.color,
                opacity: this.lineStyle.opacity,
                weight: this.lineStyle.width,
                fillColor: colorTransform(this.polygonStyle.color as string, 1),
                fillOpacity: this.polygonStyle.opacity
              })
              this.endDrawChange()

            })
          }
        },

        {
          name: "绘制",
          attrs: {
            class: 'draw_start_btn'
          },
          onClick: (_, _dom) => {
            if (_dom.classList.contains('active')) {
              return
            }
            _dom.classList.add('active')
            this.createFace()
          }
        },
        {
          name: "删除",
          attrs: {
            class: 'remove_btn'
          },
          onClick: (_, _dom, container) => {
            this.removePolygon()
            this.options.onChange?.(undefined)
            container.querySelector('.draw_start_btn')?.classList.remove('active')
          }
        },
      ]
    })

    // new ToolBox({
    //   map: this.options.map,
    //   position: "bottomleft",
    //   menus: [
    //     {
    //
    //     }
    //   ]
    // })
  }
}
