import {Client, matchMaker, Room} from "colyseus";
import {ChatRoomState} from "../states/ChatRoomState";
import {ChatRoomCreateOption} from "../options/chatRoom/ChatRoomCreateOption";
import {ChatRoomService} from "../services/chatRoom/ChatRoomService";
import EventEmitter from "node:events";
import {ChatRoomPlayer} from "../schemas/chatRoom/ChatRoomPlayer";
import {ChatQueue} from "../schemas/chatRoom/ChatQueue";

export enum ChatRoomRequest {
    OPTION_CONFIG = "OPTION_CONFIG",
    CHAT_REQUEST = "CHAT_REQUEST",
    TEAM_CHANGE_REQUEST = "TEAM_CHANGE_REQUEST",
}

export enum ChatRoomResponse {
    PLAYER_JOINED = "PLAYER_JOINED",
    PLAYER_LEAVED = "PLAYER_LEAVED",
    OWNER_CHANGED = "OWNER_CHANGED",
    ECHO_CHAT_MESSAGE = "ECHO_CHAT_MESSAGE",
    TEAM_CHANGED = "TEAM_CHANGED",
    TEAM_CHANGE_UNAVAILABLE = "TEAM_CHANGE_UNAVAILABLE",
}

export class ChatRoom extends Room<ChatRoomState> {

    private chatRoomService!: ChatRoomService;
    chatQueue: ChatQueue = new ChatQueue();

     onCreate(createOptions: ChatRoomCreateOption) {

         this.setState(new ChatRoomState());
         this.chatRoomService = new ChatRoomService(this, createOptions.lobby);
         this.chatRoomService.onCreate(createOptions);

         this.onMessage("*", (client, type, message) => {
             this.handleMessage(client, type as ChatRoomRequest, message);
         });

     }

    private handleMessage(client: Client, type: ChatRoomRequest, message: any) {
        //console.log(`[${this.state.roomName}] Received message of type ${type} from ${this.state.chatRoomPlayers.get(client.sessionId)?.id}:`, message);
        switch (type) {
            case ChatRoomRequest.CHAT_REQUEST:
                this.chatRoomService.onChatReceived(client, message);
                break;
            default:
                console.log(`Unknown message type: ${type}`);
        }
    }

    onJoin(client: Client, options: any) {
         this.chatRoomService.onJoin(client, options);
    }

    onLeave(client: Client) {
         this.chatRoomService.onLeave(client);
    }

    async onDispose() {
        this.chatRoomService.onDispose();
    }


}
