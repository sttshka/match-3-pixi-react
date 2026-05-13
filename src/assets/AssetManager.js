import { Assets } from 'pixi.js';
import { manifest } from './manifest';
// Обёртка над Pixi v8 Assets API. Дополнительно репортит прогресс
// в глобальный стейт (через коллбек), чтобы LoadingScreen мог его показать.
export class AssetManager {
    initialized = false;
    async init() {
        if (this.initialized)
            return;
        // Регистрируем бандлы. Это позволяет потом грузить по имени.
        Assets.init({
            manifest: {
                bundles: manifest.bundles.map((b) => ({
                    name: b.name,
                    assets: b.assets,
                })),
            },
        });
        this.initialized = true;
    }
    async loadBundle(name, onProgress) {
        const bundle = manifest.bundles.find((b) => b.name === name);
        if (!bundle || bundle.assets.length === 0) {
            onProgress?.(1);
            return;
        }
        await Assets.loadBundle(name, (p) => onProgress?.(p));
    }
}
export const assetManager = new AssetManager();
