import { getDocNumberRules, validarFechaNacimiento, validarFechaNacimientoOpcional } from './formValidators';

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
});
