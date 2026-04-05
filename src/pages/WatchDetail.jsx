import { useParams, Navigate } from 'react-router-dom'

/** Old /watch/:ref bookmarks redirect to Collection with that watch selected. */
export default function WatchDetail() {
  const { reference } = useParams()
  if (!reference) return <Navigate to="/" replace />
  return <Navigate to={`/?ref=${encodeURIComponent(reference)}&view=watch`} replace />
}
