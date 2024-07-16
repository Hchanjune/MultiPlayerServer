import {MapSchema, Schema, type} from "@colyseus/schema";


export class ChatRoomInfo extends Schema {
    @type("string")
    roomId = "";
    @type("string")
    roomName = "";
    @type("string")
    roomOwner = "";
    @type("uint8")
    maxClients = 10;
    @type("boolean")
    isPrivate = false;
    @type("string")
    password = "";
    @type("uint8")
    currentPlayers = 0;
    @type("boolean")
    isPlaying = false;
}
