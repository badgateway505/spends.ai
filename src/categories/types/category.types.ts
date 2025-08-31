// Category type definitions for groups and tags
export type GroupIcon = 
  | 'utensils'           // Food & Dining
  | 'car'                // Transportation
  | 'shopping-bag'       // Shopping
  | 'receipt'            // Bills & Utilities
  | 'film'               // Entertainment
  | 'heart'              // Health & Fitness
  | 'book-open'          // Education
  | 'plane'              // Travel
  | 'briefcase'          // Work
  | 'home'               // Home & Garden
  | 'gamepad'            // Gaming
  | 'music'              // Music
  | 'camera'             // Photography
  | 'gift'               // Gifts
  | 'wrench'             // Maintenance
  | 'tag'                // Other/Default
  | 'dollar-sign'        // Finance
  | 'coffee'             // Coffee/Drinks
  | 'shield'             // Insurance
  | 'phone'              // Communication
  | 'laptop'             // Technology
  | 'baby'               // Baby/Kids
  | 'pet'                // Pets
  | 'leaf'               // Environment
  | 'star';              // Premium/Special

export type GroupColor = 
  | 'gray'
  | 'red' 
  | 'orange'
  | 'amber'
  | 'yellow'
  | 'lime'
  | 'green'
  | 'emerald'
  | 'teal'
  | 'cyan'
  | 'sky'
  | 'blue'
  | 'indigo'
  | 'violet'
  | 'purple'
  | 'fuchsia'
  | 'pink'
  | 'rose';

export interface GroupIconData {
  icon: GroupIcon;
  label: string;
  category: string;
}

export interface GroupColorData {
  color: GroupColor;
  label: string;
  cssClass: string;
}

// Icon definitions with categories for better organization
export const GROUP_ICONS: GroupIconData[] = [
  // Essentials
  { icon: 'utensils', label: 'Food & Dining', category: 'essentials' },
  { icon: 'car', label: 'Transportation', category: 'essentials' },
  { icon: 'home', label: 'Home', category: 'essentials' },
  { icon: 'receipt', label: 'Bills & Utilities', category: 'essentials' },
  { icon: 'heart', label: 'Health & Fitness', category: 'essentials' },
  
  // Shopping & Lifestyle
  { icon: 'shopping-bag', label: 'Shopping', category: 'lifestyle' },
  { icon: 'gift', label: 'Gifts', category: 'lifestyle' },
  { icon: 'coffee', label: 'Coffee & Drinks', category: 'lifestyle' },
  { icon: 'camera', label: 'Photography', category: 'lifestyle' },
  
  // Entertainment
  { icon: 'film', label: 'Movies & Shows', category: 'entertainment' },
  { icon: 'gamepad', label: 'Gaming', category: 'entertainment' },
  { icon: 'music', label: 'Music', category: 'entertainment' },
  
  // Work & Education
  { icon: 'briefcase', label: 'Work', category: 'work' },
  { icon: 'book-open', label: 'Education', category: 'work' },
  { icon: 'laptop', label: 'Technology', category: 'work' },
  
  // Travel & Special
  { icon: 'plane', label: 'Travel', category: 'travel' },
  { icon: 'star', label: 'Premium', category: 'special' },
  
  // Family & Personal
  { icon: 'baby', label: 'Baby & Kids', category: 'family' },
  { icon: 'pet', label: 'Pets', category: 'family' },
  
  // Services & Finance
  { icon: 'dollar-sign', label: 'Finance', category: 'services' },
  { icon: 'shield', label: 'Insurance', category: 'services' },
  { icon: 'phone', label: 'Communication', category: 'services' },
  { icon: 'wrench', label: 'Maintenance', category: 'services' },
  { icon: 'leaf', label: 'Environment', category: 'services' },
  
  // Default
  { icon: 'tag', label: 'Other', category: 'default' }
];

