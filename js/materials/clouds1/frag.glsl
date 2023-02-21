#include <defaultFrag>

varying vec3 vNormal;
varying vec2 vUv;
uniform sampler2D alphaMap;
uniform float isDark;
uniform vec2 resolution;
uniform float uTime;

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
	vec2 uv = gl_FragCoord.xy / resolution;
	vec4 t = texture2D(alphaMap, vUv);

	float noiseVal = noise(vec2(uv.x + uTime * 0.05, uv.y) * (20.));
	float colorSwitch = smoothstep(.4, .6, uv.x);
	float finalSwitch = smoothstep( 0.2, 0.5, (noiseVal + colorSwitch + 0.5) * (colorSwitch));
	// colorSwitch = step(.5, uv.x);
	vec3 color = mix(vec3(.9, .9,.9), vec3(1., 0., 0.), finalSwitch);
	vec3 finalColor = mix(color, vec3(0., 0., 0.), isDark);
    gl_FragColor = vec4(finalColor, t.r - 0.1);
	// gl_FragColor = vec4(vec3(finalSwitch), t.r - 0.1);
}