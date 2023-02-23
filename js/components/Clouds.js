import { Object3D, PlaneGeometry, InstancedMesh, InstancedBufferAttribute, Vector3, Vector2, Vector4, Matrix4, Euler, Quaternion, Texture, WebGLRenderTarget, RGBAFormat, NearestFilter, DepthTexture, UnsignedShortType, DepthFormat } from 'three'
import { CloudMaterial } from '../materials'
import store from '../store'
import { E } from '../utils'
import GlobalEvents from '../utils/GlobalEvents'

const params = {
	enable: true,
	enableFadeBit: 1,
	depthFade: 0.001,
	color: {
		r: 254,
		g: 255,
		b: 234,
		a: 0.09
	}
}
const BLOOM_SCENE = 12
export default class Clouds extends InstancedMesh {
	constructor(options) {
		super(
			new PlaneGeometry(10, 10),
			new CloudMaterial({
				alphaMap: new Texture(),
				uColor: new Vector4(params.color.r / 255, params.color.g / 255, params.color.b / 255, params.color.a)
			}),
			500
		)
		this.name = 'CLOUD'
		this.map = options.map
		this.particles = []
		this.particlesCount = 500
		this.spread = 10
		this.step = 10
		this.dummy = new Object3D()
		this._depth = 10
		this._width = 7
		this._height = 4
		this.isCloud = true
		this.bounds = new Vector3(40, 10, 100)
		this.ratio = store.WebGL.renderer.getPixelRatio()
		this.position.set(0, 0, 0)
		this.rotation.set(-Math.PI * 0.1, 0, 0)
		this.layers.enable(BLOOM_SCENE)
	}

	build() {
		this.groups = [[[0], [0], [0]]]

		this.map ? this.getCloudCoordinate() : this.generateParticles()

		this.setSoft()
		this.material.uniforms.uMaskTexture.value = store.MainScene.smoke
		this.texturePosition = new Vector3(0, 0, 0)

		E.on(GlobalEvents.RESIZE, this.onResize)
	}

	getCloudCoordinate() {
		const canvas = document.createElement('canvas')
		canvas.classList.add('cloud-map')
		// document.body.appendChild(canvas)
		const img = new Image()
		img.src = this.map

		img.onload = () => {
			canvas.width = img.naturalWidth
			canvas.height = img.naturalHeight
			canvas.ctx = canvas.getContext('2d')
			canvas.ctx.translate(0, canvas.height)
			canvas.ctx.scale(1, -1)
			canvas.ctx.drawImage(img, 0, 0)
			const imageData = canvas.ctx.getImageData(0, 0, canvas.width, canvas.height)
			const imageMask = Array.from(Array(canvas.height), () => new Array(canvas.width))
			canvas.ctx.clearRect(0, 0, canvas.width, canvas.height)
			canvas.ctx.translate(0, canvas.height)
			canvas.ctx.scale(1, -1)
			canvas.ctx.drawImage(img, 0, 0)
			for (let i = 0; i < canvas.height; i = i + this.step) {
				for (let j = 0; j < canvas.width; j = j + this.step) {
					imageMask[i][j] = imageData.data[(j + i * canvas.width) * 4] > 0
				}
			}
			this.textureCoordinates = []
			for (let i = 0; i < canvas.height; i++) {
				for (let j = 0; j < canvas.width; j++) {
					if (imageMask[i][j]) {
						this.textureCoordinates.push({
							x: j - canvas.width * 0.5,
							y: i - canvas.height * 0.5,
							old: false,
							toDelete: false
						})
					}
				}
			}
			this.generateParticles()
		}
	}

	generateParticles() {
		for (let i = 0; i < 100; i++) {
			const x = Math.random() * 50 - 25
			const y = Math.random() * 50 - 25
			const p = this.particleData(x, y)
			this.particles.push(p)
		}
		for (let i = 0; i < this.particlesCount - 100; i++) {
			const x = Math.random() * 200 - 100
			const y = Math.random() * 200 - 100
			const p = this.particleData(x, y)
			this.particles.push(p)
		}
		// for (let i = 0; i < this.count; i++) {
		// 	this.particles.push(this.particleData(Math.random() * 3 - 1.5, Math.random() * 1 - 0.5))
		// }
		this.count = this.particles.length
		this.createInstance()
	}

