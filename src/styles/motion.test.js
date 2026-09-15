import { SPRING, EASE, slideVariants } from './motion';

describe('SPRING', () => {
  test('cada variante es un spring sin rebote salvo momentum y celebrate', () => {
    expect(SPRING.default).toEqual({ type: 'spring', bounce: 0, duration: 0.35 });
    expect(SPRING.quick).toEqual({ type: 'spring', bounce: 0, duration: 0.22 });
    expect(SPRING.momentum).toEqual({ type: 'spring', bounce: 0.2, duration: 0.4 });
    expect(SPRING.celebrate).toEqual({ type: 'spring', bounce: 0.25, duration: 0.5 });
  });
});

describe('EASE', () => {
  test('expone las tres curvas espejadas de --ease-* en tokens.css', () => {
    expect(EASE.out).toEqual([0.16, 1, 0.3, 1]);
    expect(EASE.in).toEqual([0.7, 0, 0.84, 0]);
    expect(EASE.inOut).toEqual([0.76, 0, 0.24, 1]);
  });
});

describe('slideVariants', () => {
  test('center no depende de la dirección', () => {
    expect(slideVariants.center).toEqual({ x: 0, opacity: 1 });
  });

  test('enter/exit devuelven desplazamiento positivo cuando la dirección es hacia adelante', () => {
    expect(slideVariants.enter(1)).toEqual({ x: 24, opacity: 0 });
    expect(slideVariants.exit(1)).toEqual({ x: -24, opacity: 0 });
  });

  test('enter/exit devuelven desplazamiento negativo cuando la dirección es hacia atrás', () => {
    expect(slideVariants.enter(-1)).toEqual({ x: -24, opacity: 0 });
    expect(slideVariants.exit(-1)).toEqual({ x: 24, opacity: 0 });
  });
});
