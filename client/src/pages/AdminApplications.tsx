import { useState } from 'react'
import {
  approveInstructorApplication,
  downloadDocument,
  listInstructorApplications,
  rejectInstructorApplication,
} from '../api'
import type { InstructorApplication } from '../api'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { PageTransition } from '../components/PageTransition'
import { SectionBar } from '../components/SectionBar'
import { Skeleton } from '../components/Skeleton'
import { useAsyncData } from '../hooks/useAsyncData'
import { formatDate } from '../lib/format'

export function AdminApplications() {
  const { data, loading, error, reload } = useAsyncData(() =>
    listInstructorApplications('PENDING'),
  )

  return (
    <PageTransition>
      <SectionBar
        title="Solicitudes de instructor"
        subtitle="Revisa y aprueba o rechaza las solicitudes pendientes"
      />

      <div className="mx-auto max-w-4xl px-4 pb-16">
        {loading ? (
          <div className="space-y-4">
            {[0, 1, 2].map((item) => (
              <Skeleton key={item} className="h-48 w-full" />
            ))}
          </div>
        ) : error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : !data || data.length === 0 ? (
          <EmptyState
            title="No hay solicitudes pendientes"
            description="Todas las solicitudes de instructor han sido revisadas."
          />
        ) : (
          <ul className="space-y-4">
            {data.map((application) => (
              <ApplicationCard
                key={application.id}
                application={application}
                onChanged={reload}
              />
            ))}
          </ul>
        )}
      </div>
    </PageTransition>
  )
}

function ApplicationCard({
  application,
  onChanged,
}: {
  application: InstructorApplication
  onChanged: () => void
}) {
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null)

  async function handleApprove() {
    setError(null)
    setBusy('approve')
    try {
      await approveInstructorApplication(
        application.id,
        notes.trim() ? notes.trim() : undefined,
      )
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al aprobar')
      setBusy(null)
    }
  }

  async function handleReject() {
    setError(null)
    if (!notes.trim()) {
      setError('Las notas de revisión son obligatorias para rechazar.')
      return
    }
    setBusy('reject')
    try {
      await rejectInstructorApplication(application.id, notes.trim())
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al rechazar')
      setBusy(null)
    }
  }

  return (
    <li className="card p-6">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-gray-800">
            {application.applicant.nombre} {application.applicant.apellidos}
          </p>
          <p className="text-sm text-gray-500">
            {application.applicant.correo}
          </p>
        </div>
        <span className="text-sm text-gray-500">
          {formatDate(application.createdAt)}
        </span>
      </div>

      <dl className="mb-4 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-gray-400">Profesión</dt>
          <dd className="font-medium text-gray-700">
            {application.applicant.profesion ?? '—'}
          </dd>
        </div>
        <div>
          <dt className="text-gray-400">Edad</dt>
          <dd className="font-medium text-gray-700">
            {application.applicant.edad ?? '—'}
          </dd>
        </div>
      </dl>

      {application.documents.length > 0 && (
        <div className="mb-4">
          <p className="mb-1 text-sm font-semibold text-gray-600">Documentos</p>
          <ul className="space-y-1">
            {application.documents.map((document) => (
              <li key={document.id} className="flex items-center gap-2">
                <span className="truncate text-sm text-gray-700">
                  <i
                    className="fa-solid fa-file mr-2 text-gray-400"
                    aria-hidden="true"
                  />
                  {document.fileName}
                </span>
                <button
                  type="button"
                  onClick={() => downloadDocument(document.id)}
                  className="text-sm font-semibold text-primary hover:underline"
                >
                  Descargar
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-2 border-t border-gray-100 pt-4">
        <label htmlFor={`notas-${application.id}`} className="field-label">
          Notas de revisión{' '}
          <span className="font-normal text-gray-400">
            (obligatorias para rechazar)
          </span>
        </label>
        <textarea
          id={`notas-${application.id}`}
          className="field-input min-h-20"
          placeholder="Comentarios para el solicitante"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={handleReject}
            disabled={busy !== null}
            className="rounded-full border-2 border-red-200 bg-white px-5 py-2 text-sm font-semibold text-danger transition-colors hover:bg-red-50 disabled:opacity-60"
          >
            {busy === 'reject' ? 'Rechazando…' : 'Rechazar'}
          </button>
          <button
            type="button"
            onClick={handleApprove}
            disabled={busy !== null}
            className="btn-primary px-5 py-2 text-sm"
          >
            {busy === 'approve' ? 'Aprobando…' : 'Aprobar'}
          </button>
        </div>
      </div>
    </li>
  )
}
