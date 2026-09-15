import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { User } from 'lucide-react';
import { Field, StyledInput, StyledSelect, FormStep } from './FormFields';
import { FormStepContext } from './FormStepContext';

// Envuelve el mock compartido de framer-motion para capturar el último
// `onAnimationComplete` y poder dispararlo a mano con "exit"/"center".
let mockUltimoOnAnimationComplete = null;
jest.mock('framer-motion', () => {
  const React = require('react');
  const compartido = jest.requireActual('../../../__mocks__/framer-motion');
  const cache = {};
  const motion = new Proxy({}, {
    get: (_, tag) => {
      if (!cache[tag]) {
        const Base = compartido.motion[tag];
        cache[tag] = ({ onAnimationComplete, ...props }) => {
          if (onAnimationComplete) mockUltimoOnAnimationComplete = onAnimationComplete;
          return React.createElement(Base, { ...props, onAnimationComplete });
        };
      }
      return cache[tag];
    },
  });
  return { ...compartido, motion };
});

describe('Field', () => {
  test('genera un id a partir del label cuando no se pasa uno explícito', () => {
    render(
      <Field label="Nombre completo" icon={User}>
        <StyledInput placeholder="María" />
      </Field>
    );
    const input = screen.getByPlaceholderText('María');
    expect(input).toHaveAttribute('id', 'field-nombre-completo');
    expect(screen.getByText('Nombre completo')).toHaveAttribute('for', 'field-nombre-completo');
  });

  test('respeta un id explícito si se pasa como prop', () => {
    render(
      <Field id="mi-id" label="Nombre" icon={User}>
        <StyledInput placeholder="María" />
      </Field>
    );
    expect(screen.getByPlaceholderText('María')).toHaveAttribute('id', 'mi-id');
  });

  test('sin error no setea aria-invalid ni aria-describedby', () => {
    render(
      <Field label="Nombre" icon={User}>
        <StyledInput placeholder="María" />
      </Field>
    );
    const input = screen.getByPlaceholderText('María');
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(input).not.toHaveAttribute('aria-describedby');
  });

  test('con error, wire aria-invalid y aria-describedby hacia el mensaje', () => {
    render(
      <Field label="Nombre" icon={User} error="Requerido">
        <StyledInput placeholder="María" />
      </Field>
    );
    const input = screen.getByPlaceholderText('María');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    const errorMessage = screen.getByRole('alert');
    expect(input.getAttribute('aria-describedby')).toBe(errorMessage.id);
    expect(errorMessage).toHaveTextContent('Requerido');
  });
});

