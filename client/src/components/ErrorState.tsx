import { ApiError, NetworkError } from '../api'

interface ErrorStateProps {
  error: Error
  onRetry?: () => void
}

/**
 * Renders a failed request. Network errors offer a retry action; API errors
 * surface the server's message without implying a retry would help.
 */
export function ErrorState({ error, onRetry }: ErrorStateProps) {
  const isNetwork = error instanceof NetworkError
  const message =
    error instanceof ApiError
      ? error.message
      : isNetwork
        ? error.message
        : 'Ocurrió un error inesperado.'

  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-red-100 bg-red-50/40 px-6 py-14 text-center">
      <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-2xl text-danger">
        <i
          className={`fa-solid ${isNetwork ? 'fa-wifi' : 'fa-circle-exclamation'}`}
          aria-hidden="true"
        />
      </span>
      <h3 className="mb-1 text-lg font-semibold text-gray-800">
        {isNetwork ? 'No pudimos conectar con el servidor' : 'Algo salió mal'}
      </h3>
      <p className="mb-5 max-w-md text-sm text-gray-600">{message}</p>
      {isNetwork && onRetry && (
        <button type="button" onClick={onRetry} className="btn-outline">
          Reintentar
        </button>
      )}
    </div>
  )
}
