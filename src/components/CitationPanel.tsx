export function CitationPanel() {
  return (
    <aside className="sidebar right">
      <div className="sidebar-head tight">Fuentes de cita</div>
      <p className="muted tiny tight">
        Panel de FC del proyecto: alta, edición e inserción en el editor.
      </p>
      <button type="button" className="btn secondary tiny block" disabled>
        + Nueva FC
      </button>
    </aside>
  )
}
