export type Role = 'manager' | 'employee' | 'admin';

export type ModuleKey = 'agenda' | 'accommodation' | 'swag' | 'invitations' | 'equipment';
export type ModuleStatusValue = 'pending' | 'in_progress' | 'complete';

export interface Gathering {
  id: string;
  title: string;
  type: string;
  dates: string;
  location: string;
  groupSize: number;
  status: 'draft' | 'active' | 'completed';
}

export interface GatheringBudget {
  accommodation: number;
  food: number;
  activities: number;
  swag: number;
  travel: number;
}

export interface Invitation {
  id: string;
  gatheringId: string;
  invitedBy: string;
  status: 'pending' | 'accepted' | 'declined';
}

export interface AppNotification {
  id: string;
  message: string;
  type: 'invitation' | 'update' | 'reminder';
  read: boolean;
  gatheringId?: string;
  timestamp: Date;
}