// Color definitions with Tailwind classes
export const GROUP_COLORS: GroupColorData[] = [
  { color: 'gray', label: 'Gray', cssClass: 'text-gray-600 bg-gray-100 border-gray-200 dark:text-gray-400 dark:bg-gray-800 dark:border-gray-700' },
  { color: 'red', label: 'Red', cssClass: 'text-red-600 bg-red-100 border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800' },
  { color: 'orange', label: 'Orange', cssClass: 'text-orange-600 bg-orange-100 border-orange-200 dark:text-orange-400 dark:bg-orange-900/20 dark:border-orange-800' },
  { color: 'amber', label: 'Amber', cssClass: 'text-amber-600 bg-amber-100 border-amber-200 dark:text-amber-400 dark:bg-amber-900/20 dark:border-amber-800' },
  { color: 'yellow', label: 'Yellow', cssClass: 'text-yellow-600 bg-yellow-100 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-900/20 dark:border-yellow-800' },
  { color: 'lime', label: 'Lime', cssClass: 'text-lime-600 bg-lime-100 border-lime-200 dark:text-lime-400 dark:bg-lime-900/20 dark:border-lime-800' },
  { color: 'green', label: 'Green', cssClass: 'text-green-600 bg-green-100 border-green-200 dark:text-green-400 dark:bg-green-900/20 dark:border-green-800' },
  { color: 'emerald', label: 'Emerald', cssClass: 'text-emerald-600 bg-emerald-100 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-900/20 dark:border-emerald-800' },
  { color: 'teal', label: 'Teal', cssClass: 'text-teal-600 bg-teal-100 border-teal-200 dark:text-teal-400 dark:bg-teal-900/20 dark:border-teal-800' },
  { color: 'cyan', label: 'Cyan', cssClass: 'text-cyan-600 bg-cyan-100 border-cyan-200 dark:text-cyan-400 dark:bg-cyan-900/20 dark:border-cyan-800' },
  { color: 'sky', label: 'Sky', cssClass: 'text-sky-600 bg-sky-100 border-sky-200 dark:text-sky-400 dark:bg-sky-900/20 dark:border-sky-800' },
  { color: 'blue', label: 'Blue', cssClass: 'text-blue-600 bg-blue-100 border-blue-200 dark:text-blue-400 dark:bg-blue-900/20 dark:border-blue-800' },
  { color: 'indigo', label: 'Indigo', cssClass: 'text-indigo-600 bg-indigo-100 border-indigo-200 dark:text-indigo-400 dark:bg-indigo-900/20 dark:border-indigo-800' },
  { color: 'violet', label: 'Violet', cssClass: 'text-violet-600 bg-violet-100 border-violet-200 dark:text-violet-400 dark:bg-violet-900/20 dark:border-violet-800' },
  { color: 'purple', label: 'Purple', cssClass: 'text-purple-600 bg-purple-100 border-purple-200 dark:text-purple-400 dark:bg-purple-900/20 dark:border-purple-800' },
  { color: 'fuchsia', label: 'Fuchsia', cssClass: 'text-fuchsia-600 bg-fuchsia-100 border-fuchsia-200 dark:text-fuchsia-400 dark:bg-fuchsia-900/20 dark:border-fuchsia-800' },
  { color: 'pink', label: 'Pink', cssClass: 'text-pink-600 bg-pink-100 border-pink-200 dark:text-pink-400 dark:bg-pink-900/20 dark:border-pink-800' },
  { color: 'rose', label: 'Rose', cssClass: 'text-rose-600 bg-rose-100 border-rose-200 dark:text-rose-400 dark:bg-rose-900/20 dark:border-rose-800' }
];

// Helper function to get color CSS classes
export function getGroupColorClasses(color: GroupColor): string {
  const colorData = GROUP_COLORS.find(c => c.color === color);
  return colorData?.cssClass || GROUP_COLORS[0].cssClass; // Default to gray
}

// Helper function to get icon data
export function getGroupIconData(icon: GroupIcon): GroupIconData | undefined {
  return GROUP_ICONS.find(i => i.icon === icon);
}
