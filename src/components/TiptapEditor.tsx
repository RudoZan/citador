import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

export function TiptapEditor() {
  const editor = useEditor({
    extensions: [StarterKit],
    content: '<p>Escribe la sección aquí…</p>',
    editorProps: {
      attributes: {
        class: 'tiptap-inner',
      },
    },
  })

  if (!editor) return null

  return (
    <div className="editor-column">
      <div className="tiptap-toolbar">
        <button
          type="button"
          className={`btn ghost tiny ${editor.isActive('bold') ? 'active' : ''}`}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          Negrita
        </button>
        <button
          type="button"
          className={`btn ghost tiny ${editor.isActive('italic') ? 'active' : ''}`}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          Cursiva
        </button>
        <button
          type="button"
          className={`btn ghost tiny ${editor.isActive('heading', { level: 2 }) ? 'active' : ''}`}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          Título 2
        </button>
      </div>
      <EditorContent editor={editor} className="tiptap-root" />
    </div>
  )
}
