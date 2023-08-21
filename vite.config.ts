import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import importToCDN from 'vite-plugin-cdn-import'
// https://vitejs.dev/config/
export default defineConfig({
	plugins: [vue(), importToCDN({
		modules: [
			{
				name: 'leaflet',
				var: 'L',
				path: ["https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"]
			}
		]
	})],
	build: {
		lib: {
			entry: 'src/components/drawMap/index.ts',
			name: 'DrawMapLeaflet',
			fileName: (format) => `drawMapLeaflet.${format}.js`
		},
		rollupOptions: {
			external: ['leaflet'],
			output: {
				globals: {
					leaflet: 'L'
				}
			}
		}
	}
})
