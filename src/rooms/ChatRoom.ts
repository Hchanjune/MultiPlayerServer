import {Client, matchMaker, Room} from "colyseus";
import {ChatRoomState} from "../states/ChatRoomState";
import {ChatRoomCreateOption} from "../options/chatRoom/ChatRoomCreateOption";
import {ChatRoomService} from "../services/chatRoom/ChatRoomService";
import EventEmitter from "node:events";
import {ChatRoomPlayer} from "../schemas/chatRoom/ChatRoomPlayer";
import {ChatQueue} from "../schemas/chatRoom/ChatQueue";

export enum ChatRoomRequest {
    ROOM_CONFIG = "ROOM_CONFIG",
    CHAT_REQUEST = "CHAT_REQUEST",
    TEAM_CHANGE_REQUEST = "TEAM_CHANGE_REQUEST",
    START = "START",
    READY = "READY",
    CANCEL_READY = "CANCEL_READY"
}

export enum ChatRoomResponse {
    ROOM_CONFIG_SUCCESS = "ROOM_CONFIG_SUCCESS",
    ROOM_CONFIG_FAILURE = "ROOM_CONFIG_FAILURE",
    PLAYER_JOINED = "PLAYER_JOINED",
    PLAYER_LEAVED = "PLAYER_LEAVED",
    OWNER_CHANGED = "OWNER_CHANGED",
    ECHO_CHAT_MESSAGE = "ECHO_CHAT_MESSAGE",
    READY_TO_START = "READY_TO_START",
    START_CANCELED = "START_CANCELED",
}

export class ChatRoom extends Room<ChatRoomState> {

    private chatRoomService!: ChatRoomService;
    chatQueue: ChatQueue = new ChatQueue();

     onCreate(createOptions: ChatRoomCreateOption) {

         this.setState(new ChatRoomState());
         this.chatRoomService = new ChatRoomService(this, createOptions.lobby);
         this.chatRoomService.onCreate(createOptions);

         this.onMessage("*", async (client, type, message) => {
             await this.handleMessage(client, type as ChatRoomRequest, message);
         });

     }

    private async handleMessage(client: Client, type: ChatRoomRequest, message: any) {
        //console.log(`[${this.state.roomName}] Received message of type ${type} from ${this.state.chatRoomPlayers.get(client.sessionId)?.id}:`, message);
        switch (type) {
            case ChatRoomRequest.ROOM_CONFIG:
                await this.chatRoomService.configChatRoom(client, message);
                break;
            case ChatRoomRequest.CHAT_REQUEST:
                this.chatRoomService.onChatReceived(client, message);
                break;
            case ChatRoomRequest.TEAM_CHANGE_REQUEST:
                this.chatRoomService.onTeamChangeRequest(client, message);
                break;
            case ChatRoomRequest.START:
                await this.chatRoomService.onStartRequest(client);
                break;
            case ChatRoomRequest.READY:
                this.chatRoomService.onReadyRequest(client);
                break;
            case ChatRoomRequest.CANCEL_READY:
                this.chatRoomService.onCancelReadyRequest(client);
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
