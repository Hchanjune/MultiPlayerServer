import {ArraySchema, MapSchema, Schema, type} from "@colyseus/schema";
import {ChatRoomPlayer} from "../schemas/chatRoom/ChatRoomPlayer";
import {ClientInfo} from "../schemas/globals/ClientInfo";


export class ChatRoomState extends Schema {
    @type("string")
    roomId = "";
    @type("string")
    roomName = "";
    @type("string")
    roomOwner = "";
    @type("uint8")
    maxClients = 10;
    @type("boolean")
    isPrivate = false;
    @type("string")
    password = "";
    @type({ map : ChatRoomPlayer })
    chatRoomPlayers = new MapSchema<ChatRoomPlayer>();
    @type( { array : ChatRoomPlayer})
    redTeam = new ArraySchema<ChatRoomPlayer>();
    @type( { array : ChatRoomPlayer})
    blackTeam = new ArraySchema<ChatRoomPlayer>();
    @type("boolean")
    isPlaying = false;


    addChatRoomPlayer(key: string, clientInfo: ClientInfo): ChatRoomPlayer {
        try {
            const player = new ChatRoomPlayer().assign({
                lobbySessionId: clientInfo.sessionId,
                sessionId: key,
                id: clientInfo.id,
                name: clientInfo.name
            });
            this.chatRoomPlayers.set(key, player);
            return player;
        } catch (error) {
            console.error("Error adding player:", error);
            throw error;
        }
    }

    removeChatRoomPlayer(key: string) {
        this.removePlayerFromCurrentTeam(this.chatRoomPlayers.get(key)!);
        return this.chatRoomPlayers.delete(key);
    }

    selectChatRoomPlayerByKey(key: string): ChatRoomPlayer {
        return this.chatRoomPlayers.get(key)!;
    }

    selectChatRoomPlayerById(id: string): ChatRoomPlayer | undefined {
        let targetPlayer: ChatRoomPlayer | undefined;
        this.chatRoomPlayers.forEach((player, key) => {
            if (player.id === id) {
                targetPlayer = player;
            }
        });
        return targetPlayer;
    }

    autoSetPlayerTeam(player: ChatRoomPlayer) {
        if (this.redTeam.length <= this.blackTeam.length) {
            this.redTeam.push(player);
            player.team = "RED";
        } else {
            this.blackTeam.push(player);
            player.team = "BLACK";
        }
    }

    setPlayerTeam(player: ChatRoomPlayer, teamColor: string) {
        this.removePlayerFromCurrentTeam(player);

        switch (teamColor) {
            case "RED":
                if (this.redTeam.length < this.maxClients/2) {
                    this.redTeam.push(player);
                    player.team = "RED";
                } else {
                    throw new Error("Red team is full");
                }
                break;
            case "BLACK":
                if (this.blackTeam.length < this.maxClients/2) {
                    this.blackTeam.push(player);
                    player.team = "BLACK";
                } else {
                    throw new Error("Black team is full");
                }
                break;
            default:
                throw new Error("Invalid team color");
        }
    }

    changePlayerTeam(player: ChatRoomPlayer, newTeamColor: string): boolean {
        if (player.team === newTeamColor) {
            console.log(`Player is already in the ${newTeamColor} team`);
            return false;
        }

        this.removePlayerFromCurrentTeam(player);

        switch (newTeamColor) {
            case "RED":
                if (this.redTeam.length < this.maxClients/2) {
                    this.redTeam.push(player);
                    player.team = "RED";
                    return true;
                } else {
                    return false;
                    throw new Error("Red team is full");
                }
            case "BLACK":
                if (this.blackTeam.length < this.maxClients/2) {
                    this.blackTeam.push(player);
                    player.team = "BLACK";
                    return true;
                } else {
                    return false;
                    throw new Error("Black team is full");
                }
            default:
                return false;
                throw new Error("Invalid team color");
        }
    }

    removePlayerFromCurrentTeam(player: ChatRoomPlayer) {
        if (player.team === "RED") {
            const index = this.redTeam.findIndex(p => p.sessionId === player.sessionId);
            if (index !== -1) {
                this.redTeam.splice(index, 1);
            }
        } else if (player.team === "BLACK") {
            const index = this.blackTeam.findIndex(p => p.sessionId === player.sessionId);
            if (index !== -1) {
                this.blackTeam.splice(index, 1);
            }
        }
        player.team = "";
    }


    isAllPlayersReady() {
        let allReady = true;
        this.chatRoomPlayers.forEach((player, key) => {
            if (player.id !== this.roomOwner && !player.isReady) {
                allReady = false;
            }
        });
        return allReady;
    }
}
