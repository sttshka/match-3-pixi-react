import { describe, expect, it, vi } from 'vitest';
import { CommandQueue } from '@game/commands/CommandQueue';

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

describe('CommandQueue', () => {
  it('исполняет команды строго последовательно', async () => {
    const queue = new CommandQueue();
    const events: number[] = [];
    queue.push(async () => {
      await wait(20);
      events.push(1);
    });
    queue.push(async () => {
      events.push(2);
    });
    await wait(60);
    expect(events).toEqual([1, 2]);
  });

  it('isBusy=true пока есть команды в работе', async () => {
    const queue = new CommandQueue();
    queue.push(async () => {
      await wait(15);
    });
    expect(queue.isBusy).toBe(true);
    await wait(40);
    expect(queue.isBusy).toBe(false);
  });

  it('clear() сбрасывает невыполненные команды', async () => {
    const queue = new CommandQueue();
    const events: number[] = [];
    queue.push(async () => {
      await wait(20);
      events.push(1);
    });
    queue.push(async () => {
      events.push(2);
    });
    queue.clear();
    await wait(60);
    // Первая команда уже стартовала, её прервать нельзя — но вторая не запустится.
    expect(events).toEqual([1]);
  });

  it('ошибка в одной команде не блокирует очередь', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const queue = new CommandQueue();
    const events: string[] = [];
    queue.push(async () => {
      throw new Error('boom');
    });
    queue.push(async () => {
      events.push('after-error');
    });
    await wait(40);
    expect(events).toEqual(['after-error']);
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it('pushAll исполняет все команды в порядке передачи', async () => {
    const queue = new CommandQueue();
    const events: number[] = [];
    queue.pushAll([
      async () => {
        await wait(10);
        events.push(1);
      },
      async () => {
        events.push(2);
      },
      async () => {
        await wait(5);
        events.push(3);
      },
    ]);
    await wait(80);
    expect(events).toEqual([1, 2, 3]);
  });
});
