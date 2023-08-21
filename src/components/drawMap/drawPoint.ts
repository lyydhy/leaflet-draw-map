import {bd09towgs84, gcj02towgs84, wgs84tobd09, wgs84togcj02} from "./coord_transform.ts";
import {CrsType, ErrorType} from "./interface.ts";
import {ToolBox} from "./toolBox.ts";

export interface DrawPointOptions {
  map?: any
  // 是否多选
  muti?: boolean
  // 初始值
  value?: [number, number][]
  // change事件
  onChange?: (value: [number, number][]) => void
  // crs
  crs?: CrsType
  // 多选的时候最多可打点的数量
  maxPoint?: number
  // event
  onError?: (type: ErrorType, err: any) => void
}

export class DrawPoint {
  options: DrawPointOptions
  pointMarkerList: any[]
  // 是否按下鼠标
  clickDown: boolean = false
  // 是否移动中
  isMove: boolean = false

  constructor(options: DrawPointOptions) {
    this.options = options
    this.pointMarkerList = []

    this.addDefaultPoint()
    this.options.map.on('mousedown', () => {
      this.clickDown = true
    })
    this.options.map.on('mousemove', () => {
      this.isMove = this.clickDown;
    })
    this.options.map.on('mouseup', () => {
      this.clickDown = false
    })
    this.options.map.on('click', (e: any) => {
      if (this.isMove) return
      if (this.options.muti && this.options.maxPoint && this.pointMarkerList.length > this.options.maxPoint) {
        this.options.onError?.("pointMax", "打点数量超过最大值")
        return
      }
      if (!this.options.muti) {
        this.pointMarkerList.forEach(item => {
          item.remove()
        })
        this.pointMarkerList = []
      }
      this.addMarker([e.latlng.lat, e.latlng.lng])
      this.onChange()
    })
    this.initToolBox()
  }

  /**
   * 初始化工具
   */
  initToolBox() {
    new ToolBox({
      map: this.options.map,
      menus: [
        {
          name: "删除",
          attrs: {
            class: 'remove_btn'
          },
          onClick: () => {
            this.pointMarkerList.forEach(item => {
              item.remove()
            })
            this.pointMarkerList = []
          }
        }
      ]
    }).init()
  }

  addMarker(center: [number, number]) {
    let marker = window.L.marker(center, {})
    marker.on('click', () => {
      this.pointMarkerList = this.pointMarkerList.filter(item => item !== marker)
      marker.remove()
      this.onChange()
    })
    marker.addTo(this.options.map)
    this.pointMarkerList.push(marker)
  }

  onChange() {
    let value: [number, number][] = []
    this.pointMarkerList.forEach((item) => {
      let center: [number, number] = [item._latlng.lng, item._latlng.lat]
      if (this.options.crs !== 'wgs84') {
        switch (this.options.crs) {
          case "gcj02":
            center = gcj02towgs84(item._latlng.lng, item._latlng.lat)
            break;
          case "bd09":
            center = bd09towgs84(item._latlng.lng, item._latlng.lat)
            break;
        }
      }
      value.push(center)
    })
    this.options.onChange?.(value)

  }

  addDefaultPoint() {
    this.options.value?.forEach?.((item) => {
      let center: [number, number] = item
      if (this.options.crs !== 'wgs84') {
        switch (this.options.crs) {
          case "gcj02":
            center = wgs84togcj02(item[0], item[1])
            break;
          case "bd09":
            center = wgs84tobd09(item[0], item[1])
            break;
        }
      }
      // @ts-ignore
      this.addMarker(center.reverse())

    })
  }
}
