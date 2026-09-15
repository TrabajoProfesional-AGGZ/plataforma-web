import { createContext } from 'react';

/**
 * Callback que `MultiStepFormShell` provee a cada `FormStep` para avisar que
 * el paso terminó su animación de entrada (`onStepEntered` → `finNavGuard`).
 * Vive en su propio módulo para que `FormFields` y `MultiStepFormShell` no se
 * importen mutuamente.
 */
export const FormStepContext = createContext(null);
