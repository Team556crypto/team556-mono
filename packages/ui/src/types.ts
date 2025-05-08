/**
 * Represents a firearm object, matching the structure from the main API.
 */
export interface Firearm {
  id: number;
  owner_user_id: number; // snake_case matches JSON
  name: string;
  type: string;
  serial_number: string; // snake_case
  manufacturer?: string | null; // Optional string
  model_name?: string | null; // Optional string
  caliber?: string | null;
  acquisition_date?: string | null; // ISO string
  purchase_price?: string | null; // String representation of decimal
  ballistic_performance?: string | null; // Assuming JSON string for now
  last_fired?: string | null; // ISO string
  image?: string | null; // Optional string
  round_count?: number | null; // Optional number
  last_cleaned?: string | null; // ISO string
  value?: number | null; // Optional number
  status?: string | null; // Optional string
  created_at: string; // ISO string
  updated_at: string; // ISO string
}

// Add other shared types here as needed
