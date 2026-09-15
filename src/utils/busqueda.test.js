import { normalizarBusqueda } from './busqueda';

describe('normalizarBusqueda', () => {
  test('pasa a minúsculas y quita tildes', () => {
    expect(normalizarBusqueda('Pérez')).toBe('perez');
    expect(normalizarBusqueda('GARCÍA Ñandú')).toBe('garcia nandu');
  });

  test('recorta espacios sobrantes', () => {
    expect(normalizarBusqueda('  juan  ')).toBe('juan');
  });

  test('tolera valores nulos o no string', () => {
    expect(normalizarBusqueda(null)).toBe('');
    expect(normalizarBusqueda(undefined)).toBe('');
    expect(normalizarBusqueda(1001)).toBe('1001');
  });
});
