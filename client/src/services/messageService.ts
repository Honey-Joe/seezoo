import api from "./api";
import type { IConversation, IDirectMessage } from "../types";

export const getConversations = () => api.get<IConversation[]>("/messages");
export const getHistory       = (userId: string) => api.get<IDirectMessage[]>(`/messages/${userId}`);
