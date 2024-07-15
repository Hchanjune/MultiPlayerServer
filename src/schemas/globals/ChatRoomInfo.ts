import {MapSchema, Schema, type} from "@colyseus/schema";
import {ChatRoomPlayer} from "../chatRoom/ChatRoomPlayer";


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
    @type({ map : ChatRoomPlayer })
    players= new MapSchema<ChatRoomPlayer>();
    @type("boolean")
    isPlaying = false;
}