describe('StyledSelect', () => {
  function renderSelect(props = {}) {
    return render(
      <StyledSelect aria-label="Categoría" {...props}>
        <option value="">Seleccionar...</option>
        <option value="a">Opción A</option>
        <option value="b">Opción B</option>
      </StyledSelect>
    );
  }

  test('clickear una opción del listbox la selecciona y cierra el popover', async () => {
    const { container } = renderSelect();
    fireEvent.click(screen.getByRole('button', { name: /seleccionar/i }));
    fireEvent.click(within(screen.getByRole('listbox')).getByRole('option', { name: 'Opción B' }));

    const hiddenSelect = container.querySelector('select');
    expect(hiddenSelect.value).toBe('b');
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  test('pasar el mouse por una opción la resalta', () => {
    renderSelect();
    fireEvent.click(screen.getByRole('button', { name: /seleccionar/i }));
    const opcionA = within(screen.getByRole('listbox')).getByRole('option', { name: 'Opción A' });

    fireEvent.mouseEnter(opcionA);

    expect(opcionA.className).toMatch(/highlighted/);
  });

  test('clickear una opción deshabilitada no selecciona nada', () => {
    const { container } = render(
      <StyledSelect aria-label="Categoría">
        <option value="">Seleccionar...</option>
        <option value="a" disabled>Opción A</option>
      </StyledSelect>
    );
    fireEvent.click(screen.getByRole('button', { name: /seleccionar/i }));
    fireEvent.click(within(screen.getByRole('listbox')).getByRole('option', { name: 'Opción A' }));

    const hiddenSelect = container.querySelector('select');
    expect(hiddenSelect.value).toBe('');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  test('flecha abajo con el trigger cerrado lo abre', () => {
    renderSelect();
    const trigger = screen.getByRole('button', { name: /seleccionar/i });

    fireEvent.keyDown(trigger, { key: 'ArrowDown' });

    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  test('flecha abajo/arriba recorren las opciones y Enter confirma la resaltada', async () => {
    const { container } = renderSelect();
    const trigger = screen.getByRole('button', { name: /seleccionar/i });
    fireEvent.click(trigger);

    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    fireEvent.keyDown(trigger, { key: 'ArrowUp' });
    fireEvent.keyDown(trigger, { key: 'Enter' });

    const hiddenSelect = container.querySelector('select');
    expect(hiddenSelect.value).toBe('a');
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  test('flecha arriba no baja el índice resaltado por debajo de cero', async () => {
    renderSelect();
    const trigger = screen.getByRole('button', { name: /seleccionar/i });
    fireEvent.click(trigger);

    fireEvent.keyDown(trigger, { key: 'ArrowUp' });
    fireEvent.keyDown(trigger, { key: ' ' });

    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  test('reabrir el select con un valor ya elegido resalta esa opción', () => {
    const { container } = renderSelect();
    const trigger = screen.getByRole('button', { name: /seleccionar/i });
    fireEvent.click(trigger);
    fireEvent.click(within(screen.getByRole('listbox')).getByRole('option', { name: 'Opción B' }));

    fireEvent.click(container.querySelector('.csf-dropdown-trigger'));

    expect(within(screen.getByRole('listbox')).getByRole('option', { name: 'Opción B' }))
      .toHaveClass('csf-dropdown-option--highlighted');
  });
});

describe('FormStep', () => {
  beforeEach(() => { mockUltimoOnAnimationComplete = null; });

  test('renderiza el contenido del paso', () => {
    render(<FormStep direction={1}><p>Campos del paso</p></FormStep>);
    expect(screen.getByText('Campos del paso')).toBeInTheDocument();
  });

  test('dispara onEntered cuando termina la animación de entrada', () => {
    const onEntered = jest.fn();
    render(<FormStep direction={1} onEntered={onEntered}><p>Paso</p></FormStep>);
    expect(onEntered).toHaveBeenCalledTimes(1);
  });

  test('no dispara onEntered cuando la que termina es la animación de salida', () => {
    const onEntered = jest.fn();
    render(<FormStep direction={1} onEntered={onEntered}><p>Paso</p></FormStep>);
    onEntered.mockClear();

    mockUltimoOnAnimationComplete('exit');
    expect(onEntered).not.toHaveBeenCalled();

    mockUltimoOnAnimationComplete('center');
    expect(onEntered).toHaveBeenCalledTimes(1);
  });

  test('sin onEntered usa el callback que provee FormStepContext', () => {
    const desdeShell = jest.fn();
    render(
      <FormStepContext.Provider value={desdeShell}>
        <FormStep direction={1}><p>Paso</p></FormStep>
      </FormStepContext.Provider>
    );
    expect(desdeShell).toHaveBeenCalledTimes(1);
  });

  test('onEntered explícito tiene prioridad sobre el del contexto', () => {
    const desdeShell = jest.fn();
    const propio = jest.fn();
    render(
      <FormStepContext.Provider value={desdeShell}>
        <FormStep direction={1} onEntered={propio}><p>Paso</p></FormStep>
      </FormStepContext.Provider>
    );
    expect(propio).toHaveBeenCalledTimes(1);
    expect(desdeShell).not.toHaveBeenCalled();
  });

  test('sin onEntered ni contexto no rompe al terminar la animación', () => {
    render(<FormStep direction={1}><p>Paso</p></FormStep>);
    expect(() => mockUltimoOnAnimationComplete('center')).not.toThrow();
  });
});
