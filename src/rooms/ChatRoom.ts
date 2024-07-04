import {Client, Room} from "colyseus";
import {ChatRoomState} from "../states/ChatRoomState";
import {ChatRoomCreateOption} from "../options/chatRoom/ChatRoomCreateOption";
import {ChatRoomService} from "../services/chatRoom/ChatRoomService";

enum ChatRoomCommands {

}

export class ChatRoom extends Room<ChatRoomState> {

    private chatRoomService: ChatRoomService;

    constructor() {
        super();
        this.setState(new ChatRoomState());
        this.chatRoomService = new ChatRoomService(this.state);
    }

     onCreate(createOptions: ChatRoomCreateOption) {
        this.state.roomName = createOptions.roomName;
        this.state.roomOwner = createOptions.initialOwner;
        this.state.maxClients = createOptions.maxClients;
        this.state.isPrivate = createOptions.isPrivate;
        this.state.password = createOptions.password;

        this.onMessage("*", (client, type, message) => {
            this.handleMessage(client, type as ChatRoomCommands, message);
        });
     }

    private handleMessage(client: Client, type: ChatRoomCommands, message: any) {
        //console.log(`[${this.state.roomName}] Received message of type ${type} from ${this.state.chatRoomPlayers.get(client.sessionId)?.id}:`, message);
        switch (type) {
            default:
                console.log(`Unknown message type: ${type}`);

        }
    }

    onJoin(client: Client, options: any) {
        const playerId = options.id;

    }



}
