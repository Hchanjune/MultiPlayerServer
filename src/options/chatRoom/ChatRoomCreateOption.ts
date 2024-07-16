import {Lobby} from "../../rooms/Lobby";

export interface ChatRoomCreateOption {
    roomName: string;
    initialOwner: string;
    maxClients: number;
    isPrivate: boolean;
    password: string;
    lobby: Lobby;
}
