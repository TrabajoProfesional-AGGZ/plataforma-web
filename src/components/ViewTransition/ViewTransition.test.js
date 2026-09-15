import { render, screen, fireEvent } from '@testing-library/react';
import { ViewTransition, scrollAlInicio } from './ViewTransition';

describe('ViewTransition', () => {
  test('renderiza el contenido de la vista actual', () => {
    render(
      <ViewTransition screenKey="lista">
        <p>Soy la lista</p>
      </ViewTransition>
    );
    expect(screen.getByText('Soy la lista')).toBeInTheDocument();
  });

  test('al cambiar screenKey remonta el contenido (el estado interno se pierde)', () => {
    const { rerender } = render(
      <ViewTransition screenKey="lista">
        <input aria-label="campo" defaultValue="" />
      </ViewTransition>
    );
    fireEvent.change(screen.getByLabelText('campo'), { target: { value: 'escrito' } });
    expect(screen.getByLabelText('campo')).toHaveValue('escrito');

    rerender(
      <ViewTransition screenKey="lista">
        <input aria-label="campo" defaultValue="" />
      </ViewTransition>
    );
    expect(screen.getByLabelText('campo')).toHaveValue('escrito');

    rerender(
      <ViewTransition screenKey="detalle">
        <input aria-label="campo" defaultValue="" />
      </ViewTransition>
    );
    expect(screen.getByLabelText('campo')).toHaveValue('');
  });
});

describe('scrollAlInicio', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('lleva .app-content al tope si existe', () => {
    const main = document.createElement('main');
    main.className = 'app-content';
    main.scrollTo = jest.fn();
    document.body.appendChild(main);

    scrollAlInicio();

    expect(main.scrollTo).toHaveBeenCalledWith({ top: 0 });
  });

  test('no falla si no hay .app-content ni scrollTo', () => {
    expect(() => scrollAlInicio()).not.toThrow();
    const main = document.createElement('main');
    main.className = 'app-content';
    main.scrollTo = undefined;
    document.body.appendChild(main);
    expect(() => scrollAlInicio()).not.toThrow();
  });
});
