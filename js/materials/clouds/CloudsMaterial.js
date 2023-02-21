import { ShaderMaterial, Texture, Vector2, Vector4 } from 'three'
import vertexShader from './vert.glsl'
import fragmentShader from './frag.glsl'
import { mergeDeep } from '../../utils'
import store from '../../store'
export default class CloudMaterial extends ShaderMaterial {
	constructor(options = {}) {
		console.log(options)
		options = mergeDeep(
			{
				uniforms: {
					uMaskTexture: { value: new Texture() },
					uColor: { value: Vector4 },
					alphaMap: { value: options.alphaMap },
					uTime: store.WebGL.globalUniforms.uTime,
					uCameraNear: { value: 0 },
					uCameraFar: { value: 0 },
					uDepthFade: { value: 0 },
					uResolution: { value: new Vector2() },
					uDepthTexture: { value: null },
					uEnableFade: { value: 1 },
					uSpriteGrid: { value: new Vector2(4, 4) },
					isDark: { value: 0 }
				},
				defines: {
					// ...store.WebGL.scenes.MainScene.components.fog.fogDefines
				}
			}, options)

		super({
			vertexShader,
			fragmentShader,
			uniforms: options.uniforms,
			defines: options.defines,
			transparent: true,
			alphaTest: 0.1,
			depthWrite: false
		})

		this.globalUniforms = options.globalUniforms
		this.uniforms = Object.assign(this.uniforms, this.globalUniforms)
	}

	/*
		Ensure correct cloning of uniforms with original references
	*/
	clone(uniforms) {
		const newMaterial = super.clone()
		newMaterial.uniforms = Object.assign(newMaterial.uniforms, this.globalUniforms)
		newMaterial.uniforms = Object.assign(newMaterial.uniforms, uniforms)
		return newMaterial
	}
}