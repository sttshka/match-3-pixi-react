// Манифест ассетов. В шаблоне мы НЕ грузим реальные арт-ассеты,
// а используем placeholder-текстуры, которые рисуются Pixi Graphics в коде.
// Когда появятся атласы, добавляем их сюда и в AssetManager.
export const manifest = {
    bundles: [
        {
            name: 'preload',
            // В реальном проекте сюда попадут SpriteSheet/Texture/Sound.
            // Пример (закомментировано):
            // assets: [
            //   { alias: 'tiles', src: '/atlases/tiles.json' },
            //   { alias: 'sfx-swap', src: '/sfx/swap.mp3' },
            // ],
            assets: [],
        },
    ],
};
