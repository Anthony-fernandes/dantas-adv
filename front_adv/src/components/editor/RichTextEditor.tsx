import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/integrations/api/client';
import { cn } from '@/lib/utils';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Table as TableIcon,
  Minus, Link as LinkIcon, Highlighter,
  ChevronDown, Variable,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const VARIABLE_LABELS: Record<string, string> = {
  'now': 'Data/hora atual',
  'tenant': 'Escritório',
  'tenant.name': 'Escritório — nome',
  'tenant.email': 'Escritório — e-mail',
  'tenant.phone': 'Escritório — telefone',
  'user': 'Usuário logado',
  'user.full_name': 'Usuário — nome',
  'user.email': 'Usuário — e-mail',
  'client': 'Cliente',
  'client.name': 'Cliente — nome',
  'client.doc': 'Cliente — CPF/CNPJ',
  'client.email': 'Cliente — e-mail',
  'client.phone': 'Cliente — telefone',
  'process': 'Processo',
  'process.cnj': 'Processo — nº CNJ',
  'process.title': 'Processo — título',
  'process.status': 'Processo — status',
};

const VARIABLE_GROUPS = [
  { label: 'Escritório', keys: ['tenant.name', 'tenant.email', 'tenant.phone'] },
  { label: 'Cliente', keys: ['client.name', 'client.doc', 'client.email', 'client.phone'] },
  { label: 'Processo', keys: ['process.cnj', 'process.title', 'process.status'] },
  { label: 'Usuário / Data', keys: ['user.full_name', 'user.email', 'now'] },
];

function ToolbarBtn({
  onClick, active, disabled, title, children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      disabled={disabled}
      title={title}
      className={cn(
        'flex h-7 w-7 items-center justify-center rounded text-sm transition-colors',
        active
          ? 'bg-foreground text-background'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        disabled && 'pointer-events-none opacity-40',
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="h-5 w-px bg-border" />;
}

function EditorToolbar({ editor }: { editor: Editor }) {
  function insertVariable(key: string) {
    editor.chain().focus().insertContent(`{{ ${key} }}`).run();
  }

  function insertTable() {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }

  function setLink() {
    const url = window.prompt('URL do link:');
    if (!url) return;
    editor.chain().focus().setLink({ href: url }).run();
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/30 px-3 py-2">
      {/* Text style */}
      <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Negrito">
        <Bold className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Itálico">
        <Italic className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Sublinhado">
        <UnderlineIcon className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Tachado">
        <Strikethrough className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')} title="Destacar">
        <Highlighter className="h-3.5 w-3.5" />
      </ToolbarBtn>

      <Divider />

      {/* Headings */}
      <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Título 1">
        <Heading1 className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Título 2">
        <Heading2 className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Título 3">
        <Heading3 className="h-3.5 w-3.5" />
      </ToolbarBtn>

      <Divider />

      {/* Alignment */}
      <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Alinhar à esquerda">
        <AlignLeft className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Centralizar">
        <AlignCenter className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Alinhar à direita">
        <AlignRight className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Justificar">
        <AlignJustify className="h-3.5 w-3.5" />
      </ToolbarBtn>

      <Divider />

      {/* Lists */}
      <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Lista com marcadores">
        <List className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Lista numerada">
        <ListOrdered className="h-3.5 w-3.5" />
      </ToolbarBtn>

      <Divider />

      {/* Insert */}
      <ToolbarBtn onClick={insertTable} title="Inserir tabela">
        <TableIcon className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Linha horizontal">
        <Minus className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <ToolbarBtn onClick={setLink} active={editor.isActive('link')} title="Inserir link">
        <LinkIcon className="h-3.5 w-3.5" />
      </ToolbarBtn>

      <Divider />

      {/* Variables */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex h-7 items-center gap-1 rounded border border-border bg-background px-2 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Variable className="h-3 w-3" />
            Variáveis
            <ChevronDown className="h-3 w-3" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="max-h-80 w-64 overflow-y-auto">
          {VARIABLE_GROUPS.map((group) => (
            <div key={group.label}>
              <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {group.label}
              </DropdownMenuLabel>
              {group.keys.map((key) => (
                <DropdownMenuItem
                  key={key}
                  onSelect={() => insertVariable(key)}
                  className="gap-2 font-mono text-xs"
                >
                  <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                    {`{{${key}}}`}
                  </span>
                  <span className="text-foreground">{VARIABLE_LABELS[key] ?? key}</span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  disabled?: boolean;
};

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Escreva o conteúdo do modelo...',
  minHeight = 400,
  disabled = false,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Highlight,
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Sync external value changes (e.g., when dialog opens with existing content)
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (current !== value) {
      editor.commands.setContent(value || '', false);
    }
  }, [value, editor]);

  useEffect(() => {
    if (editor) editor.setEditable(!disabled);
  }, [disabled, editor]);

  return (
    <div className={cn('overflow-hidden rounded-lg border border-border bg-background', disabled && 'opacity-70')}>
      {editor && !disabled && <EditorToolbar editor={editor} />}
      <EditorContent
        editor={editor}
        className="prose prose-sm dark:prose-invert max-w-none p-4 focus:outline-none [&_.ProseMirror]:min-h-[var(--editor-min-h)] [&_.ProseMirror]:outline-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0 [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_table]:w-full [&_.ProseMirror_table]:border-collapse [&_.ProseMirror_th]:border [&_.ProseMirror_th]:border-border [&_.ProseMirror_th]:bg-muted/40 [&_.ProseMirror_th]:p-2 [&_.ProseMirror_td]:border [&_.ProseMirror_td]:border-border [&_.ProseMirror_td]:p-2"
        style={{ '--editor-min-h': `${minHeight}px` } as React.CSSProperties}
      />
    </div>
  );
}
