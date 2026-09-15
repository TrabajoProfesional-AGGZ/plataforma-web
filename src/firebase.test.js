const mockSetPersistence = jest.fn().mockResolvedValue();
const mockGetAuth = jest.fn(() => ({}));
const mockInitializeApp = jest.fn(() => ({}));
const mockBrowserSessionPersistence = { type: 'SESSION' };

jest.mock('firebase/app', () => ({
  initializeApp: (...args) => mockInitializeApp(...args),
}));

jest.mock('firebase/auth', () => ({
  getAuth: (...args) => mockGetAuth(...args),
  setPersistence: (...args) => mockSetPersistence(...args),
  browserSessionPersistence: mockBrowserSessionPersistence,
}));

describe('firebase', () => {
  test('fuerza sesión por pestaña (browserSessionPersistence) en vez del default persistente de Firebase', async () => {
    await import('./firebase');

    expect(mockSetPersistence).toHaveBeenCalledWith(
      mockGetAuth.mock.results[0].value,
      mockBrowserSessionPersistence
    );
  });
});
