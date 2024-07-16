import {Schema, type} from "@colyseus/schema";


export class ChatMessage extends Schema {
    @type("string")
    senderId = "";
    @type("string")
    senderName = "";
    @type("string")
    senderTeam = "";
    @type("string")
    message = "";
    @type("string")
    timestamp = "";
}
