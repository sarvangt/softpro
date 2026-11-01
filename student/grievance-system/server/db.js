// Tiny local JSON-file store (no database server needed).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const FILE = path.join(__dirname, 'data', 'db.json');
let data = { users: [], grievances: [] };

try {
  data = { ...data, ...JSON.parse(fs.readFileSync(FILE, 'utf8')) };
} catch {
  /* first run: start empty */
}

function save() {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

function collection(name) {
  const rows = () => data[name];
  return {
    find: (pred = () => true) => rows().filter(pred),
    findOne: (pred) => rows().find(pred) || null,
    insert(doc) {
      const row = { _id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...doc };
      rows().push(row);
      save();
      return row;
    },
    update(row, changes) {
      Object.assign(row, changes, { updatedAt: new Date().toISOString() });
      save();
      return row;
    },
    remove(id) {
      data[name] = rows().filter((r) => r._id !== id);
      save();
    }
  };
}

module.exports = { users: collection('users'), grievances: collection('grievances') };
