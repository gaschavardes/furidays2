#include <defaultFrag>

varying vec3 vNormal;
uniform vec3 color1;
uniform vec3 color2;
uniform vec2 resolution;
uniform float isDark;
uniform float uTime;
uniform float progress;


void main() {
	vec2 uv = gl_FragCoord.xy / resolution;
	float alphaVal = -progress * 2. + 1.;
	float alphaSwitch = smoothstep(.4 - alphaVal, .6 - alphaVal, uv.x);
	float colorSwitch = smoothstep(.45, .55, uv.y);
	vec3 color = mix(color2, color1, colorSwitch);
    
	vec3 bloomColor = mix(color, vec3(0., 0., 0.), isDark);
	gl_FragColor = vec4(bloomColor, 1. - alphaSwitch);
}