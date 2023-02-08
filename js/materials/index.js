import { ShaderChunk } from 'three'
import { glslifyStrip } from '../utils'
import defaultVert from '../../glsl/includes/default/vert.glsl'
import defaultFrag from '../../glsl/includes/default/frag.glsl'
import normalsVert from '../../glsl/includes/normals/vert.glsl'

import BasicMaterial from './basic/BasicMaterial'
import TestMaterial from './test/TestMaterial'
import GlassMaterial from './glass/GlassMaterial'
import CloudsMaterial from './clouds/CloudsMaterial'
import TextMaterial from './text/TextMaterial'

// Shader #include chunks
ShaderChunk.defaultVert = glslifyStrip(defaultVert)
ShaderChunk.defaultFrag = glslifyStrip(defaultFrag)
ShaderChunk.normalsVert = glslifyStrip(normalsVert)

export {
	BasicMaterial, TestMaterial, GlassMaterial, CloudsMaterial, TextMaterial
}