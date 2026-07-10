import { render, screen } from '@testing-library/react';
import { User } from 'lucide-react';
import { Field, StyledInput } from './FormFields';

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
