import {ChatRoomState} from "../../states/ChatRoomState";
import {Client} from "colyseus";
import {ChatRoomCreateOption} from "../../options/chatRoom/ChatRoomCreateOption";
import {Lobby, LobbyEvent} from "../../rooms/Lobby";
import {AsyncEventEmitter} from "../../utils/AsyncEventEmitter";
import {ChatRoom, ChatRoomResponse} from "../../rooms/ChatRoom";
import {ClientInfo} from "../../schemas/globals/ClientInfo";
import {ChatRoomPlayer} from "../../schemas/chatRoom/ChatRoomPlayer";
import {LobbyState} from "../../states/LobbyState";


export class ChatRoomService {

    private chatRoom: ChatRoom;
    private state: ChatRoomState;
    private lobby: Lobby;
    private lobbyState: LobbyState;
    private lobbyEventEmitter!: AsyncEventEmitter;

    constructor(chatRoom: ChatRoom, lobby: Lobby) {
        this.chatRoom = chatRoom;
        this.state = chatRoom.state;
        this.lobby = lobby;
        this.lobbyState = lobby.state;
        this.lobbyEventEmitter = lobby.eventEmitter;
    }

    onCreate(createOptions: ChatRoomCreateOption) {
        this.state.roomId = this.chatRoom.roomId;
        this.state.roomName = createOptions.roomName;
        this.state.roomOwner = createOptions.initialOwner;
        this.state.maxClients = createOptions.maxClients;
        this.chatRoom.maxClients = this.state.maxClients;
        this.state.isPrivate = createOptions.isPrivate;
        this.state.password = createOptions.password;

        this.lobbyState.chatRooms.set(this.chatRoom.roomId, this.state);
        console.log(`[ChatRoom: ${this.state.roomName}(${this.chatRoom.roomId})] Created`);
    }

    async onJoin(client: Client, options: ClientInfo) {
        let chatRoomPlayer = new ChatRoomPlayer();
        chatRoomPlayer.lobbySessionId = options.sessionId;
        chatRoomPlayer.sessionId = client.sessionId;
        chatRoomPlayer.id = options.id;
        chatRoomPlayer.name = options.name;
        this.state.players.set(chatRoomPlayer.sessionId, chatRoomPlayer);
        //client.send(ChatRoomResponse.CHAT_ROOM_JOINED);
        console.log(`[ChatRoom: ${this.state.roomName}(${this.chatRoom.roomId})] ${chatRoomPlayer.id}(${chatRoomPlayer.lobbySessionId})(${client.sessionId}) Joined - Currently [${this.state.players.size}] Player In The Room`);
        this.refreshRoomState();
        //this.lobbyState.chatRooms.get(this.chatRoom.roomId)!.players.set(chatRoomPlayer.sessionId, chatRoomPlayer);
    }

    onLeave(client: Client) {
        let chatRoomPlayer = this.state.players.get(client.sessionId)!;
        this.state.players.delete(client.sessionId);
        console.log(`[ChatRoom: ${this.state.roomName}(${this.chatRoom.roomId})] ${chatRoomPlayer.id}(${chatRoomPlayer.lobbySessionId})(${client.sessionId}) Left - Currently [${this.chatRoom.clients.length}] Player In The Room`);

        // 방장이 떠나는 경우, 남아 있는 플레이어 중 한 명에게 방장을 넘김
        if (this.state.roomOwner === chatRoomPlayer.id && this.state.players.size > 0) {
            let remainingPlayers = Array.from(this.state.players.values());
            this.state.roomOwner = remainingPlayers[0].id; // 첫 번째 남아 있는 플레이어에게 방장 넘김
            //this.lobbyState.chatRooms.get(this.chatRoom.roomId)!.roomOwner = remainingPlayers[0].id;
            console.log(`[ChatRoom: ${this.state.roomName}(${this.chatRoom.roomId})] OwnerChanged "${this.state.roomOwner}"`);
        }

        this.refreshRoomState();
        //this.lobbyState.chatRooms.get(this.chatRoom.roomId)!.players.delete(client.sessionId);
    }

    onDispose() {
        //this.lobbyEventEmitter.emit(LobbyEvent.CHAT_ROOM_DISPOSED, this.room.roomId);
        this.lobbyState.chatRooms.delete(this.chatRoom.roomId);
    }


    private refreshRoomState() {
        //this.lobbyEventEmitter.emit(LobbyEvent.CHAT_ROOM_UPDATED, this.getRoomState());
        this.lobby.broadcastPatch();
    }

}
