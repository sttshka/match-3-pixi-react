import { extend } from '@pixi/react';
import { Container, Graphics, Sprite, Text, ParticleContainer } from 'pixi.js';

// @pixijs/react v8 требует явной регистрации Pixi-классов, которые мы хотим
// использовать в JSX. После extend() в JSX доступны элементы в lowercase
// с префиксом pixi: <pixiContainer/>, <pixiGraphics/>, <pixiSprite/>, ...
extend({
  Container,
  Graphics,
  Sprite,
  Text,
  ParticleContainer,
});
