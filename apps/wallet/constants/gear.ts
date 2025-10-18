/**
 * Gear Management Constants
 * Comprehensive categories, subcategories, and attributes for tactical, camping,
 * communication, survival, and other gear types
 */

export const GEAR_CATEGORIES = [
  { label: 'Tactical', value: 'tactical' },
  { label: 'Camping', value: 'camping' },
  { label: 'Communication', value: 'communication' },
  { label: 'Survival', value: 'survival' },
  { label: 'Optics', value: 'optics' },
  { label: 'Protection', value: 'protection' },
  { label: 'Bags & Packs', value: 'bags' },
  { label: 'Medical', value: 'medical' },
  { label: 'Tools & Knives', value: 'tools' },
  { label: 'Lighting', value: 'lighting' },
  { label: 'Clothing', value: 'clothing' },
  { label: 'Maintenance', value: 'maintenance' },
  { label: 'Storage', value: 'storage' },
  { label: 'Electronics', value: 'electronics' },
  { label: 'Other', value: 'other' },
];

export const GEAR_SUBCATEGORIES: Record<string, { label: string; value: string }[]> = {
  tactical: [
    { label: 'Plate Carrier', value: 'plate_carrier' },
    { label: 'Chest Rig', value: 'chest_rig' },
    { label: 'Battle Belt', value: 'battle_belt' },
    { label: 'Holster', value: 'holster' },
    { label: 'Magazine Pouch', value: 'mag_pouch' },
    { label: 'IFAK Pouch', value: 'ifak_pouch' },
    { label: 'Admin Pouch', value: 'admin_pouch' },
    { label: 'Dump Pouch', value: 'dump_pouch' },
    { label: 'Sling', value: 'sling' },
    { label: 'Gloves', value: 'gloves' },
    { label: 'Knee Pads', value: 'knee_pads' },
    { label: 'Elbow Pads', value: 'elbow_pads' },
    { label: 'Other', value: 'other' },
  ],
  camping: [
    { label: 'Tent', value: 'tent' },
    { label: 'Sleeping Bag', value: 'sleeping_bag' },
    { label: 'Sleeping Pad', value: 'sleeping_pad' },
    { label: 'Camp Stove', value: 'camp_stove' },
    { label: 'Cookware', value: 'cookware' },
    { label: 'Water Filter', value: 'water_filter' },
    { label: 'Hammock', value: 'hammock' },
    { label: 'Tarp', value: 'tarp' },
    { label: 'Chair', value: 'chair' },
    { label: 'Cooler', value: 'cooler' },
    { label: 'Other', value: 'other' },
  ],
  communication: [
    { label: 'Handheld Radio', value: 'handheld_radio' },
    { label: 'Base Station', value: 'base_station' },
    { label: 'Mobile Radio', value: 'mobile_radio' },
    { label: 'Antenna', value: 'antenna' },
    { label: 'Headset', value: 'headset' },
    { label: 'PTT (Push-to-Talk)', value: 'ptt' },
    { label: 'Repeater', value: 'repeater' },
    { label: 'Signal Booster', value: 'signal_booster' },
    { label: 'Satellite Phone', value: 'satellite_phone' },
    { label: 'Other', value: 'other' },
  ],
  survival: [
    { label: 'Fire Starter', value: 'fire_starter' },
    { label: 'Emergency Shelter', value: 'emergency_shelter' },
    { label: 'Survival Kit', value: 'survival_kit' },
    { label: 'Signal Device', value: 'signal_device' },
    { label: 'Compass', value: 'compass' },
    { label: 'GPS', value: 'gps' },
    { label: 'Paracord', value: 'paracord' },
    { label: 'Emergency Food', value: 'emergency_food' },
    { label: 'Water Purification', value: 'water_purification' },
    { label: 'Mylar Blanket', value: 'mylar_blanket' },
    { label: 'Other', value: 'other' },
  ],
  optics: [
    { label: 'Rifle Scope', value: 'rifle_scope' },
    { label: 'Red Dot Sight', value: 'red_dot' },
    { label: 'Holographic Sight', value: 'holographic' },
    { label: 'Magnifier', value: 'magnifier' },
    { label: 'Binoculars', value: 'binoculars' },
    { label: 'Rangefinder', value: 'rangefinder' },
    { label: 'Night Vision', value: 'night_vision' },
    { label: 'Thermal Imaging', value: 'thermal' },
    { label: 'Laser Sight', value: 'laser' },
    { label: 'Iron Sights', value: 'iron_sights' },
    { label: 'Scope Mount', value: 'scope_mount' },
    { label: 'Other', value: 'other' },
  ],
  protection: [
    { label: 'Body Armor Plates', value: 'armor_plates' },
    { label: 'Soft Armor', value: 'soft_armor' },
    { label: 'Helmet', value: 'helmet' },
    { label: 'Face Mask', value: 'face_mask' },
    { label: 'Eye Protection', value: 'eye_protection' },
    { label: 'Ear Protection', value: 'ear_protection' },
    { label: 'Ballistic Shield', value: 'ballistic_shield' },
    { label: 'Gas Mask', value: 'gas_mask' },
    { label: 'Other', value: 'other' },
  ],
  bags: [
    { label: 'Backpack', value: 'backpack' },
    { label: 'Daypack', value: 'daypack' },
    { label: 'Assault Pack', value: 'assault_pack' },
    { label: 'Duffel Bag', value: 'duffel' },
    { label: 'Range Bag', value: 'range_bag' },
    { label: 'Gun Case', value: 'gun_case' },
    { label: 'Ammo Can', value: 'ammo_can' },
    { label: 'Dry Bag', value: 'dry_bag' },
    { label: 'Hydration Pack', value: 'hydration_pack' },
    { label: 'Other', value: 'other' },
  ],
  medical: [
    { label: 'IFAK', value: 'ifak' },
    { label: 'First Aid Kit', value: 'first_aid' },
    { label: 'Tourniquet', value: 'tourniquet' },
    { label: 'Chest Seal', value: 'chest_seal' },
    { label: 'Hemostatic Gauze', value: 'hemostatic_gauze' },
    { label: 'Bandages', value: 'bandages' },
    { label: 'Trauma Shears', value: 'trauma_shears' },
    { label: 'Decompression Needle', value: 'decompression_needle' },
    { label: 'Israeli Bandage', value: 'israeli_bandage' },
    { label: 'Other', value: 'other' },
  ],
  tools: [
    { label: 'Multi-tool', value: 'multitool' },
    { label: 'Fixed Blade Knife', value: 'fixed_blade' },
    { label: 'Folding Knife', value: 'folding_knife' },
    { label: 'Axe', value: 'axe' },
    { label: 'Saw', value: 'saw' },
    { label: 'Shovel', value: 'shovel' },
    { label: 'Machete', value: 'machete' },
    { label: 'Tomahawk', value: 'tomahawk' },
    { label: 'Other', value: 'other' },
  ],
  lighting: [
    { label: 'Flashlight', value: 'flashlight' },
    { label: 'Headlamp', value: 'headlamp' },
    { label: 'Weapon Light', value: 'weapon_light' },
    { label: 'Lantern', value: 'lantern' },
    { label: 'Chemlight', value: 'chemlight' },
    { label: 'Strobe', value: 'strobe' },
    { label: 'IR Illuminator', value: 'ir_illuminator' },
    { label: 'Other', value: 'other' },
  ],
  clothing: [
    { label: 'Combat Shirt', value: 'combat_shirt' },
    { label: 'Combat Pants', value: 'combat_pants' },
    { label: 'Jacket', value: 'jacket' },
    { label: 'Rain Gear', value: 'rain_gear' },
    { label: 'Base Layer', value: 'base_layer' },
    { label: 'Boots', value: 'boots' },
    { label: 'Hat/Cap', value: 'hat' },
    { label: 'Gloves', value: 'gloves' },
    { label: 'Belt', value: 'belt' },
    { label: 'Other', value: 'other' },
  ],
  maintenance: [
    { label: 'Cleaning Kit', value: 'cleaning_kit' },
    { label: 'Lubricant', value: 'lubricant' },
    { label: 'Solvent', value: 'solvent' },
    { label: 'Bore Snake', value: 'bore_snake' },
    { label: 'Patches', value: 'patches' },
    { label: 'Brushes', value: 'brushes' },
    { label: 'Gun Mat', value: 'gun_mat' },
    { label: 'Other', value: 'other' },
  ],
  storage: [
    { label: 'Gun Safe', value: 'gun_safe' },
    { label: 'Cabinet', value: 'cabinet' },
    { label: 'Wall Mount', value: 'wall_mount' },
    { label: 'Ammo Box', value: 'ammo_box' },
    { label: 'Pelican Case', value: 'pelican_case' },
    { label: 'Shelving', value: 'shelving' },
    { label: 'Dehumidifier', value: 'dehumidifier' },
    { label: 'Other', value: 'other' },
  ],
  electronics: [
    { label: 'Battery', value: 'battery' },
    { label: 'Charger', value: 'charger' },
    { label: 'Solar Panel', value: 'solar_panel' },
    { label: 'Power Bank', value: 'power_bank' },
    { label: 'Cable', value: 'cable' },
    { label: 'Other', value: 'other' },
  ],
  other: [
    { label: 'Other', value: 'other' },
  ],
};

