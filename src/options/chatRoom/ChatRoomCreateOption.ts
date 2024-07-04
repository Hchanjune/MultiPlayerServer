
export interface ChatRoomCreateOption {
    roomName: string;
    initialOwner: string;
    maxClients: number;
    isPrivate: boolean;
    password: string;
}
