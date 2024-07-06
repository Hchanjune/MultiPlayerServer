import {Client, Room} from "colyseus";
import {LobbyState} from "../states/LobbyState";
import {LobbyService} from "../services/lobby/LobbyService";
import {LobbyLoginOption} from "../options/lobby/LobbyLoginOption";

export enum LobbyRequest {
    "CREATE_ACCOUNT" = "CREATE_ACCOUNT"
}

export enum LobbyResponse {
    "CONNECTED" = "CONNECTED",
    "NOT_AUTHENTICATED" = "NOT_AUTHENTICATED",
    "DUPLICATED_CONNECTION" = "DUPLICATED_CONNECTION"
}

export class Lobby extends Room<LobbyState> {

    private lobbyService: LobbyService;

    constructor() {
        super();
        this.setState(new LobbyState());
        this.lobbyService = new LobbyService(this.state);
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
