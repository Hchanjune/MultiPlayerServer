import { EventEmitter } from "events";

export class AsyncEventEmitter extends EventEmitter {
    emitAsync(event: string, ...args: any[]): Promise<any> {
        return new Promise((resolve, reject) => {
            console.log(`[AsyncEventEmitter] Emitting event: ${event}`);
            this.emit(event, ...args, resolve);
        });
    }
}
