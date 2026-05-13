// Простая очередь асинхронных команд. Команды выполняются строго последовательно.
// Используется для оркестрации анимаций: swap → resolve → cascade → spawn → ...
// Каждая команда возвращает Promise, очередь ждёт его до запуска следующей.

export type Command = () => Promise<void>;

export class CommandQueue {
  private queue: Command[] = [];
  private running = false;

  push(cmd: Command): void {
    this.queue.push(cmd);
    void this.tick();
  }

  pushAll(cmds: Command[]): void {
    this.queue.push(...cmds);
    void this.tick();
  }

  clear(): void {
    this.queue.length = 0;
  }

  get isBusy(): boolean {
    return this.running || this.queue.length > 0;
  }

  private async tick(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      while (this.queue.length > 0) {
        const cmd = this.queue.shift()!;
        try {
          await cmd();
        } catch (err) {
          console.error('[CommandQueue] command failed', err);
        }
      }
    } finally {
      this.running = false;
    }
  }
}
