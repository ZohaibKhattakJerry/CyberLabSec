/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DB_PATH = path.join(__dirname, '../prisma/cyberlabsec.db');
const UPLOADS_PATH = path.join(__dirname, '../uploads');
const BACKUP_DIR = path.join(__dirname, '../backups');

console.log("Starting Backup Process...");

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const dbBackupPath = path.join(BACKUP_DIR, `db-backup-${timestamp}.db`);

if (fs.existsSync(DB_PATH)) {
  fs.copyFileSync(DB_PATH, dbBackupPath);
  console.log(`Database backed up to ${dbBackupPath}`);
} else {
  console.log("Database file not found.");
}

const uploadsBackupPath = path.join(BACKUP_DIR, `uploads-backup-${timestamp}.tar.gz`);
if (fs.existsSync(UPLOADS_PATH)) {
  try {
    execSync(`tar -czf ${uploadsBackupPath} -C ${path.dirname(UPLOADS_PATH)} ${path.basename(UPLOADS_PATH)}`);
    console.log(`Uploads backed up to ${uploadsBackupPath}`);
  } catch(e) {
    console.error("Failed to backup uploads:", e.message);
  }
} else {
  console.log("Uploads directory not found.");
}

console.log("Backup process completed.");
