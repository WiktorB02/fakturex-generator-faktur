export const useToast = () => {
  return {
    success: (message, title = 'Sukces') => {
      window.dispatchEvent(new CustomEvent('toast-add', {
        detail: { message, title, type: 'success' }
      }))
    },
    error: (message, title = 'Błąd') => {
      window.dispatchEvent(new CustomEvent('toast-add', {
        detail: { message, title, type: 'error' }
      }))
    },
    info: (message, title = 'Info') => {
      window.dispatchEvent(new CustomEvent('toast-add', {
        detail: { message, title, type: 'info' }
      }))
    }
  }
}
