// In-engine viewpoints for checking the four seasons. No concept-image backdrop.
export const GALLERY_STOPS=Object.freeze([0,480,780,1080]);
export function galleryStop(season){return GALLERY_STOPS[Math.min(3,Math.max(0,Math.trunc(season)))];}
