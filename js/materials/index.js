import { ShaderChunk } from 'three'
import { glslifyStrip } from '../utils'
import defaultVert from '../../glsl/includes/default/vert.glsl'
import defaultFrag from '../../glsl/includes/default/frag.glsl'
import normalsVert from '../../glsl/includes/normals/vert.glsl'

import BasicMaterial from './basic/BasicMaterial'
import TestMaterial from './test/TestMaterial'
import GlassMaterial from './glass/GlassMaterial'
import CloudMaterial from './clouds/CloudsMaterial'
import TextMaterial from './text/TextMaterial'
import CloudVolMaterial from './cloudVol/CloudVolMaterial'

// Shader #include chunks
ShaderChunk.defaultVert = glslifyStrip(defaultVert)
ShaderChunk.defaultFrag = glslifyStrip(defaultFrag)
ShaderChunk.normalsVert = glslifyStrip(normalsVert)

export {
	BasicMaterial, TestMaterial, GlassMaterial, CloudMaterial, TextMaterial, CloudVolMaterial
}