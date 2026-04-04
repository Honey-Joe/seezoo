export interface IPet {
  _id: string;
  name: string;
  species: "dog" | "cat" | "bird" | "rabbit" | "fish" | "reptile" | "other";
  breed?: string;
  age?: number;
  bio?: string;
  profileImage?: string;
}

export interface IUser {
  _id: string;
  name: string;
  username: string;
  email: string;
  profileImage?: string;
  bio?: string;
  pets: IPet[];
  followers: string[];
  following: string[];
  isPrivate: boolean;
  createdAt: string;
}

export interface AuthResponse extends IUser {}

export interface ApiError {
  message: string;
}
