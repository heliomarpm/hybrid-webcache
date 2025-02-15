const HybridWebCache = require('hybrid-webcache');
const db = new HybridWebCache('NotesApp', { storage: StorageType.IndexedDB});

async function addNote(title, content) {
    const id = Date.now().toString();
    await db.set(id, { title, content, createdAt: new Date() });
}

async function getAllNotes() {
    return await db.getAll();
}

async function deleteNote(id) {
    await db.unset(id);
}

async function getStorageStats() {
    return db.info();
}
