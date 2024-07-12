import {AsyncEventEmitter} from "../../utils/AsyncEventEmitter";
import {LobbyState} from "../../states/LobbyState";
import {Lobby} from "../../rooms/Lobby";

export interface ChatRoomCreateOption {
    roomName: string;
    initialOwner: string;
    maxClients: number;
    isPrivate: boolean;
    password: string;
    lobby: Lobby;
}
