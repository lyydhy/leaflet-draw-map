(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global["leaflet-draw-map"] = factory());
})(this, (function () { 'use strict';

    //定义一些常量
    let x_PI = (3.14159265358979324 * 3000.0) / 180.0;
    let PI = 3.1415926535897932384626;
    let a = 6378245.0;
    let ee = 0.00669342162296594323;
    /**
     * 百度坐标系 (BD-09) 与 火星坐标系 (GCJ-02)的转换
     * 即 百度 转 谷歌、高德
     */
    // @ts-ignore
    function bd09togcj02(bd_lon, bd_lat) {
        let x_pi = (3.14159265358979324 * 3000.0) / 180.0;
        let x = bd_lon - 0.0065;
        let y = bd_lat - 0.006;
        let z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * x_pi);
        let theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * x_pi);
        let gg_lng = z * Math.cos(theta);
        let gg_lat = z * Math.sin(theta);
        return [gg_lng, gg_lat];
    }
    /**
     * 火星坐标系 (GCJ-02) 与百度坐标系 (BD-09) 的转换
     * 即谷歌、高德 转 百度
     */
    // @ts-ignore
    function gcj02tobd09(lng, lat) {
        let z = Math.sqrt(lng * lng + lat * lat) + 0.00002 * Math.sin(lat * x_PI);
        let theta = Math.atan2(lat, lng) + 0.000003 * Math.cos(lng * x_PI);
        let bd_lng = z * Math.cos(theta) + 0.0065;
        let bd_lat = z * Math.sin(theta) + 0.006;
        return [bd_lng, bd_lat];
    }
    /**
     * WGS84转GCj02
     */
    // @ts-ignore
    function wgs84togcj02(lng, lat) {
        if (out_of_china(lng, lat)) {
            return [lng, lat];
        }
        else {
            let dlat = transformlat(lng - 105.0, lat - 35.0);
            let dlng = transformlng(lng - 105.0, lat - 35.0);
            let radlat = (lat / 180.0) * PI;
            let magic = Math.sin(radlat);
            magic = 1 - ee * magic * magic;
            let sqrtmagic = Math.sqrt(magic);
            dlat = (dlat * 180.0) / (((a * (1 - ee)) / (magic * sqrtmagic)) * PI);
            dlng = (dlng * 180.0) / ((a / sqrtmagic) * Math.cos(radlat) * PI);
            let mglat = lat + dlat;
            let mglng = lng + dlng;
            return [mglng, mglat];
        }
    }
    // @ts-ignore
    function wgs84tobd09(lng, lat) {
        let coord = wgs84togcj02(lng, lat);
        return gcj02tobd09(coord[0], coord[1]);
    }
    // @ts-ignore
    function bd09towgs84(lng, lat) {
        let coord = bd09togcj02(lng, lat);
        return gcj02towgs84(coord[0], coord[1]);
    }
    /**
     * GCJ02 转换为 WGS84
     */
    // @ts-ignore
    function gcj02towgs84(lng, lat) {
        let mglat;
        let mglng;
        if (out_of_china(lng, lat)) {
            return [lng, lat];
        }
        else {
            let dlat = transformlat(lng - 105.0, lat - 35.0);
            let dlng = transformlng(lng - 105.0, lat - 35.0);
            let radlat = (lat / 180.0) * PI;
            let magic = Math.sin(radlat);
            magic = 1 - ee * magic * magic;
            let sqrtmagic = Math.sqrt(magic);
            dlat = (dlat * 180.0) / (((a * (1 - ee)) / (magic * sqrtmagic)) * PI);
            dlng = (dlng * 180.0) / ((a / sqrtmagic) * Math.cos(radlat) * PI);
            mglat = lat + dlat;
            mglng = lng + dlng;
            return [lng * 2 - mglng, lat * 2 - mglat];
        }
    }
    // @ts-ignore
    function transformlat(lng, lat) {
        let ret = -100.0 +
            2.0 * lng +
            3.0 * lat +
            0.2 * lat * lat +
            0.1 * lng * lat +
            0.2 * Math.sqrt(Math.abs(lng));
        ret +=
            ((20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) *
                2.0) /
                3.0;
        ret +=
            ((20.0 * Math.sin(lat * PI) + 40.0 * Math.sin((lat / 3.0) * PI)) * 2.0) /
                3.0;
        ret +=
            ((160.0 * Math.sin((lat / 12.0) * PI) + 320 * Math.sin((lat * PI) / 30.0)) *
                2.0) /
                3.0;
        return ret;
    }
    // @ts-ignore
    function transformlng(lng, lat) {
        let ret = 300.0 +
            lng +
            2.0 * lat +
            0.1 * lng * lng +
            0.1 * lng * lat +
            0.1 * Math.sqrt(Math.abs(lng));
        ret +=
            ((20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) *
                2.0) /
                3.0;
        ret +=
            ((20.0 * Math.sin(lng * PI) + 40.0 * Math.sin((lng / 3.0) * PI)) * 2.0) /
                3.0;
        ret +=
            ((150.0 * Math.sin((lng / 12.0) * PI) +
                300.0 * Math.sin((lng / 30.0) * PI)) *
                2.0) /
                3.0;
        return ret;
    }
    /**
     * 判断是否在国内，不在国内则不做偏移
     */
    // @ts-ignore
    function out_of_china(lng, lat) {
        return (lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271 || false);
    }

    /**
     * 加载远程css
     * 可根据 :root 变量判断 防止重复添加
     * @param {string|string[]} url
     * @param {() => boolean} [checkFunc]
     * @param {string} prop
     */
    function loadRemoteCss(url, checkFunc, prop) {
        return new Promise(async (resolve, reject) => {
            if (typeof url === 'string') {
                fn(url).then(() => {
                    resolve(true);
                }).catch(() => {
                    reject('样式文件加载失败!,地址链接:' + url);
                });
            }
            else {
                for (const item of url) {
                    if (checkFunc && checkFunc()) {
                        break;
                    }
                    await fn(item);
                }
                if (checkFunc && checkFunc()) {
                    resolve(true);
                }
                else {
                    reject('样式文件加载失败!,地址链接:' + url.join(','));
                }
            }
        });
        function fn(path) {
            return new Promise((resolve, reject) => {
                let link = document.createElement('link');
                link.type = 'text/css';
                link.rel = 'stylesheet';
                link.href = path;
                // @ts-ignore
                link.dataset[prop] = 1;
                document.head.appendChild(link);
                link.onload = function () {
                    resolve(true);
                };
                link.onerror = function (e) {
                    reject(e);
                };
            });
        }
    }
    /**
     * 动态加载脚本
     * @param url 脚本地址
     * @param check 检验是否引入
     * @param prop window属性
     */
    function loadScript(url, check = false, prop) {
        return new Promise((resolve, reject) => {
            // @ts-ignore
            let document1 = window?.rawWindow?.document || window?.document;
            try {
                // @ts-ignore
                if (check)
                    resolve(true);
                let script = document1.createElement("script");
                script.type = "text/javascript";
                // @ts-ignore
                if (script.readyState) {
                    // @ts-ignore
                    script.onreadystatechange = function () {
                        // @ts-ignore
                        if (script.readyState == "loaded" || script.readyState == "complete") {
                            // @ts-ignore
                            script.onreadystatechange = null;
                            resolve(true);
                        }
                    };
                }
                else {
                    script.onload = function () {
                        // @ts-ignore
                        if (prop && !window[prop] && window.rawWindow && window.rawWindow[prop]) {
                            // @ts-ignore
                            window[prop] = window.rawWindow[prop];
                        }
                        resolve(true);
                    };
                    script.onerror = function (r) {
                        reject(r);
                    };
                }
                script.src = url;
                document1.head.appendChild(script);
            }
            catch (e) {
                reject(false);
            }
        });
    }
    /**
     *
     * @param urls 数组
     * @param check 检验是否引入
     * @param prop window属性
     */
    function loadScriptByUrls(urls, prop, check) {
        return new Promise((resolve, reject) => {
            fn();
            function fn(urlIndex = 0) {
                let url = urls[urlIndex];
                // @ts-ignore
                let bool1 = !!(window?.rawWindow?.[prop] || window?.[prop]);
                if (check) {
                    bool1 = check();
                }
                loadScript(url, bool1, prop)
                    .then(() => {
                    // @ts-ignore
                    let value = window.rawWindow?.[prop] || window?.[prop];
                    resolve(value);
                })
                    .catch(() => {
                    if (urlIndex + 1 > urls.length - 1) {
                        reject(false);
                    }
                    else {
                        fn(urlIndex + 1);
                    }
                });
            }
        });
    }
    function initDefaultProps(props, defaultProps) {
        // @ts-ignore
        let obj = { ...props };
        Object.keys(defaultProps).forEach(key => {
            // @ts-ignore
            if (props[key] === undefined && typeof defaultProps[key] !== "object") {
                // @ts-ignore
                obj[key] = defaultProps[key];
                //@ts-ignore
            }
            else if (Array.isArray(defaultProps[key]) && defaultProps[key].length > 0 && (!props[key] || props[key].length === 0)) {
                // @ts-ignore
                obj[key] = [...defaultProps[key]];
                // @ts-ignore
            }
            else if (Array.isArray(props[key])) {
                // @ts-ignore
                obj[key] = [...props[key]];
                // @ts-ignore
            }
            else if (typeof defaultProps[key] === "object" && defaultProps[key] !== null) {
                // @ts-ignore
                obj[key] = initDefaultProps(obj[key] || {}, defaultProps[key]);
            }
        });
        return obj;
    }

    class ToolBox {
        /**
         *
         * @param {ToolBoxOption} options
         */
        constructor(options) {
            Object.defineProperty(this, "options", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            this.options = initDefaultProps(options, {
                position: "topright",
                menus: [],
                map: null
            });
            return this;
        }
        init() {
            let that = this;
            return new Promise((resolve) => {
                window.L.Control.LegendPolygon = window.L.Control.extend({
                    initialize: function (options) {
                        window.L.Util.extend(this.options, options);
                    },
                    onAdd: function () {
                        //创建一个class为leaflet-control-clegend的div
                        this._container = window.L.DomUtil.create('div', 'leaflet-control-clegend');
                        let doms = {};
                        that.options.menus.map(item => {
                            // 开始绘制
                            let _dom = document.createElement('div');
                            _dom.innerHTML = item.name;
                            if (item.attrs) {
                                for (const domKey in item.attrs) {
                                    _dom.setAttribute(domKey, item.attrs[domKey]);
                                }
                            }
                            doms[item.name] = _dom;
                            _dom.addEventListener("click", (e) => {
                                item.onClick(e, _dom, this._container);
                                e.stopPropagation();
                                e.preventDefault();
                                return false;
                            });
                            this._container.appendChild(_dom);
                        });
                        resolve(doms);
                        return this._container;
                    }
                });
                // @ts-ignore
                window.L.control.LegendPolygon = function (opts) {
                    return new window.L.Control.LegendPolygon(opts);
                };
                let legend2 = window.L.control.LegendPolygon({ position: this.options.position });
                //添加图例
                legend2.addTo(this.options.map);
            });
        }
    }

    class DrawPoint {
        constructor(options) {
            Object.defineProperty(this, "options", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            Object.defineProperty(this, "pointMarkerList", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            // 是否按下鼠标
            Object.defineProperty(this, "clickDown", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: false
            });
            // 是否移动中
            Object.defineProperty(this, "isMove", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: false
            });
            this.options = options;
            this.pointMarkerList = [];
            this.addDefaultPoint();
            this.options.map.on('mousedown', () => {
                this.clickDown = true;
            });
            this.options.map.on('mousemove', () => {
                this.isMove = this.clickDown;
            });
            this.options.map.on('mouseup', () => {
                this.clickDown = false;
            });
            this.options.map.on('click', (e) => {
                if (this.isMove)
                    return;
                if (this.options.muti && this.options.maxPoint && this.pointMarkerList.length > this.options.maxPoint) {
                    this.options.onError?.("pointMax", "打点数量超过最大值");
                    return;
                }
                if (!this.options.muti) {
                    this.pointMarkerList.forEach(item => {
                        item.remove();
                    });
                    this.pointMarkerList = [];
                }
                this.addMarker([e.latlng.lat, e.latlng.lng]);
                this.onChange();
            });
            this.initToolBox();
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
                                item.remove();
                            });
                            this.pointMarkerList = [];
                        }
                    }
                ]
            }).init();
        }
        addMarker(center) {
            let marker = window.L.marker(center, {});
            marker.on('click', () => {
                this.pointMarkerList = this.pointMarkerList.filter(item => item !== marker);
                marker.remove();
                this.onChange();
            });
            marker.addTo(this.options.map);
            this.pointMarkerList.push(marker);
        }
        onChange() {
            let value = [];
            this.pointMarkerList.forEach((item) => {
                let center = [item._latlng.lng, item._latlng.lat];
                if (this.options.crs !== 'wgs84') {
                    switch (this.options.crs) {
                        case "gcj02":
                            center = gcj02towgs84(item._latlng.lng, item._latlng.lat);
                            break;
                        case "bd09":
                            center = bd09towgs84(item._latlng.lng, item._latlng.lat);
                            break;
                    }
                }
                value.push(center);
            });
            this.options.onChange?.(value);
        }
        addDefaultPoint() {
            this.options.value?.forEach?.((item) => {
                let center = item;
                if (this.options.crs !== 'wgs84') {
                    switch (this.options.crs) {
                        case "gcj02":
                            center = wgs84togcj02(item[0], item[1]);
                            break;
                        case "bd09":
                            center = wgs84tobd09(item[0], item[1]);
                            break;
                    }
                }
                // @ts-ignore
                this.addMarker(center.reverse());
            });
        }
    }

    // hex转rgba第一种
    // hex转rgba第二种
    const hex2Rgba = (bgColor, alpha = 1) => {
        let color = bgColor.slice(1); // 去掉'#'号
        let rgba = [
            parseInt("0x" + color.slice(0, 2)),
            parseInt("0x" + color.slice(2, 4)),
            parseInt("0x" + color.slice(4, 6)),
            alpha
        ];
        return "rgba(" + rgba.toString() + ")";
    };
    /**
     * 颜色转换
     * @param color
     * @param alpha
     * @constructor
     */
    function colorTransform(color, alpha = 1) {
        if (color?.startsWith('#')) {
            return hex2Rgba(color, alpha);
        }
        if (color?.startsWith('rgb') && !color?.startsWith('rgba')) {
            return color.replace('rgb', 'rgba').replace(')', `,${alpha})`);
        }
        const reg = /rgba\((.+)\)/;
        const result = reg.exec(color);
        if (result) {
            const arr = result[1].split(',');
            return `rgba(${arr[0]},${arr[1]},${arr[2]},${alpha})`;
        }
        return color.replace(/,\d\)/, `,${alpha})`);
    }

    var colorPicker_min = {exports: {}};

    (function (module, exports) {
    	!function(t,e){module.exports=e();}(self,()=>(()=>{var L={785:(t,e,n)=>{n.d(e,{Z:()=>o});var e=n(327),e=n.n(e),r=n(632),n=n.n(r)()(e());n.push([t.id," \r\n:root {\r\n  --border-style: 1px solid #666;\r\n  --bottom-height: 22px;\r\n  --hue-slider-width: 12px;\r\n  --margin-size: 6px;\r\n}\r\n\r\n/* 最外层容器 */\r\n.zengsg-color-picker-container {\r\n  width: 100%;\r\n  height: 100%;\r\n  padding: var(--margin-size);\r\n}\r\n.zengsg-color-picker-container,\r\n.zengsg-color-picker-container * {\r\n  box-sizing: border-box;\r\n}\r\n/* 颜色画板 */\r\n.zengsg-color-picker-content {\r\n  position: relative;\r\n  width: 100%;\r\n  height: calc(100% - var(--bottom-height) - var(--margin-size));\r\n  padding-right: calc(var(--hue-slider-width) + var(--margin-size));\r\n}\r\n.zengsg-color-picker-content .zengsg-svpanel {\r\n  position: relative;\r\n  width: 100%;\r\n  height: 100%;\r\n  background: rgba(255, 0, 0, 1);\r\n}\r\n.zengsg-color-picker-content .zengsg-svpanel .zengsg-svpanel-white,\r\n.zengsg-color-picker-content .zengsg-svpanel .zengsg-svpanel-black {\r\n  position: absolute;\r\n  top: 0;\r\n  left: 0;\r\n  right: 0;\r\n  bottom: 0;\r\n  width: 100%;\r\n  height: 100%;\r\n}\r\n.zengsg-color-picker-content .zengsg-svpanel .zengsg-svpanel-white {\r\n  background: linear-gradient(to right, #fff, rgba(255, 255, 255, 0));\r\n}\r\n.zengsg-color-picker-content .zengsg-svpanel .zengsg-svpanel-black {\r\n  background: linear-gradient(to top, #000, rgba(0, 0, 0, 0));\r\n}\r\n.zengsg-color-picker-content .zengsg-svpanel .zengsg-svpanel-dot {\r\n  --size:6px;\r\n  position: absolute;\r\n  width: var(--size);\r\n  height: var(--size);\r\n  border: 1px solid #666;\r\n  /* background: #ddd; */\r\n  left: calc(100% - var(--size));\r\n  top: 0px;\r\n  border-radius: 50%;\r\n\r\n  cursor: pointer;\r\n}\r\n\r\n.zengsg-color-picker-content .zengsg-hue-slider {\r\n  position: absolute;\r\n  right: 0;\r\n  background-color: rgba(255, 0, 0, 1);\r\n}\r\n.zengsg-color-picker-content .zengsg-hue-slider.is-vertical {\r\n  width: var(--hue-slider-width);\r\n  height: 100%;\r\n  padding: 2px 0;\r\n  top: 0;\r\n}\r\n.zengsg-color-picker-content .zengsg-hue-slider .zengsg-hue-slider-bar {\r\n  position: relative;\r\n  background: linear-gradient(\r\n    to bottom,\r\n    #f00 0%,\r\n    #ff0 17%,\r\n    #0f0 33%,\r\n    #0ff 50%,\r\n    #00f 67%,\r\n    #f0f 83%,\r\n    #f00 100%\r\n  );\r\n  height: 100%;\r\n}\r\n.zengsg-color-picker-content .zengsg-hue-slider .zengsg-hue-slider-thumb {\r\n  position: absolute;\r\n  cursor: pointer;\r\n  top: 0;\r\n  left: 0;\r\n  width: 100%;\r\n  height: 4px;\r\n  background: #fff;\r\n  box-shadow: 0 0 2px #0009;\r\n  z-index: 1;\r\n  left: 0;\r\n  top: 0;\r\n  left: 0;\r\n}\r\n\r\n/* 底部内容 */\r\n.zengsg-color-picker-bottom {\r\n  height: var(--bottom-height);\r\n  display: flex;\r\n  align-items: center;\r\n  /* background: salmon; */\r\n  margin-top: var(--margin-size);\r\n}\r\n\r\n.zengsg-color-picker-bottom .color {\r\n  display: block;\r\n  width: var(--bottom-height);\r\n  height: var(--bottom-height);\r\n  margin-right: var(--margin-size);\r\n  border: var(--border-style);\r\n}\r\n\r\n.zengsg-color-picker-bottom .zengsg-color-input {\r\n  background: none;\r\n  outline: none;\r\n  border: var(--border-style);\r\n  height: var(--bottom-height);\r\n  line-height: var(--bottom-height);\r\n  border-radius: 2px;\r\n  padding-left: var(--margin-size);\r\n  padding-right: var(--margin-size);\r\n  font-size: 14px;\r\n  color: #333;\r\n}\r\n.zengsg-color-picker-bottom .zengsg-color-input :focus {\r\n  outline: none;\r\n}\r\n",""]);const o=n;},632:t=>{t.exports=function(r){var c=[];return c.toString=function(){return this.map(function(t){var e="",n=void 0!==t[5];return t[4]&&(e+="@supports (".concat(t[4],") {")),t[2]&&(e+="@media ".concat(t[2]," {")),n&&(e+="@layer".concat(0<t[5].length?" ".concat(t[5]):""," {")),e+=r(t),n&&(e+="}"),t[2]&&(e+="}"),t[4]&&(e+="}"),e}).join("")},c.i=function(t,e,n,r,o){"string"==typeof t&&(t=[[null,t,void 0]]);var i={};if(n)for(var a=0;a<this.length;a++){var s=this[a][0];null!=s&&(i[s]=!0);}for(var l=0;l<t.length;l++){var u=[].concat(t[l]);n&&i[u[0]]||(void 0!==o&&(void 0!==u[5]&&(u[1]="@layer".concat(0<u[5].length?" ".concat(u[5]):""," {").concat(u[1],"}")),u[5]=o),e&&(u[2]&&(u[1]="@media ".concat(u[2]," {").concat(u[1],"}")),u[2]=e),r&&(u[4]?(u[1]="@supports (".concat(u[4],") {").concat(u[1],"}"),u[4]=r):u[4]="".concat(r)),c.push(u));}},c};},327:t=>{t.exports=function(t){return t[1]};},480:t=>{var u=[];function c(t){for(var e=-1,n=0;n<u.length;n++)if(u[n].identifier===t){e=n;break}return e}function s(t,e){for(var n={},r=[],o=0;o<t.length;o++){var i=t[o],a=e.base?i[0]+e.base:i[0],s=n[a]||0,l="".concat(a," ").concat(s),a=(n[a]=s+1,c(l)),s={css:i[1],media:i[2],sourceMap:i[3],supports:i[4],layer:i[5]};-1!==a?(u[a].references++,u[a].updater(s)):(i=function(e,t){var n=t.domAPI(t);return n.update(e),function(t){t?t.css===e.css&&t.media===e.media&&t.sourceMap===e.sourceMap&&t.supports===e.supports&&t.layer===e.layer||n.update(e=t):n.remove();}}(s,e),e.byIndex=o,u.splice(o,0,{identifier:l,updater:i,references:1})),r.push(l);}return r}t.exports=function(t,i){var a=s(t=t||[],i=i||{});return function(t){t=t||[];for(var e=0;e<a.length;e++){var n=c(a[e]);u[n].references--;}for(var t=s(t,i),r=0;r<a.length;r++){var o=c(a[r]);0===u[o].references&&(u[o].updater(),u.splice(o,1));}a=t;}};},308:t=>{var n={};t.exports=function(t,e){if(!(t=function(t){if(void 0===n[t]){var e=document.querySelector(t);if(window.HTMLIFrameElement&&e instanceof window.HTMLIFrameElement)try{e=e.contentDocument.head;}catch(t){e=null;}n[t]=e;}return n[t]}(t)))throw new Error("Couldn't find a style target. This probably means that the value for the 'insert' parameter is invalid.");t.appendChild(e);};},969:t=>{t.exports=function(t){var e=document.createElement("style");return t.setAttributes(e,t.attributes),t.insert(e,t.options),e};},442:(t,e,n)=>{t.exports=function(t){var e=n.nc;e&&t.setAttribute("nonce",e);};},391:t=>{t.exports=function(i){var a=i.insertStyleElement(i);return {update:function(t){var e,n,r,o;e=a,n=i,r="",(t=t).supports&&(r+="@supports (".concat(t.supports,") {")),t.media&&(r+="@media ".concat(t.media," {")),(o=void 0!==t.layer)&&(r+="@layer".concat(0<t.layer.length?" ".concat(t.layer):""," {")),r+=t.css,o&&(r+="}"),t.media&&(r+="}"),t.supports&&(r+="}"),(o=t.sourceMap)&&"undefined"!=typeof btoa&&(r+="\n/*# sourceMappingURL=data:application/json;base64,".concat(btoa(unescape(encodeURIComponent(JSON.stringify(o))))," */")),n.styleTagTransform(r,e,n.options);},remove:function(){var t;null!==(t=a).parentNode&&t.parentNode.removeChild(t);}}};},14:t=>{t.exports=function(t,e){if(e.styleSheet)e.styleSheet.cssText=t;else {for(;e.firstChild;)e.removeChild(e.firstChild);e.appendChild(document.createTextNode(t));}};}},n={};function r(t){var e=n[t];return void 0!==e||(e=n[t]={id:t,exports:{}},L[t](e,e.exports,r)),e.exports}r.n=t=>{var e=t&&t.__esModule?()=>t.default:()=>t;return r.d(e,{a:e}),e},r.d=(t,e)=>{for(var n in e)r.o(e,n)&&!r.o(t,n)&&Object.defineProperty(t,n,{enumerable:!0,get:e[n]});},r.o=(t,e)=>Object.prototype.hasOwnProperty.call(t,e),r.r=t=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0});},r.nc=void 0;var l,a,u,s,i,c,h,p,t,e,o,d,f,v,g,m,b,y={};function _(){var t=navigator.userAgent.toLowerCase(),e="ipad"==t.match(/ipad/i),n="iphone os"==t.match(/iphone os/i),r="midp"==t.match(/midp/i),o="rv:1.2.3.4"==t.match(/rv:1.2.3.4/i),i="ucweb"==t.match(/ucweb/i),a="android"==t.match(/android/i),s="windows ce"==t.match(/windows ce/i),t="windows mobile"==t.match(/windows mobile/i);return e||n||r||o||i||a||s||t}function w(t){return (w="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t})(t)}function k(t,e){for(var n=0;n<e.length;n++){var r=e[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(t,function(t){t=function(t,e){if("object"!==w(t)||null===t)return t;var n=t[Symbol.toPrimitive];if(void 0===n)return ("string"===e?String:Number)(t);n=n.call(t,e||"default");if("object"!==w(n))return n;throw new TypeError("@@toPrimitive must return a primitive value.")}(t,"string");return "symbol"===w(t)?t:String(t)}(r.key),r);}}function S(t){return (S="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t})(t)}function P(t,e){for(var n=0;n<e.length;n++){var r=e[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(t,function(t){t=function(t,e){if("object"!==S(t)||null===t)return t;var n=t[Symbol.toPrimitive];if(void 0===n)return ("string"===e?String:Number)(t);n=n.call(t,e||"default");if("object"!==S(n))return n;throw new TypeError("@@toPrimitive must return a primitive value.")}(t,"string");return "symbol"===S(t)?t:String(t)}(r.key),r);}}function C(t){return (C="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t})(t)}function R(t,e){return function(t){if(Array.isArray(t))return t}(t)||function(t,e){var n=null==t?null:"undefined"!=typeof Symbol&&t[Symbol.iterator]||t["@@iterator"];if(null!=n){var r,o,i,a,s=[],l=!0,u=!1;try{if(i=(n=n.call(t)).next,0===e){if(Object(n)!==n)return;l=!1;}else for(;!(l=(r=i.call(n)).done)&&(s.push(r.value),s.length!==e);l=!0);}catch(t){u=!0,o=t;}finally{try{if(!l&&null!=n.return&&(a=n.return(),Object(a)!==a))return}finally{if(u)throw o}}return s}}(t,e)||function(t,e){var n;if(t)return "string"==typeof t?z(t,e):"Map"===(n="Object"===(n=Object.prototype.toString.call(t).slice(8,-1))&&t.constructor?t.constructor.name:n)||"Set"===n?Array.from(t):"Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?z(t,e):void 0}(t,e)||function(){throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function z(t,e){(null==e||e>t.length)&&(e=t.length);for(var n=0,r=new Array(e);n<e;n++)r[n]=t[n];return r}function E(t,e){for(var n=0;n<e.length;n++){var r=e[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(t,function(t){t=function(t,e){if("object"!==C(t)||null===t)return t;var n=t[Symbol.toPrimitive];if(void 0===n)return ("string"===e?String:Number)(t);n=n.call(t,e||"default");if("object"!==C(n))return n;throw new TypeError("@@toPrimitive must return a primitive value.")}(t,"string");return "symbol"===C(t)?t:String(t)}(r.key),r);}}function N(t,e){return function(t){if(Array.isArray(t))return t}(t)||function(t,e){var n=null==t?null:"undefined"!=typeof Symbol&&t[Symbol.iterator]||t["@@iterator"];if(null!=n){var r,o,i,a,s=[],l=!0,u=!1;try{if(i=(n=n.call(t)).next,0===e){if(Object(n)!==n)return;l=!1;}else for(;!(l=(r=i.call(n)).done)&&(s.push(r.value),s.length!==e);l=!0);}catch(t){u=!0,o=t;}finally{try{if(!l&&null!=n.return&&(a=n.return(),Object(a)!==a))return}finally{if(u)throw o}}return s}}(t,e)||function(t,e){var n;if(t)return "string"==typeof t?T(t,e):"Map"===(n="Object"===(n=Object.prototype.toString.call(t).slice(8,-1))&&t.constructor?t.constructor.name:n)||"Set"===n?Array.from(t):"Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?T(t,e):void 0}(t,e)||function(){throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function T(t,e){(null==e||e>t.length)&&(e=t.length);for(var n=0,r=new Array(e);n<e;n++)r[n]=t[n];return r}function I(t){var t=t/60,e=255*(1-Math.abs(t%2-1)),n=0,r=0,o=0;0<=t&&t<1?(n=255,r=e):1<=t&&t<2?(n=e,r=255):o=2<=t&&t<3?(r=255,e):3<=t&&t<4?(r=e,255):4<=t&&t<5?(n=e,255):(n=255,e);return [n+=0,r+=0,o+=0]}function j(t,e,n){t/=255,e/=255,n/=255;var r,o=Math.max(t,e,n),i=Math.min(t,e,n),a=o,s=o-i,l=0==o?0:s/o;if(o==i)r=0;else {switch(o){case t:r=(e-n)/s+(e<n?6:0);break;case e:r=(n-t)/s+2;break;case n:r=(t-e)/s+4;}r/=6;}return {h:360*r,s:100*l,v:100*a}}function x(t){return (x="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t})(t)}function U(t,e){return function(t){if(Array.isArray(t))return t}(t)||function(t,e){var n=null==t?null:"undefined"!=typeof Symbol&&t[Symbol.iterator]||t["@@iterator"];if(null!=n){var r,o,i,a,s=[],l=!0,u=!1;try{if(i=(n=n.call(t)).next,0===e){if(Object(n)!==n)return;l=!1;}else for(;!(l=(r=i.call(n)).done)&&(s.push(r.value),s.length!==e);l=!0);}catch(t){u=!0,o=t;}finally{try{if(!l&&null!=n.return&&(a=n.return(),Object(a)!==a))return}finally{if(u)throw o}}return s}}(t,e)||function(t,e){var n;if(t)return "string"==typeof t?A(t,e):"Map"===(n="Object"===(n=Object.prototype.toString.call(t).slice(8,-1))&&t.constructor?t.constructor.name:n)||"Set"===n?Array.from(t):"Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?A(t,e):void 0}(t,e)||function(){throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function A(t,e){(null==e||e>t.length)&&(e=t.length);for(var n=0,r=new Array(e);n<e;n++)r[n]=t[n];return r}function O(t,e){for(var n=0;n<e.length;n++){var r=e[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(t,function(t){t=function(t,e){if("object"!==x(t)||null===t)return t;var n=t[Symbol.toPrimitive];if(void 0===n)return ("string"===e?String:Number)(t);n=n.call(t,e||"default");if("object"!==x(n))return n;throw new TypeError("@@toPrimitive must return a primitive value.")}(t,"string");return "symbol"===x(t)?t:String(t)}(r.key),r);}}function M(t){return (M="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t})(t)}function B(t){return function(t){if(Array.isArray(t))return D(t)}(t)||function(t){if("undefined"!=typeof Symbol&&null!=t[Symbol.iterator]||null!=t["@@iterator"])return Array.from(t)}(t)||function(t,e){var n;if(t)return "string"==typeof t?D(t,e):"Map"===(n="Object"===(n=Object.prototype.toString.call(t).slice(8,-1))&&t.constructor?t.constructor.name:n)||"Set"===n?Array.from(t):"Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?D(t,e):void 0}(t)||function(){throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function D(t,e){(null==e||e>t.length)&&(e=t.length);for(var n=0,r=new Array(e);n<e;n++)r[n]=t[n];return r}function q(t,e){for(var n=0;n<e.length;n++){var r=e[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(t,H(r.key),r);}}function H(t){t=function(t,e){if("object"!==M(t)||null===t)return t;var n=t[Symbol.toPrimitive];if(void 0===n)return ("string"===e?String:Number)(t);n=n.call(t,e||"default");if("object"!==M(n))return n;throw new TypeError("@@toPrimitive must return a primitive value.")}(t,"string");return "symbol"===M(t)?t:String(t)}return r.r(y),r.d(y,{ColorPicker:()=>b}),l="HUE",a="SV",u="INPUT",s={HEX:"hex",RGB:"rgb"},i=function(){function t(){if(!(this instanceof t))throw new TypeError("Cannot call a class as a function")}var e,n,r;return e=t,r=[{key:"move",get:function(){return _()?"touchmove":"mousemove"}},{key:"down",get:function(){return _()?"touchstart":"mousedown"}},{key:"up",get:function(){return _()?"touchend":"mouseup"}}],(n=null)&&k(e.prototype,n),r&&k(e,r),Object.defineProperty(e,"prototype",{writable:!1}),t}(),c=function(){function r(t){var e=t.container,n=t.hsv,t=t.callback;if(!(this instanceof r))throw new TypeError("Cannot call a class as a function");this.container=e,this.dotParam={},this.sliderParam={},this.updateColorCallabck=t,this._hue=n[0],this._init();}var t,e;return t=r,(e=[{key:"_init",value:function(){this._initParams(),this._initEvent();}},{key:"_initParams",value:function(){this.sliderParam.el=document.querySelector(".zengsg-hue-slider");var t=this.sliderParam.el.getBoundingClientRect(),t=(this.sliderParam.height=t.height,this.sliderParam.top=t.top,this.dotParam.el=document.querySelector(".zengsg-hue-slider-thumb"),this.dotParam.el.getBoundingClientRect());this.dotParam.height=t.height,this.dotParam.top=t.top,this._updateDotPosition(this._hue/360*this.sliderParam.height);}},{key:"_initEvent",value:function(){this.sliderParam.el.addEventListener(i.down,this._mouseDown.bind(this));}},{key:"_mouseDown",value:function(t){this._update(t),this._removeEvent(),this._removeEventThat=this._removeEvent.bind(this),this._updateThat=this._update.bind(this),window.addEventListener(i.up,this._removeEventThat),window.addEventListener(i.move,this._updateThat);}},{key:"_removeEvent",value:function(){window.removeEventListener(i.move,this._updateThat),window.removeEventListener(i.up,this._removeEventThat),this._updateThat=null,this._removeEventThat=null;}},{key:"_update",value:function(t){var e=-1,t=(_()?e=t.targetTouches[0].clientY:(e=t.y,t.preventDefault&&t.preventDefault()),this.sliderParam),n=t.top,t=t.height,e=e-n;this._updateDotPosition(e=t<(e=e<0?0:e)?t:e),this._updateColor(e);}},{key:"_updateDotPosition",value:function(t){var e=this.dotParam,n=e.el,e=e.height;n.style.top=t-e/2+"px";}},{key:"_updateColor",value:function(t){var e=this.sliderParam.height,n=this.dotParam.height,t=t-n/2;this._hue=Math.round((0<t?t:0)/(e-n/2)*360),this.updateColorCallabck&&this.updateColorCallabck(l);}},{key:"hue",get:function(){return this._hue},set:function(t){this._hue=t,this._updateDotPosition(this._hue/360*this.sliderParam.height);}}])&&P(t.prototype,e),Object.defineProperty(t,"prototype",{writable:!1}),r}(),h=function(){function o(t){var e=t.container,n=t.backgroundColor,r=t.callback,t=t.hsv;if(!(this instanceof o))throw new TypeError("Cannot call a class as a function");this.container=e,this.dotParam={},this.panelParam={},this._saturation=t[1],this._value=t[2],this._backgroundColor=n,this.updateColorCallabck=r,this._init();}var t,e;return t=o,(e=[{key:"_init",value:function(){this._initParams(),this._initEvent();}},{key:"_initParams",value:function(){this.dotParam.el=this.container.querySelector(".zengsg-svpanel-dot");var t=this.dotParam.el.getBoundingClientRect(),t=(this.dotParam.width=t.width,this.dotParam.height=t.height,this.panelParam.el=this.container.querySelector(".zengsg-svpanel"),this.panelParam.el.getBoundingClientRect());this.panelParam.width=t.width,this.panelParam.height=t.height,this.panelParam.left=t.left,this.panelParam.top=t.top,this._updateBackgroundColor(),this._updateDotPosition();}},{key:"_initEvent",value:function(){this.panelParam.el.addEventListener(i.down,this._mouseDown.bind(this));}},{key:"_mouseDown",value:function(t){this._update(t),this._removeEvent(),this._removeEventThat=this._removeEvent.bind(this),this._updateThat=this._update.bind(this),window.addEventListener(i.up,this._removeEventThat),window.addEventListener(i.move,this._updateThat);}},{key:"_removeEvent",value:function(){window.removeEventListener(i.move,this._updateThat),window.removeEventListener(i.up,this._removeEventThat),this._updateThat=null,this._removeEventThat=null;}},{key:"_update",value:function(t){var e,n=-1;_()?(e=t.targetTouches[0].clientY,n=t.targetTouches[0].clientX):(e=t.y,n=t.x,t.preventDefault&&t.preventDefault()),this._updateColor(n,e),this._updateDotPosition();}},{key:"_updateDotPosition",value:function(){var t=this._saturation/100*this.panelParam.width,e=this.panelParam.height-this._value/100*this.panelParam.height,n=this.dotParam,r=n.el,o=n.width,n=n.height;r.style.left=t-o/2+"px",r.style.top=e-n/2+"px";}},{key:"_updateColor",value:function(t,e){var n=this.panelParam,r=n.left,o=n.top,i=n.width,n=n.height,t=t-r,r=e-o;n<(r=r<0?0:r)&&(r=n),this._saturation=(t=i<(t=t<0?0:t)?i:t)/i*100,this._value=100-r/n*100,this.updateColorCallabck&&this.updateColorCallabck(a);}},{key:"_updateBackgroundColor",value:function(){var t=R(this._backgroundColor,3),e=t[0],n=t[1],t=t[2];this.panelParam.el.style.backgroundColor="rgb(".concat(e,",").concat(n,",").concat(t,")");}},{key:"backgroundColor",set:function(t){this._backgroundColor=t,this._updateBackgroundColor();}},{key:"saturation",get:function(){return this._saturation},set:function(t){this._saturation=t,this._updateDotPosition();}},{key:"value",get:function(){return this._value},set:function(t){this._value=t,this._updateDotPosition();}}])&&E(t.prototype,e),Object.defineProperty(t,"prototype",{writable:!1}),o}(),p=function(){function o(t){var e=t.container,n=t.rgb,r=t.callback,t=t.mode;if(!(this instanceof o))throw new TypeError("Cannot call a class as a function");this.container=e,this._currentColorRgbArray=n,this.updateColorCallabck=r,this._inputEl=null,this._colorEl=null,this._mode=t,this._init();}var t,e;return t=o,(e=[{key:"_init",value:function(){var e=this;this._inputEl=this.container.querySelector(".zengsg-color-input"),this._colorEl=this.container.querySelector(".color"),this._inputEl.addEventListener("keydown",function(t){13==t.keyCode&&e._inputChange();}),this._inputEl.addEventListener("blur",this._inputChange.bind(this)),this._updateInputVue();}},{key:"_inputChange",value:function(){var t,e,n=this._inputEl.value,r="string"==typeof(t=n)&&null!=(t=t.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/))&&(r=(t=N(t,4))[1],e=t[2],t=t[3],[parseInt(r,10),parseInt(e,10),parseInt(t,10)]);(r=this._mode==s.HEX?"#"===(e=n).charAt(0)&&(4===e.length||7===e.length)&&(4===e.length&&(e="#"+e[1]+e[1]+e[2]+e[2]+e[3]+e[3]),!!/^#[0-9A-F]{6}$/i.test(e))&&(e=e.replace("#",""),[parseInt(e.substring(0,2),16),parseInt(e.substring(2,4),16),parseInt(e.substring(4,6),16)]):r)?this._currentColorRgbArray=r:r=this._currentColorRgbArray,this._updateInputVue(),r&&this.updateColorCallabck&&this.updateColorCallabck(u);}},{key:"_updateInputVue",value:function(){var t,e,n,r=U(this._currentColorRgbArray,3),o=r[0],i=r[1],r=r[2],a=null,a=this._mode===s.HEX?(e=i,n=r,t=(t=o).toString(16).padStart(2,"0"),e=e.toString(16).padStart(2,"0"),n=n.toString(16).padStart(2,"0"),"#".concat(t).concat(e).concat(n).toUpperCase()):"rgb(".concat(o,",").concat(i,",").concat(r,")");this._inputEl.value=a,this._colorEl.style.backgroundColor=a;}},{key:"currentColorRgbArray",get:function(){return this._currentColorRgbArray},set:function(t){this._currentColorRgbArray=t,this._updateInputVue();}},{key:"inputValue",get:function(){return this._inputEl.value}}])&&O(t.prototype,e),Object.defineProperty(t,"prototype",{writable:!1}),o}(),t=r(480),t=r.n(t),e=r(391),e=r.n(e),o=r(308),o=r.n(o),d=r(442),d=r.n(d),f=r(969),f=r.n(f),v=r(14),v=r.n(v),g=r(785),(m={}).styleTagTransform=v(),m.setAttributes=d(),m.insert=o().bind(null,"head"),m.domAPI=e(),m.insertStyleElement=f(),t()(g.Z,m),g.Z&&g.Z.locals&&g.Z.locals,v=b=function(){function e(t){if(!(this instanceof e))throw new TypeError("Cannot call a class as a function");this.container=t.container||document.querySelector("body"),this._mode=t.mode||s.RGB,this._svPanelInstance=null,this._hueSliderInstance=null,this._bottomInputInstance=null,this._userDefaultColor=t.defaultColor||[0,0,0],this._update=t.update,this._init();}var t,n;return t=e,(n=[{key:"_init",value:function(){this._initTemplate();var t=j.apply(void 0,B(this._userDefaultColor)),e=t.h,n=t.s,t=t.v,r=I(e),o=this.updateColorCallback.bind(this),e={container:this.container,rgb:this._userDefaultColor,hsv:[e,n,t],backgroundColor:r,callback:o,mode:this._mode};this._svPanelInstance=new h(e),this._hueSliderInstance=new c(e),this._bottomInputInstance=new p(e);}},{key:"_initTemplate",value:function(){this.container.innerHTML='<div class="zengsg-color-picker-container">\n     <div class="zengsg-color-picker-content">\n       <div class="zengsg-svpanel">\n         <div class="zengsg-svpanel-white"></div>\n         <div class="zengsg-svpanel-black"></div>\n         <div class="zengsg-svpanel-dot"></div>\n       </div>\n       <div class="zengsg-hue-slider is-vertical">\n         <div class="zengsg-hue-slider-bar"></div>\n         <div class="zengsg-hue-slider-thumb"></div>\n       </div>\n     </div>\n     <div class="zengsg-color-picker-bottom">\n       <span class="color"></span>\n       <input type="text" class="zengsg-color-input" />\n     </div>\n   </div>';}},{key:"updateColorCallback",value:function(t){var e,n,r,o,i,a,s;t!==u?(e=this._hueSliderInstance.hue,r=(o=this._svPanelInstance).saturation,o=o.value,this._bottomInputInstance.currentColorRgbArray=(n=e,r=r,o=o,n%=360,i=(r=(o/=100)*(r/=100))*(1-Math.abs(n/60%2-1)),n=0<=n&&n<60?(a=r,s=i,0):60<=n&&n<120?(a=i,s=r,0):120<=n&&n<180?(a=0,s=r,i):180<=n&&n<240?(a=0,s=i,r):240<=n&&n<300?(a=i,s=0,r):(a=r,s=0,i),a=255*(a+(o=o-r)),s=255*(s+o),n=255*(n+o),[Math.round(a),Math.round(s),Math.round(n)]),t==l&&(this._svPanelInstance.backgroundColor=I(e))):(i=this._bottomInputInstance.currentColorRgbArray,o=(r=j.apply(void 0,B(i))).h,a=r.s,s=r.v,this._svPanelInstance.backgroundColor=I(o),this._svPanelInstance.saturation=a,this._svPanelInstance.value=s,this._hueSliderInstance.hue=o),this._update&&this._update(this._bottomInputInstance.inputValue);}}])&&q(t.prototype,n),Object.defineProperty(t,"prototype",{writable:!1}),e}(),d=s,(o=H(o="INPUT_TEXT_MODE_TYPE"))in v?Object.defineProperty(v,o,{value:d,enumerable:!0,configurable:!0,writable:!0}):v[o]=d,y})()); 
    } (colorPicker_min));

    var colorPicker_minExports = colorPicker_min.exports;

    // @ts-ignore
    class ColorPicker {
        constructor(defaultColor, opacity = 1, change) {
            Object.defineProperty(this, "opacity", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: 1
            });
            Object.defineProperty(this, "color", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: ''
            });
            Object.defineProperty(this, "fullColor", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: ''
            });
            Object.defineProperty(this, "onChange", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            this.onChange = change;
            this.opacity = opacity;
            this.color = defaultColor;
            this.initStyle();
            this.initModal();
            this.initColorPicker();
        }
        initColorPicker() {
            const reg = /rgba\((.+)\)/;
            const result = reg.exec(colorTransform(this.color));
            let defaultColor = [];
            if (result) {
                const arr = result[1].split(',');
                // this.opacity = +arr[3]
                defaultColor = arr.slice(0, 3).map(item => +item);
            }
            // console.log(result);
            new colorPicker_minExports.ColorPicker({
                container: document.querySelector(".leaflet-color-modal .leaflet-color-modal-content .color-picker-content"),
                mode: colorPicker_minExports.ColorPicker.INPUT_TEXT_MODE_TYPE.RGB,
                defaultColor: defaultColor,
                // defaultColor: colorTransform(this.color).replace('(', '').replace(')', '').split(',').map(item => +item).slice(0, 3),  // red
                update: (color) => {
                    this.color = color;
                    this.change();
                }
            });
            let opacityDiv = document.createElement('div');
            opacityDiv.classList.add('opacity-div');
            let text = document.createElement('span');
            text.textContent = '透明度: ';
            let input = document.createElement('input');
            input.setAttribute('min', '0');
            input.setAttribute('max', '1');
            input.setAttribute('step', '0.1');
            input.setAttribute('type', 'range');
            input.setAttribute('value', this.opacity + '');
            let text1 = document.createElement('span');
            text1.textContent = this.opacity + '';
            opacityDiv.append(text, input, text1);
            document.querySelector('.leaflet-color-modal .zengsg-color-picker-bottom')?.appendChild(opacityDiv);
            input.addEventListener('input', e => {
                // @ts-ignore
                text1.textContent = e.target.value;
                // @ts-ignore
                this.opacity = +e.target.value;
                this.change();
            });
        }
        change() {
            let color = colorTransform(this.color, this.opacity);
            this.fullColor = color;
            // @ts-ignore
            document.querySelector('.leaflet-color-modal-content').style.backgroundColor = color;
        }
        close() {
            document.querySelector('.leaflet-color-modal')?.remove();
        }
        ok() {
            this.onChange(this.fullColor, +this.opacity);
            this.close();
        }
        initModal() {
            let that = this;
            if (document.querySelector('.leaflet-color-modal')) {
                document.querySelector('.leaflet-color-modal')?.remove();
            }
            let body = document.createElement('div');
            body.classList.add('leaflet-color-modal');
            createModal();
            document.body.appendChild(body);
            function createModal() {
                let modal = document.createElement('div');
                modal.classList.add('leaflet-color-modal-content');
                modal.style.backgroundColor = that.color;
                let pickerContent = document.createElement('div');
                pickerContent.classList.add('color-picker-content');
                modal.appendChild(pickerContent);
                modal.appendChild(createFooter());
                body.appendChild(modal);
            }
            function createFooter() {
                let ok = document.createElement('div');
                ok.textContent = '确定';
                let cancel = document.createElement('div');
                cancel.textContent = '取消';
                let footer = document.createElement('div');
                footer.append(cancel, ok);
                footer.classList.add('leaflet-color-modal-footer');
                ok.addEventListener('click', that.ok.bind(that));
                cancel.addEventListener('click', that.close.bind(that));
                return footer;
            }
        }
        initStyle() {
            const cssText = `
        :root{
          --leaflet-draw-color-picker:1;
        }
        .leaflet-color-modal {
          position:fixed;
          width: 100vw;
          height:100vh;
          background:rgba(0,0,0,.25);
          top:0;
          left:0;
          z-index:1000;
        }
        
        .leaflet-color-modal .leaflet-color-modal-content {
          position:absolute;
          top:50%;
          left:50%;
          transform:translate(-50%,-50%);
          background:white;
          border-radius:5px;
          padding:10px;
        }
        .leaflet-color-modal .leaflet-color-modal-content .color-picker-content{
           width: 500px;
           height: 300px;
        }
        .leaflet-color-modal .leaflet-color-modal-content .color-picker-content .zengsg-color-input {
          pointer-events:none;
        }
        
        .leaflet-color-modal .leaflet-color-modal-content .color-picker-content .opacity-div {
            margin-left: 10px;
        }
        .leaflet-color-modal .leaflet-color-modal-content .color-picker-content .opacity-div input {
          outline:none;
        }
        
        .leaflet-color-modal .leaflet-color-modal-content .leaflet-color-modal-footer {
          display:flex;
          justify-content: flex-end;
          margin-top: 10px;
         
        }
        .leaflet-color-modal .leaflet-color-modal-content .leaflet-color-modal-footer div {
          padding: 5px 10px;
          border-radius: 5px;
          cursor: pointer;
          margin-left: 10px;
          background: white;
          color:#000;
          border: 1px solid #000;
        }
        .leaflet-color-modal .leaflet-color-modal-content .leaflet-color-modal-footer div:last-child {
          background: #00a8ff;
          color:white;
          border-color:#00a8ff;
        }
    `;
            let isAddLeafletCss = getComputedStyle(document.documentElement).getPropertyValue('--leaflet-draw-color-picker');
            if (isAddLeafletCss === '1') {
                return;
            }
            let style = document.createElement('style');
            style.type = "text/css";
            style.innerHTML = cssText;
            document.head.appendChild(style);
        }
    }

    class DrawPolygon {
        constructor(options) {
            Object.defineProperty(this, "options", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            Object.defineProperty(this, "points", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: []
            }); // 画的过程中的点
            Object.defineProperty(this, "lines", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: {}
            }); // 画的过程中生成的多边形
            Object.defineProperty(this, "tempLines", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: {}
            }); // 鼠标移动中生成的多边形（实际是一条线段）
            Object.defineProperty(this, "polygonSelect", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: undefined
            }); // 双击结束生成多边形
            Object.defineProperty(this, "facelines", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: []
            }); // 存储画的多边形
            Object.defineProperty(this, "facetempLines", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: []
            }); // 存储移动的多边形
            Object.defineProperty(this, "facepolygonList", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: []
            }); // 存储结束生成的多边形
            Object.defineProperty(this, "markers", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: []
            }); // 记录所有的marker
            Object.defineProperty(this, "hoverMarker", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: null
            }); // 鼠标移动时的marker
            Object.defineProperty(this, "polygonStyle", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: {}
            }); // 多边形样式
            Object.defineProperty(this, "lineStyle", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: {}
            }); // 线段样式
            Object.defineProperty(this, "isClickPolygon", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: false
            }); // 是否点击了多边形
            Object.defineProperty(this, "toolBoxDom", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            this.options = initDefaultProps(options, {
                max: 1,
                crs: 'wgs84'
            });
            this.initStyle();
            if (!!options.value) {
                this.initDefaultValue();
            }
            this.createControl();
        }
        /**
         * 初始化默认值
         */
        initDefaultValue() {
            const that = this;
            this.initStyle();
            let { features } = this.options.value;
            features.map(item => {
                let geometry = item.geometry;
                let coordinates = geometry?.coordinates;
                this.points = [];
                coordinates.forEach((item1) => {
                    item1.forEach((item2) => {
                        let center = item2.reverse();
                        switch (this.options.crs) {
                            case 'wgs84':
                                break;
                            case 'gcj02':
                                center = gcj02towgs84(center[0], center[1]);
                                break;
                            case 'bd09':
                                center = bd09towgs84(center[0], center[1]);
                                break;
                        }
                        this.points.push(center);
                    });
                    if (item.properties) {
                        if (item.properties['fill-color']) {
                            this.polygonStyle.color = item.properties['fill-color'];
                        }
                        if (item.properties['fill-opacity']) {
                            this.polygonStyle.opacity = item.properties['fill-opacity'];
                        }
                        if (item.properties['line-color']) {
                            this.lineStyle.color = item.properties['line-color'];
                        }
                        if (item.properties['line-opacity']) {
                            this.lineStyle.opacity = item.properties['line-opacity'];
                        }
                        if (item.properties['line-width']) {
                            this.lineStyle.width = item.properties['line-width'];
                        }
                        initStyle();
                    }
                });
                this.endDraw();
            });
            initStyle();
            function initStyle() {
                that.lineStyle = initDefaultProps(that.lineStyle, {
                    color: "rgb(252, 106, 0)",
                    opacity: 1,
                    type: 'solid',
                    width: 2
                });
                that.polygonStyle = initDefaultProps(that.polygonStyle || {}, {
                    color: "rgb(252, 106, 0)",
                    opacity: 1,
                });
            }
        }
        // 初始化样式
        initStyle() {
            this.lineStyle = initDefaultProps(this.options.style?.lineStyle || {}, {
                color: "rgb(252, 106, 0)",
                opacity: 1,
                type: 'solid',
                width: 2
            });
            this.polygonStyle = initDefaultProps(this.options.style?.polygonStyle || {}, {
                color: "rgb(252, 106, 0)",
                opacity: 1,
            });
        }
        // 2. 绘制
        createFace() {
            let { hoverMarker, options } = this;
            // this.removePolygon()
            this.lines = window.L.polyline([], {
                color: colorTransform(this.lineStyle.color, 1),
            });
            this.tempLines = window.L.polyline([], {
                color: colorTransform(this.lineStyle.color, 1),
            });
            this.options.map?.addLayer(this.lines);
            this.options.map?.addLayer(this.tempLines);
            this.options.map?.on('click', (e) => {
                if (this.isClickPolygon)
                    return;
                if (hoverMarker) {
                    this.points.push([hoverMarker.getLatLng().lat, hoverMarker.getLatLng().lng]);
                    // @ts-ignore
                    this.lines.addLatLng(hoverMarker.getLatLng());
                    this.options.map?.addLayer(this.lines);
                    this.facelines.push(this.lines);
                    this.endDraw();
                    return;
                }
                this.facepolygonList.map(item => {
                    item.setStyle({
                        dashArray: []
                    });
                });
                this.points.push([e.latlng.lat, e.latlng.lng]);
                // @ts-ignore
                this.lines.addLatLng(e.latlng);
                this.options.map?.addLayer(this.lines);
                this.facelines.push(this.lines);
                // let icon_child = document.createElement('div')
                // iconBox.appendChild(icon_child)
                let marker = createIcon.call(this, e.latlng);
                this.markers.push(marker);
            });
            this.options.map?.on('mousemove', (e) => {
                if (this.points.length > 0) {
                    // @ts-ignore
                    this.tempLines.setLatLngs([this.points[this.points.length - 1], [e.latlng.lat, e.latlng.lng]]);
                    this.options.map?.addLayer(this.tempLines);
                    this.facetempLines.push(this.tempLines);
                }
            });
            this.options.map?.on('dblclick', () => {
                this.endDraw();
            });
            function createIcon(latlng) {
                let iconBox = document.createElement('div');
                let iconDive = window.L.divIcon({
                    html: iconBox,
                    className: 'polygon_icon',
                    iconSize: [12, 12]
                });
                // 绘制起点图标
                let marker = window.L.marker(latlng, {
                    icon: iconDive,
                });
                marker.on('mousemove', () => {
                    // @ts-ignore
                    hoverMarker = marker;
                });
                marker.on('mouseout', () => {
                    // @ts-ignore
                    hoverMarker = null;
                });
                // @ts-ignore
                marker.addTo(options.map);
                return marker;
            }
        }
        // 完成绘制
        endDraw() {
            this.toolBoxDom?.["绘制"]?.classList.remove('active');
            this.options.map?.off('click');
            let polygon = window.L.polygon([this.points], {
                color: colorTransform(this.lineStyle.color, 1),
                opacity: this.lineStyle.opacity,
                weight: this.lineStyle.width,
                fillColor: colorTransform(this.polygonStyle.color, 1),
                fillOpacity: this.polygonStyle.opacity
            });
            // @ts-ignore
            polygon?.addTo?.(this.options.map);
            this.options.map?.addLayer(polygon);
            this.facepolygonList.push(polygon);
            this.points = [];
            // @ts-ignore
            this.tempLines?.setLatLngs?.([]);
            // @ts-ignore
            this.lines?.setLatLngs?.([]);
            this.markers.map(item => {
                item?.removeFrom(this.options.map);
            });
            this.polygonSelect = polygon;
            this.endDrawChange();
            polygon.on('click', (e) => {
                this.isClickPolygon = true;
                setTimeout(() => {
                    this.isClickPolygon = false;
                }, 50);
                this.polygonSelect = polygon;
                this.facepolygonList.map((item) => {
                    item.setStyle({
                        dashArray: []
                    });
                });
                this.polygonSelect.setStyle({
                    dashArray: [2, 5]
                });
                this.lineStyle.color = polygon.options.color;
                this.lineStyle.opacity = polygon.options.opacity;
                this.polygonStyle.opacity = polygon.options.fillOpacity;
                this.polygonStyle.color = polygon.options.fillColor;
                this.toolBoxDom["线条颜色"]?.setAttribute('style', `color: ${colorTransform(this.lineStyle.color, this.lineStyle.opacity)}`);
                this.toolBoxDom["区域颜色"]?.setAttribute('style', `color: ${colorTransform(this.polygonStyle.color, this.polygonStyle.opacity)}`);
                // 禁止默认行为
                e.originalEvent.preventDefault();
                e.originalEvent.stopPropagation();
            });
            // this.options.map?.off('click')
        }
        /**
         * change
         */
        endDrawChange() {
            if (this.facepolygonList?.length === 0)
                return;
            let features = this.featureTransform({
                type: 'FeatureCollection',
                features: this.createPrototype()
            });
            this.options.onChange?.(features);
        }
        createPrototype() {
            return this.facepolygonList.map(item => {
                let options = item.options;
                let feature = item.toGeoJSON();
                feature.properties = {
                    ...feature.properties,
                    "fill-color": options.fillColor,
                    "fill-opacity": options.fillOpacity,
                    "line-color": options.color,
                    "line-opacity": options.opacity,
                    "line-width": options.weight,
                    "center": {}
                };
                let centerLatLng = item.getCenter();
                let centerArr = [centerLatLng.lng, centerLatLng.lat];
                let center = {
                    wgs84: [],
                    bd09: [],
                    gcj02: [],
                    zoom: this.options.map?.getZoom()
                };
                switch (this.options.crs) {
                    case "wgs84":
                        center["wgs84"] = centerArr;
                        center["bd09"] = wgs84tobd09(centerArr[0], centerArr[1]);
                        center["gcj02"] = wgs84togcj02(centerArr[0], centerArr[1]);
                        break;
                    case "bd09":
                        center["wgs84"] = bd09towgs84(centerArr[0], centerArr[1]);
                        center["bd09"] = centerArr;
                        center["gcj02"] = bd09togcj02(centerArr[0], centerArr[1]);
                        break;
                    case "gcj02":
                        center["wgs84"] = gcj02towgs84(centerArr[0], centerArr[1]);
                        center["bd09"] = gcj02tobd09(centerArr[0], centerArr[1]);
                        center["gcj02"] = centerArr;
                        break;
                }
                feature.properties.center = JSON.stringify(center);
                return feature;
            });
        }
        // 转换坐标系
        featureTransform(obj) {
            if (this.options.crs === 'wgs84')
                return obj;
            obj.features = obj.features.map((item) => {
                // @ts-ignore
                item.geometry.coordinates = item.geometry.coordinates.map((item1) => {
                    item1 = item1.map((item2) => {
                        switch (this.options.crs) {
                            case 'gcj02':
                                return wgs84togcj02(item2[0], item2[1]);
                            case 'bd09':
                                return wgs84tobd09(item2[0], item2[1]);
                        }
                        return item2;
                    });
                    return item1;
                });
                return item;
            });
            return obj;
        }
        removePolygon() {
            this.points.forEach(item => {
                this.options.map?.removeLayer(item);
            });
            this.facelines.forEach(item => {
                this.options.map?.removeLayer(item);
            });
            this.facetempLines.forEach(item => {
                this.options.map?.removeLayer(item);
            });
            // this.facepolygonList.forEach(item => {
            // 	this.options.map?.removeLayer(item)
            // })
            this.markers.forEach(item => {
                item?.removeFrom(this.options.map);
            });
            this.points = [];
            this.facelines = [];
            this.facetempLines = [];
            // this.facepolygonList = []
            this.markers = [];
            let deleteIndex = 0;
            this.facepolygonList.map((item, index) => {
                if (item._leaflet_id === this.polygonSelect?._leaflet_id) {
                    this.options.map?.removeLayer(item);
                    this.polygonSelect = undefined;
                    deleteIndex = index;
                }
            });
            this.facepolygonList.splice(deleteIndex, 1);
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
                            new ColorPicker(this.polygonStyle.color, this.polygonStyle.opacity, (color, opacity) => {
                                this.polygonStyle.color = colorTransform(color, opacity);
                                _dom.style.color = colorTransform(color, opacity);
                                // @ts-ignore
                                this.polygonStyle.opacity = opacity;
                                this.polygonSelect?.setStyle({
                                    color: this.lineStyle.color,
                                    opacity: this.lineStyle.opacity,
                                    weight: this.lineStyle.width,
                                    fillColor: colorTransform(this.polygonStyle.color, 1),
                                    fillOpacity: this.polygonStyle.opacity
                                });
                                this.endDrawChange();
                            });
                        }
                    },
                    {
                        name: "线条颜色",
                        attrs: {
                            class: 'line_color_btn',
                            style: `color: ${this.lineStyle.color}`
                        },
                        onClick: (_, _dom) => {
                            new ColorPicker(this.lineStyle.color, this.lineStyle.opacity, (color, opacity) => {
                                this.lineStyle.color = colorTransform(color, opacity);
                                _dom.style.color = colorTransform(color, opacity);
                                // @ts-ignore
                                this.lineStyle.opacity = opacity;
                                this.polygonSelect?.setStyle({
                                    color: this.lineStyle.color,
                                    opacity: this.lineStyle.opacity,
                                    weight: this.lineStyle.width,
                                    fillColor: colorTransform(this.polygonStyle.color, 1),
                                    fillOpacity: this.polygonStyle.opacity
                                });
                                this.endDrawChange();
                            });
                        }
                    },
                    {
                        name: "绘制",
                        attrs: {
                            class: 'draw_start_btn'
                        },
                        onClick: (_, _dom) => {
                            if (this.facepolygonList?.length >= this.options.max) {
                                this.options?.onError?.('pointMax', '超过最大绘制数量');
                                return;
                            }
                            if (_dom.classList.contains('active')) {
                                this.options?.onError?.('message', '超过最大绘制数量');
                                return;
                            }
                            _dom.classList.add('active');
                            this.createFace();
                        }
                    },
                    {
                        name: "删除",
                        attrs: {
                            class: 'remove_btn'
                        },
                        onClick: (_, _dom, container) => {
                            this.removePolygon();
                            // this.options.onChange?.(undefined)
                            this.endDrawChange();
                            container.querySelector('.draw_start_btn')?.classList.remove('active');
                        }
                    },
                ]
            });
            toolBox.init().then((re) => {
                this.toolBoxDom = re;
            });
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

    // import Leaflet from 'leaflet'
    class DrawMapLeaflet {
        constructor(options) {
            Object.defineProperty(this, "options", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            // 地图实例
            Object.defineProperty(this, "mapInstance", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            this.options = initDefaultProps(options, {
                el: null,
                drawType: 'point',
                mapOptions: {
                    center: [29.568, 106.54241],
                    zoom: 12,
                    zoomControl: false,
                    doubleClickZoom: false,
                    attributionControl: false // 移除右下角leaflet标识
                },
                addTitleUrl: (map) => {
                    window.L.tileLayer("https://gac-geo.googlecnapps.cn/maps/vt?lyrs=y&x={x}&y={y}&z={z}").addTo(map);
                },
                crs: "wgs84",
                pointOptions: {
                    muti: false
                }
            });
            this.init().then(() => {
            });
        }
        // 初始化
        async init() {
            await this.importScriptAndStyle().catch(() => {
            });
            // 初始化地图
            this.initMap();
            // 初始化自定义样式
            this.createCssTextAndImport();
            // 初始化工具
            switch (this.options.drawType) {
                case "point":
                    new DrawPoint({
                        map: this.mapInstance, ...this.options.pointOptions, crs: this.options.crs, onError: (type, err) => {
                            this.options.onError?.(type, err);
                        }, onChange: (value) => {
                            this.options.onChange?.(value);
                        }
                    });
                    break;
                case "polygon":
                    new DrawPolygon({
                        map: this.mapInstance,
                        ...this.options.drawOptions,
                        crs: this.options.crs,
                        onChange: (value) => {
                            this.options.onChange?.(value);
                        },
                        onError: (type, err) => {
                            this.options.onError?.(type, err);
                        }
                    });
                    break;
            }
        }
        /**
         * 初始化地图
         */
        initMap() {
            this.mapInstance = window.L.map(this.options.el, this.options.mapOptions);
            this.options.addTitleUrl?.(this.mapInstance);
            this.options.onMapLoad?.(this.mapInstance, window.L);
        }
        /**
         * 导入样式和js文件
         */
        importScriptAndStyle() {
            let requestScript = loadScriptByUrls(["https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"], 'L', () => {
                return window.L !== undefined;
            });
            let requestCss = loadRemoteCss(["https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"], () => {
                return !!document.querySelector('link[data--l]');
            }, 'L');
            return new Promise((resolve, reject) => {
                Promise.all([requestScript, requestCss]).then(() => {
                    resolve(true);
                }).catch((err) => {
                    reject(err);
                });
            });
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
    
    `;
            let isAddLeafletCss = getComputedStyle(document.documentElement).getPropertyValue('--leaflet-draw-toolbox');
            if (isAddLeafletCss === '1') {
                return;
            }
            let style = document.createElement('style');
            style.type = "text/css";
            style.innerHTML = cssText;
            document.head.appendChild(style);
        }
    }

    return DrawMapLeaflet;

}));
