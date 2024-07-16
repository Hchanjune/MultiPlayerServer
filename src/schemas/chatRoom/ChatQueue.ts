import {ArraySchema, Schema, type} from "@colyseus/schema";
import {ChatMessage} from "./ChatMessage";


export class ChatQueue extends Schema {
    @type({ array: ChatMessage })
    chatMessages = new ArraySchema<ChatMessage>();
}
