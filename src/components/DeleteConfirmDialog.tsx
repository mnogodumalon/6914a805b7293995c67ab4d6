import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface DeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  recordName: string
  onConfirm: () => Promise<void>
}

export function DeleteConfirmDialog({ open, onOpenChange, recordName, onConfirm }: DeleteDialogProps) {
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } catch {
      // error handled by parent
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eintrag löschen?</AlertDialogTitle>
          <AlertDialogDescription>
            Möchtest du &quot;{recordName}&quot; wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Abbrechen</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleting}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {deleting ? 'Löscht...' : 'Löschen'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
