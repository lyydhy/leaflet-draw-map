import type {CrsType, ErrorType} from "./interface.ts";
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
    // 多选的时候最多可打点的数量 默认只能一个
    max?: number

    value?: GeoJSON.FeatureCollection

    // change事件
    onChange?: (value: GeoJSON.FeatureCollection | undefined) => void

    // event
    onError?: (type: ErrorType, err: any) => void
}

export class DrawPolygon {
    options: DrawPolygonOptions
    points: any[] = [] // 画的过程中的点
    lines: object = {} // 画的过程中生成的多边形
    tempLines: object = {} // 鼠标移动中生成的多边形（实际是一条线段）
    polygonSelect: Polygon | undefined = undefined // 双击结束生成多边形
    facelines: any[] = [] // 存储画的多边形
    facetempLines: any[] = [] // 存储移动的多边形
    facepolygonList: Polygon[] = [] // 存储结束生成的多边形
    markers: Marker[] = [] // 记录所有的marker
    hoverMarker: Marker | null = null // 鼠标移动时的marker
    polygonStyle: polygonStyle = {} // 多边形样式
    lineStyle: lineStyle = {} // 线段样式
    isClickPolygon: boolean = false // 是否点击了多边形
    toolBoxDom: {
        "线条颜色": HTMLElement | null,
        "区域颜色": HTMLElement | null,
        "绘制": HTMLElement | null,
        "删除": HTMLElement | null,
    }

    constructor(options: DrawPolygonOptions) {
        this.options = initDefaultProps<DrawPolygonOptions>(options, {
            max: 1,
            crs: 'wgs84'
        })
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
        features.map(item => {
            let geometry = item.geometry
            let coordinates = (geometry as any)?.coordinates
            this.points = []
            coordinates.forEach((item1: any) => {

                item1.forEach((item2: any) => {
                    let center = item2.reverse()
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
                })
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
            })
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
        // this.removePolygon()
        this.lines = window.L.polyline([], {
            color: colorTransform(this.lineStyle.color as string, 1),
        })
        this.tempLines = window.L.polyline([], {
            color: colorTransform(this.lineStyle.color as string, 1),
        })
        this.options.map?.addLayer(this.lines)
        this.options.map?.addLayer(this.tempLines)

        this.options.map?.on('click', (e: any) => {
            if (this.isClickPolygon) return
            if (hoverMarker) {
                this.points.push([hoverMarker.getLatLng().lat, hoverMarker.getLatLng().lng])
                // @ts-ignore
                this.lines.addLatLng(hoverMarker.getLatLng())
                this.options.map?.addLayer(this.lines)
                this.facelines.push(this.lines)
                this.endDraw()
                return
            }
            this.facepolygonList.map(item => {
                item.setStyle({
                    dashArray: []
                })
            })
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
        this.toolBoxDom?.["绘制"]?.classList.remove('active')
        this.options.map?.off('click')
        let polygon = window.L.polygon([this.points], {
            color: colorTransform(this.lineStyle.color as string, 1),
            opacity: this.lineStyle.opacity,
            weight: this.lineStyle.width,
            fillColor: colorTransform(this.polygonStyle.color as string, 1),
            fillOpacity: this.polygonStyle.opacity
        })


        // @ts-ignore
        polygon?.addTo?.(this.options.map)
        this.options.map?.addLayer(polygon)
        this.facepolygonList.push(polygon)
        this.points = []
        // @ts-ignore
        this.tempLines?.setLatLngs?.([])
        // @ts-ignore
        this.lines?.setLatLngs?.([])
        this.markers.map(item => {
            item?.removeFrom(this.options.map)
        })

        this.polygonSelect = polygon
        this.endDrawChange()

        polygon.on('click', (e) => {
            this.isClickPolygon = true
            setTimeout(() => {
                this.isClickPolygon = false
            }, 50)
            this.polygonSelect = polygon
            this.facepolygonList.map((item) => {
                item.setStyle({
                    dashArray: []
                })
            })
            this.polygonSelect.setStyle({
                dashArray: [2, 5]
            })
            this.lineStyle.color = polygon.options.color
            this.lineStyle.opacity = polygon.options.opacity
            this.polygonStyle.opacity = polygon.options.fillOpacity
            this.polygonStyle.color = polygon.options.fillColor
            this.toolBoxDom["线条颜色"]?.setAttribute('style', `color: ${colorTransform(this.lineStyle.color, this.lineStyle.opacity)}`)
            this.toolBoxDom["区域颜色"]?.setAttribute('style', `color: ${colorTransform(this.polygonStyle.color, this.polygonStyle.opacity)}`)
            // 禁止默认行为
            e.originalEvent.preventDefault()
            e.originalEvent.stopPropagation()
        })
        // this.options.map?.off('click')
    }

    /**
     * change
     */
    endDrawChange() {
        if (this.facepolygonList?.length === 0) return
        let features = this.featureTransform({
            type: 'FeatureCollection',
            features: this.createPrototype()
        })
        this.options.onChange?.(features)

    }

    createPrototype() {
        return this.facepolygonList.map(item => {
            let options = item.options
            let feature = item.toGeoJSON()
            feature.properties = {
                ...feature.properties,
                "fill-color": options.fillColor,
                "fill-opacity": options.fillOpacity,
                "line-color": options.color,
                "line-opacity": options.opacity,
                "line-width": options.weight,
                "center": {}
            }
            let centerLatLng = item.getCenter()
            let centerArr = [centerLatLng.lng, centerLatLng.lat]
            let center: {
                [key: string]: number[] | number
            } = {
                wgs84: [],
                bd09: [],
                gcj02: [],
                zoom: this.options.map?.getZoom()
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
            feature.properties.center = JSON.stringify(center)
            return feature
        })
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
        // this.facepolygonList.forEach(item => {
        // 	this.options.map?.removeLayer(item)
        // })
        this.markers.forEach(item => {
            item?.removeFrom(this.options.map)
        })
        this.points = []
        this.facelines = []
        this.facetempLines = []
        // this.facepolygonList = []
        this.markers = []
        let deleteIndex = 0
        this.facepolygonList.map((item, index) => {
            if ((item as any)._leaflet_id === (this.polygonSelect as any)?._leaflet_id) {
                this.options.map?.removeLayer(item)
                this.polygonSelect = undefined
                deleteIndex = index
            }
        })
        this.facepolygonList.splice(deleteIndex, 1)
    }

    createControl() {

        let toolBox = new ToolBox({
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
                            this.polygonSelect?.setStyle({
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
                            this.polygonSelect?.setStyle({
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
                        if (this.facepolygonList?.length >= this.options.max) {
                            this.options?.onError?.('pointMax', '超过最大绘制数量')
                            return
                        }
                        if (_dom.classList.contains('active')) {
                            this.options?.onError?.('message', '超过最大绘制数量')
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
                        // this.options.onChange?.(undefined)
                        this.endDrawChange()
                        container.querySelector('.draw_start_btn')?.classList.remove('active')
                    }
                },
            ]
        })
        toolBox.init().then((re: any) => {
            this.toolBoxDom = re
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
