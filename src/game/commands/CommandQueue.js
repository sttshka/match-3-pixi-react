// Простая очередь асинхронных команд. Команды выполняются строго последовательно.
// Используется для оркестрации анимаций: swap → resolve → cascade → spawn → ...
// Каждая команда возвращает Promise, очередь ждёт его до запуска следующей.
export class CommandQueue {
    queue = [];
    running = false;
    push(cmd) {
        this.queue.push(cmd);
        void this.tick();
    }
    pushAll(cmds) {
        this.queue.push(...cmds);
        void this.tick();
    }
    clear() {
        this.queue.length = 0;
    }
    get isBusy() {
        return this.running || this.queue.length > 0;
    }
    async tick() {
        if (this.running)
            return;
        this.running = true;
        try {
            while (this.queue.length > 0) {
                const cmd = this.queue.shift();
                try {
                    await cmd();
                }
                catch (err) {
                    console.error('[CommandQueue] command failed', err);
                }
            }
        }
        finally {
            this.running = false;
        }
    }
}
