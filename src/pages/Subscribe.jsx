import { Navigate } from 'react-router-dom'

/** Paid subscriptions removed; old /subscribe links go home. */
export default function Subscribe() {
  return <Navigate to="/" replace />
}
