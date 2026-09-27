/** Put the keyboard back on the sheet (after clicking a button in the task panel). */
export function focusSheet() {
  window.setTimeout(() => document.querySelector<HTMLElement>('[role="grid"]')?.focus({ preventScroll: true }), 0);
}
