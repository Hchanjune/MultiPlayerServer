import {ChatRoomState} from "../../states/ChatRoomState";
import {Client} from "colyseus";
import {ChatRoomCreateOption} from "../../options/chatRoom/ChatRoomCreateOption";
import {Lobby} from "../../rooms/Lobby";
import {ChatRoom, ChatRoomResponse} from "../../rooms/ChatRoom";
import {ClientInfo} from "../../schemas/globals/ClientInfo";
import {LobbyState} from "../../states/LobbyState";
import {ChatRoomInfo} from "../../schemas/globals/ChatRoomInfo";
import {ChatMessage} from "../../schemas/chatRoom/ChatMessage";
import internal from "node:stream";

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
            this.state.roomOwner = remainingPlayers[0].id;
            let newRoomOwner = this.state.selectChatRoomPlayerById(remainingPlayers[0].id)!;
            newRoomOwner.isReady = false;
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

    async configChatRoom(client: Client, chatRoomConfig: any) {
        let player = this.state.selectChatRoomPlayerByKey(client.sessionId);
        if (player.id !== this.state.roomOwner) {
            console.error("Unusual Activity Detected");
            return;
        }

        const previousState = {
            maxClients: this.state.maxClients,
            roomName: this.state.roomName,
            isPrivate: this.state.isPrivate,
            password: this.state.password,
        };

        try {
            const newMaxClients = chatRoomConfig.maxClients;
            const halfMaxClients = Math.ceil(newMaxClients / 2);
            const currentRedTeamCount = this.state.redTeam.length;
            const currentBlackTeamCount = this.state.blackTeam.length;

            if (newMaxClients < this.state.chatRoomPlayers.size) {
                client.send(ChatRoomResponse.ROOM_CONFIG_FAILURE, "현재 참여중인 사용자의 수가 설정을 초과합니다.");
                throw new Error("New maxClients cannot be less than the current number of players.");
            }
            if (currentRedTeamCount > halfMaxClients || currentBlackTeamCount > halfMaxClients) {
                client.send(ChatRoomResponse.ROOM_CONFIG_FAILURE, "현재 하나의 팀에 소속된 사용자의 수가 설정을 초과합니다.");
                throw new Error("New maxClients cannot be set due to team size constraints.");
            }
            this.state.maxClients = newMaxClients;
            this.chatRoom.maxClients = this.state.maxClients;
            this.state.roomName = chatRoomConfig.roomName;
            this.state.isPrivate = chatRoomConfig.isPrivate;
            this.state.password = chatRoomConfig.password;
            console.log(`[ChatRoom: ${this.state.roomName}(${this.chatRoom.roomId})] Configuration Patched.`);
            client.send(ChatRoomResponse.ROOM_CONFIG_SUCCESS, "성공적으로 변경 되었습니다.");
            await this.chatRoom.unlock();
            this.syncLobbyState();
        } catch (error: any) {
            this.state.maxClients = previousState.maxClients;
            this.chatRoom.maxClients = previousState.maxClients;
            this.state.roomName = previousState.roomName;
            this.state.isPrivate = previousState.isPrivate;
            this.state.password = previousState.password;
            console.log(`[ChatRoom: ${this.state.roomName}(${this.chatRoom.roomId})] Configuration Failed To Patch.`);
            this.syncLobbyState();
        }
    }

    onTeamChangeRequest(client: Client, color: string) {
        let player = this.state.selectChatRoomPlayerByKey(client.sessionId);
        if (player.isReady) {
            client.send(ChatRoomResponse.ECHO_CHAT_MESSAGE, new ChatMessage().assign({
                senderId: "System",
                senderName: "System",
                senderTeam: "System",
                message: `준비상태에서는 팀을 변경 할 수 없습니다.`,
                timestamp: new Date().toISOString()
            }));
            return;
        }
        //console.log(`[ChatRoom: ${this.state.roomName}(${this.chatRoom.roomId})] ${player.id} Requested To Change Team To ${color}`);
        if (this.state.changePlayerTeam(player, color)) {
            //console.log(`[ChatRoom: ${this.state.roomName}(${this.chatRoom.roomId})] ${player.id} Request Successful`);
        }
    }

    onReadyRequest(client: Client) {
        let player = this.state.selectChatRoomPlayerByKey(client.sessionId);
        player.isReady = true;
    }

    onCancelReadyRequest(client: Client) {
        let player = this.state.selectChatRoomPlayerByKey(client.sessionId);
        player.isReady = false;
    }

    async onStartRequest(client: Client) {
        let player = this.state.selectChatRoomPlayerByKey(client.sessionId);
        if (player.id !== this.state.roomOwner) {
            console.error("Unusual Activity Detected");
            return;
        }
        if (this.state.isAllPlayersReady()) {

            if (this.state.redTeam.length !== this.state.blackTeam.length) {
                this.chatRoom.broadcast(ChatRoomResponse.ECHO_CHAT_MESSAGE, new ChatMessage().assign({
                    senderId: "System",
                    senderName: "System",
                    senderTeam: "System",
                    message: `양쪽 진형의 사용자 수의 균형이 맞지 않습니다. [Red:${this.state.redTeam.length} vs Black:${this.state.blackTeam.length}]`,
                    timestamp: new Date().toISOString()
                }));
                return;
            }

            await this.chatRoom.lock();

            this.chatRoom.state.isPlaying = true;
            this.syncLobbyState();

            this.chatRoom.broadcast(ChatRoomResponse.ECHO_CHAT_MESSAGE, new ChatMessage().assign({
                senderId: "System",
                senderName: "System",
                senderTeam: "System",
                message: `모든 사용자가 준비되어 세션을 시작합니다.`,
                timestamp: new Date().toISOString()
            }));
            this.chatRoom.broadcast(ChatRoomResponse.READY_TO_START);

            this.startCountdown();

        } else {
            this.chatRoom.broadcast(ChatRoomResponse.ECHO_CHAT_MESSAGE, new ChatMessage().assign({
                senderId: "System",
                senderName: "System",
                senderTeam: "System",
                message: `준비되지 않은 사용자가 존재합니다.`,
                timestamp: new Date().toISOString()
            }));
        }
    }


    private startCountdown() {
        let timeoutDelay = 5;
        const delayInterval = setInterval(() => {
            this.chatRoom.broadcast(ChatRoomResponse.ECHO_CHAT_MESSAGE, new ChatMessage().assign({
                senderId: "System",
                senderName: "System",
                senderTeam: "System",
                message: timeoutDelay.toString(),
                timestamp: new Date().toISOString()
            }));
            timeoutDelay--;
        }, 1000);

        const timeout = setTimeout(() => {
            clearInterval(delayInterval);
            this.chatRoom.broadcast(ChatRoomResponse.ECHO_CHAT_MESSAGE, new ChatMessage().assign({
                senderId: "System",
                senderName: "System",
                senderTeam: "System",
                message: `잠시 후 인스턴트 세션이 시작됩니다.`,
                timestamp: new Date().toISOString()
            }));
            this.chatRoom._events.off('leave', playerLeavedWhileCountdown);
            // start
        }, 6000);

        const playerLeavedWhileCountdown = async () => {
            clearInterval(delayInterval);
            clearTimeout(timeout);
            this.chatRoom.broadcast(ChatRoomResponse.ECHO_CHAT_MESSAGE, new ChatMessage().assign({
                senderId: "System",
                senderName: "System",
                senderTeam: "System",
                message: `사용자가 퇴장하여 카운트 다운이 중단됩니다.`,
                timestamp: new Date().toISOString()
            }));
            await this.chatRoom.unlock();
            this.chatRoom.state.isPlaying = false;
            this.chatRoom.broadcast(ChatRoomResponse.START_CANCELED);
            this.syncLobbyState();
            this.chatRoom._events.off('leave', playerLeavedWhileCountdown);
        };

        this.chatRoom._events.on('leave', playerLeavedWhileCountdown);
    }



}
