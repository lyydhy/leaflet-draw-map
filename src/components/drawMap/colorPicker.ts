// @ts-ignore
import {ColorPicker as ColorPickerJs} from 'color-picker-zengsg'
import {colorTransform} from "./colorUtil.ts";

export default class ColorPicker {
	opacity: number = 1
	color: string = ''
	fullColor: string = ''
	onChange: any

	constructor(defaultColor: string, opacity: number = 1, change: Function) {
		this.onChange = change
		this.opacity = opacity
		this.color = defaultColor
		this.initStyle()
		this.initModal()
		this.initColorPicker()
	}

	initColorPicker() {


		const reg = /rgba\((.+)\)/;
		const result = reg.exec(colorTransform(this.color));
		let defaultColor: number[] = []
		if (result) {
			const arr = result[1].split(',');
			this.opacity = +arr[3]
			defaultColor = arr.slice(0, 3).map(item => +item)
		}

		new ColorPickerJs({
			container: document.querySelector(".leaflet-color-modal .leaflet-color-modal-content .color-picker-content"),
			mode: ColorPickerJs.INPUT_TEXT_MODE_TYPE.RGB, //HEX: #FF0000 ，RGB: rgb(255,0,0)
			defaultColor: defaultColor,
			// defaultColor: colorTransform(this.color).replace('(', '').replace(')', '').split(',').map(item => +item).slice(0, 3),  // red
			update: (color: string) => {
				this.color = color
				console.log(color);

				this.change()
			}
		});

		let opacityDiv = document.createElement('div')
		opacityDiv.classList.add('opacity-div')
		let text = document.createElement('span')
		text.textContent = '透明度: '
		let input = document.createElement('input')
		input.setAttribute('min', '0')
		input.setAttribute('max', '1')
		input.setAttribute('step', '0.1')
		input.setAttribute('type', 'range')
		input.setAttribute('value', this.opacity + '')
		let text1 = document.createElement('span')
		text1.textContent = this.opacity + ''
		opacityDiv.append(text, input, text1)
		document.querySelector('.leaflet-color-modal .zengsg-color-picker-bottom')?.appendChild(opacityDiv)

		input.addEventListener('input', e => {
			// @ts-ignore
			text1.textContent = e.target.value
			// @ts-ignore
			this.opacity = +e.target.value
			this.change()
		})
	}

	change() {
		let color = colorTransform(this.color, this.opacity)
		this.fullColor = color
		// @ts-ignore
		document.querySelector('.leaflet-color-modal-content').style.backgroundColor = color
	}

	close() {
		document.querySelector('.leaflet-color-modal')?.remove()
	}

	ok() {
		this.onChange(this.fullColor, +this.opacity)
		this.close()
	}


	initModal() {
		let that = this
		if (document.querySelector('.leaflet-color-modal')) {
			document.querySelector('.leaflet-color-modal')?.remove();
		}
		let body = document.createElement('div')
		body.classList.add('leaflet-color-modal')
		createModal()
		document.body.appendChild(body)

		function createModal() {
			let modal = document.createElement('div')
			modal.classList.add('leaflet-color-modal-content')
			modal.style.backgroundColor = that.color
			let pickerContent = document.createElement('div')
			pickerContent.classList.add('color-picker-content')
			modal.appendChild(pickerContent)
			modal.appendChild(createFooter())
			body.appendChild(modal)
		}

		function createFooter() {
			let ok = document.createElement('div')
			ok.textContent = '确定'
			let cancel = document.createElement('div')
			cancel.textContent = '取消'
			let footer = document.createElement('div')
			footer.append(cancel, ok)
			footer.classList.add('leaflet-color-modal-footer')
			ok.addEventListener('click', that.ok.bind(that))
			cancel.addEventListener('click', that.close.bind(that))


			return footer
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
    `
		let isAddLeafletCss = getComputedStyle(document.documentElement).getPropertyValue('--leaflet-draw-color-picker')
		if (isAddLeafletCss === '1') {
			return
		}
		let style = document.createElement('style')
		style.type = "text/css"
		style.innerHTML = cssText
		document.head.appendChild(style)
	}
}
