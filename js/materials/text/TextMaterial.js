import { RawShaderMaterial, Color, Vector2 } from 'three'

import vertexShader from './vert.glsl'
import fragmentShader from './frag.glsl'

export default class TextMaterial extends RawShaderMaterial {
	constructor(options) {
		super({
			vertexShader,
			fragmentShader,
			transparent: true,
			uniforms: {
				color1: { value: new Color(options.color1) },
				color2: { value: new Color(options.color2) },
				progress: { value: 0 },
				resolution: { value: new Vector2(options.resolution[0], options.resolution[1]) },
				isDark: { value: 0 },
				uTime: store.WebGL.globalUniforms.uTime
			}
		})
	}
}