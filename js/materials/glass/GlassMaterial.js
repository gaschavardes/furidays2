import { DoubleSide, ShaderMaterial, Vector2 } from 'three'

import vertexShader from './vert.glsl'
import fragmentShader from './frag.glsl'

export default class GlassMaterial extends ShaderMaterial {
	constructor(options) {
		super({
			vertexShader,
			fragmentShader,
			depthWrite: true,
			depthTest: true,
			transparent: true,
			opacity: 1,
			uniforms: {
				envMap: { value: options.envMap },
				uMouse: { value: new Vector2() },
				resolution: { value: new Vector2(options.resolution[0], options.resolution[1]) },
				matCapMap: { value: options.matCapMap },
				uTime: store.WebGL.globalUniforms.uTime,
				uProgress: { value: 0 },
				isQuche: { value: 0 },
				isDark: { value: 0 },
				uX: { value: 0 },
				uIncrease: { value: 1 },
				// uFresnelVal: { value: options.fresnelVal },
				uStartingTime: { value: 0 }
				// uRefractPower: { value: options.refractPower }
			},
			side: DoubleSide
		})
	}
}