document.addEventListener("DOMContentLoaded", async () => {
    const noteForm = document.getElementById("noteForm");
    const notesList = document.getElementById("notesList");
    const totalNotes = document.getElementById("totalNotes");
    const totalBytes = document.getElementById("totalBytes");

    async function renderNotes() {
        notesList.innerHTML = "";
        const notes = await getAllNotes();
        if (notes) {
            notes.forEach((note, id) => {
                const li = document.createElement("li");
                li.innerHTML = `<strong>${note.title}</strong>: ${note.content} 
                    <button onclick="deleteNoteHandler('${id}')">🗑️</button>`;
                notesList.appendChild(li);
            });
        }
        const { length, bytes } = await getStorageStats();
        totalNotes.textContent = length;
        totalBytes.textContent = bytes;
    }

    noteForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const title = document.getElementById("title").value.trim();
        const content = document.getElementById("content").value.trim();
        if (title && content) {
            await addNote(title, content);
            noteForm.reset();
            renderNotes();
        }
    });

    window.deleteNoteHandler = async (id) => {
        await deleteNote(id);
        renderNotes();
    };

    renderNotes();
});
