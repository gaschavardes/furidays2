varying vec3 vNormal;
varying vec2 vUv;
varying vec4 vViewPosition;
uniform float uCameraRotation;
uniform float uTime;
varying float vFade;
attribute float randomVal;


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
mat4 translationMatrix(vec3 axis)
{

		return mat4(1., 0., 0., 0.,
					0., 1., 0., 0.,
					0., 0., 1., 0., 
					axis.r , axis.g , axis.b , 1.);
}

mat4 scaleMatrix(float val)
{

		return mat4(val, 0., 0., 0.,
					0., val, 0., 0.,
					0., 0., val, 0., 
					0., 0., 0., 1.);
}


void main()	{
	vUv = uv;
	mat4 transformedMatrix = instanceMatrix;
	vFade = 0.5;
	
	vec4 newPos = vec4(position, 1.);
	newPos *= rotationMatrix(vec3(0., 0., 1.), uTime * 0.02 * randomVal) * scaleMatrix(4. + sin(uTime * 0.1 + randomVal) * .8);
	vec3 up = vec3(modelViewMatrix[0][1], modelViewMatrix[1][1], modelViewMatrix[2][1]);
	vec3 right = vec3(modelViewMatrix[0][0], modelViewMatrix[1][0], modelViewMatrix[2][0]);
	newPos.xyz = right * newPos.x + up * newPos.y;

	vec4 mvPosition = modelViewMatrix * transformedMatrix * newPos;
    vViewPosition = mvPosition;
    gl_Position = projectionMatrix * mvPosition;
}