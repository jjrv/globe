precision highp float;

uniform sampler2D uTexture;

varying vec2 vUV;

void main() {
	vec4 color = texture2D(uTexture, vUV);
	gl_FragColor = vec4(color.xyz, 1.0);
}
