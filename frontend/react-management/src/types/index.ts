export interface TeamLeader {
  name: string;
  is_direct_staff: boolean;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  location?: string;
  leader?: TeamLeader;
  employee_count?: number;
  org_leader?: string | null;
  created_at: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  team_id: string | null;
  is_direct_staff?: boolean;
  co_located?: boolean;
  created_at: string;
}

export interface Achievement {
  id: string;
  description: string;
  month: string;
  team_id: string | null;
}
