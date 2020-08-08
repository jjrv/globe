/** Calculate orthogonal projection center so that given unprojected and
  * projected coordinates match.
  *
  * @param x Projected X coordinate between -1 and 1.
  * @param y Projected Y coordinate between -1 and 1.
  * @param lat Unprojected latitude in radians.
  * @param lon Unprojected longitude in radians.
  * @param isFar True if unprojected point is on the far side hemisphere.
  * @return Object with fields:
  * - lat0: Projection center latitude in radians.
  * - lon0: Projection center longitude in radians.
  * - flippable: True if a dragged point on the far side of the
  *   north-south axis can be seamlessly flipped to the front hemisphere. */

export function inv0(x: number, y: number, lat: number, lon: number, isFar?: boolean) {
	let lat0, lon0;
	let flippable = false;

	const clat = Math.cos(lat);
	const slat = Math.sin(lat);

	const len2 = x * x + y * y;

	if(len2 > 1) {
		// Move points outside the projection disc slightly inside the disc edges.

		const len = Math.sqrt(len2) + 1 / 65536;
		x /= len;
		y /= len;
	}

	// On an upright globe, points can't be dragged off the north-south axis
	// further than the cosine of their latitude.

	if(Math.abs(x) > Math.abs(clat)) {
		x = clat * Math.sign(x * clat);

		// The point is on a longitude perpendicular to the projection center,
		// so it can be seamlessly flipped from back to front hemisphere
		// if needed.

		flippable = true;
	}

	// Orthogonal projection central longitude.

	if(!isFar) {
		lon0 = lon - Math.asin(x / clat);
	} else {
		lon0 = lon + Math.asin(x / clat) + Math.PI;
	}

	// Latitude takes more work...

	const clatlon = clat * Math.cos(lon - lon0);
	const d = clatlon * clatlon + slat * slat;

	// Limits when target latitude approaches zero.
	let a = -y;
	let b = Math.sqrt(d - y * y);

	if(slat) {
		// Handle nonzero latitudes.

		a = a * clatlon + slat * b;
		b = (a * clatlon + y * d) / slat;
	}

	// Orthogonal projection central latitude.

	lat0 = Math.atan2(a, b);

	if(lat0 < -Math.PI / 2 || lat0 > Math.PI / 2) {
		// If poles were switched (front one was dragged too high or low),
		// move the front pole to the center and rotate around it.

		lat0 = Math.PI / 2;

		if(lat < 0) {
			// Only if the dragged point is in the southern hemisphere,
			// the south pole can be dragged too far up (otherwise
			// the north pole went too far down).

			lat0 = -lat0;
			y = -y;
		}

		// Pole is in the center, rotate longitude by angle of the dragged point.
		lon0 = lon - Math.atan2(x, -y);

		// If a point was dragged the wrong way past a pole far enough,
		// it can be flipped to the front of the north-south axis.
		if(y < -clat) flippable = true;
	}

	return ({ lat0, lon0, flippable });
}

export class Orientation {

	constructor(lat0: number, lon0: number) {
		this.reset(lat0, lon0);
	}

	reset(lat0: number, lon0: number) {
		this.clat0 = Math.cos(lat0);
		this.slat0 = Math.sin(lat0);
		this.lon0 = lon0;
	}

	proj(lat: number, lon: number) {
		const tanHalf = Math.tan((lat + 90) * Math.PI / 360);
		const cotHalf = 1 / tanHalf;
		lon = lon * Math.PI / 180 - this.lon0;

		const slon = Math.sin(lon);
		const clon = Math.cos(lon);

		const clat0 = this.clat0;
		const slat0 = this.slat0;

		const clat = 2 / (tanHalf + cotHalf);
		const tlat = (tanHalf - cotHalf) / 2;

		const x = slon * clat;
		const y = -(clat0 * tlat - slat0 * clon) * clat;
		const z = (slat0 * tlat + clat0 * clon) * clat;

		return ({ x, y, z });
	}

	/** Inverse orthogonal projection.
	  *
	  * @param x Projected X coordinate between -1 and 1.
	  * @param y Projected Y coordinate between -1 and 1.
	  * @return Object with fields:
	  * - lat: Unprojected latitude.
	  * - lon: Unprojected longitude. */

	inv(x: number, y: number) {
		let z;
		let l2 = x * x + y * y;

		if(l2 > 1) {
			const l = Math.sqrt(l2) + 1 / 1024;
			x /= l;
			y /= l;
			z = 0;
		} else {
			z = Math.sqrt(1 - l2);
		}

		const slat0 = this.slat0;
		const clat0 = this.clat0;

		const lat = Math.asin(z * slat0 + y * clat0);
		const lon = Math.atan2(x, (z * clat0 - y * slat0)) + this.lon0;

		return ({ lat, lon });
	}

	/** Sine of projection center latitude. */
	slat0!: number;
	/** Cosine of projection center latitude. */
	clat0!: number;

	/** Projection center longitude in radians. */
	lon0!: number;

}
