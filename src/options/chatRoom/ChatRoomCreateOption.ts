import {AsyncEventEmitter} from "../../utils/AsyncEventEmitter";
import {LobbyState} from "../../states/LobbyState";

export interface ChatRoomCreateOption {
    roomName: string;
    initialOwner: string;
    maxClients: number;
    isPrivate: boolean;
    password: string;
    eventEmitter: AsyncEventEmitter;
    lobbyState: LobbyState;
}
