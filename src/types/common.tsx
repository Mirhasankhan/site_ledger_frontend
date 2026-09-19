



export interface TLoginValues {
  email: string;
  password: string;
  fullName: string;
  confirmPassword?: string;
}

export type MemberRole = "OWNER" | "EDITOR" | "VIEWER";

export interface BoardUser {
  id: string;
  fullName: string;
  email: string;
  profileImage: string | null;
}

export interface BoardMember {
  id: string;
  role: MemberRole;
  user: BoardUser;
}

export interface Task {
  id: string;
  title: string;
  columnId?: string;
  position: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Column {
  id: string;
  title: string;
  position: number;
  boardId?: string;
  tasks: Task[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Board {
  id: string;
  title: string;
  description?: string;
  columns: Column[];
  members: BoardMember[];
}

export interface TExprt {
  id: string;
  name: string;
  imageUrl: string;
  category: {
    categoryName: string;
  };
}

