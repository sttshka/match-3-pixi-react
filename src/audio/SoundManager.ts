import { sound } from '@pixi/sound';

// Тонкая обёртка над @pixi/sound. Регистрирует короткие сэмплы и
// проигрывает их по логическому имени. В шаблоне сэмплов нет —
// при добавлении файлов вызывайте register() при буте.
export class SoundManager {
  private muted = false;
  private volume = 0.6;

  setMuted(value: boolean): void {
    this.muted = value;
    sound.muteAll();
    if (!value) sound.unmuteAll();
  }

  isMuted(): boolean {
    return this.muted;
  }

  setVolume(v: number): void {
    this.volume = Math.max(0, Math.min(1, v));
    sound.volumeAll = this.volume;
  }

  register(alias: string, src: string): void {
    if (!sound.exists(alias)) {
      sound.add(alias, src);
    }
  }

  play(alias: string, opts?: { volume?: number }): void {
    if (this.muted) return;
    if (!sound.exists(alias)) return;
    sound.play(alias, { volume: opts?.volume ?? this.volume });
  }
}

export const soundManager = new SoundManager();
