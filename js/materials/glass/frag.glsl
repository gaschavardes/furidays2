uniform samplerCube envMap;
// uniform sampler2D backfaceMap;
uniform vec2 resolution;
uniform float uProgress;
uniform float uFresnelVal;
uniform float uRefractPower;
uniform float isQuche;
uniform float isDark;
uniform sampler2D matCapMap;
varying vec3 worldNormal;
varying vec3 eyeVector;
varying vec3 viewDirection;
varying vec2 vUv; 
varying vec3 worldPosition;
varying vec3 vReflect;
varying vec3 vNormal;

float ior = 1.5;
float diffuse = 0.2;
float a = .5;

vec2 matcap(vec3 eye, vec3 normal) {
  vec3 reflected = reflect(eye, normal);
  float m = 2.8284271247461903 * sqrt( reflected.z+1.0 );
  return reflected.xy / m + 0.5;
}

float Fresnel(vec3 eyeVector, vec3 worldNormal) {
	return pow( 1.0 + dot( eyeVector, worldNormal), 3.0 );
}

void main() {
		vec2 uv = gl_FragCoord.xy / resolution;
		

		// vec4 backfaceTex = texture2D(backfaceMap, uv);
		// vec3 backfaceNormal = backfaceTex.rgb;
		// float backfaceDepth = backfaceTex.a;

		// float frontfaceDepth = worldPosition.z;

		// vec3 normal = mix(worldNormal * (1.0 - a) - backfaceNormal * a, worldNormal * (1.0 - a) - backfaceNormal * a, 1.) ;
		// calculate refraction and add to the screen coordinates
		// vec3 refracted = refract(eyeVector, normal, 1.0/ior);
		// uv += refracted.xy;
		// vec4 backText = texture2D(uBackTexture, uv);
		float f = Fresnel(eyeVector, vNormal);
		vec2 matCapUv = matcap(eyeVector, vNormal).xy;
		vec4 matCap = texture2D(matCapMap, uv);

		vec4 envMapColor = textureCube(envMap, vReflect + vNormal);
		envMapColor.rgb = mix(envMapColor.rgb, vec3(0., 1., 0.) + vNormal * 0.5, isQuche);
		// float test = step(backText.g, .3);
		// vec4 texture = mix(backText, envMapColor, test);
		// gl_FragColor = vec4(envMapColor.rgb, 0.6);
		vec3 refractCol = mix(envMapColor.rgb, matCap.rgb, f );

		gl_FragColor = vec4(envMapColor * (1. - isDark));
	}