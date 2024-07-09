import {Schema, type} from "@colyseus/schema";

export class ChatRoomPlayer extends Schema {

    @type("string")
    lobbySessionId = "";
    @type("string")
    sessionId = "";
    @type("string")
    id = "";
    @type("string")
    name = "";
}
