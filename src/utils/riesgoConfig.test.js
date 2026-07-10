import { riesgoConfig, RIESGO_CONFIG, RIESGO_DEFAULT } from './riesgoConfig';

describe('riesgoConfig', () => {
  test('devuelve la config para "Alto"', () => {
    expect(riesgoConfig('Alto')).toEqual(RIESGO_CONFIG.Alto);
  });

  test('devuelve la config para "Medio"', () => {
    expect(riesgoConfig('Medio')).toEqual(RIESGO_CONFIG.Medio);
  });

  test('devuelve la config para "Bajo"', () => {
    expect(riesgoConfig('Bajo')).toEqual(RIESGO_CONFIG.Bajo);
  });

  test('normaliza mayúsculas/minúsculas (ej: "ALTO", "bajo")', () => {
    expect(riesgoConfig('ALTO')).toEqual(RIESGO_CONFIG.Alto);
    expect(riesgoConfig('bajo')).toEqual(RIESGO_CONFIG.Bajo);
  });

  test('devuelve el default ante un valor desconocido', () => {
    expect(riesgoConfig('Inexistente')).toEqual(RIESGO_DEFAULT);
  });

  test('devuelve el default ante null/undefined', () => {
    expect(riesgoConfig(null)).toEqual(RIESGO_DEFAULT);
    expect(riesgoConfig(undefined)).toEqual(RIESGO_DEFAULT);
  });
});
