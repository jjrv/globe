import { Globe } from './Globe';
import { inv0, Orientation } from './Orientation';

const doc = document;
let canvas: HTMLCanvasElement;

const size = Math.min(window.innerWidth, window.innerHeight);
const R = size / 2;

const glCanvas = doc.createElement('canvas');
glCanvas.width = size * 2;
glCanvas.height = size * 2;

glCanvas.style.width = size + 'px';
glCanvas.style.height = size + 'px';

document.body.appendChild(glCanvas);

const orientation = new Orientation(60 * Math.PI / 180, 25 * Math.PI / 180);

const img = new Image();
let globe: Globe;

img.onload = () => {
	globe = new Globe(glCanvas, img);
	globe.render(orientation.slat0, orientation.clat0, orientation.lon0);
};

img.src = 'world.jpg';





let isFar: boolean;

let dragging = false;
let dragLat: number;
let dragLon: number;

function dragStart(e: MouseEvent) {
	// const coords = e.touches ? e.touches[0] : e;
	const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
	let x = (e.clientX - rect.left - R) / R;
	let y = (R - e.clientY + rect.top) / R;
	let z: number;

	let f = Math.sqrt(2 - (x * x + y * y));
	x *= f;
	y *= f;

	const { lat, lon } = orientation.inv(x, y);

	// If clicked longitude is more than half pi away from the projection
	// center, it's on the far side of the north-south axis and must stay
	// there when dragged until it can be seamlessly flipped to the front.

	isFar = Math.abs(lon - orientation.lon0) * 2 / Math.PI + 1 & 2;

	dragLat = lat * 180 / Math.PI;
	dragLon = lon * 180 / Math.PI;

	({ x, y, z } = orientation.proj(dragLat, dragLon));

	f = Math.sqrt(1 / (1 + z));
	x *= f;
	y *= f;

	dragging = true;
	e.preventDefault();
	e.stopPropagation();
	return (false);
}

function dragMove(e) {
	if(!dragging) return;

	// const coords = e.touches ? e.touches[0] : e;
	const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
	let x = (e.clientX - rect.left - R) / R;
	let y = (R - e.clientY + rect.top) / R;
	let z: number;

	let f = Math.sqrt(2 - (x * x + y * y));
	x *= f;
	y *= f;

	const { lat0, lon0, flippable } = inv0(
		x,
		y,
		dragLat * Math.PI / 180,
		dragLon * Math.PI / 180,
		isFar
	);

	if(flippable) isFar = 0;

	orientation.reset(lat0, lon0);

	if(globe) globe.render(orientation.slat0, orientation.clat0, orientation.lon0);

	e.preventDefault();
	e.stopPropagation();
	return (false);
}

function dragEnd(e: MouseEvent) {
	dragging = false;
	e.preventDefault();
	e.stopPropagation();
	return (false);
}

glCanvas.onmousedown = dragStart;
glCanvas.onmousemove = dragMove;
glCanvas.onmouseup = dragEnd;

// canvas.ontouchstart = dragStart;
// canvas.ontouchmove = dragMove;
// canvas.ontouchend = dragEnd;
