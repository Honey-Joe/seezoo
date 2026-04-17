export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "superadmin";
  permissions: string[];
}

export interface User {
  _id: string;
  name: string;
  username: string;
  email: string;
  profileImage?: string;
  isBlocked: boolean;
  isEmailVerified: boolean;
  authProvider: string;
  pets: Pet[];
  followers: string[];
  following: string[];
  createdAt: string;
}

export interface Pet {
  _id: string;
  name: string;
  species: string;
  breed?: string;
  age?: number;
  bio?: string;
  profileImage?: string;
  owner?: { _id: string; name: string; username: string };
}

export interface Post {
  _id: string;
  user: { _id: string; name: string; username: string; profileImage?: string } | null;
  images: string[];
  caption?: string;
  location?: string;
  likes: string[];
  comments: { _id: string; text: string; user: string }[];
  commentsEnabled: boolean;
  createdAt: string;
}

export interface Report {
  _id: string;
  post: Post | null;
  reportedBy: { _id: string; name: string; username: string };
  reason: string;
  status: "pending" | "resolved" | "ignored";
  createdAt: string;
}

export interface Category {
  _id: string;
  name: string;
  description?: string;
  icon?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalPets: number;
  totalPosts: number;
  totalReports: number;
  newUsersThisWeek: number;
  newPostsThisWeek: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}
