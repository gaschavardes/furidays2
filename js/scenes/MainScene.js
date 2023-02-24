import { Color, Fog, Mesh, RGBAFormat, NearestFilter, DepthTexture, UnsignedShortType, DepthFormat, SphereGeometry, WebGLRenderTarget, BoxGeometry, Data3DTexture, RedFormat, LinearFilter, CanvasTexture, BackSide, PerspectiveCamera, Object3D, Group, PlaneGeometry, Matrix4, InstancedMesh, Euler, Quaternion, Layers, Vector2, ShaderMaterial, WebGLCubeRenderTarget, Uint32BufferAttribute, Vector3, BufferGeometry, BufferAttribute, Scene, TorusKnotBufferGeometry, LatheGeometry, MeshBasicMaterial } from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { BasicMaterial, GlassMaterial, TextMaterial } from '../materials'
import store from '../store'
import { E, qs } from '../utils'
import GlobalEvents from '../utils/GlobalEvents'
import { ImprovedNoise } from 'three/examples/jsm/math/ImprovedNoise'
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass'
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import screenFxVert from '../../glsl/includes/screenFx/vert.glsl'
import screenFxFrag from '../../glsl/includes/screenFx/frag.glsl'
import finalFxVert from '../../glsl/includes/finalPass/vert.glsl'
import finalFxFrag from '../../glsl/includes/finalPass/frag.glsl'
import Clouds from '../components/Clouds'

import { TimelineMax } from 'gsap/gsap-core'
import gsap from 'gsap'
const ENTIRE_SCENE = 0; const BLOOM_SCENE = 12; const HALF_BLOOM_SCENE = 15
export default class MainScene extends Scene {
	constructor() {
		super()
		this.link = qs('.link')
		this.loader = qs('.loader')

		E.on('AssetsProgress', (e) => {
			if (e.percent === 100) {
				gsap.to(this.loader, {
					opacity: 0,
					onComplete: () => {
						this.loader.style.pointerEvents = 'none'
					}
				})
			}
		})

		this.dummy = new Object3D()
		this.camera = new PerspectiveCamera(85, store.window.w / store.window.h, 0.1, 5000)
		this.camera.position.z = 50
		this.particlesCount = 500
		this.background = new Color(0x000000)
		// this.fog = new Fog(0x000000, this.camera.near, this.camera.far)

		// this.controls = new OrbitControls(this.camera, store.WebGL.renderer.domElement)
		// this.controls.enableDamping = true
		this.materials = {}
		this.load()
		this.bloomLayer = new Layers()
		this.halfbloomLayer = new Layers()
		this.bloomLayer.set(BLOOM_SCENE)
		this.halfbloomLayer.set(HALF_BLOOM_SCENE)
		this.composer = new EffectComposer(store.WebGL.renderer)
		this.composer.setSize(store.window.w, store.window.h)

		E.on('App:start', () => {
			this.build()
			this.addEvents()
			this.startAnim()
		})
	}

	build() {
		this.disco = this.assets.models.pineapplefbx.children.slice(0, this.assets.models.pineapplefbx.children.length - 1)
		this.disco.forEach((el, i) => {
			if (el.name === 'Pineapple_Mesh') {
				this.quche = el
				this.disco.splice(i, 1)
			}
		})
		this.item = new Mesh()
		this.qucheItem = new Mesh()
		this.drawPieces()
		this.drawQuche()
		this.drawDisco()
		// this.particle = this.buildParticle()
		// this.generateParticles()
		this.clouds = new Clouds({ pos: new Vector3() })
		this.clouds.build()
		this.add(this.clouds)
		this.addBackground()
		this.setCloudRT()
		// this.drawVolumetric()
		this.drawFuridays()
		this.buildPasses()
	}

