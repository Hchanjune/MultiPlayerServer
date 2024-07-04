import {LobbyState} from "../../states/LobbyState";
import {Client} from "colyseus";
import {LobbyLoginOption} from "../../options/lobby/LobbyLoginOption";
import {ClientInfo} from "../../schemas/globals/ClientInfo";
import {LobbyResponse} from "../../rooms/Lobby";


export class LobbyService {
    constructor(private state: LobbyState) {}


    onLogin(client: Client, loginOption: LobbyLoginOption){

        // LoginService => originally check login in database
        const clientInfo = new ClientInfo();
        clientInfo.sessionId = client.sessionId;
        clientInfo.id = loginOption.id;
        client.id = clientInfo.id;
        clientInfo.name = "Nickname"
        this.state.clients.set(client.id, clientInfo);

        if (true) {
            client.send(LobbyResponse.CONNECTED, clientInfo);
        } else {
            client.send(LobbyResponse.NOT_AUTHENTICATED);
        }

        console.log(`[Lobby] ${client.id} Joined The Lobby`);
        console.log(`[Lobby] Currently [${this.state.clients.size}] Users In The Lobby Including "${client.id}"`);
    }

    onLogout(client: Client)
    {
        this.state.clients.delete(client.sessionId);
        console.log(`[Lobby] ${client.id} Left The Lobby`);
        console.log(`[Lobby] Currently [${this.state.clients.size}] Users In The Lobby Excluding "${client.id}"`);
    }

}
