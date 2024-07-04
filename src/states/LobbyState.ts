import {MapSchema, Schema, type} from "@colyseus/schema";
import {ClientInfo} from "../schemas/globals/ClientInfo";
import {ChatRoomInfo} from "../schemas/globals/ChatRoomInfo";


export class LobbyState extends Schema {
    @type("string")
    initializedTimestamp = "";
    @type({map : ClientInfo})
    clients = new MapSchema<ClientInfo>();
    @type({map: ChatRoomInfo})
    chatRooms = new MapSchema<ChatRoomInfo>();











}
