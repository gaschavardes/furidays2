varying vec3 eyeVector;
varying vec3 worldNormal;
varying vec3 newWorldNormal;
varying vec3 worldPosition;
varying vec2 vUv;
varying vec3 initNormal;
attribute float index;
attribute vec3 center;
attribute vec3 random;
uniform float uProgress;
uniform float uStartingTime;
uniform float uTime;
uniform vec2 resolution;
uniform vec2 uMouse;
varying vec3 vReflect;
varying vec3 vNormal;

mat4 rotationMatrix(vec3 axis, float angle)
{
		axis = normalize(axis);
		float s = sin(angle);
		float c = cos(angle);
		float oc = 1.0 - c;

		return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
														oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
														oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
														0.0,                                0.0,                                0.0,                                1.0);
}

vec3 scale(vec3 v, float val) {
	mat4 scaleMat =mat4( val,   0.0,  0.0,  0.0,
																						0.0,  val,   0.0,  0.0,
																						0.0,  0.0,  val,   0.0,
																						0.0,  0.0,  0.0,  1.0
														);
	return (scaleMat * vec4(v, 1.0)).xyz;
}

vec3 rotate(vec3 v, vec3 axis, float angle) {
  mat4 m = rotationMatrix(axis, angle);
  return (m * vec4(v, 1.0)).xyz;
}
vec3 bezier4(vec3 a, vec3 b, vec3 c, vec3 d, float t) {
  return mix(mix(mix(a, b, t), mix(b, c, t), t), mix(mix(b, c, t), mix(c, d, t), t), t);
}

float easeInOutQuint(float t){
  return t < 0.5 ? 16.0 * t * t * t * t * t : 1.0 + 16.0 * (--t) * t * t * t * t;
}
float easeOutQuint(float t){
  return 1. + (--t) * t * t * t * t;
}
float easeOut(float t){
  return  t * t * t;
}
float exponentialInOut(float t) {
  return t == 0.0 || t == 1.0
    ? t
    : t < 0.5
      ? +0.5 * pow(2.0, (20.0 * t) - 10.0)
      : -0.5 * pow(2.0, 10.0 - (t * 20.0)) + 1.0;
}


vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
    return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}

void main() {
	vUv = uv;

	vec3 pos = position;
	vec3 newNorm = normal;
	vNormal = normal;

		/// ROTATE MESH
	pos = rotate(pos, vec3(0., 1., 0.), uTime * 0.2);
	vec3 newCenter = rotate(center, vec3(0., 1., 0.), uTime * 0.2);
	vec3 newRandom = rotate(random, vec3(0., 1., 0.), uTime * 0.2);
	float movingEl = exponentialInOut((smoothstep(-8., -6., newCenter.y)) * ( 1. - smoothstep(6., 8., newCenter.y)) * (smoothstep(0., 10., newCenter.x + 2.)) * uProgress);


    vec3 objectNormal = vec3(normal);
    vec3 transformedNormal = objectNormal;
    transformedNormal = normalMatrix*transformedNormal;

	float mask = smoothstep(uv.y, 0.5, 1.);


	vec3 translatePos = vec3(0.);
	translatePos.z += random.z * clamp(sign(center.z + 2.) * random.z, -1., 1.) * abs(sin(uTime * 0.3)) * 6. + sin(uTime - uStartingTime) * abs(sin(uTime * 0.3)) * clamp(random.z - 10., -.1, .1);
	translatePos.x += (random.x ) * sin(sign(center.x) * random.x ) * abs(sin(uTime * 0.3)) * 10. + sin(uTime - uStartingTime) * abs(sin(uTime * 0.3)) * clamp(random.z - 10., -.1, .1);
	translatePos.y += (random.y ) * cos(sign(center.y) * random.y ) * abs(sin(uTime * 0.3)) * 10. + sin(uTime - uStartingTime) * abs(sin(uTime * 0.3)) * clamp(random.z - 10., -.1, .1);

	// if(center.x != 0.){
	// 	pos = position - center;
	// 	float zT = random.z * clamp(sign(center.z) * random.z, -1., 1.) * 0.2 * 6. + (uTime - uStartingTime) * abs(sin(uTime * 0.3)) * clamp(random.z - 10., -.1, .1);
	// 	// pos = scale(pos, abs(1. - clamp(zT , 0., 1.)));
		vec3 rotation = rotate(newCenter, newCenter, newRandom.x * movingEl);
		pos = rotate(pos, newCenter, newRandom.x * movingEl);
		// pos = rotate(pos, , newRandom.x * movingEl);
	// 	newNorm = rotate(newNorm, vec3(1., 0., 0.) + center, abs(sin(uTime * 0.3)) * 5. + (uTime - uStartingTime) * abs(sin(uTime * 0.3)) * clamp(random.z, 0., 4.) * 0.5);

	// 	float zVal = center.z + random.z * clamp(sign(center.z + 2.) * random.z, -1., 1.) * abs(sin(uTime * 0.3)) * 6. + sin(uTime - uStartingTime) * uProgress * clamp(random.z - 10., -.1, .1);
	// 	pos = scale(pos, clamp(translatePos.z + 4., 0., 1.) );
	// 	pos += center;
	// }
	vec4 worldPosition = modelMatrix * vec4( pos, 1.0);


	///// MOVING PIECES
	float way = mix(1., -1., mod(index, 2.));
	pos.x += movingEl * newRandom.x * 0.5;
	pos.z += movingEl * newRandom.z * 0.;
	pos.y += movingEl * newRandom.y * 0.5;
	
	// newposition = rotate(newposition - centroid,axis,(1. - vTemp)*tProgress*(3. + offset*10.)) + centroid;
	// newposition += newposition + (1.5 - vTemp)*centroid*(tProgress)*(3. + vTemp*7. + offset*3.);


	vec3 cameraToVertex;
	if ( isOrthographic ) {
		cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
	}
	else {
		cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
	}
	vec3 newWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vReflect = reflect( cameraToVertex, newWorldNormal );

	eyeVector = normalize(worldPosition.xyz - cameraPosition);
	worldNormal = normalize( modelViewMatrix * vec4(normal, 0.0)).xyz;

	
	gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}