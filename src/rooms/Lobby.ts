import { LobbyRoom, Client } from "colyseus";

export enum LobbyResponse {
    "DUPLICATED_CONNECTION" = "DUPLICATED_CONNECTION"
}

export class Lobby extends LobbyRoom {
    async onCreate(options: any) {
        await super.onCreate(options);
        console.log(`[Lobby] Created`);
    }

    onJoin(client: Client, options: any) {
        const existingClient = this.clients.find(client => client.id === options.username);

        if (existingClient) {
            existingClient.send(LobbyResponse.DUPLICATED_CONNECTION, "중복된 로그인입니다.");
            console.error(`[Lobby] "${options.username}" User Duplicated Login Detected.`);
            //existingClient.leave();
            //this.clients.delete(client);
            return;
        }

        client.id = options.username;

        super.onJoin(client, options);
        console.log(`[Lobby] "${client.id}" Joined The Lobby`);
        console.log(`[Lobby] Currently [${this.clients.length}] Users In The Lobby Including "${client.id}"`);
    }

    onLeave(client: Client) {
        super.onLeave(client);
        this.clients.delete(client);
        console.log(`[Lobby] ${client.id} Left The Lobby`);
        console.log(`[Lobby] Currently [${this.clients.length}] Users In The Lobby Excluding "${client.id}"`);
    }

    onDispose() {
        super.onDispose();
        console.log(`[Lobby] disposed There Is No User Left In Lobby`);
    }
}
