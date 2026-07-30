import { createContext, useContext, type ReactNode } from 'react';

import {
  appContainer,
  type AppContainer,
} from '../../data/di/createAppContainer';

const AppContainerContext = createContext<AppContainer>(appContainer);

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AppContainerContext.Provider value={appContainer}>
      {children}
    </AppContainerContext.Provider>
  );
}

export function useAppContainer(): AppContainer {
  return useContext(AppContainerContext);
}

export function useUseCases() {
  return useAppContainer().useCases;
}