export const GEAR_CONDITIONS = [
  { label: 'New', value: 'new' },
  { label: 'Excellent', value: 'excellent' },
  { label: 'Good', value: 'good' },
  { label: 'Fair', value: 'fair' },
  { label: 'Poor', value: 'poor' },
];

export const GEAR_STATUS = [
  { label: 'Active', value: 'active' },
  { label: 'Retired', value: 'retired' },
  { label: 'Loaned Out', value: 'loaned' },
  { label: 'In Repair', value: 'repair' },
  { label: 'For Sale', value: 'for_sale' },
];

export const ARMOR_LEVELS = [
  { label: 'NIJ Level IIA', value: 'level_2a' },
  { label: 'NIJ Level II', value: 'level_2' },
  { label: 'NIJ Level IIIA', value: 'level_3a' },
  { label: 'NIJ Level III', value: 'level_3' },
  { label: 'NIJ Level IV', value: 'level_4' },
  { label: 'NIJ Level III+', value: 'level_3_plus' },
];

export const MATERIALS = [
  { label: 'Nylon', value: 'nylon' },
  { label: 'Cordura', value: 'cordura' },
  { label: 'Polyester', value: 'polyester' },
  { label: 'Canvas', value: 'canvas' },
  { label: 'Leather', value: 'leather' },
  { label: 'Kydex', value: 'kydex' },
  { label: 'Plastic', value: 'plastic' },
  { label: 'Metal', value: 'metal' },
  { label: 'Aluminum', value: 'aluminum' },
  { label: 'Steel', value: 'steel' },
  { label: 'Ceramic', value: 'ceramic' },
  { label: 'UHMWPE', value: 'uhmwpe' },
  { label: 'Carbon Fiber', value: 'carbon_fiber' },
  { label: 'Gore-Tex', value: 'gore_tex' },
  { label: 'Other', value: 'other' },
];

