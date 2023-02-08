import { RawShaderMaterial, BackSide, Vector3, Color } from 'three'

import vertexShader from './vert.glsl'
import fragmentShader from './frag.glsl'

export default class CloudVolMaterial extends RawShaderMaterial {
	constructor(options) {
		super({
			vertexShader,
			fragmentShader,
			side: BackSide,
			transparent: true,
			uniforms: {
				base: { value: new Color(0x798aa0) },
				map: { value: options.texture },
				cameraPos: { value: new Vector3() },
				threshold: { value: 0.25 },
				opacity: { value: 0.25 },
				range: { value: 0.1 },
				steps: { value: 100 },
				frame: { value: 0 }
			}

		})
	}
}