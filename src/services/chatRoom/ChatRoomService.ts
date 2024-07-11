import {ChatRoomState} from "../../states/ChatRoomState";
import {Client} from "colyseus";
import {ChatRoomCreateOption} from "../../options/chatRoom/ChatRoomCreateOption";
import {LobbyEvent} from "../../rooms/Lobby";
import {AsyncEventEmitter} from "../../utils/AsyncEventEmitter";
import {ChatRoom, ChatRoomResponse} from "../../rooms/ChatRoom";
import {ClientInfo} from "../../schemas/globals/ClientInfo";
import {ChatRoomPlayer} from "../../schemas/chatRoom/ChatRoomPlayer";
import {ChatRoomInfo} from "../../schemas/globals/ChatRoomInfo";


export class ChatRoomService {
    constructor(private room: ChatRoom, private state: ChatRoomState) {}

    private lobbyEventEmitter!: AsyncEventEmitter;

    onCreate(createOptions: ChatRoomCreateOption) {

        this.room.autoDispose = true;

        this.state.roomId = this.room.roomId;
        this.state.roomName = createOptions.roomName;
        this.state.roomOwner = createOptions.initialOwner;
        this.state.maxClients = createOptions.maxClients;
        this.room.maxClients = this.state.maxClients;
        this.state.isPrivate = createOptions.isPrivate;
        this.state.password = createOptions.password;
        this.lobbyEventEmitter = createOptions.eventEmitter;
        console.log(`[ChatRoom: ${this.state.roomName}(${this.room.roomId})] Created`);
    }

    async onJoin(client: Client, options: ClientInfo) {
        let chatRoomPlayer = new ChatRoomPlayer();
        chatRoomPlayer.lobbySessionId = options.sessionId;
        chatRoomPlayer.sessionId = client.sessionId;
        chatRoomPlayer.id = options.id;
        chatRoomPlayer.name = options.name;
        this.state.players.set(chatRoomPlayer.sessionId, chatRoomPlayer);
        //client.send(ChatRoomResponse.CHAT_ROOM_JOINED);
        console.log(`[ChatRoom: ${this.state.roomName}(${this.room.roomId})] ${chatRoomPlayer.id}(${chatRoomPlayer.lobbySessionId})(${client.sessionId}) Joined - Currently [${this.state.players.size}] Player In The Room`);
        this.refreshRoomState();
    }

    onLeave(client: Client) {
        let chatRoomPlayer = this.state.players.get(client.sessionId)!;
        this.state.players.delete(client.sessionId);
        console.log(`[ChatRoom: ${this.state.roomName}(${this.room.roomId})] ${chatRoomPlayer.id}(${chatRoomPlayer.lobbySessionId})(${client.sessionId}) Left - Currently [${this.state.players.size}] Player In The Room`);

        // 방장이 떠나는 경우, 남아 있는 플레이어 중 한 명에게 방장을 넘김
/*        if (this.state.roomOwner === chatRoomPlayer.id && this.state.players.size > 0) {
            let remainingPlayers = Array.from(this.state.players.values());
            this.state.roomOwner = remainingPlayers[0].id; // 첫 번째 남아 있는 플레이어에게 방장 넘김
            console.log(`[ChatRoom: ${this.state.roomName}(${this.room.roomId})] OwnerChanged "${this.state.roomOwner}"`);
        }*/

        this.refreshRoomState();
    }

    onDispose() {
        //TODO: 이게 문제였네
        //this.lobbyEventEmitter.emit(LobbyEvent.CHAT_ROOM_DISPOSED, this.room.roomId);
    }


    private refreshRoomState() {
        this.lobbyEventEmitter.emit(LobbyEvent.CHAT_ROOM_UPDATED, this.getRoomState());
    }

    private getRoomState(): ChatRoomInfo {
        let chatRoomInfo = new ChatRoomInfo();
        chatRoomInfo.roomId = this.state.roomId;
        chatRoomInfo.roomName = this.state.roomName;
        chatRoomInfo.roomOwner = this.state.roomOwner;
        chatRoomInfo.maxClients = this.state.maxClients;
        chatRoomInfo.isPrivate = this.state.isPrivate;
        chatRoomInfo.password = chatRoomInfo.isPrivate ? this.state.password : "";
        chatRoomInfo.players = this.state.players;
        chatRoomInfo.isPlaying = this.state.isPlaying;
        //console.log(JSON.stringify(chatRoomInfo, null, 2));
        return chatRoomInfo;
    }

}
