import {Schema, type} from "@colyseus/schema";


export class ClientInfo extends Schema {

    @type("string")
    sessionId = "";
    @type("string")
    id = "";
    @type("string")
    name = "";

}