	particleData(x, y) {
		const particle = {}
		particle.x = x + .15 * (Math.random() - .5)
		particle.z = 0
		particle.y = -(y + .15 * (Math.random() - .5))

		particle.isGrowing = true
		particle.toDelete = false

		particle.maxScale = .5 + 1.5 * Math.pow(Math.random(), 10)
		particle.scale = particle.maxScale * 0.5 + Math.random() * particle.maxScale * 0.5

		particle.deltaScale = .03 + .03 * Math.random()
		particle.age = Math.PI * Math.random()
		particle.ageDelta = .001 + .002 * Math.random()
		particle.rotationZ = .5 * Math.random() * Math.PI
		particle.deltaRotation = .02 * (Math.random() * 0.1 - .05)

		return particle
	}

	particleGroupData(x, y, z) {
		const particle = {}
		particle.x = x + 2 * (Math.random() - .5)
		particle.z = z + 6 * (Math.random() - .5)
		particle.y = y + 2 * (Math.random() - .5)
		particle.isGrowing = true
		particle.toDelete = false

		particle.maxScale = .5 + 1.5 * Math.pow(Math.random(), 10)
		particle.scale = particle.maxScale * 0.5 + Math.random() * particle.maxScale * 0.5

		particle.deltaScale = .03 + .03 * Math.random()
		particle.age = Math.PI * Math.random()
		particle.ageDelta = .001 + .002 * Math.random()
		particle.rotationZ = .5 * Math.random() * Math.PI
		particle.deltaRotation = .02 * (Math.random() * 0.1 - .05)

		return particle
	}

	createInstance() {
		this.camera = store.MainScene.camera
		this.material.uniforms.uEnableFade.value = params.enableFadeBit
		this.material.uniforms.uColor.value.x = params.color.r / 255
		this.material.uniforms.uColor.value.y = params.color.g / 255
		this.material.uniforms.uColor.value.z = params.color.b / 255
		this.material.uniforms.uColor.value.w = params.color.a
		this.material.uniforms.uResolution.value = new Vector2(
			store.window.w * store.WebGL.renderer.getPixelRatio(),
			store.window.h * store.WebGL.renderer.getPixelRatio()
		)
		// this.material.uniforms.uDepthTexture.value = this.renderTarget.depthTexture
		this.material.uniforms.uCameraNear.value = this.camera.near
		this.material.uniforms.uCameraFar.value = this.camera.far
		this.material.uniforms.uDepthFade.value = params.depthFade

		const matrix = new Matrix4()
		const position = new Vector3()
		const rotation = new Euler()
		const quaternion = new Quaternion()
		const scale = new Vector3()
		const random = []
		this.particles.forEach((el, i) => {
			position.x = el.x
			position.y = el.y
			position.z = el.z

			rotation.x = 0
			rotation.y = el.rotationZ
			rotation.z = el.rotationZ
			quaternion.setFromEuler(rotation)

			scale.x = scale.y = scale.z = 2
			// this.posArray.push(position)
			matrix.compose(position, quaternion, scale)
			random.push(Math.random() * Math.PI * 2)
			this.setMatrixAt(i, matrix)
		})
		this.geometry.setAttribute('randomVal', new InstancedBufferAttribute(new Float32Array(random), 1))
	}

	updadeInstanceMatrix() {
		if (!this.camera) return
		this.particles.forEach((p, i) => {
			this.dummy.position.set(p.x, p.y, p.z)
			this.dummy.updateMatrix()
			this.setMatrixAt(i, this.dummy.matrix)
		})
		this.instanceMatrix.needsUpdate = true
	}

	setSoft() {
		this.renderTarget = new WebGLRenderTarget(1, 1)
		this.renderTarget.texture.format = RGBAFormat
		this.renderTarget.texture.minFilter = NearestFilter
		this.renderTarget.texture.magFilter = NearestFilter
		this.renderTarget.texture.generateMipmaps = false
		this.renderTarget.stencilBuffer = false
		this.renderTarget.depthBuffer = true
		this.renderTarget.depthTexture = new DepthTexture()
		this.renderTarget.depthTexture.type = UnsignedShortType
		this.renderTarget.depthTexture.format = DepthFormat
		this.renderTarget.setSize(Math.floor(store.window.w * store.WebGL.renderer.getPixelRatio()), Math.floor(store.window.h * store.WebGL.renderer.getPixelRatio()))
	}

	onBeforeRender() {
		this.updadeInstanceMatrix()
	}

	onResize = () => {
		this.material.uniforms.uResolution.value = new Vector2(
			store.window.w * store.WebGL.renderer.getPixelRatio(),
			store.window.h * store.WebGL.renderer.getPixelRatio()
		)
	}
}