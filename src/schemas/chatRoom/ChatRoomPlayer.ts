import {Schema, type} from "@colyseus/schema";

export class ChatRoomPlayer extends Schema {
    @type("string") lobbySessionId: string = "";
    @type("string") sessionId: string = "";
    @type("string") id: string = "";
    @type("string") name: string = "";
}
