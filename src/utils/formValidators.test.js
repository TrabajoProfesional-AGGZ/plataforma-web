import { getDocNumberRules, validarFechaNacimiento, validarFechaNacimientoOpcional, esUrlHttpsValida, getImagenUrlRules, validarFortalezaPassword, getPasswordRules, MAX_LEN } from './formValidators';

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

  describe('validarFortalezaPassword', () => {
    test('rechaza contraseñas vacías o menores a 10 caracteres', () => {
      expect(validarFortalezaPassword('')).toBe('Mínimo 10 caracteres');
      expect(validarFortalezaPassword('Abc123')).toBe('Mínimo 10 caracteres');
    });

    test('rechaza contraseñas mayores a 128 caracteres', () => {
      const larga = `Ab1${'a'.repeat(127)}`;
      expect(validarFortalezaPassword(larga)).toBe('Máximo 128 caracteres');
    });

    test('rechaza contraseñas sin minúscula', () => {
      expect(validarFortalezaPassword('SECRETA123')).toBe('Debe incluir al menos una minúscula');
    });

    test('rechaza contraseñas sin mayúscula', () => {
      expect(validarFortalezaPassword('secreta123')).toBe('Debe incluir al menos una mayúscula');
    });

    test('rechaza contraseñas sin número', () => {
      expect(validarFortalezaPassword('SecretaAbc')).toBe('Debe incluir al menos un número');
    });

    test('acepta una contraseña fuerte', () => {
      expect(validarFortalezaPassword('Secreta123')).toBeUndefined();
    });
  });

  describe('getPasswordRules', () => {
    test('incluye required y validate', () => {
      const rules = getPasswordRules();
      expect(rules.required).toBe('La contraseña es requerida');
      expect(rules.validate).toBe(validarFortalezaPassword);
    });
  });

  describe('MAX_LEN', () => {
    test('define los límites usados por los forms', () => {
      expect(MAX_LEN.TITULO_NOTICIA).toBe(150);
      expect(MAX_LEN.CUERPO_NOTICIA).toBe(5000);
      expect(MAX_LEN.MENSAJE_ALERTA).toBe(500);
      expect(MAX_LEN.NRO_SOCIO).toBe(20);
      expect(MAX_LEN.URL_IMAGEN).toBe(2048);
      expect(MAX_LEN.PASSWORD).toBe(128);
    });
  });
});
