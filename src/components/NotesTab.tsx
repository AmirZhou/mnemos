import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc, Id } from "../../convex/_generated/dataModel";
import { Button, Input, TextArea } from "./ui";

type Category = "operational" | "credit";

interface NotesTabProps {
  reportId: Id<"dailyReports">;
}

export function NotesTab({ reportId }: NotesTabProps) {
  const notes = useQuery(api.notes.listForReport, { reportId });
  const addNote = useMutation(api.notes.add);
  const updateNote = useMutation(api.notes.update);
  const removeNote = useMutation(api.notes.remove);

  const [editing, setEditing] = useState<{
    category: Category;
    id: Id<"noteEntries"> | null;
  } | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftBody, setDraftBody] = useState("");

  const operational =
    notes?.filter((n) => n.category === "operational") ?? [];
  const credit = notes?.filter((n) => n.category === "credit") ?? [];

  const startAdd = (category: Category) => {
    setEditing({ category, id: null });
    setDraftTitle("");
    setDraftBody("");
  };

  const startEdit = (note: Doc<"noteEntries">) => {
    setEditing({ category: note.category as Category, id: note._id });
    setDraftTitle(note.title);
    setDraftBody(note.body);
  };

  const cancel = () => {
    setEditing(null);
    setDraftTitle("");
    setDraftBody("");
  };

  const save = async () => {
    if (!editing) return;
    const title = draftTitle.trim();
    const body = draftBody.trim();
    if (!title && !body) {
      cancel();
      return;
    }
    if (editing.id) {
      await updateNote({ id: editing.id, title, body });
    } else {
      await addNote({
        reportId,
        category: editing.category,
        title,
        body,
      });
    }
    cancel();
  };

  const handleDelete = async (id: Id<"noteEntries">) => {
    if (confirm("Delete this note?")) {
      await removeNote({ id });
    }
  };

  const renderSection = (
    category: Category,
    title: string,
    subtitle: string,
    list: Doc<"noteEntries">[]
  ) => {
    const isEditingHere =
      editing?.category === category && editing?.id === null;

    return (
      <section className="bg-surface-800 rounded-xl p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-gray-100">{title}</h3>
            <p className="text-xs text-gray-500">{subtitle}</p>
          </div>
          {!isEditingHere && (
            <Button size="sm" variant="ghost" onClick={() => startAdd(category)}>
              + Add
            </Button>
          )}
        </div>

        {list.length === 0 && !isEditingHere && (
          <p className="text-sm text-gray-500 italic">
            No notes. This section will be hidden in the report.
          </p>
        )}

        <div className="space-y-2">
          {list.map((note) => {
            const isEditingThis = editing?.id === note._id;
            if (isEditingThis) {
              return (
                <NoteEditor
                  key={note._id}
                  title={draftTitle}
                  body={draftBody}
                  onTitle={setDraftTitle}
                  onBody={setDraftBody}
                  onCancel={cancel}
                  onSave={save}
                />
              );
            }
            return (
              <div
                key={note._id}
                className="p-3 bg-surface-700 rounded-lg space-y-1"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-medium text-gray-100">
                    {note.title || <span className="text-gray-500 italic">Untitled</span>}
                  </h4>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => startEdit(note)}
                      className="px-2 py-1 text-xs text-gray-400 hover:text-gray-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(note._id)}
                      className="px-2 py-1 text-xs text-gray-400 hover:text-red-400"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                {note.body && (
                  <p className="text-sm text-gray-300 whitespace-pre-wrap">
                    {note.body}
                  </p>
                )}
              </div>
            );
          })}

          {isEditingHere && (
            <NoteEditor
              title={draftTitle}
              body={draftBody}
              onTitle={setDraftTitle}
              onBody={setDraftBody}
              onCancel={cancel}
              onSave={save}
            />
          )}
        </div>
      </section>
    );
  };

  return (
    <div className="p-3 sm:p-4 space-y-4">
      {renderSection(
        "operational",
        "Operational Notes",
        "Downtime, scrap, issues — short title + what happened.",
        operational
      )}
      {renderSection(
        "credit",
        "Credit and Teamwork",
        "Who helped, break coverage, good calls.",
        credit
      )}
    </div>
  );
}

interface NoteEditorProps {
  title: string;
  body: string;
  onTitle: (v: string) => void;
  onBody: (v: string) => void;
  onCancel: () => void;
  onSave: () => void;
}

function NoteEditor({
  title,
  body,
  onTitle,
  onBody,
  onCancel,
  onSave,
}: NoteEditorProps) {
  return (
    <div className="p-3 bg-surface-700 rounded-lg space-y-3 border border-amber-500/30">
      <Input
        placeholder="Title (e.g., STM 21 – Downtime (20 min))"
        value={title}
        onChange={(e) => onTitle(e.target.value)}
        autoFocus
      />
      <TextArea
        placeholder="What happened..."
        value={body}
        onChange={(e) => onBody(e.target.value)}
        rows={3}
      />
      <div className="flex gap-2 justify-end">
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" onClick={onSave}>
          Save
        </Button>
      </div>
    </div>
  );
}
