import {Client, matchMaker, Room} from "colyseus";
import {ChatRoomState} from "../states/ChatRoomState";
import {ChatRoomCreateOption} from "../options/chatRoom/ChatRoomCreateOption";
import {ChatRoomService} from "../services/chatRoom/ChatRoomService";
import EventEmitter from "node:events";
import {ChatRoomPlayer} from "../schemas/chatRoom/ChatRoomPlayer";

export enum ChatRoomRequest {
    OPTION_CONFIG = "OPTION_CONFIG",
}

export enum ChatRoomResponse {
    CHAT_ROOM_JOINED = "CHAT_ROOM_JOINED",
}

export class ChatRoom extends Room<ChatRoomState> {

    private chatRoomService!: ChatRoomService;

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
            default:
                console.log(`Unknown message type: ${type}`);
        }
    }

    onJoin(client: Client, options: any) {
         try {
             this.chatRoomService.onJoin(client, options);
         } finally {
             this.chatRoomService.syncLobbyState();
         }
    }

    onLeave(client: Client) {
         try {
             this.chatRoomService.onLeave(client);
         } finally {
             this.chatRoomService.syncLobbyState();
         }
    }

    async onDispose() {
        this.chatRoomService.onDispose();
    }


}
