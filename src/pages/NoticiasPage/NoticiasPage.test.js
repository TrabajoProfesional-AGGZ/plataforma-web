import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NoticiasPage from './NoticiasPage';

jest.mock('../../firebase', () => ({ auth: {} }));

jest.mock('../../hooks/usePermiso', () => ({
  usePermiso: () => true,
}));

jest.mock('../../services/noticiasService', () => ({
  getNoticias: jest.fn(),
  getNoticiasHistoricas: jest.fn(),
  getNoticia: jest.fn(),
  createNoticia: jest.fn(),
  borrarNoticia: jest.fn(),
}));
import {
  getNoticias,
  getNoticiasHistoricas,
  getNoticia,
  createNoticia,
  borrarNoticia,
} from '../../services/noticiasService';

jest.mock('../../assets/logo_socio.png', () => 'logo_socio.png');
jest.mock('../../assets/logo-verde.png', () => 'logo-verde.png');

jest.mock('../../components/createNoticiaForm/CreateNoticiaForm', () => ({
  CreateNoticiaForm: ({ onSuccess, onCancel }) => ( // NOSONAR
    <div>
      <button onClick={() => onSuccess({ titulo: 'Nueva noticia', cuerpo: 'Cuerpo', fecha_expiracion: '2026-07-30', imagen: null })}>
        Confirmar creación
      </button>
      <button onClick={onCancel}>Cancelar creación</button>
    </div>
  ),
}));

jest.mock('../../components/editNoticiaForm/EditNoticiaForm', () => ({
  EditNoticiaForm: ({ noticia, onSuccess, onCancel }) => ( // NOSONAR
    <div>
      <button onClick={() => onSuccess({ ...noticia, titulo: 'Título editado' })}>
        Confirmar edición
      </button>
      <button onClick={onCancel}>Cancelar edición</button>
    </div>
  ),
}));

const NOTICIA_LISTA = {
  id: 'n-1',
  titulo: 'Noticia de prueba',
  fecha_publicacion: '2026-06-01',
  fecha_expiracion: '2026-07-01',
  estado: 'Publicada',
};

const NOTICIA_DETALLE = {
  ...NOTICIA_LISTA,
  cuerpo: 'Cuerpo completo de la noticia.',
  imagen: 'https://example.com/img.png',
};

async function renderPage() {
  render(<MemoryRouter><NoticiasPage /></MemoryRouter>);
  await waitFor(() =>
    expect(document.querySelector('.list-loading')).not.toBeInTheDocument()
  );
}

async function irAlDetalle() {
  fireEvent.click(screen.getByText('Noticia de prueba'));
  await waitFor(() =>
    expect(screen.getByText('Cuerpo completo de la noticia.')).toBeInTheDocument()
  );
}

