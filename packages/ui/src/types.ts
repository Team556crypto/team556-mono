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


/**
 * Represents an ammunition object, matching the structure from the main API.
 */
export interface Ammo {
  id: number;
  owner_user_id: number;
  manufacturer: string;
  caliber: string;
  type: string; // e.g., FMJ, JHP
  quantity: number;
  grainWeight: string;
  purchaseDate?: string; // ISO string
  purchasePrice?: number;
  notes?: string;
  pictures?: string; // JSON string array of image URLs
  created_at: string;
  updated_at: string;
}

/**
 * Represents the payload for creating new ammunition.
 */
export type CreateAmmoPayload = Omit<Ammo, 'id' | 'owner_user_id' | 'created_at' | 'updated_at'>;


/**
 * Represents the payload for updating existing ammunition.
 */
export type UpdateAmmoPayload = { id: number } & Partial<CreateAmmoPayload>;


/**
 * Represents a gear object, matching the structure from the main API.
 */
export interface Gear {
  id: number;
  owner_user_id: number;
  name: string;
  type: string; // e.g., "Combat", "Hunting", "Camping"
  manufacturer?: string;
  model?: string;
  quantity: number;
  purchaseDate?: string; // ISO string
  purchasePrice?: number;
  notes?: string;
  pictures?: string; // JSON string array of image URLs
  created_at: string;
  updated_at: string;
}

/**
 * Represents the payload for creating new gear.
 */
export type CreateGearPayload = Omit<Gear, 'id' | 'owner_user_id' | 'created_at' | 'updated_at'>;

/**
 * Represents the payload for updating existing gear.
 */
export type UpdateGearPayload = { id: number } & Partial<CreateGearPayload>;

/**
 * Represents a document object, matching the structure from the main API.
 */
export interface Document {
  id: number;
  owner_user_id: number;
  name: string;
  type: string;
  issuing_authority?: string;
  issue_date?: string;
  expiration_date?: string;
  document_number?: string;
  notes?: string;
  attachments?: string; // JSON string of attachment URLs
  created_at: string;
  updated_at: string;
}

/**
 * Represents the payload for creating a new document.
 */
export type CreateDocumentPayload = {
  name: string;
  type: string;
  issuing_authority?: string;
  issue_date?: string;
  expiration_date?: string;
  document_number?: string;
  notes?: string;
  attachments?: string;
};

/**
 * Represents the payload for updating an existing document.
 */
export type UpdateDocumentPayload = { id: number } & Partial<CreateDocumentPayload>;

export const documentTypeOptions = [
  { label: 'License', value: 'license' },
  { label: 'Permit', value: 'permit' },
  { label: 'Registration', value: 'registration' },
  { label: 'Insurance', value: 'insurance' },
  { label: 'Other', value: 'other' },
];

// Add other shared types here as needed
