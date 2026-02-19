// DEPRECATED shim — redirects ModalContext imports to the new DrawerContext
export {
  DrawerProvider as ModalProvider,
  useGlobalDrawer as useGlobalModal,
} from './DrawerContext';
