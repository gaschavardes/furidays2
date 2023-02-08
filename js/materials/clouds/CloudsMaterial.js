import { RawShaderMaterial, DoubleSide, Vector2 } from 'three'
import vertexShader from './vert.glsl'
import fragmentShader from './frag.glsl'

export default class CloudsMaterial extends RawShaderMaterial {
	constructor(options) {
		super({
			vertexShader,
			fragmentShader,
			depthWrite: false,
			depthTest: true,
			alphaTest: 0.9,
			transparent: true,
			uniforms: {
				color: options.color,
				alphaMap: { value: options.alphaMap },
				uCameraRotation: { value: 0 },
				isDark: { value: options.isDark },
				uTime: store.WebGL.globalUniforms.uTime,
				resolution: { value: new Vector2(options.resolution[0], options.resolution[1]) }
			}
		})
	}
}