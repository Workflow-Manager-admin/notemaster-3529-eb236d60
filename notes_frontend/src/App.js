import React, { useState, useEffect, useCallback } from "react";
import "./App.css";

// PUBLIC_INTERFACE
/**
 * NoteApp is the main component for managing notes and the app layout.
 * Provides features for creating, editing, deleting, and viewing notes,
 * with a sidebar for navigation and a main panel for content/editing.
 */
function App() {
  // Note format: { id: string, title: string, body: string, createdAt: number, updatedAt: number }
  const [notes, setNotes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Load notes from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("notes-v1");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setNotes(parsed);
        if (parsed.length > 0) setSelectedId(parsed[0].id);
      } catch {
        setNotes([]);
      }
    }
  }, []);

  // Save notes to localStorage on change
  useEffect(() => {
    localStorage.setItem("notes-v1", JSON.stringify(notes));
  }, [notes]);

  /** Finds the selected note object by ID */
  const selectedNote = notes.find((n) => n.id === selectedId);

  // PUBLIC_INTERFACE
  /**
   * Creates a new note and selects it.
   */
  const handleNewNote = useCallback(() => {
    const now = Date.now();
    const newNote = {
      id: "note-" + now,
      title: "Untitled",
      body: "",
      createdAt: now,
      updatedAt: now,
    };
    setNotes((old) => [newNote, ...old]);
    setSelectedId(newNote.id);
    setIsEditing(true);
  }, []);

  // PUBLIC_INTERFACE
  /**
   * Deletes a note by ID and updates selection.
   * @param {string} id - ID of note to delete
   */
  const handleDelete = (id) => {
    setNotes((notes) => notes.filter((n) => n.id !== id));
    if (id === selectedId) {
      const idx = notes.findIndex((n) => n.id === id);
      // Select next note, or previous, or null
      if (notes.length > 1) {
        setSelectedId(notes[idx === 0 ? 1 : idx - 1].id);
      } else {
        setSelectedId(null);
      }
      setIsEditing(false);
    }
  };

  /**
   * Handles save (Create or Edit) for a note.
   * @param {object} updatedNote - Updated note object
   */
  const handleSave = (updatedNote) => {
    setNotes((notes) =>
      notes.map((n) => (n.id === updatedNote.id ? {...updatedNote, updatedAt: Date.now()} : n))
    );
    setIsEditing(false);
  };

  /**
   * Handles selection of a note for viewing/editing.
   * @param {string} id
   */
  const handleSelect = (id) => {
    setSelectedId(id);
    setIsEditing(false);
  };

  /**
   * Handles editing a note.
   * Sets the editing state for selected note.
   */
  const handleEdit = () => setIsEditing(true);

  return (
    <div className="notes-app light-theme">
      <Sidebar
        notes={notes}
        selectedId={selectedId}
        onSelect={handleSelect}
        onNewNote={handleNewNote}
        onDelete={handleDelete}
      />
      <main className="main-panel">
        {selectedNote ? (
          isEditing ? (
            <NoteEditor
              key={selectedNote.id}
              note={selectedNote}
              onSave={handleSave}
              onCancel={() => setIsEditing(false)}
              accentColor={"#ff9800"}
            />
          ) : (
            <NoteView
              note={selectedNote}
              onEdit={handleEdit}
              onDelete={handleDelete}
              accentColor={"#ff9800"}
            />
          )
        ) : (
          <EmptyState onNewNote={handleNewNote} accentColor={"#ff9800"} />
        )}
      </main>
    </div>
  );
}

// PUBLIC_INTERFACE
/**
 * Sidebar component to display note list and note controls
 */
function Sidebar({ notes, selectedId, onSelect, onNewNote, onDelete }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1>
          <span style={{ color: "#1976d2" }}>Note</span>
          <span style={{ color: "#ff9800" }}>Master</span>
        </h1>
        <button
          className="btn-accent"
          onClick={onNewNote}
          title="Create note"
          data-testid="create-note"
        >
          + New Note
        </button>
      </div>
      <ul className="notes-list">
        {notes.length === 0 && (
          <li className="notes-list-empty">No notes yet</li>
        )}
        {notes.map((note) => (
          <li
            key={note.id}
            className={`notes-list-item${selectedId === note.id ? " selected" : ""}`}
            onClick={() => onSelect(note.id)}
            tabIndex={0}
            aria-selected={selectedId === note.id}
          >
            <div>
              <strong>{note.title || "Untitled"}</strong>
              <span className="notes-list-date">
                {new Date(note.updatedAt).toLocaleDateString()}
              </span>
            </div>
            <button
              className="btn-delete"
              onClick={(e) => {e.stopPropagation(); onDelete(note.id);}}
              title="Delete note"
              aria-label="Delete note"
            >
              🗑
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}

// PUBLIC_INTERFACE
/**
 * NoteEditor allows editing the note's title and body
 */
function NoteEditor({ note, onSave, onCancel, accentColor }) {
  const [title, setTitle] = useState(note.title);
  const [body, setBody] = useState(note.body);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({...note, title, body});
  };

  return (
    <form className="note-editor" onSubmit={handleSubmit}>
      <input
        className="note-title-input"
        style={{ borderBottom: `2px solid ${accentColor}` }}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        autoFocus
        placeholder="Title"
        maxLength={48}
        required
      />
      <textarea
        className="note-body-textarea"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write your note here..."
        required
      />
      <div className="editor-actions">
        <button type="submit" className="btn-accent" style={{background: accentColor}}>
          Save
        </button>
        <button type="button" className="btn" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

// PUBLIC_INTERFACE
/**
 * NoteView renders a read-only note with edit and delete options
 */
function NoteView({ note, onEdit, onDelete, accentColor }) {
  return (
    <article className="note-view">
      <h2>{note.title}</h2>
      <div className="note-meta">
        <span>
          Edited: {new Date(note.updatedAt).toLocaleString()}
        </span>
      </div>
      <div className="note-content">{note.body}</div>
      <div className="view-actions">
        <button className="btn" style={{borderColor: accentColor, color: accentColor}} onClick={onEdit}>
          Edit
        </button>
        <button className="btn-delete" onClick={() => onDelete(note.id)}>
          Delete
        </button>
      </div>
    </article>
  );
}

// PUBLIC_INTERFACE
/**
 * EmptyState renders when there are no notes or none is selected
 */
function EmptyState({ onNewNote, accentColor }) {
  return (
    <div className="empty-state">
      <h2>Welcome to NoteMaster!</h2>
      <p>
        Select or create a note to get started.<br />
      </p>
      <button className="btn-accent" style={{background: accentColor}} onClick={onNewNote}>Create your first note</button>
    </div>
  );
}

export default App;
