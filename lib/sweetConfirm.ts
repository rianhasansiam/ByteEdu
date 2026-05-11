import Swal from "sweetalert2";

/**
 * A reusable SweetAlert2 confirmation dialog that replaces native confirm().
 * Returns `true` if the user confirms, `false` otherwise.
 */
export async function sweetConfirm(
  message: string,
  options?: {
    title?: string;
    confirmText?: string;
    cancelText?: string;
    icon?: "warning" | "error" | "info" | "question";
  }
): Promise<boolean> {
  const result = await Swal.fire({
    title: options?.title || "Are you sure?",
    text: message,
    icon: options?.icon || "warning",
    showCancelButton: true,
    confirmButtonColor: "#111827",
    cancelButtonColor: "#6b7280",
    confirmButtonText: options?.confirmText || "Yes, proceed",
    cancelButtonText: options?.cancelText || "Cancel",
    reverseButtons: true,
    customClass: {
      popup: "rounded-xl",
    },
  });

  return result.isConfirmed;
}
