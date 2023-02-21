import { NoBlending, RawShaderMaterial, Vector2 } from 'three'

import vertexShader from './vert.glsl'
import fragmentShader from './frag.glsl'
import store from '../../store'
export default class BasicMaterial extends RawShaderMaterial {
	constructor() {
		super({
			vertexShader,
			fragmentShader,
			depthWrite: true,
			depthTest: true,
			blending: NoBlending,
			uniforms: {
				uTime: store.WebGL.globalUniforms.uTime,
				uResolution: { value: new Vector2() },
				isDark: { value: 0 }
			}
		})
	}
}