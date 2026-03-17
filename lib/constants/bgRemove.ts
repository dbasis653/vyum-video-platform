// Union type for the background output mode chosen by the user
export type BgOutput = "transparent" | "white";

// Cloudinary effect string for standard background removal
export const BG_REMOVE_EFFECT = "background_removal";

// Cloudinary effect string for background removal with fine-edges mode enabled
// Use only for images with fur, feathers, or detailed edge textures
export const BG_REMOVE_FINE_EDGES_EFFECT = "background_removal:fineedges_y";

// Cloudinary folder where bg-removed copies are stored (same as image uploads)
export const BG_REMOVE_FOLDER = "images";
