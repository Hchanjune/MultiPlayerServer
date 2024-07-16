import {Client, Room} from "colyseus";
import {LobbyState} from "../states/LobbyState";
import {LobbyService} from "../services/lobby/LobbyService";
import {LobbyLoginOption} from "../options/lobby/LobbyLoginOption";

export enum LobbyRequest {
    CREATE_ACCOUNT = "CREATE_ACCOUNT",
    CREATE_CUSTOM_CHAT_ROOM = "CREATE_CUSTOM_CHAT_ROOM",
    JOIN_CUSTOM_CHAT_ROOM = "JOIN_CUSTOM_CHAT_ROOM",
}

export enum LobbyResponse {
    ERROR_MESSAGE = "ERROR_MESSAGE",
    CONNECTED = "CONNECTED",
    NOT_AUTHENTICATED = "NOT_AUTHENTICATED",
    DUPLICATED_CONNECTION = "DUPLICATED_CONNECTION",
    CHAT_ROOM_CREATED = "CHAT_ROOM_CREATED",
    CHAT_ROOM_AUTHORIZED = "CHAT_ROOM_AUTHORIZED",
    CHAT_ROOM_PASSWORD_ERROR = "CHAT_ROOM_PASSWORD_ERROR",
    CHAT_ROOM_FULL = "CHAT_ROOM_FULL",

}

export class Lobby extends Room<LobbyState> {

    private lobbyService!: LobbyService;


    onCreate(options: any) {
        this.setState(new LobbyState());
        this.lobbyService = new LobbyService(this);
        this.setPatchRate(1);
        this.onMessage("*", (client, type, message) => {
            this.handleMessage(client, type as LobbyRequest, message);
        });
        console.log(`[Lobby] Created`);
    }

    private handleMessage(client: Client, type: LobbyRequest, message: any) {
        //console.log(`[Lobby] Received message of type ${type} from ${this.state.players.get(client.sessionId)?.id}:`, message);
        switch (type) {

            case LobbyRequest.CREATE_CUSTOM_CHAT_ROOM:
                this.lobbyService.onCreateChatRoom(client, message);
                break;
            case LobbyRequest.JOIN_CUSTOM_CHAT_ROOM:
                this.lobbyService.onChatRoomJoinRequest(client, message);
                break;
            default:
                console.log(`[Lobby] Unknown message type: ${type}`);

        }
    }





    onJoin(client: Client, loginOption: LobbyLoginOption) {
        this.lobbyService.onLogin(client, loginOption);
    }

    onLeave(client: Client) {
        this.lobbyService.onLogout(client);
    }

    onDispose() {
        console.log(`[Lobby] Disposed There Is No User Left In Lobby`);
    }
}
