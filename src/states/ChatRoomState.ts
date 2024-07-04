import {MapSchema, Schema, type} from "@colyseus/schema";
import {ChatRoomPlayer} from "../schemas/chatRoom/ChatRoomPlayer";


export class ChatRoomState extends Schema {
    @type("string")
    roomName = "";
    @type("string")
    roomOwner = null;
    @type("number")
    maxClients = 10;
    @type("boolean")
    isPrivate = false;
    @type("string")
    password = null;
    @type({ map : ChatRoomPlayer })
    players= new MapSchema<ChatRoomPlayer>();
    @type("boolean")
    isPlaying;
}