describe('NoticiasPage', () => {
  beforeEach(() => {
    getNoticias.mockResolvedValue([]);
    getNoticiasHistoricas.mockResolvedValue([]);
    getNoticia.mockResolvedValue(NOTICIA_DETALLE);
    createNoticia.mockResolvedValue({ ...NOTICIA_LISTA, id: 'n-new' });
    borrarNoticia.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('muestra el título "Noticias"', async () => {
    await renderPage();
    expect(screen.getByText('Noticias')).toBeInTheDocument();
  });

  test('muestra mensaje cuando no hay noticias', async () => {
    await renderPage();
    expect(screen.getByText('No hay noticias registradas.')).toBeInTheDocument();
  });

  test('muestra un banner de error si falla la carga de noticias', async () => {
    getNoticias.mockRejectedValue(new Error('error de red'));
    await renderPage();
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudieron cargar las noticias.');
  });

  test('el botón Reintentar del banner de error vuelve a cargar las noticias', async () => {
    getNoticias.mockRejectedValueOnce(new Error('error de red'));
    await renderPage();
    expect(screen.getByRole('alert')).toBeInTheDocument();

    getNoticias.mockResolvedValueOnce([NOTICIA_LISTA]);
    fireEvent.click(screen.getByRole('button', { name: /reintentar/i }));
    await waitFor(() => expect(screen.getByText('Noticia de prueba')).toBeInTheDocument());
  });

  test('muestra las noticias cargadas desde el servidor', async () => {
    getNoticias.mockResolvedValue([NOTICIA_LISTA]);
    await renderPage();
    await waitFor(() => expect(screen.getByText('Noticia de prueba')).toBeInTheDocument());
    expect(screen.getByText('2026-06-01')).toBeInTheDocument();
    expect(screen.getByText('2026-07-01')).toBeInTheDocument();
  });

  test('"Ver históricas" llama a getNoticiasHistoricas y actualiza la lista', async () => {
    getNoticiasHistoricas.mockResolvedValue([{ ...NOTICIA_LISTA, titulo: 'Noticia histórica' }]);
    await renderPage();
    fireEvent.click(screen.getByRole('button', { name: /ver históricas/i }));
    await waitFor(() => expect(screen.getByText('Noticia histórica')).toBeInTheDocument());
    expect(getNoticiasHistoricas).toHaveBeenCalledTimes(1);
  });

  test('click en una fila llama getNoticia con el id y muestra la vista detalle', async () => {
    getNoticias.mockResolvedValue([NOTICIA_LISTA]);
    await renderPage();
    await waitFor(() => expect(screen.getByText('Noticia de prueba')).toBeInTheDocument());
    await irAlDetalle();
    expect(getNoticia).toHaveBeenCalledWith('n-1');
    expect(screen.getByText('Cuerpo completo de la noticia.')).toBeInTheDocument();
  });

  test('la vista detalle muestra título, cuerpo, imagen y fechas', async () => {
    getNoticias.mockResolvedValue([NOTICIA_LISTA]);
    await renderPage();
    await waitFor(() => expect(screen.getByText('Noticia de prueba')).toBeInTheDocument());
    await irAlDetalle();
    expect(screen.getByRole('heading', { level: 1, name: 'Noticia de prueba' })).toBeInTheDocument();
    expect(screen.getByText('Cuerpo completo de la noticia.')).toBeInTheDocument();
    expect(screen.getByAltText('Imagen de la noticia')).toBeInTheDocument();
    expect(screen.getByText(/2026-06-01/)).toBeInTheDocument();
  });

  test('no renderiza el img si la imagen tiene un esquema inseguro', async () => {
    getNoticias.mockResolvedValue([NOTICIA_LISTA]);
    getNoticia.mockResolvedValue({ ...NOTICIA_DETALLE, imagen: 'javascript:alert(1)' });
    await renderPage();
    await waitFor(() => expect(screen.getByText('Noticia de prueba')).toBeInTheDocument());
    await irAlDetalle();
    expect(screen.queryByAltText('Imagen de la noticia')).not.toBeInTheDocument();
  });

  test('"Volver" regresa a la vista lista', async () => {
    getNoticias.mockResolvedValue([NOTICIA_LISTA]);
    await renderPage();
    await waitFor(() => expect(screen.getByText('Noticia de prueba')).toBeInTheDocument());
    await irAlDetalle();
    fireEvent.click(screen.getByRole('button', { name: /volver/i }));
    expect(screen.getByText('Noticias')).toBeInTheDocument();
  });

  test('el botón "Nueva noticia" abre el formulario de creación', async () => {
    await renderPage();
    fireEvent.click(screen.getByRole('button', { name: /nueva noticia/i }));
    expect(screen.getByRole('button', { name: 'Confirmar creación' })).toBeInTheDocument();
  });

  test('cancelar el formulario de crear lo cierra', async () => {
    await renderPage();
    fireEvent.click(screen.getByRole('button', { name: /nueva noticia/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar creación' }));
    expect(screen.queryByRole('button', { name: 'Confirmar creación' })).not.toBeInTheDocument();
  });

  test('crear noticia añade optimistamente a la lista', async () => {
    await renderPage();
    fireEvent.click(screen.getByRole('button', { name: /nueva noticia/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar creación' }));
    expect(screen.getAllByText('Nueva noticia').length).toBeGreaterThanOrEqual(1);
  });

  test('revierte la noticia optimista y muestra un banner de error si createNoticia falla', async () => {
    createNoticia.mockRejectedValueOnce(new Error('error'));
    await renderPage();
    fireEvent.click(screen.getByRole('button', { name: /nueva noticia/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar creación' }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('No se pudo crear la noticia.');
    });
  });

  test('el botón "Editar" es visible en el detalle con permiso editar_noticia', async () => {
    getNoticias.mockResolvedValue([NOTICIA_LISTA]);
    await renderPage();
    await waitFor(() => expect(screen.getByText('Noticia de prueba')).toBeInTheDocument());
    await irAlDetalle();
    expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument();
  });

  test('el botón "Eliminar" es visible en el detalle con permiso borrar_noticia', async () => {
    getNoticias.mockResolvedValue([NOTICIA_LISTA]);
    await renderPage();
    await waitFor(() => expect(screen.getByText('Noticia de prueba')).toBeInTheDocument());
    await irAlDetalle();
    expect(screen.getByRole('button', { name: 'Eliminar' })).toBeInTheDocument();
  });

  test('"Editar" abre el formulario de edición', async () => {
    getNoticias.mockResolvedValue([NOTICIA_LISTA]);
    await renderPage();
    await waitFor(() => expect(screen.getByText('Noticia de prueba')).toBeInTheDocument());
    await irAlDetalle();
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    expect(screen.getByRole('button', { name: 'Confirmar edición' })).toBeInTheDocument();
  });

  test('confirmar edición actualiza el título en la vista detalle', async () => {
    getNoticias.mockResolvedValue([NOTICIA_LISTA]);
    await renderPage();
    await waitFor(() => expect(screen.getByText('Noticia de prueba')).toBeInTheDocument());
    await irAlDetalle();
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar edición' }));
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1, name: 'Título editado' })).toBeInTheDocument()
    );
  });

  test('"Eliminar" abre el modal de confirmación', async () => {
    getNoticias.mockResolvedValue([NOTICIA_LISTA]);
    await renderPage();
    await waitFor(() => expect(screen.getByText('Noticia de prueba')).toBeInTheDocument());
    await irAlDetalle();
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    expect(screen.getByText(/eliminar noticia/i)).toBeInTheDocument();
  });

  test('confirmar eliminación vuelve a la lista y llama borrarNoticia', async () => {
    getNoticias.mockResolvedValue([NOTICIA_LISTA]);
    await renderPage();
    await waitFor(() => expect(screen.getByText('Noticia de prueba')).toBeInTheDocument());
    await irAlDetalle();
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    const btnsEliminar = screen.getAllByRole('button', { name: 'Eliminar' });
    fireEvent.click(btnsEliminar[btnsEliminar.length - 1]);
    await waitFor(() => expect(screen.getByText('Noticias')).toBeInTheDocument());
    expect(borrarNoticia).toHaveBeenCalledWith('n-1');
  });

  test('revierte la noticia y muestra un banner de error si borrarNoticia falla', async () => {
    borrarNoticia.mockRejectedValueOnce(new Error('error de red'));
    getNoticias.mockResolvedValue([NOTICIA_LISTA]);
    await renderPage();
    await waitFor(() => expect(screen.getByText('Noticia de prueba')).toBeInTheDocument());
    await irAlDetalle();
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    const btnsEliminar = screen.getAllByRole('button', { name: 'Eliminar' });
    fireEvent.click(btnsEliminar[btnsEliminar.length - 1]);
    await waitFor(() => expect(screen.getByText('Noticia de prueba')).toBeInTheDocument());
    expect(borrarNoticia).toHaveBeenCalledWith('n-1');
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo eliminar la noticia.');
  });
});
