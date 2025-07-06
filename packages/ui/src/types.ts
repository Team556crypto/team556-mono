/**
 * Represents a firearm object, matching the structure from the main API.
 */
export interface Firearm {
  id: number;
  owner_user_id: number; // snake_case matches JSON
  name: string;
  type: string;
  serial_number: string; // snake_case
  manufacturer?: string; // Optional string
  model_name?: string; // Optional string
  caliber?: string;
  acquisition_date?: string; // ISO string
  purchase_price?: number; // Represents a decimal value
  ballistic_performance?: string; // Assuming JSON string for now
  last_fired?: string; // ISO string
  image?: string; // Optional string
  round_count?: number; // Optional number
  last_cleaned?: string; // ISO string
  value?: number; // Optional number
  status?: string; // Optional string
  created_at: string; // ISO string
  updated_at: string; // ISO string
}

/**
 * Represents the payload for updating a firearm.
 * Excludes fields that are typically not directly updatable by the user.
 */
export type UpdateFirearmPayload = {
  id: number;
  imageName?: string;      // Name of the new image file
  imageData?: string;      // Base64 encoded data of the new image
  imageType?: string;      // Mime type of the new image (e.g., 'image/jpeg')
  imageSize?: number;      // Size of the new image in bytes
} & Partial<Omit<Firearm, 'id' | 'owner_user_id' | 'created_at' | 'updated_at'>>;

/**
 * Represents the payload for creating a new firearm.
 * All fields are optional except for those that are fundamentally required for a new firearm.
 * 'image' (URL) is optional as it can be generated server-side from image_base64.
 */
export type CreateFirearmPayload = {
  name: string; // Assuming name is required
  type: string; // Assuming type is required
  serial_number: string; // Assuming serial_number is required
  manufacturer?: string;
  model_name?: string;
  caliber?: string;
  acquisition_date?: string;
  purchase_price?: number;
  ballistic_performance?: string;
  last_fired?: string;
  image?: string; // URL, optional, will be set by server if image_base64 is provided
  image_base64?: string; // Base64 encoded image data, optional
  round_count?: number;
  last_cleaned?: string;
  value?: number;
  status?: string;
};

// Add other shared types here as needed
