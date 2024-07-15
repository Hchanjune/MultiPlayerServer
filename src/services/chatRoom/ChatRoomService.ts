import {ChatRoomState} from "../../states/ChatRoomState";
import {Client} from "colyseus";
import {ChatRoomCreateOption} from "../../options/chatRoom/ChatRoomCreateOption";
import {Lobby} from "../../rooms/Lobby";
import {ChatRoom} from "../../rooms/ChatRoom";
import {ClientInfo} from "../../schemas/globals/ClientInfo";
import {ChatRoomPlayer} from "../../schemas/chatRoom/ChatRoomPlayer";
import {LobbyState} from "../../states/LobbyState";
import {ChatRoomInfo} from "../../schemas/globals/ChatRoomInfo";
import type {type} from "@colyseus/schema";
import {MapSchema} from "@colyseus/schema";


export class ChatRoomService {

    private chatRoom: ChatRoom;
    private state: ChatRoomState;
    private lobby: Lobby;
    private lobbyState: LobbyState;

    constructor(chatRoom: ChatRoom, lobby: Lobby) {
        this.chatRoom = chatRoom;
        this.state = chatRoom.state;
        this.lobby = lobby;
        this.lobbyState = lobby.state;
    }

    onCreate(createOptions: ChatRoomCreateOption) {
        this.state.roomId = this.chatRoom.roomId;
        this.state.roomName = createOptions.roomName;
        this.state.roomOwner = createOptions.initialOwner;
        this.state.maxClients = createOptions.maxClients;
        this.chatRoom.maxClients = this.state.maxClients;
        this.state.isPrivate = createOptions.isPrivate;
        this.state.password = createOptions.password;
        this.lobbyState.chatRooms.set(this.chatRoom.roomId, this.generateChatRoomInfo());
        console.log(`[ChatRoom: ${this.state.roomName}(${this.chatRoom.roomId})] Created`);
    }

    onJoin(client: Client, options: ClientInfo) {
        let chatRoomPlayer = new ChatRoomPlayer();
        chatRoomPlayer.lobbySessionId = options.sessionId;
        chatRoomPlayer.sessionId = client.sessionId;
        chatRoomPlayer.id = options.id;
        chatRoomPlayer.name = options.name;
        this.state.players.set(chatRoomPlayer.sessionId, chatRoomPlayer);
        //this.state.roomName = `${chatRoomPlayer.id} Joined`;
        console.log(`[ChatRoom: ${this.state.roomName}(${this.chatRoom.roomId})] ${chatRoomPlayer.id}(${chatRoomPlayer.lobbySessionId})(${client.sessionId}) Joined - Currently [${this.state.players.size}] Player In The Room`);
    }

    onLeave(client: Client) {
        let chatRoomPlayer = this.state.players.get(client.sessionId)!;
        //this.state.roomName = `${chatRoomPlayer.id} Leaved`;
        this.state.players.delete(client.sessionId);
        console.log(`[ChatRoom: ${this.state.roomName}(${this.chatRoom.roomId})] ${chatRoomPlayer.id}(${chatRoomPlayer.lobbySessionId})(${client.sessionId}) Left - Currently [${this.state.players.size}] Player In The Room`);

        // 방장이 떠나는 경우, 남아 있는 플레이어 중 한 명에게 방장을 넘김
        if (this.state.roomOwner === chatRoomPlayer.id && this.state.players.size > 0) {
            let remainingPlayers = Array.from(this.state.players.values());
            this.state.roomOwner = remainingPlayers[0].id; // 첫 번째 남아 있는 플레이어에게 방장 넘김
            console.log(`[ChatRoom: ${this.state.roomName}(${this.chatRoom.roomId})] OwnerChanged "${this.state.roomOwner}"`);
        }
    }

    onDispose() {
        this.lobbyState.chatRooms.delete(this.chatRoom.roomId);
    }


    syncLobbyState() {
        let chatRoomInfo = this.lobby.state.chatRooms.get(this.chatRoom.roomId)!;
        chatRoomInfo.roomName = this.state.roomName;
        chatRoomInfo.roomOwner = this.state.roomOwner;
        chatRoomInfo.maxClients = this.state.maxClients;
        chatRoomInfo.isPrivate = this.state.isPrivate;
        chatRoomInfo.password = this.state.password;
        chatRoomInfo.players = this.state.players;
        chatRoomInfo.isPlaying = this.state.isPlaying;
        console.log(`[Lobby] View Of Player - [${this.state.players.size}]`);
    }

    generateChatRoomInfo() {
        let chatRoomInfo = new ChatRoomInfo();
        chatRoomInfo.roomId = this.state.roomId;
        chatRoomInfo.roomName = this.state.roomName;
        chatRoomInfo.roomOwner = this.state.roomOwner;
        chatRoomInfo.maxClients = this.state.maxClients;
        chatRoomInfo.isPrivate = this.state.isPrivate;
        chatRoomInfo.password = this.state.password;
        chatRoomInfo.players = this.state.players;
        chatRoomInfo.isPlaying = this.state.isPlaying;
        return chatRoomInfo;
    }

}
