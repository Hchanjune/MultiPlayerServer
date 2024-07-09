import {Client, Room} from "colyseus";
import {LobbyState} from "../states/LobbyState";
import {LobbyService} from "../services/lobby/LobbyService";
import {LobbyLoginOption} from "../options/lobby/LobbyLoginOption";
import {AsyncEventEmitter} from "../utils/AsyncEventEmitter";
import {ChatRoomInfo} from "../schemas/globals/ChatRoomInfo";

export enum LobbyEvent {
    GET_CLIENT_INFO = "GET_CLIENT_INFO",
    CHAT_ROOM_UPDATED = "CHAT_ROOM_UPDATED",
    CHAT_ROOM_DISPOSED = "CHAT_ROOM_DISPOSED",
}

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

    private lobbyService: LobbyService;
    private eventEmitter: AsyncEventEmitter;

    constructor() {
        super();
        this.setState(new LobbyState());
        this.eventEmitter = new AsyncEventEmitter();
        this.lobbyService = new LobbyService(this.state, this.eventEmitter);

        this.onMessage("*", (client, type, message) => {
            this.handleMessage(client, type as LobbyRequest, message);
        });

        this.eventEmitter.on(LobbyEvent.GET_CLIENT_INFO, async (sessionId: string, resolve: Function) => {
            console.log(`[Lobby] Received Event of type ${LobbyEvent.GET_CLIENT_INFO}`);
            const clientInfo = await this.lobbyService.returnClientInfo(sessionId);
            resolve(clientInfo);
        });

        this.eventEmitter.on(LobbyEvent.CHAT_ROOM_DISPOSED, (roomId: string) => {
            this.lobbyService.onChatRoomDispose(roomId);
        });

        this.eventEmitter.on(LobbyEvent.CHAT_ROOM_UPDATED, (chatRoomInfo: ChatRoomInfo) => {
            this.lobbyService.onChatRoomUpdate(chatRoomInfo);
        });
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



    onCreate(options: any) {
        console.log(`[Lobby] Created`);
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
