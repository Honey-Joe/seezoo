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

export interface IPost {
  _id: string;
  user: string;
  images: string[];
  caption?: string;
  location?: string;
  petTags: string[];
  commentsEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ReportType  = "lost" | "found";
export type PetSize     = "tiny" | "small" | "medium" | "large" | "extra-large";
export type PetGender   = "male" | "female" | "unknown";
export type PetSpecies  = "dog" | "cat" | "bird" | "rabbit" | "fish" | "reptile" | "other";

export interface ILostFound {
  _id: string;
  user: { _id: string; name: string; username: string; profileImage?: string } | string;
  type: ReportType;
  isResolved: boolean;
  petName?: string;
  species: PetSpecies;
  breed?: string;
  age?: number;
  gender: PetGender;
  size: PetSize;
  color: string;
  description: string;
  microchipId?: string;
  photos: string[];
  lastSeenLocation: string;
  lastSeenDate: string;
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  rewardOffered: boolean;
  rewardAmount?: number;
  createdAt: string;
  updatedAt: string;
}
