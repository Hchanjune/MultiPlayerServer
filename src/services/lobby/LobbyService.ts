import _ from 'lodash';
import {LobbyState} from "../../states/LobbyState";
import {Client, matchMaker} from "colyseus";
import {LobbyLoginOption} from "../../options/lobby/LobbyLoginOption";
import {ClientInfo} from "../../schemas/globals/ClientInfo";
import {Lobby, LobbyResponse} from "../../rooms/Lobby";
import {ChatRoomCreateOption} from "../../options/chatRoom/ChatRoomCreateOption";
import {ChatRoom} from "../../rooms/ChatRoom";
import {ChatRoomInfo} from "../../schemas/globals/ChatRoomInfo";
import {AsyncEventEmitter} from "../../utils/AsyncEventEmitter";


export class LobbyService {

    private room: Lobby;
    private state: LobbyState;
    private eventEmitter: AsyncEventEmitter;

    constructor(private lobby: Lobby) {
        this.room = lobby;
        this.state = lobby.state;
        this.eventEmitter = lobby.eventEmitter;
    }


    onLogin(client: Client, loginOption: LobbyLoginOption){

        // LoginService => originally check login in database
        const clientInfo = new ClientInfo();
        clientInfo.sessionId = client.sessionId;
        clientInfo.id = loginOption.id;
        client.id = clientInfo.id;
        clientInfo.name = "Nickname"
        this.state.clients.set(client.sessionId, clientInfo);

        if (true) {
            client.send(LobbyResponse.CONNECTED, clientInfo);
        } else {
            client.send(LobbyResponse.NOT_AUTHENTICATED);
        }

        console.log(`[Lobby] ${client.id}(${client.sessionId}) Joined The Lobby`);
        console.log(`[Lobby] Currently [${this.state.clients.size}] Users In The Lobby Including "${client.id}(${client.sessionId})"`);
        console.log(`[Lobby] Currently [${this.state.chatRooms.size}] ChatRoom Active In The Lobby`);
    }

    onLogout(client: Client)
    {
        this.state.clients.delete(client.sessionId);
        console.log(`[Lobby] ${client.id}(${client.sessionId}) Left The Lobby`);
        console.log(`[Lobby] Currently [${this.state.clients.size}] Users In The Lobby Excluding "${client.id}(${client.sessionId})"`);
        console.log(`[Lobby] Currently [${this.state.chatRooms.size}] ChatRoom Active In The Lobby`);
    }

    async returnClientInfo(sessionId: string): Promise<ClientInfo> {
        return this.state.clients.get(sessionId)!!;
    }

    async onCreateChatRoom(client: Client, option: ChatRoomCreateOption) {
        try {

            if (client.id !== option.initialOwner) {
                console.log(`[CreatingChatRoom] Request="${client.id}" Owner="${option.initialOwner}"`);
                client.send(LobbyResponse.ERROR_MESSAGE, "유효하지 않은 요청입니다.");
                return;
            }
            option.lobby = this.lobby;
            const chatRoom = await matchMaker.createRoom('ChatRoom', option);
            let chatRoomInfo = new ChatRoomInfo();
            chatRoomInfo.roomId = chatRoom.roomId;
            chatRoomInfo.roomName = option.roomName;
            chatRoomInfo.roomOwner = option.initialOwner;
            chatRoomInfo.maxClients = option.maxClients;
            chatRoomInfo.isPrivate = option.isPrivate;
            chatRoomInfo.password = option.isPrivate ? option.password : "";
            //this.state.chatRooms.set(chatRoom.roomId, chatRoomInfo);
            const seatReservation = await matchMaker.joinById(chatRoom.roomId, this.state.clients.get(client.sessionId));
            client.send(LobbyResponse.CHAT_ROOM_CREATED, seatReservation);
        } catch (error: any) {
            console.error(`[Lobby] Error Occurred While Creating Custom Session : ${error}`);
            client.send(LobbyResponse.ERROR_MESSAGE, `방을 생성 할 수 없습니다 - ${error}`);
        }
    }

    async onChatRoomJoinRequest(client: Client, options: any) {
        try {
            let targetRoom = await matchMaker.getRoomById(options.roomId) as ChatRoom;

            if (targetRoom.state.isPrivate) {
                if (targetRoom.state.password !== options.password) {
                    client.send(LobbyResponse.CHAT_ROOM_PASSWORD_ERROR, "비밀번호가 일치하지 않습니다.");
                    return;
                }
            }

            if (targetRoom.state.players.size >= targetRoom.state.maxClients) {
                client.send(LobbyResponse.CHAT_ROOM_FULL, "현재 자리가 없습니다.");
                return;
            }

            // 클라이언트 세션 ID로 시트 예약
            const seatReservation = await matchMaker.joinById(options.roomId, this.state.clients.get(client.sessionId));

            client.send(LobbyResponse.CHAT_ROOM_AUTHORIZED, seatReservation);
        } catch (error) {
            console.error(`Error during chat room join request: ${error}`);
            client.send(LobbyResponse.ERROR_MESSAGE, `방에 참여할 수 없습니다 - ${error}`);
        }
    }

    onChatRoomUpdate(chatRoomInfo: ChatRoomInfo) {
        if (this.state.chatRooms.has(chatRoomInfo.roomId)) {
            let chatRoom = this.state.chatRooms.get(chatRoomInfo.roomId)!;
            chatRoom.roomName = chatRoomInfo.roomName;
            chatRoom.roomOwner = chatRoomInfo.roomOwner;
            chatRoom.maxClients = chatRoomInfo.maxClients;
            chatRoom.isPrivate = chatRoomInfo.isPrivate;
            chatRoom.password = chatRoomInfo.password;
            chatRoom.players = chatRoomInfo.players;
            chatRoom.isPlaying = chatRoomInfo.isPlaying;

            console.log(`[Lobby] ChatRoom(${chatRoomInfo.roomId}) Updated`);
            //console.log(JSON.stringify(chatRoom, null, 2));
        } else {
            console.log(`[Lobby] ChatRoom(${chatRoomInfo.roomId}) Does Not Exist`);
        }
    }

    onChatRoomDispose(roomId: string) {
        if (this.state.chatRooms.has(roomId)) {
            this.state.chatRooms.delete(roomId);
            console.log(`[Lobby] ChatRoom(${roomId}) Disposed`);
            console.log(`[Lobby] Currently [${this.state.chatRooms.size}] ChatRoom Active In The Lobby`);
        } else {
            console.error(`[Lobby] ChatRoom(${roomId}) Does Not Exist`);
        }
    }

}
