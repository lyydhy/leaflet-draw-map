import type {DrawPointOptions} from "./drawPoint.ts";
import type {CrsType, ErrorType} from "./interface.ts";
import type {DrawPolygonOptions} from "./drawPolygon.ts";
// @ts-ignore
import type {GeoJSON} from "leaflet";
import {DrawPoint} from './drawPoint.ts'
import {DrawPolygon} from "./drawPolygon.ts";
import {initDefaultProps, loadRemoteCss, loadScriptByUrls} from "./utils.ts";
// import Leaflet from 'leaflet'

export default class DrawMapLeaflet {
  options: DrawMapLeafletOptions
  // 地图实例
  mapInstance: any

  constructor(options: DrawMapLeafletOptions) {
    this.options = initDefaultProps<DrawMapLeafletOptions>(options, {
      el: null,
      drawType: 'point',
      mapOptions: {
        center: [29.568, 106.54241],
        zoom: 12,
        zoomControl: false, // 禁用 + - 按钮
        doubleClickZoom: false,  // 禁用双击放大
        attributionControl: false  // 移除右下角leaflet标识
      },
      addTitleUrl: (map) => {
        window.L.tileLayer(
          "https://gac-geo.googlecnapps.cn/maps/vt?lyrs=y&x={x}&y={y}&z={z}"
        ).addTo(map);
      },
      crs: "wgs84",
      pointOptions: {
        muti: false
      }
    })
    this.init().then(() => {
    })
  }

  // 初始化
  async init() {
    await this.importScriptAndStyle().catch(() => {

    })
    // 初始化地图
    this.initMap()
    // 初始化自定义样式
    this.createCssTextAndImport()
    // 初始化工具
    switch (this.options.drawType) {
      case "point":
        new DrawPoint({
          map: this.mapInstance, ...this.options.pointOptions, crs: this.options.crs, onError: (type, err) => {
            this.options.onError?.(type, err)

          }, onChange: (value) => {
            if (this.options.drawType === 'point') {
              this.options.onChange?.(value)
            }
          }
        })
        break;
      case "polygon":
        new DrawPolygon({
          map: this.mapInstance,
          ...this.options.drawOptions,
          crs: this.options.crs,
          onChange: (value) => {
            if (this.options.drawType === "polygon") {
              this.options.onChange?.(value)
            }

          },
          onError: (type, err) => {
            this.options.onError?.(type, err)
          }
        })
        break;
      // case "polyline":
      //     break;
      default:
        break;
    }
  }

  /**
   * 初始化地图
   */
  initMap() {
    this.mapInstance = window.L.map(this.options.el as HTMLElement, this.options.mapOptions)
    this.options.addTitleUrl?.(this.mapInstance)
    this.options.onMapLoad?.(this.mapInstance, window.L)
  }

  /**
   * 导入样式和js文件
   */
  importScriptAndStyle() {
    let requestScript = loadScriptByUrls(["https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"], 'L', () => {
      return window.L !== undefined
    })
    let requestCss = loadRemoteCss(["https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"], () => {
      return !!document.querySelector('link[data--l]')
    }, 'L')
    return new Promise((resolve, reject) => {
      Promise.all([requestScript, requestCss]).then(() => {
        resolve(true)
      }).catch((err) => {
        reject(err)
      })
    })
  }

  createCssTextAndImport() {
    const cssText = `
    :root{
      --leaflet-draw-toolbox:1;
    }
    .leaflet-control-clegend {
      display:flex;
      background-color:white;
      padding: 0 5px;
      border-radius: 5px;
    }
    .leaflet-control-clegend > div {
      margin: 0 5px;
      cursor:pointer;
      padding: 10px 5px;
      transition: all 0.2s;
    }
    .leaflet-control-clegend > div:hover {
      color:green;
    }
    .leaflet-control-clegend > div.active {
      color:green;
    }
    .polygon_icon > div {
      width: 12px;
      height:12px;
      background:white;
      border-radius:50%;
      position:relative;
    }
    .polygon_icon > div:hover {
      transform:scale(1.2);
    }
    .polygon_icon > div:before {
      width: 4px;
      height:4px;
      background:#ffa502;
      content: "";
      position:absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      border-radius:50%;
    }
    
    `
    let isAddLeafletCss = getComputedStyle(document.documentElement).getPropertyValue('--leaflet-draw-toolbox')
    if (isAddLeafletCss === '1') {
      return
    }
    let style = document.createElement('style')
    style.type = "text/css"
    style.innerHTML = cssText
    document.head.appendChild(style)

  }


}

interface DrawMapLeafletOptionsCommon {
  // dom节点
  el: HTMLElement | null,
  // 地图配置
  mapOptions?: {
    // 默认中心炮
    center?: [number, number],
    // 默认瓦片地层
    zoom?: number
    // 其他层
    [key: string]: any
  },

  // 添加瓦片地址
  addTitleUrl?: (map: any) => void


  // 瓦片地址坐标系 传入坐标系需要和这个一样  传出的坐标系也会是这个 默认所有传入和传出都是wgs84的格式
  crs?: CrsType

  // onError
  onError?: (eventName: ErrorType, message: string) => void

  // 地图加载
  onMapLoad?: (map: any, L: any) => void
}

interface DrawMapLeafletOptionsByPoint extends DrawMapLeafletOptionsCommon {
  // 绘制类型
  drawType: 'point'

  // 打点法配置
  pointOptions?: DrawPointOptions,
  // 倒盘盒孯名称
  onChange?: (data: [number, number][] | undefined) => void

}

interface DrawMapLeafletOptionsByPolygon extends DrawMapLeafletOptionsCommon {
  // 绘制类型
  drawType: 'polygon'

  // 打点法配置
  drawOptions?: DrawPolygonOptions,
  // 倒盘盒孯名称
  onChange?: (data: GeoJSON.FeatureCollection | undefined) => void

}

export type DrawMapLeafletOptions = DrawMapLeafletOptionsByPolygon | DrawMapLeafletOptionsByPoint
