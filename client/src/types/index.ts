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
  followRequests: IFollowRequester[];
  blockedUsers: string[];
  isPrivate: boolean;
  isEmailVerified: boolean;
  authProvider: "local" | "google";
  createdAt: string;
}

export interface AuthResponse extends IUser {
  isNewUser?: boolean;
}

/** Returned when Google sign-in reveals a new user who still needs a username */
export interface GooglePendingData {
  pendingGoogle: true;
  email: string;
  name: string;
  picture: string;
}

export interface ApiError {
  message: string;
}

export interface IComment {
  _id: string;
  user: { _id: string; name: string; username: string; profileImage?: string };
  text: string;
  createdAt: string;
}

export interface IPost {
  _id: string;
  user: string;
  images: string[];
  caption?: string;
  location?: string;
  petTags: string[];
  commentsEnabled: boolean;
  likes: string[];
  comments: IComment[];
  createdAt: string;
  updatedAt: string;
}

export interface IFollowRequester {
  _id: string;
  name: string;
  username: string;
  profileImage?: string;
}

export interface IPublicUser {
  _id: string;
  name: string;
  username: string;
  profileImage?: string;
  bio?: string;
  pets: IPet[];
  followers: string[];
  following: string[];
  followRequests?: IFollowRequester[]; // only present when viewing own profile
  isPrivate: boolean;
  createdAt: string;
}

export interface IDirectMessage {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  createdAt: number; // Unix ms timestamp
  read: boolean;
}

export interface IConversation {
  partnerId: string;
  partnerName: string;
  partnerUsername: string;
  partnerImage?: string;
  lastMessage: string;
  lastAt: number;
  unread: number;
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
