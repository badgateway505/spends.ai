// Main exports for categories module
export { groupService } from './services/groupService';
export type { Group, CreateGroupRequest, GroupServiceError } from './services/groupService';

// Types
export type { 
  GroupIcon, 
  GroupColor, 
  GroupIconData, 
  GroupColorData 
} from './types/category.types';

export { 
  GROUP_ICONS, 
  GROUP_COLORS, 
  getGroupColorClasses, 
  getGroupIconData 
} from './types/category.types';

// Components
export { GroupForm } from './components/GroupForm';
export { IconColorPicker } from './components/IconColorPicker';
