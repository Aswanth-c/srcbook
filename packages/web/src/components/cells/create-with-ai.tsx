import { useEffect, useState } from 'react';
import CodeMirror, { keymap, Prec, EditorView } from '@uiw/react-codemirror';
import { CircleAlert, Trash2, Pencil } from 'lucide-react';
import { CellType, PlaceholderCellType, MarkdownCellUpdateAttrsType } from '@srcbook/shared';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import DeleteCellWithConfirmation from '@/components/delete-cell-dialog';
import useTheme from '@/components/use-theme';

export default function CreateWithAiPlaceholderCell(props: {
  cell: PlaceholderCellType;
  onUpdateCell: (
    cell: MarkdownCellType,
    attrs: MarkdownCellUpdateAttrsType,
    getValidationError?: (cell: MarkdownCellType) => string | null,
  ) => Promise<string | null>;
  onDeleteCell: (cell: CellType) => void;
}) {
  const { codeTheme } = useTheme();
  const cell = props.cell;
  const defaultState = cell.text ? 'view' : 'edit';
  const [status, setStatus] = useState<'edit' | 'view'>(defaultState);
  const [text, setText] = useState(cell.text);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'edit') {
      setText(cell.text);
    }
  }, [status, cell]);

  const keyMap = Prec.highest(
    keymap.of([
      {
        key: 'Mod-Enter',
        run: () => {
          onSave();
          return true;
        },
      },
      {
        key: 'Escape',
        run: () => {
          setStatus('view');
          return true;
        },
      },
    ]),
  );

  function getValidationError(cell: MarkdownCellType) {
    const tokens = marked.lexer(cell.text);
    const hasH1 = tokens?.some((token) => token.type === 'heading' && token.depth === 1);
    const hasH6 = tokens?.some((token) => token.type === 'heading' && token.depth === 6);

    if (hasH1 || hasH6) {
      return 'Markdown cells cannot use h1 or h6 headings, these are reserved for srcbook.';
    }
    return null;
  }

  async function onSave() {
    const error = await props.onUpdateCell(cell, { text }, getValidationError);
    setError(error);
    if (error === null) {
      setStatus('view');
      return true;
    }
  }

  return (
    <div
      id={`cell-${props.cell.id}`}
      onDoubleClick={() => setStatus('edit')}
      className={cn(
        'group/cell relative w-full rounded-md border border-transparent hover:border-border transition-all',
        status === 'edit' && 'ring-1 ring-ring border-ring hover:border-ring',
        error && 'ring-1 ring-sb-red-30 border-sb-red-30 hover:border-sb-red-30',
      )}
    >
      {status === 'view' ? (
        <div>
          <div className="p-1 w-full h-11 hidden group-hover/cell:flex items-center justify-between z-10">
            <h5 className="pl-2 text-sm font-mono font-bold">Markdown</h5>
            <div className="flex items-center gap-1">
              <Button
                variant="secondary"
                size="icon"
                className="border-transparent"
                onClick={() => setStatus('edit')}
              >
                <Pencil size={16} />
              </Button>

              <DeleteCellWithConfirmation onDeleteCell={() => props.onDeleteCell(cell)}>
                <Button variant="secondary" size="icon" className="border-transparent">
                  <Trash2 size={16} />
                </Button>
              </DeleteCellWithConfirmation>
            </div>
          </div>
          <div className="sb-prose px-3 pt-11 group-hover/cell:pt-0">
            <Markdown>{cell.text}</Markdown>
          </div>
        </div>
      ) : (
        <>
          {error && (
            <div className="flex items-center gap-2 absolute bottom-1 right-1 px-2.5 py-2 text-sb-red-80 bg-sb-red-30 rounded-sm">
              <CircleAlert size={16} />
              <p className="text-xs">{error}</p>
            </div>
          )}
          <div className="flex flex-col">
            <div className="p-1 w-full flex items-center justify-between z-10">
              <h5 className="pl-4 text-sm font-mono font-bold">Markdown</h5>
              <div className="flex items-center gap-1">
                <DeleteCellWithConfirmation onDeleteCell={() => props.onDeleteCell(cell)}>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="border-secondary hover:border-muted"
                  >
                    <Trash2 size={16} />
                  </Button>
                </DeleteCellWithConfirmation>

                <Button variant="secondary" onClick={() => setStatus('view')}>
                  Cancel
                </Button>

                <Button onClick={onSave}>Save</Button>
              </div>
            </div>

            <div className="px-3">
              <CodeMirror
                theme={codeTheme}
                indentWithTab={false}
                value={text}
                basicSetup={{ lineNumbers: false, foldGutter: false }}
                extensions={[markdown(), keyMap, EditorView.lineWrapping]}
                onChange={(source) => setText(source)}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
