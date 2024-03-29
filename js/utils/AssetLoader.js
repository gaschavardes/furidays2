import store from '../store'
import { E } from './'

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import { TextureLoader } from 'three'

/**
*   Add any promises that need to be resolved before showing
*   the page by using the add( promise ) method.
*/

export default class AssetLoader {
	constructor(progressEventName = 'AssetsProgress') {
		this.promisesToLoad = []
		this.fontsLoaded = false
		this.loaded = false
		this.progressEventName = progressEventName

		this.jsons = {}
		this.gltfs = {}
		this.fbxs = {}
		this.textures = {}

		this.textureLoader = new TextureLoader()
		this.fbxLoader = new FBXLoader()
		this.gltfLoader = new GLTFLoader()
	}

	load = ({ element = document.body, progress = true } = {}) => {
		if (element) {
			this.element = element
			this.addFonts()
			this.addMedia()
		}

		let loadedCount = 0

		if (progress) {
			for (let i = 0; i < this.promisesToLoad.length; i++) {
				this.promisesToLoad[i].then(() => {
					loadedCount++
					this.progressCallback((loadedCount * 100) / this.promisesToLoad.length)
				})
			}
		}

		this.loaded = new Promise(resolve => {
			Promise.all(this.promisesToLoad).then(() => {
				this.reset()
				resolve()
			})
		})

		return this.loaded
	}

	progressCallback = (percentLoaded) => {
		E.emit(this.progressEventName, { percent: Math.ceil(percentLoaded) })
	}

	add = (promise) => {
		this.promisesToLoad.push(promise)
		return promise
	}

	addMedia = () => {
		const images = this.element.querySelectorAll('img')
		for (let i = 0; i < images.length; i++) {
			this.addImage(images[i])
		}

		const videos = this.element.querySelectorAll('video:not([lazy])')
		for (let i = 0; i < videos.length; i++) {
			this.add(new Promise(resolve => {
				videos[i].crossOrigin = ''
				videos[i].addEventListener('canplaythrough', function playthrough() {
					videos[i].removeEventListener('canplaythrough', playthrough)

					videos[i].addEventListener('timeupdate', function ready() {
						videos[i].removeEventListener('timeupdate', ready)
						videos[i].pause()
						resolve()
					})
				})
				videos[i].addEventListener('error', resolve)
				if (videos[i].src === '' && videos[i].dataset.src) {
					videos[i].src = videos[i].dataset.src
				}
				videos[i].load()
				videos[i].play()
			}))
		}
	}

	addImage(el) {
		return this.add(new Promise(resolve => {
			if (el.complete && el.naturalWidth !== 0) {
				// image already loaded so resolve
				resolve(el)
			} else {
				// image not loaded yet so listen for it
				el.addEventListener('load', () => { resolve(el) })
				el.addEventListener('error', () => { resolve(el) })
			}
		}))
	}

	addFonts = () => {
		if (document.fonts) {
			this.add(document.fonts.ready)
		}

		if (!this.fontsLoaded && window.Typekit) {
			this.add(new Promise(resolve => {
				window.Typekit.load({
					active: () => {
						this.fontsLoaded = true
						resolve()
					}
				})
			}))
		}
	}

	loadJson = (url) => {
		if (!this.jsons[url]) {
			this.jsons[url] = this.add(new Promise((resolve, reject) => {
				fetch(url, {
					headers: {
						'Content-Type': 'application/json'
					}
				})
					.then(response => {
						if (!response.ok) {
							throw new Error('Network response was not ok for request: ', url)
						}
						resolve(response.json())
					}, reject)
			}))
		}

		return this.jsons[url]
	}

	loadGltf = (url) => {
		if (!this.gltfs[url]) {
			this.gltfs[url] = this.add(new Promise((resolve, reject) => {
				this.gltfLoader.load(url, gltf => {
					resolve(gltf)
				}, undefined, reject)
			}))
		}

		return this.gltfs[url]
	}

	loadFbx = (url) => {
		if (!this.fbxs[url]) {
			this.fbxs[url] = this.add(new Promise((resolve, reject) => {
				this.fbxLoader.load(url, fbx => {
					resolve(fbx)
				}, undefined, reject)
			}))
		}

		return this.fbxs[url]
	}

	loadTexture = (url, options) => {
		if (!this.textures[url]) {
			this.textures[url] = this.add(new Promise((resolve, reject) => {
				this.textureLoader.load(url, texture => {
					resolve(store.WebGL.generateTexture(texture, options))
				}, undefined, reject)
			}))
		}

		return this.textures[url]
	}

	reset = () => {
		this.promisesToLoad = []
	}
}