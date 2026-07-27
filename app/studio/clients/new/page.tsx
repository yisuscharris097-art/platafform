import ClientForm from '@/components/studio/ClientForm'
import { createClientAction } from '@/lib/actions/clients'

export default function NewClientPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">New client</h1>
      <ClientForm action={createClientAction} submitLabel="Create client" />
    </div>
  )
}