	addBackground() {
		this.bkgMaterial = new BasicMaterial()
		this.bkgMaterial.uniforms.uResolution.value = new Vector2(
			store.window.w * store.WebGL.renderer.getPixelRatio(),
			store.window.h * store.WebGL.renderer.getPixelRatio()
		)
		this.bkg = new Mesh(new PlaneGeometry(2000, 2000), this.bkgMaterial)
		this.bkg.rotation.set(-Math.PI * 0.1, 0, 0)
		this.bkg.layers.enable(BLOOM_SCENE)
		this.bkg.position.set(0, 0, -100)
		this.add(this.bkg)
	}

	setCloudRT() {
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

	buildPasses() {
		this.renderScene = new RenderPass(this, this.camera)

		this.fxaaPass = new ShaderPass(FXAAShader)
		this.fxaaPass.material.uniforms.resolution.value.x = 1 / (store.window.w * store.WebGL.renderer.getPixelRatio())
		this.fxaaPass.material.uniforms.resolution.value.y = 1 / (store.window.fullHeight * store.WebGL.renderer.getPixelRatio())

		this.bloomPass = new UnrealBloomPass(new Vector2(store.window.w, store.window.fullHeight), 1.120, 2, 0.4)
		this.bloomPass.enabled = true

		this.screenFxPass = new ShaderPass(new ShaderMaterial({
			vertexShader: screenFxVert,
			fragmentShader: screenFxFrag,
			uniforms: {
				tDiffuse: { value: null },
				uMaxDistort: { value: 0.251 },
				uBendAmount: { value: -0.272 }
			}
		}))

		this.composer.addPass(this.renderScene)
		this.composer.renderToScreen = false
		this.composer.addPass(this.fxaaPass)
		this.composer.addPass(this.bloomPass)
		this.composer.addPass(this.screenFxPass)

		const finalPass = new ShaderPass(
			new ShaderMaterial({
				uniforms: {
					baseTexture: { value: null },
					bloomTexture: { value: this.composer.renderTarget2.texture }
				},
				vertexShader: finalFxVert,
				fragmentShader: finalFxFrag,
				defines: {}
			}), 'baseTexture'
		)
		finalPass.needsSwap = true

		this.finalComposer = new EffectComposer(store.WebGL.renderer)
		this.finalComposer.setSize(store.window.w, store.window.h)
		this.finalComposer.addPass(this.renderScene)
		this.finalComposer.addPass(finalPass)
	}

	particleData(x, y) {
		const particle = {}
		particle.x = x
		particle.y = y
		particle.z = -20
		// particle.y = (Math.random() * this.step * 0.1 - this.step * 0.05)

		particle.isGrowing = true
		particle.toDelete = false

		particle.maxScale = 20 + 1.5 * Math.pow(Math.random(), 10)
		particle.scale = particle.maxScale * 0.5 + Math.random() * particle.maxScale * 0.5

		particle.deltaScale = 10 + .03 * Math.random()
		particle.age = Math.PI * Math.random()
		particle.ageDelta = .001 + .002 * Math.random()
		particle.rotationZ = .5 * Math.random() * Math.PI
		particle.deltaRotation = .02 * (Math.random() * 0.1 - .05)

		return particle
	}

	drawFuridays() {
		this.furidays = new Group()
		// this.item = this.assets.models.furidays.scene
		this.assets.models.furidays.scene.children.forEach((el, i) => {
			const geometry = el.geometry
			const material = new TextMaterial({
				color1: i === 0 ? 'rgb(0, 255, 0)' : 'rgb(255, 255, 255)',
				color2: i === 0 ? 'rgb(255, 255, 0)' : 'rgb(255, 255, 255)',
				resolution: [store.window.w * store.WebGL.renderer.getPixelRatio(), store.window.h * store.WebGL.renderer.getPixelRatio()]

			})

			const mesh = new Mesh(geometry, material)
			mesh.layers.enable(i === 0 ? BLOOM_SCENE : HALF_BLOOM_SCENE)
			this.furidays.add(mesh)
		})
		this.add(this.furidays)
		this.furidays.position.set(0, 0, 15)
		// this.furidays.scale.set(3.5, 3.5, 3.5)
		store.isMobile ? this.furidays.scale.set(3.8, 3.8, 3.8) : this.furidays.scale.set(8, 8, 8)
		this.furidays.rotateX(Math.PI * 0.5)

		const vol2 = this.assets.models.vol2.scene.children[0]
		const geometry = vol2.geometry
		const material = new TextMaterial({
			color1: 'rgb(100, 255, 100)',
			color2: 'rgb(100, 255, 100)',
			resolution: [store.window.w * store.WebGL.renderer.getPixelRatio(), store.window.h * store.WebGL.renderer.getPixelRatio()]
		})
		const mesh = new Mesh(geometry, material)
		mesh.scale.set(0.2, 0.2, 0.2)
		mesh.position.set(-vol2.position.x * 2, 0, -vol2.position.z * 1.5)
		this.furidays.add(mesh)
	}

	drawPieces() {
		const position = []
		const normal = []
		const index = []
		const random = []
		const uv = []
		const centroidVal = []
		let indexVal = 0
		const geometry = new BufferGeometry()
		this.disco.forEach((piece, id) => {
			const pieceGeometry = piece.geometry
			if (pieceGeometry) {
				pieceGeometry.computeBoundingBox()
				const centroid = new Vector3()
				pieceGeometry.boundingBox.getCenter(centroid)
				// console.log(centroid)
				for (let i = 0; i < pieceGeometry.attributes.position.array.length; i = i + 3) {
					position.push(pieceGeometry.attributes.position.array[i])
					position.push(pieceGeometry.attributes.position.array[i + 1])
					position.push(pieceGeometry.attributes.position.array[i + 2])
					this.x = pieceGeometry.attributes.position.array[i]
					this.y = pieceGeometry.attributes.position.array[i + 1]
					this.z = pieceGeometry.attributes.position.array[i + 2]

					index.push(pieceGeometry.attributes.index)

					centroidVal.push(centroid.x)
					centroidVal.push(centroid.y)
					centroidVal.push(centroid.z)
				}
				const randomVal = new Vector3(Math.sign(this.x) * this.randomIntFromInterval(2), Math.sign(this.y) * this.randomIntFromInterval(2, 10), this.randomIntFromInterval(2, 10))
				const randomEl = this.randomIntFromInterval(0.5, 10)
				if (pieceGeometry.attributes.normal) {
					for (let i = 0; i < pieceGeometry.attributes.normal.array.length; i = i + 3) {
						normal.push(pieceGeometry.attributes.normal.array[i])
						normal.push(pieceGeometry.attributes.normal.array[i + 1])
						normal.push(pieceGeometry.attributes.normal.array[i + 2])

						random.push(this.x * randomEl)
						random.push(this.y * randomEl)
						random.push(this.z * randomEl)
					}
				}
				if (pieceGeometry.attributes.uv) {
					for (let i = 0; i < pieceGeometry.attributes.uv.array.length; i = i + 2) {
						uv.push(pieceGeometry.attributes.uv.array[i])
						uv.push(pieceGeometry.attributes.uv.array[i + 1])
					}
				}

				indexVal++
				// pieceGeometry.index.array.forEach(el => {
				//
				// })
			}
		})
		// console.log(position)
		const positionArray = new Float32Array(position)
		const normalArray = new Float32Array(normal)
		const uvArray = new Float32Array(uv)
		const indexArray = new Float32Array(index)
		const centroidArray = new Float32Array(centroidVal)
		const randomArray = new Float32Array(random)
		geometry.setAttribute('position', new BufferAttribute(positionArray, 3))
		geometry.setAttribute('center', new BufferAttribute(centroidArray, 3))
		geometry.setAttribute('normal', new BufferAttribute(normalArray, 3))
		// geometry.setIndex(new Uint32BufferAttribute(indexArray, 1))

		geometry.setAttribute('uv', new BufferAttribute(uvArray, 2))
		geometry.setAttribute('index', new BufferAttribute(indexArray, 1))
		geometry.setAttribute('random', new BufferAttribute(randomArray, 3))
		geometry.computeVertexNormals()
		this.item.geometry = geometry
	}

	drawQuche() {
		const position = []
		const normal = []
		const index = []
		const random = []
		const uv = []
		const centroidVal = []
		let indexVal = 0
		const geometry = new BufferGeometry()
		// this.disco.forEach((piece, id) => {
		const pieceGeometry = this.quche.geometry

		if (pieceGeometry) {
			pieceGeometry.computeBoundingBox()
			const centroid = new Vector3()
			pieceGeometry.boundingBox.getCenter(centroid)
			// console.log(centroid)
			for (let i = 0; i < pieceGeometry.attributes.position.array.length; i = i + 3) {
				position.push(pieceGeometry.attributes.position.array[i])
				position.push(pieceGeometry.attributes.position.array[i + 1])
				position.push(pieceGeometry.attributes.position.array[i + 2])
				this.x = pieceGeometry.attributes.position.array[i]
				this.y = pieceGeometry.attributes.position.array[i + 1]
				this.z = pieceGeometry.attributes.position.array[i + 2]
				index.push(pieceGeometry.attributes.index)

				centroidVal.push(centroid.x)
				centroidVal.push(centroid.y)
				centroidVal.push(centroid.z)
			}
			const randomVal = new Vector3(Math.sign(this.x) * this.randomIntFromInterval(0.2, 5), Math.sign(this.y) * this.randomIntFromInterval(0.2, 10), this.randomIntFromInterval(0.2, 10))
			const randomEl = this.randomIntFromInterval(3, 5)
			if (pieceGeometry.attributes.normal) {
				for (let i = 0; i < pieceGeometry.attributes.normal.array.length; i = i + 3) {
					normal.push(pieceGeometry.attributes.normal.array[i])
					normal.push(pieceGeometry.attributes.normal.array[i + 1])
					normal.push(pieceGeometry.attributes.normal.array[i + 2])

					random.push(this.x * randomEl)
					random.push(this.y * randomEl)
					random.push(this.z * randomEl)
				}
			}
			if (pieceGeometry.attributes.uv) {
				for (let i = 0; i < pieceGeometry.attributes.uv.array.length; i = i + 2) {
					uv.push(pieceGeometry.attributes.uv.array[i])
					uv.push(pieceGeometry.attributes.uv.array[i + 1])
				}
			}

			indexVal++
			// pieceGeometry.index.array.forEach(el => {
			//
			// })
		}
		// })
		// console.log(position)
		const positionArray = new Float32Array(position)
		const normalArray = new Float32Array(normal)
		const uvArray = new Float32Array(uv)
		const indexArray = new Float32Array(index)
		const centroidArray = new Float32Array(centroidVal)
		const randomArray = new Float32Array(random)
		geometry.setAttribute('position', new BufferAttribute(positionArray, 3))
		geometry.setAttribute('center', new BufferAttribute(centroidArray, 3))
		geometry.setAttribute('normal', new BufferAttribute(normalArray, 3))
		// geometry.setIndex(new Uint32BufferAttribute(indexArray, 1))

		geometry.setAttribute('uv', new BufferAttribute(uvArray, 2))
		geometry.setAttribute('index', new BufferAttribute(indexArray, 1))
		geometry.setAttribute('random', new BufferAttribute(randomArray, 3))
		geometry.computeVertexNormals()
		this.qucheItem.geometry = geometry
	}

	drawDisco() {
		const renderTarget = new WebGLCubeRenderTarget(this.envTexture.image.naturalHeight / 2)
		renderTarget.fromEquirectangularTexture(store.WebGL.renderer, this.envTexture)
		const texture = renderTarget.texture
		store.WebGL.renderer.initTexture(texture)
		this.pineapple = new Group()

		this.GlassMaterial = new GlassMaterial({
			envMap: texture,
			// backTexture: store.envFbo.texture,
			matCap: this.matcap,
			// normalMap: this.normalMap,
			resolution: [store.window.w * store.WebGL.renderer.getPixelRatio(), store.window.h * store.WebGL.renderer.getPixelRatio()],
			progress: 0,
			fresnelVal: 0.1,
			refractPower: 1
		})
		this.GlassMaterialQuche = new GlassMaterial({
			envMap: texture,
			// backTexture: store.envFbo.texture,
			matCap: this.matcap,
			// normalMap: this.normalMap,
			resolution: [store.window.w * store.WebGL.renderer.getPixelRatio(), store.window.h * store.WebGL.renderer.getPixelRatio()],
			progress: 0,
			fresnelVal: 0.1,
			refractPower: 1,
			isBlack: 0
		})
		this.item.material = this.GlassMaterial

		this.qucheItem.material = this.GlassMaterialQuche
		this.qucheItem.material.uniforms.isQuche.value = 1
		this.qucheItem.layers.enable(BLOOM_SCENE)
		this.item.material.uniforms.isQuche.value = 0
		this.pineapple.add(this.item)
		this.pineapple.add(this.qucheItem)
		this.pineapple.position.set(0., 0., -50)
		this.pineapple.rotation.set(Math.PI * 0.5, 0., 0)
		this.add(this.pineapple)
	}

	randomIntFromInterval(min, max) {
		return Math.floor(Math.random() * (max - min + 1) + min)
	}

	addEvents() {
		E.on(GlobalEvents.RESIZE, this.onResize)

		store.RAFCollection.add(this.onRaf, 3)
	}

	onRaf = () => {
		// this.cloudsUpdate()
		// this.controls.update()
		this.qucheItem.material.uniforms.isQuche.value = 1
		this.item.material.uniforms.isQuche.value = 0
		// this.renderFade()
		this.renderBloom(true)
		this.finalComposer.render()
		// this.item.rotation.y = store.WebGL.globalUniforms.uTime.value
	}

	cloudsUpdate() {
		/// CLOUDS PART
		if (!this.activeCamera) return
		this.clouds.visible = false
		const ctx = store.WebGL.renderer.getContext()
		store.WebGL.renderer.setRenderTarget(this.renderTarget)

		ctx.colorMask(false, false, false, false)

		store.WebGL.renderer.render(this, this.camera)
		store.WebGL.renderer.setRenderTarget(null)

		this.clouds.visible = true
		this.clouds.material.uniforms.uDepthTexture.value = this.renderTarget.depthTexture
		ctx.colorMask(true, true, true, true)
	}

	renderBloom = (mask) => {
		if (mask === true) {
			this.traverse(this.darkenNonBloomed)
			this.composer.render()
			this.traverse(this.restoreMaterial)
		} else {
			store.camera.layers.set(BLOOM_SCENE)
			this.composer.render()
			store.camera.layers.set(ENTIRE_SCENE)
		}
	}

	darkenNonBloomed = (obj) => {
		if (obj.isMesh && this.bloomLayer.test(obj.layers) === true) {
			this.materials[obj.uuid] = obj.material
			obj.material.uniforms.isDark.value = 1
		}
		if (obj.isMesh && this.halfbloomLayer.test(obj.layers) === true) {
			this.materials[obj.uuid] = obj.material
			obj.material.uniforms.isDark.value = 0.3
		}
	}

	restoreMaterial = (obj) => {
		if (this.materials[obj.uuid]) {
			obj.material.uniforms.isDark.value = 0
			delete this.materials[obj.uuid]
		}
	}

	onResize = () => {
		this.camera.aspect = store.window.w / store.window.h
		this.composer.setSize(store.window.w, store.window.h)
		this.finalComposer.setSize(store.window.w, store.window.h)
		this.renderTarget.setSize(Math.floor(store.window.w * store.WebGL.renderer.getPixelRatio()), Math.floor(store.window.h * store.WebGL.renderer.getPixelRatio()))
		this.camera.updateProjectionMatrix()
		this.bkgMaterial.uniforms.uResolution.value = new Vector2(
			store.window.w * store.WebGL.renderer.getPixelRatio(),
			store.window.h * store.WebGL.renderer.getPixelRatio()
		)
		this.GlassMaterial.uniforms.uResolution.value = new Vector2(
			store.window.w * store.WebGL.renderer.getPixelRatio(),
			store.window.h * store.WebGL.renderer.getPixelRatio()
		)
	}

	startAnim() {
		this.tl = gsap.timeline()
		this.pineapplePos = this.pineapple.position
		this.pineappleRot = Math.PI * 0.5
		this.pineappleProgress = 0
		this.tl.to(this.pineapplePos, {
			x: 0,
			y: 0,
			z: 0,
			duration: 5,
			onUpdate: () => {
				this.pineapple.position.set(this.pineapplePos.x, this.pineapplePos.y, this.pineapplePos.z)
			}
		})
			.to(this, {
				pineappleRot: 0,
				duration: 5,
				onUpdate: () => {
					this.pineapple.rotation.set(this.pineappleRot, 0., 0)
				}
			}, '-=5')
			.to(this, {
				pineappleProgress: 1,
				duration: 3,
				onUpdate: () => {
					this.item.material.uniforms.uProgress.value = this.pineappleProgress
					this.furidays.children.forEach(el => {
						el.material.uniforms.progress.value = this.pineappleProgress
					})
				},
				onComplete: () => {
					gsap.to(this.link, { opacity: 1, duration: 1 })
					this.link.addEventListener('click', (e) => {
						e.preventDefault()
						gsap.to(this, {
							pineappleProgress: 0,
							duration: 1,
							ease: 'power2.out',
							onUpdate: () => {
								this.item.material.uniforms.uProgress.value = this.pineappleProgress
							},
							onComplete: () => {
								this.item.material.uniforms.uX.value = -100
								this.item.material.uniforms.uIncrease.value = 3
								this.explode = gsap.to(this, {
									pineappleProgress: 1,
									duration: 2,
									ease: 'power2.inout',
									onUpdate: (self) => {
										console.log(this.explode.progress())
										if (this.explode.progress() > 0.6) {
											if (!this.redirected) {
												document.location.href = 'https://www.helloasso.com/associations/association-furidays/evenements/furidays-volume-ii'
												this.redirected = true
											}
										}
										this.item.material.uniforms.uProgress.value = this.pineappleProgress
									},
									onComplete: () => {
										// this.item.material.uniforms.uX.value = 0
										// this.item.material.uniforms.uIncrease.value = 1
										// this.redirected = false
									}
								})
							}
						})
					})
				}
			}, '-=1')
	}

	load() {
		this.assets = {
			textures: {},
			models: {}
		}
		const glb = {
			// furidays: 'furidays.glb',
			furidays: 'furidays.glb',
			vol2: 'vol2.glb'
		}
		const fbx = {
			pineapplefbx: 'pineapplefbxLightHalf.fbx'
			// pineapplefbx: 'pineapplefbx.fbx'
		}

		store.AssetLoader.loadTexture('/textures/diamonMatCap.png').then(texture => {
			this.matcap = texture
		})
		store.AssetLoader.loadTexture('/textures/diamondEnv.png').then(texture => {
			this.envTexture = texture
		})

		store.AssetLoader.loadTexture('/textures/smoke.png').then(texture => {
			this.smoke = texture
		})

		for (const key in glb) {
			store.AssetLoader.loadGltf((`models/${glb[key]}`)).then((gltf, animation) => {
				this.assets.models[key] = gltf
			})
		}

		for (const key in fbx) {
			store.AssetLoader.loadFbx((`models/${fbx[key]}`)).then((gltf, animation) => {
				this.assets.models[key] = gltf
			})
		}
	}
}