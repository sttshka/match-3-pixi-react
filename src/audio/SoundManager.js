import { sound } from '@pixi/sound';
// Тонкая обёртка над @pixi/sound. Регистрирует короткие сэмплы и
// проигрывает их по логическому имени. В шаблоне сэмплов нет —
// при добавлении файлов вызывайте register() при буте.
export class SoundManager {
    muted = false;
    volume = 0.6;
    setMuted(value) {
        this.muted = value;
        sound.muteAll();
        if (!value)
            sound.unmuteAll();
    }
    isMuted() {
        return this.muted;
    }
    setVolume(v) {
        this.volume = Math.max(0, Math.min(1, v));
        sound.volumeAll = this.volume;
    }
    register(alias, src) {
        if (!sound.exists(alias)) {
            sound.add(alias, src);
        }
    }
    play(alias, opts) {
        if (this.muted)
            return;
        if (!sound.exists(alias))
            return;
        sound.play(alias, { volume: opts?.volume ?? this.volume });
    }
}
export const soundManager = new SoundManager();
