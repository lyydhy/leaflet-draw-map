import {initDefaultProps} from "./utils.ts";
export interface ToolBoxMenu {
	name: string
	onClick: (event: any, dom: HTMLElement, container: HTMLElement) => void
	attrs?: any
}

export interface ToolBoxOption {
	position?: "topright" | "topleft" | "bottomright" | "bottomleft"
	map: any
	menus: ToolBoxMenu[]
}

export class ToolBox {
	private options: ToolBoxOption

	/**
	 *
	 * @param {ToolBoxOption} options
	 */
	constructor(options: ToolBoxOption){
		this.options = initDefaultProps<ToolBoxOption>(options, {
			position: "topright",
			menus: [],
			map: null
		})
		return this
	}

	init() {
		let that = this
		return new Promise((resolve) => {
			(window.L.Control as any).LegendPolygon = window.L.Control.extend({
				initialize: function (options: any) {
					window.L.Util.extend(this.options, options);
				},
				onAdd: function () {
					//创建一个class为leaflet-control-clegend的div
					this._container = window.L.DomUtil.create('div', 'leaflet-control-clegend');
					let doms = {}
					that.options.menus.map(item => {
						// 开始绘制
						let _dom = document.createElement('div');
						_dom.innerHTML = item.name
						if (item.attrs) {
							for (const domKey in item.attrs) {
								_dom.setAttribute(domKey, item.attrs[domKey])
							}
						}
						doms[item.name] = _dom
						_dom.addEventListener("click", (e) => {
							item.onClick(e, _dom, this._container)
							e.stopPropagation();
							e.preventDefault()
							return false;
						});
						this._container.appendChild(_dom);
					})

					resolve(doms)


					return this._container;
				}
			})

			// @ts-ignore
			window.L.control.LegendPolygon = function (opts: any) {
				return new (window.L.Control as any).LegendPolygon(opts);
			}
			let legend2 = (window.L.control as any).LegendPolygon({position: this.options.position});
			//添加图例
			legend2.addTo(this.options.map);
		})

	}
}
