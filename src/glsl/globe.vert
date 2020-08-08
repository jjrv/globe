precision highp float;

uniform mat3 uTransform;

attribute vec3 aPos;
attribute vec2 aUV;

varying vec2 vUV;

void main() {
	vec3 xyz = uTransform * aPos;
	if(xyz.z < 0.0) xyz.xy *= sqrt(1.0 / (1.0 - xyz.z));

	gl_Position = vec4(xyz, 1.0);
	vUV = vec2(aUV.x / 360.0 + 0.5, 0.5 - aUV.y / 180.0);
}
