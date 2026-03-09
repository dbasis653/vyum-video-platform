import Spinner from "@/components/ui/Spinner";
import Button from "@/components/ui/Button";

interface EditModalFooterProps {
  onDelete: () => void;
  onCancel: () => void;
  onSave: () => void;
  isSaving: boolean;
  isDeleting: boolean;
}

export default function EditModalFooter({
  onDelete,
  onCancel,
  onSave,
  isSaving,
  isDeleting,
}: EditModalFooterProps) {
  const busy = isSaving || isDeleting;

  return (
    <div className="modal-action flex-wrap gap-2">
      <Button variant="danger" onClick={onDelete} loading={isDeleting}>
        {isDeleting && <Spinner />}
        Delete
      </Button>

      <div className="flex-1" />

      <Button variant="cancel" onClick={onCancel} disabled={busy}>
        Cancel
      </Button>

      <Button
        variant="primary"
        onClick={onSave}
        loading={isSaving}
        className="font-semibold"
      >
        {isSaving && <Spinner />}
        Save
      </Button>
    </div>
  );
}
