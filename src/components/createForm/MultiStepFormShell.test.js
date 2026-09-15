import { render, screen, fireEvent } from '@testing-library/react';
import { User, FileText } from 'lucide-react';
import { MultiStepFormShell } from './MultiStepFormShell';
import { FormStep } from './FormFields';

jest.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({ theme: 'light', toggleTheme: jest.fn(), logoSocio: 'logo.png', logoTexto: 'texto.png' }),
}));

const MULTI_STEPS = [
  { id: 1, label: 'Personal', icon: User },
  { id: 2, label: 'Documento', icon: FileText },
];

const SINGLE_STEP = [{ id: 1, label: 'Datos', icon: FileText }];

function baseProps(overrides = {}) {
  return {
    step: 1,
    submitted: false,
    onCancel: jest.fn(),
    onFormSubmit: jest.fn((e) => e.preventDefault()),
    title: 'Formulario',
    submitLabel: 'Guardar',
    ...overrides,
  };
}

describe('MultiStepFormShell', () => {
  test('formulario multi-paso muestra las burbujas de paso y la barra de progreso', () => {
    const { container } = render(
      <MultiStepFormShell {...baseProps({ steps: MULTI_STEPS })}>
        <div>Contenido</div>
      </MultiStepFormShell>
    );
    expect(screen.getByText(/paso 1 de 2/i)).toBeInTheDocument();
    expect(container.querySelector('.csf-steps')).toBeInTheDocument();
    expect(container.querySelector('.csf-progress')).toBeInTheDocument();
  });

  test('formulario de 1 solo paso oculta burbujas, barra de progreso y subtítulo "Paso X de Y"', () => {
    const { container } = render(
      <MultiStepFormShell {...baseProps({ steps: SINGLE_STEP })}>
        <div>Contenido</div>
      </MultiStepFormShell>
    );
    expect(screen.queryByText(/paso 1 de 1/i)).not.toBeInTheDocument();
    expect(container.querySelector('.csf-steps')).not.toBeInTheDocument();
    expect(container.querySelector('.csf-progress')).not.toBeInTheDocument();
  });

  test('muestra el botón de acción y llama a onSuccessAction', () => {
    const onSuccessAction = jest.fn();
    render(
      <MultiStepFormShell
        {...baseProps({
          steps: SINGLE_STEP,
          submitted: true,
          successTitle: '¡Listo!',
          successMessage: 'Se guardó correctamente.',
          onSuccessAction,
        })}
      >
        <div>Contenido</div>
      </MultiStepFormShell>
    );
    const boton = screen.getByRole('button', { name: 'Listo' });
    fireEvent.click(boton);
    expect(onSuccessAction).toHaveBeenCalledTimes(1);
  });

  test('sin onSuccessAction no muestra ningún botón en la pantalla de éxito', () => {
    render(
      <MultiStepFormShell
        {...baseProps({
          steps: SINGLE_STEP,
          submitted: true,
          successTitle: '¡Listo!',
          successMessage: 'Se guardó correctamente.',
        })}
      >
        <div>Contenido</div>
      </MultiStepFormShell>
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  test('onStepEntered llega al FormStep hijo y se dispara al terminar la animación de entrada', () => {
    const onStepEntered = jest.fn();
    render(
      <MultiStepFormShell {...baseProps({ steps: MULTI_STEPS, direction: 1, onStepEntered })}>
        <FormStep key="step1" direction={1}><p>Paso 1</p></FormStep>
      </MultiStepFormShell>
    );
    expect(onStepEntered).toHaveBeenCalledTimes(1);
  });

  test('con navGuard activo el botón de submit queda deshabilitado', () => {
    render(
      <MultiStepFormShell {...baseProps({ steps: SINGLE_STEP, navGuard: true })}>
        <div>Contenido</div>
      </MultiStepFormShell>
    );
    expect(screen.getByRole('button', { name: /guardar/i })).toBeDisabled();
  });
});
