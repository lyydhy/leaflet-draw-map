// 打包脚本 通过 components 下面的components.ts 来打包所有的组件
const path = require('path')
const fs = require('fs')
const entryPath = path.resolve(__dirname, '../src/components/drawMap')
const outPath = path.resolve(__dirname, '../lib/')
const mainPath = path.resolve(__dirname, '../')
const fsExtra = require('fs-extra')
const {rollup} = require("rollup");
const commonjs  = require('@rollup/plugin-commonjs').default;
const  dts = require("rollup-plugin-dts").dts;

const resolve = require("@rollup/plugin-node-resolve")
const terser = require('@rollup/plugin-terser')
const typescript = require('@rollup/plugin-typescript')
const {babel} = require('@rollup/plugin-babel');
const postcss = require('rollup-plugin-postcss')
const autoprefixer = require('autoprefixer')
const cssnano = require("cssnano");
const esbuild = require('rollup-plugin-esbuild').default
const buildFormats = [{
	key: 'es',
	dir: 'es'
},
	{
		key: 'umd',
		dir: 'lib',

	}]

const components = []
fs.readdirSync(entryPath).forEach((file) => {
	const pathname = path.join(entryPath, file)
	if (fs.statSync(pathname).isDirectory()) {
		components.push(file)
	}
})

async function buildSingle(name) {
	const rollupPathName = name
	const rollupShowName = 'leaflet-draw-map'
	const bundle = await rollup({
		input: path.resolve(entryPath, `./index.ts`),
		external: [],
		plugins: [

			resolve({
				browser: true,
			}),
			// nodeExternals({
			//   deps:true,
			//   exclude: [
			//     'vuedraggable',
			//     'cron-parser',
			//     'node_fs',
			//   ]
			// }),
			commonjs(),

			typescript({tsconfig: path.resolve(__dirname, '../tsconfig.json'), declaration: false}),

			postcss({
				extensions: ['.css', '.less'],
				extract: 'style/style.css',
				plugins: [
					autoprefixer(),
					cssnano({
						zindex: false
					})
				]
			}),
			babel({
				// @rollup/plugin-babel 6.0.3 如果使用 filter 就注释掉 exclude - 互斥的
				// exclude: 'node_modules/**',
				presets: ['@babel/preset-env'],
				// 需要显示指明babelHelpers 配置， 没配置，控制台有一些warning
				babelHelpers: 'bundled',
				// 5.2.1 是不需要配置 extensions 的
				// 5.2.2 以后 需要将 vue配置进去
				extensions: ['.ts', '.js', '.jsx', '.es6', '.es', '.mjs', '.vue'],

				// filter @rollup/plugin-babel 在 5.3.0 版本才有
				// filter配置和 exclude 配置是互斥的，需要自己去实现去掉 node_modules的过滤
				filter: id => {
					return /(\.js|\.jsx|\.es6|\.es|\.mjs)$/.test(id) && !/node_modules/.test(id)
				},
				plugins: [
					'@babel/plugin-proposal-optional-chaining'
				]
			})
		],
	})

	for (const j of buildFormats) {
		let option = {
			format: j.key,
			globals: {
			},

		}
		if (j.key === 'umd') {
			option.name = rollupShowName
		}
		// if (name === './' || name === 'core') {
		// 	option.exports = 'named'
		// }
		await bundle.write({
			...option,
			file: path.resolve(mainPath, `${j.dir}/index.js`),
		})
		await bundle.write({
			...option,
			plugins: [terser()],
			file: path.resolve(mainPath, `${j.dir}/index.min.js`),
		})
	}
	// await bundle.write({
	// 	format: 'es',
	// 	plugins: [dts()],
	// 	file: path.resolve(mainPath, 'types/index.d.ts'),
	//
	// })
	const bundleType = await rollup({
		input: path.resolve(entryPath, `./index.ts`),
		plugins: [dts()]
	})
	await bundleType.write({
		format: 'es',
		file: path.resolve(mainPath, 'types/index.d.ts'),
	})
	console.log('打包完成: ' + rollupShowName)
}

function createStyle(name) {
	const importCss = `
  'use strict';
require('./style.css');
  `

	for (const item of buildFormats) {
		let isStyle = fs.existsSync(path.resolve(mainPath, `./${item.dir}/${name}/style/style.css`))
		if (!isStyle) {
			fsExtra.outputFile(path.resolve(mainPath, `./${item.dir}/${name}/style/style.css`), '', 'utf-8')
		}
		fsExtra.outputFile(path.resolve(mainPath, `./${item.dir}/${name}/style/index.js`), importCss, 'utf-8')
	}
}

function createDts(name) {
	let isStyle = fs.existsSync(path.resolve(entryPath, `./${name}/index.d.ts`))
	let isStyle1 = fs.existsSync(path.resolve(entryPath, `./${name}/types.ts`))
	if (isStyle1) {
		fsExtra.copySync(path.resolve(entryPath, `./${name}/types.ts`), path.resolve(outPath, `./${name}/types.ts`))

	}
	if (isStyle) {
		fsExtra.copySync(path.resolve(entryPath, `./${name}/index.d.ts`), path.resolve(outPath, `./${name}/index.d.ts`))
	} else {
		const str = ``
		// fsExtra.outputFile(path.resolve(outPath, `./${name}/index.d.ts`), str, 'utf-8')
	}
}

buildSingle()