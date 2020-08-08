/// <reference path="glsl.d.ts" />

import { Shader } from './Shader';
import globeVertex from './glsl/globe.vert';
import globeFragment from './glsl/globe.frag';

const enum Attribute {
	pos,
	uv
}

export class Globe {

	constructor(public canvas: HTMLCanvasElement, img: HTMLImageElement) {
		const gl = canvas.getContext(
			'experimental-webgl',
			// { preserveDrawingBuffer: true }
		) as WebGLRenderingContext;

		if(!gl) throw new Error('Error creating WebGL context');
		this.gl = gl;

		gl.clearColor(0, 0, 0, 0);
		gl.disable(gl.DEPTH_TEST);
		gl.enable(gl.CULL_FACE);
		gl.enable(gl.BLEND);

		this.globeShader = new Shader(gl, {
			vertex: globeVertex,
			fragment: globeFragment,
			attributes: {
				[Attribute.pos]: 'aPos',
				[Attribute.uv]: 'aUV'
			},
			uniforms: [
				'uTransform',
				'uTexture'
			]
		});

		const anchorPts: number[] = [];
		const uvPts: number[] = [];

		let x: number, y: number, z: number;

		for(let lat = 85; lat > -85; lat -= 2.5) {
			for(let lon = -180; lon <= 180; lon += 2.5) {
				x = -Math.cos(lon / 180 * Math.PI) * Math.cos(lat / 180 * Math.PI);
				y = Math.sin(lat / 180 * Math.PI);
				z = -Math.sin(lon / 180 * Math.PI) * Math.cos(lat / 180 * Math.PI);

				anchorPts.push(x);
				anchorPts.push(y);
				anchorPts.push(z);

				uvPts.push(lon);
				uvPts.push(lat);

				const lat2 = lat - 2.5;

				x = -Math.cos(lon / 180 * Math.PI) * Math.cos(lat2 / 180 * Math.PI);
				y = Math.sin(lat2 / 180 * Math.PI);
				z = -Math.sin(lon / 180 * Math.PI) * Math.cos(lat2 / 180 * Math.PI);

				anchorPts.push(x);
				anchorPts.push(y);
				anchorPts.push(z);

				uvPts.push(lon);
				uvPts.push(lat2);
			}
		}

		this.anchorBuffer = gl.createBuffer()!;
		this.uvBuffer = gl.createBuffer()!;

		this.anchorData = new Float32Array(anchorPts);
		this.uvData = new Float32Array(uvPts);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.anchorBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, this.anchorData, gl.STREAM_DRAW);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, this.uvData, gl.STREAM_DRAW);

		// gl.viewport(0, 0, 2048, 2048);
		this.globeShader.activate();

		const texture = gl.createTexture()!;
		gl.bindTexture(gl.TEXTURE_2D, texture);

		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

		gl.activeTexture(gl.TEXTURE0);
		gl.uniform1i(this.globeShader.uniformTbl['uTexture'], 0);
	}

	render(slat0: number, clat0: number, lon0: number) {
		const gl = this.gl;
		const slon0 = Math.sin(lon0);
		const clon0 = Math.cos(lon0);

		gl.uniformMatrix3fv(
			this.globeShader.uniformTbl['uTransform'],
			false,
			[
				clon0, -slat0 * slon0, -clat0 * slon0,
				0, clat0, -slat0,
				slon0, slat0 * clon0, clat0 * clon0
			]
		);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.anchorBuffer);
		gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.anchorData);
		gl.vertexAttribPointer(
			Attribute.pos,
			3,
			gl.FLOAT,
			false,
			3 * 4,
			0
		);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
		gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.uvData);
		gl.vertexAttribPointer(
			Attribute.uv,
			2,
			gl.FLOAT,
			false,
			2 * 4,
			0
		);

		gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.anchorData.length / 3);
	}

	gl: WebGLRenderingContext;

	globeShader: Shader;

	anchorBuffer: WebGLBuffer;
	anchorData: Float32Array;

	uvBuffer: WebGLBuffer;
	uvData: Float32Array;

}
