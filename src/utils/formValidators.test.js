import { getDocNumberRules, validarFechaNacimiento, validarFechaNacimientoOpcional, esUrlHttpsValida, getImagenUrlRules } from './formValidators';

describe('formValidators', () => {
  describe('validarFechaNacimiento', () => {
    test('retorna undefined para una fecha válida', () => {
      expect(validarFechaNacimiento('1990-05-20')).toBeUndefined();
    });

    test('retorna error si la fecha es inválida', () => {
      expect(validarFechaNacimiento('no-es-fecha')).toBe('Fecha inválida');
    });

    test('retorna error si la fecha es futura', () => {
      const manana = new Date();
      manana.setDate(manana.getDate() + 1);
      const str = manana.toISOString().split('T')[0];
      expect(validarFechaNacimiento(str)).toBe('La fecha no puede ser futura');
    });

    test('retorna error si la fecha tiene más de 120 años', () => {
      const antigua = new Date();
      antigua.setFullYear(antigua.getFullYear() - 121);
      const str = antigua.toISOString().split('T')[0];
      expect(validarFechaNacimiento(str)).toBe('Fecha inválida');
    });
  });

  describe('validarFechaNacimientoOpcional', () => {
    test('retorna undefined si el valor está vacío', () => {
      expect(validarFechaNacimientoOpcional('')).toBeUndefined();
      expect(validarFechaNacimientoOpcional(null)).toBeUndefined();
    });

    test('delega en validarFechaNacimiento si hay valor', () => {
      expect(validarFechaNacimientoOpcional('no-es-fecha')).toBe('Fecha inválida');
      expect(validarFechaNacimientoOpcional('1990-05-20')).toBeUndefined();
    });
  });

  describe('getDocNumberRules', () => {
    test('incluye required por defecto', () => {
      const rules = getDocNumberRules();
      expect(rules.required).toBe('El número es requerido');
    });

    test('no incluye required cuando se indica required=false', () => {
      const rules = getDocNumberRules({ required: false });
      expect(rules.required).toBeUndefined();
    });

    test('setValueAs convierte a mayúsculas', () => {
      const rules = getDocNumberRules();
      expect(rules.setValueAs('abc123')).toBe('ABC123');
    });
  });

  describe('esUrlHttpsValida', () => {
    test('acepta vacío por ser opcional', () => {
      expect(esUrlHttpsValida('')).toBe(true);
      expect(esUrlHttpsValida(undefined)).toBe(true);
    });

    test('acepta una url https', () => {
      expect(esUrlHttpsValida('https://cdn.club.com/foto.jpg')).toBe(true);
    });

    test('rechaza una url http', () => {
      expect(esUrlHttpsValida('http://cdn.club.com/foto.jpg')).toBe('La URL debe usar https://');
    });

    test('rechaza data:', () => {
      expect(esUrlHttpsValida('data:image/png;base64,abc123')).toBe('La URL debe usar https://');
    });

    test('rechaza javascript:', () => {
      expect(esUrlHttpsValida('javascript:alert(1)')).toBe('La URL debe usar https://');
    });

    test('rechaza una url inválida', () => {
      expect(esUrlHttpsValida('basura')).toBe('URL inválida');
    });
  });

  describe('getImagenUrlRules', () => {
    test('incluye validate y maxLength de 2048', () => {
      const rules = getImagenUrlRules();
      expect(rules.validate).toBe(esUrlHttpsValida);
      expect(rules.maxLength.value).toBe(2048);
    });
  });
});
