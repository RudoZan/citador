type Props = {
  projectName: string | null
}

export function SectionsSidebar({ projectName }: Props) {
  return (
    <aside className="sidebar left">
      <div className="sidebar-head tight">{projectName ?? 'Proyecto'}</div>
      <div className="sidebar-section-label">Secciones</div>
      <p className="muted tiny tight">Aquí irá la lista de secciones (orden, renombrar, crear).</p>
      <ul className="list-compact muted tiny">
        <li>(Sin secciones todavía)</li>
      </ul>
    </aside>
  )
}
