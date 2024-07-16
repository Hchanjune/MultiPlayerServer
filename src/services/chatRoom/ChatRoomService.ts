import {ChatRoomState} from "../../states/ChatRoomState";
import {Client} from "colyseus";
import {ChatRoomCreateOption} from "../../options/chatRoom/ChatRoomCreateOption";
import {Lobby} from "../../rooms/Lobby";
import {ChatRoom, ChatRoomResponse} from "../../rooms/ChatRoom";
import {ClientInfo} from "../../schemas/globals/ClientInfo";
import {LobbyState} from "../../states/LobbyState";
import {ChatRoomInfo} from "../../schemas/globals/ChatRoomInfo";
import {ChatMessage} from "../../schemas/chatRoom/ChatMessage";

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
        let chatRoomPlayer = this.state.addChatRoomPlayer(client.sessionId, options);
        console.log(`[ChatRoom: ${this.state.roomName}(${this.chatRoom.roomId})] ${chatRoomPlayer.id}(${chatRoomPlayer.lobbySessionId})(${client.sessionId}) Joined - Currently [${this.state.chatRoomPlayers.size}] Player In The Room`);
        this.chatRoom.broadcast(ChatRoomResponse.PLAYER_JOINED, new ChatMessage().assign({
            senderId: "System",
            senderName: "System",
            senderTeam: "System",
            message: `[${chatRoomPlayer.id}] 님이 입장 하였습니다.`,
            timestamp: new Date().toISOString()
        }));
        this.state.autoSetPlayerTeam(chatRoomPlayer);
        this.syncLobbyState();
    }

    onLeave(client: Client) {
        let chatRoomPlayer = this.state.chatRoomPlayers.get(client.sessionId)!;
        this.state.removeChatRoomPlayer(client.sessionId);
        console.log(`[ChatRoom: ${this.state.roomName}(${this.chatRoom.roomId})] ${chatRoomPlayer.id}(${chatRoomPlayer.lobbySessionId})(${client.sessionId}) Left - Currently [${this.state.chatRoomPlayers.size}] Player In The Room`);
        this.chatRoom.broadcast(ChatRoomResponse.PLAYER_LEAVED, new ChatMessage().assign({
            senderId: "System",
            senderName: "System",
            senderTeam: "System",
            message: `[${chatRoomPlayer.id}] 님이 퇴장 하였습니다.`,
            timestamp: new Date().toISOString()
        }));
        // 방장이 떠나는 경우, 남아 있는 플레이어 중 한 명에게 방장을 넘김
        if (this.state.roomOwner === chatRoomPlayer.id && this.state.chatRoomPlayers.size > 0) {
            let remainingPlayers = Array.from(this.state.chatRoomPlayers.values());
            this.state.roomOwner = remainingPlayers[0].id; // 첫 번째 남아 있는 플레이어에게 방장 넘김
            console.log(`[ChatRoom: ${this.state.roomName}(${this.chatRoom.roomId})] OwnerChanged "${this.state.roomOwner}"`);
            this.chatRoom.broadcast(ChatRoomResponse.OWNER_CHANGED, new ChatMessage().assign({
                senderId: "System",
                senderName: "System",
                senderTeam: "System",
                message: `세션의 소유권이 [${this.state.roomOwner}] 님으로 이전 됩니다.`,
                timestamp: new Date().toISOString()
            }));
        }
        this.syncLobbyState();
    }

    onDispose() {
        this.lobbyState.chatRooms.delete(this.chatRoom.roomId);
        console.log(`[ChatRoom: ${this.state.roomName}(${this.chatRoom.roomId})] Disposed.`);
    }

    onChatReceived(client: Client, message: any) {
        let sender = this.state.chatRoomPlayers.get(client.sessionId)!;
        let chat = new ChatMessage().assign({
            senderId: sender.id,
            senderName: sender.name,
            senderTeam: sender.id,
            message: message,
            timestamp: new Date().toISOString()
        });
        this.chatRoom.chatQueue.chatMessages.push(chat);
        this.chatRoom.broadcast(ChatRoomResponse.ECHO_CHAT_MESSAGE, chat);
    }

    syncLobbyState() {
        let chatRoomInfo = this.lobby.state.chatRooms.get(this.chatRoom.roomId)!;
        chatRoomInfo.roomName = this.state.roomName;
        chatRoomInfo.roomOwner = this.state.roomOwner;
        chatRoomInfo.maxClients = this.state.maxClients;
        chatRoomInfo.isPrivate = this.state.isPrivate;
        chatRoomInfo.password = this.state.password;
        chatRoomInfo.currentPlayers = this.chatRoom.clients.length;
        chatRoomInfo.isPlaying = this.state.isPlaying;
    }

    generateChatRoomInfo() {
        return new ChatRoomInfo().assign({
            roomId: this.state.roomId,
            roomName: this.state.roomName,
            roomOwner: this.state.roomOwner,
            maxClients: this.state.maxClients,
            isPrivate: this.state.isPrivate,
            password: this.state.password,
            currentPlayers: this.chatRoom.clients.length,
            isPlaying: this.state.isPlaying
        });
    }

}
