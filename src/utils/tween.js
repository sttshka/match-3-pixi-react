import { gsap } from 'gsap';
function runTween(target, vars) {
    return new Promise((resolve) => {
        gsap.to(target, { ...vars, onComplete: resolve });
    });
}
export function tweenTo(target, props) {
    const base = {
        duration: props.duration,
        ease: props.ease ?? 'power2.out',
    };
    if (props.delay)
        base.delay = props.delay;
    if (props.x !== undefined)
        base.x = props.x;
    if (props.y !== undefined)
        base.y = props.y;
    if (props.alpha !== undefined)
        base.alpha = props.alpha;
    if (props.rotation !== undefined)
        base.rotation = props.rotation;
    const promises = [];
    // Если задан хоть один линейный параметр — запускаем основной tween.
    if (base.x !== undefined ||
        base.y !== undefined ||
        base.alpha !== undefined ||
        base.rotation !== undefined) {
        promises.push(runTween(target, base));
    }
    // Если задан scale и у target есть .scale — отдельный tween на .scale.
    if (props.scale !== undefined && target?.scale && typeof target.scale.set === 'function') {
        promises.push(runTween(target.scale, {
            x: props.scale,
            y: props.scale,
            duration: props.duration,
            ease: props.ease ?? 'power2.out',
            delay: props.delay ?? 0,
        }));
    }
    // Если не указано ни одного свойства, просто ждём duration.
    if (promises.length === 0) {
        promises.push(new Promise((resolve) => {
            gsap.delayedCall((props.delay ?? 0) + props.duration, resolve);
        }));
    }
    return Promise.all(promises).then(() => undefined);
}
// Параллельное ожидание набора tween'ов.
export function tweenAll(targets) {
    return Promise.all(targets.map((t) => tweenTo(t.target, t.props))).then(() => undefined);
}
