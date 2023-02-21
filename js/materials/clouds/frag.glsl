// #include <defaultFrag>
// #include <packing>
// #include <fog_pars_fragment>
// varying vec2 vUv;
// varying vec4 vViewPosition;
// varying float vFade;
// uniform float uCameraNear;
// uniform float uCameraFar;
// uniform vec2 uResolution;
// uniform sampler2D uDepthTexture;
// uniform float uDepthFade;
// uniform sampler2D uMaskTexture;
// uniform float uEnableFade;
// uniform vec2 uSpriteGrid;
// uniform vec4 uColor;
// uniform float uTime;
// uniform float isDark;
// float readDepth(sampler2D depthSampler, vec2 coord) {
// float fragCoordZ = texture2D(depthSampler, coord).x;
// float viewZ = perspectiveDepthToViewZ(fragCoordZ, uCameraNear, uCameraFar);
// return viewZToOrthographicDepth(viewZ, uCameraNear, uCameraFar);
// }
// float rand(vec2 n) { 
// 	return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
// }

// float noise(vec2 p){
// 	vec2 ip = floor(p);
// 	vec2 u = fract(p);
// 	u = u*u*(3.0-2.0*u);
	
// 	float res = mix(
// 		mix(rand(ip),rand(ip+vec2(1.0,0.0)),u.x),
// 		mix(rand(ip+vec2(0.0,1.0)),rand(ip+vec2(1.0,1.0)),u.x),u.y);
// 	return res*res;
// }
// void main() {
// 	vec4 diffuseColor = vec4(vec3(0.), 1.);
// 	float mask = texture2D(uMaskTexture, vUv).r;
	
// 	vec2 screenCoord = vec2(
// 		gl_FragCoord.x / uResolution.x,
// 		gl_FragCoord.y / uResolution.y
// 	);
// 	float sceneDepth = readDepth(uDepthTexture, screenCoord);
// 	float viewZ = vViewPosition.z;
// 	float currentDepth = viewZToOrthographicDepth(viewZ, uCameraNear, uCameraFar);
// 	float depthFade = mix(
// 		1.,
// 		clamp(abs(currentDepth - sceneDepth) / max(uDepthFade, .0001), 0., 1.),
// 		uEnableFade
// 	);
// 	vec4 depth =  texture2D(uDepthTexture, screenCoord);

// 	float noiseVal = noise(vec2(screenCoord.x + uTime * 0.05, screenCoord.y) * (10.));
// 	float colorSwitch = smoothstep(.2, .8, screenCoord.x);
// 	float finalSwitch = smoothstep( 0.2, 0.8, (noiseVal + colorSwitch + 0.5) * (colorSwitch));
// 	// colorSwitch = step(.5, uv.x);

// 	float noiseCol = noise(vec2(screenCoord.x + uTime * 0.05, screenCoord.y * uTime * 0.05) * (10.));
// 	vec3 colorChaos = mix(vec3(1., .2, .2), vec3(.2, 1, .0), noiseCol );
// 	vec3 color = mix(vec3(.9, .9,.9), colorChaos, finalSwitch);
// 	vec3 finalColor = mix(color, vec3(0., 0., 0.), isDark);

// 	diffuseColor.a *= .8 * depthFade * mask;
// 	gl_FragColor = vec4(diffuseColor.rgb, diffuseColor.a);
// 	// gl_FragColor = depth;
// 	// #include <glow>
// }


#include <defaultFrag>
#include <packing>
#include <fog_pars_fragment>
varying vec2 vUv;
varying vec4 vViewPosition;
varying float vFade;
uniform float uCameraNear;
uniform float uCameraFar;
uniform vec2 uResolution;
uniform sampler2D uDepthTexture;
uniform float uDepthFade;
uniform sampler2D uMaskTexture;
uniform float uEnableFade;
uniform vec2 uSpriteGrid;
uniform vec4 uColor;
uniform float isDark;
uniform float uTime;
float readDepth(sampler2D depthSampler, vec2 coord) {
float fragCoordZ = texture2D(depthSampler, coord).x;
float viewZ = perspectiveDepthToViewZ(fragCoordZ, uCameraNear, uCameraFar);
return viewZToOrthographicDepth(viewZ, uCameraNear, uCameraFar);
}

float rand(vec2 n) { 
	return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

float noise(vec2 p){
	vec2 ip = floor(p);
	vec2 u = fract(p);
	u = u*u*(3.0-2.0*u);
	
	float res = mix(
		mix(rand(ip),rand(ip+vec2(1.0,0.0)),u.x),
		mix(rand(ip+vec2(0.0,1.0)),rand(ip+vec2(1.0,1.0)),u.x),u.y);
	return res*res;
}

void main() {
	vec4 diffuseColor = vec4(vec3(0.), 1.);
	float mask = texture2D(uMaskTexture, vUv).r;
	diffuseColor = uColor;
	vec2 screenCoord = vec2(
		gl_FragCoord.x / uResolution.x,
		gl_FragCoord.y / uResolution.y
	);
	float sceneDepth = readDepth(uDepthTexture, screenCoord);
	float viewZ = vViewPosition.z;
	float currentDepth = viewZToOrthographicDepth(viewZ, uCameraNear, uCameraFar);
	float depthFade = mix(
		1.,
		clamp(abs(currentDepth - sceneDepth) / max(uDepthFade, .01), 0., 1.),
		uEnableFade
	);

	float noiseTime = 10. + sin(uTime * 0.001) * 50.;
	float noiseVal = noise(vec2(screenCoord.x + noiseTime * 0.05, screenCoord.y));
	float colorSwitch = smoothstep(.2, .8, screenCoord.x);
	float finalSwitch = smoothstep( 0.2, 0.8, (noiseVal + colorSwitch + 0.5) * (colorSwitch));

	// float colorSwitch = smoothstep(.2, .8, screenCoord.x);
	diffuseColor.a *= 2. * depthFade * mask;
	gl_FragColor = mix(vec4(vec3(1., .9, .7), diffuseColor.a), vec4(0., 0., 0.,1.), isDark) ;
	// gl_FragColor = vec4(vec3(sceneDepth), mask );
}