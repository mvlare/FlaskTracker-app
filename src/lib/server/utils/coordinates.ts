/**
 * Parses a raw coordinate string into signed decimal degrees.
 *
 * Supported formats:
 *   7°18.0'N  — degree symbol, decimal minutes, hemisphere letter
 *   7d18.0N   — 'd' for degrees, no minutes apostrophe required
 *
 * Formula: decimal = degrees + minutes / 60
 * Sign: N/E → positive, S/W → negative
 *
 * Returns null if the string cannot be parsed.
 */
export function parseCoordinate(raw: string): number | null {
	const match = raw.trim().match(/^(\d+)[°d](\d+(?:\.\d+)?)[']?\s*([NSEWnsew])$/);
	if (!match) return null;
	const degrees = parseInt(match[1], 10);
	const minutes = parseFloat(match[2]);
	const hemi = match[3].toUpperCase();
	const decimal = degrees + minutes / 60;
	return hemi === 'S' || hemi === 'W' ? -decimal : decimal;
}
