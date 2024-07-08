import {Client, Room} from "colyseus";
import {LobbyState} from "../states/LobbyState";
import {LobbyService} from "../services/lobby/LobbyService";
import {LobbyLoginOption} from "../options/lobby/LobbyLoginOption";

export enum LobbyRequest {
    CREATE_ACCOUNT = "CREATE_ACCOUNT",
    CREATE_CUSTOM_SESSION = "CREATE_CUSTOM_SESSION"
}

export enum LobbyResponse {
    CONNECTED = "CONNECTED",
    NOT_AUTHENTICATED = "NOT_AUTHENTICATED",
    DUPLICATED_CONNECTION = "DUPLICATED_CONNECTION"
}

export class Lobby extends Room<LobbyState> {

    private lobbyService: LobbyService;

    constructor() {
        super();
        this.setState(new LobbyState());
        this.lobbyService = new LobbyService(this.state);

        this.onMessage("*", (client, type, message) => {
            this.handleMessage(client, type as LobbyRequest, message);
        });
    }

    private handleMessage(client: Client, type: LobbyRequest, message: any) {
        //console.log(`[Lobby] Received message of type ${type} from ${this.state.players.get(client.sessionId)?.id}:`, message);
        switch (type) {

            case LobbyRequest.CREATE_CUSTOM_SESSION:
                console.log(message);
                break;

            default:
                console.log(`Unknown message type: ${type}`);

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
