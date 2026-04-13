import api from "./api";
import type { ILostFound } from "../types";

export interface CreateListingPayload {
  photos: File[];
  type: string;
  petName?: string;
  species: string;
  breed?: string;
  age?: string;
  gender: string;
  size: string;
  color: string;
  description: string;
  microchipId?: string;
  lastSeenLocation: string;
  lastSeenDate: string;
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  rewardOffered: boolean;
  rewardAmount?: string;
}

export const createListing = (payload: CreateListingPayload) => {
  const form = new FormData();
  payload.photos.forEach((f) => form.append("photos", f));
  form.append("type",              payload.type);
  form.append("species",           payload.species);
  form.append("gender",            payload.gender);
  form.append("size",              payload.size);
  form.append("color",             payload.color);
  form.append("description",       payload.description);
  form.append("lastSeenLocation",  payload.lastSeenLocation);
  form.append("lastSeenDate",      payload.lastSeenDate);
  form.append("contactName",       payload.contactName);
  form.append("contactPhone",      payload.contactPhone);
  form.append("rewardOffered",     String(payload.rewardOffered));
  if (payload.petName)     form.append("petName",     payload.petName);
  if (payload.breed)       form.append("breed",       payload.breed);
  if (payload.age)         form.append("age",         payload.age);
  if (payload.microchipId) form.append("microchipId", payload.microchipId);
  if (payload.contactEmail) form.append("contactEmail", payload.contactEmail);
  if (payload.rewardAmount) form.append("rewardAmount", payload.rewardAmount);
  return api.post<ILostFound>("/lost-found", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const getListings = (params?: { type?: string; species?: string; resolved?: boolean }) =>
  api.get<ILostFound[]>("/lost-found", { params });

export const getListing = (id: string) =>
  api.get<ILostFound>(`/lost-found/${id}`);

export const getMyListings = () =>
  api.get<ILostFound[]>("/lost-found/my/list");

export const resolveListing = (id: string) =>
  api.patch<{ message: string; listing: ILostFound }>(`/lost-found/${id}/resolve`);