export const MOUNT_TYPES = [
  { label: 'Picatinny', value: 'picatinny' },
  { label: 'M-LOK', value: 'mlok' },
  { label: 'KeyMod', value: 'keymod' },
  { label: 'Weaver', value: 'weaver' },
  { label: 'Dovetail', value: 'dovetail' },
  { label: 'Quick Detach', value: 'qd' },
  { label: 'Other', value: 'other' },
];

export const RETICLE_TYPES = [
  { label: 'Duplex', value: 'duplex' },
  { label: 'Mil-Dot', value: 'mil_dot' },
  { label: 'MOA', value: 'moa' },
  { label: 'BDC', value: 'bdc' },
  { label: 'Red Dot', value: 'red_dot' },
  { label: 'Holographic', value: 'holographic' },
  { label: 'Etched', value: 'etched' },
  { label: 'Other', value: 'other' },
];

export const BATTERY_TYPES = [
  { label: 'AA', value: 'aa' },
  { label: 'AAA', value: 'aaa' },
  { label: 'CR123A', value: 'cr123a' },
  { label: '18650', value: '18650' },
  { label: 'CR2032', value: 'cr2032' },
  { label: 'Rechargeable', value: 'rechargeable' },
  { label: 'USB-C', value: 'usb_c' },
  { label: 'Proprietary', value: 'proprietary' },
  { label: 'Other', value: 'other' },
];

export const IP_RATINGS = [
  { label: 'IP44 (Splash Resistant)', value: 'ip44' },
  { label: 'IP65 (Dust/Water Resistant)', value: 'ip65' },
  { label: 'IP67 (Waterproof 1m)', value: 'ip67' },
  { label: 'IP68 (Waterproof 1.5m+)', value: 'ip68' },
  { label: 'Not Rated', value: 'not_rated' },
];

// Helper function to get subcategories for a given category
export const getSubcategoriesForCategory = (category: string) => {
  return GEAR_SUBCATEGORIES[category] || [];
};

// Helper function to get category label from value
export const getCategoryLabel = (value: string) => {
  const category = GEAR_CATEGORIES.find(cat => cat.value === value);
  return category?.label || value;
};

// Helper function to get subcategory label from value
export const getSubcategoryLabel = (category: string, value: string) => {
  const subcategories = GEAR_SUBCATEGORIES[category] || [];
  const subcategory = subcategories.find(sub => sub.value === value);
  return subcategory?.label || value;
};
