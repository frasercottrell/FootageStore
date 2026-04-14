import { google, drive_v3 } from "googleapis";
import { Readable } from "stream";

let driveClient: drive_v3.Drive | null = null;

function getDrive(): drive_v3.Drive {
  if (driveClient) return driveClient;

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Missing Google OAuth env vars: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN"
    );
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  driveClient = google.drive({ version: "v3", auth: oauth2Client });
  return driveClient;
}

function getParentFolderId(): string {
  const id = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID;
  if (!id) throw new Error("GOOGLE_DRIVE_PARENT_FOLDER_ID env var is not set");
  return id;
}

/**
 * Create a folder inside the parent "Footage Storage" folder.
 * Returns the Google Drive folder ID.
 */
export async function createClientFolder(clientName: string): Promise<string> {
  const drive = getDrive();
  const parentId = getParentFolderId();

  const res = await drive.files.create({
    supportsAllDrives: true,
    requestBody: {
      name: clientName,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    },
    fields: "id",
  });

  return res.data.id!;
}

/**
 * Rename a client folder in Google Drive.
 */
export async function renameClientFolder(folderId: string, newName: string): Promise<void> {
  const drive = getDrive();
  await drive.files.update({
    fileId: folderId,
    supportsAllDrives: true,
    requestBody: { name: newName },
  });
}

/**
 * Delete a client folder (and all contents) from Google Drive.
 */
export async function deleteClientFolder(folderId: string): Promise<void> {
  const drive = getDrive();
  await drive.files.delete({
    fileId: folderId,
    supportsAllDrives: true,
  });
}

/**
 * Upload a file to a client's folder in Google Drive.
 * Returns the Google Drive file ID.
 */
export async function uploadFileToDrive(
  folderId: string,
  fileName: string,
  mimeType: string,
  fileStream: Readable
): Promise<string> {
  const drive = getDrive();

  const res = await drive.files.create({
    supportsAllDrives: true,
    requestBody: {
      name: fileName,
      parents: [folderId],
    },
    media: {
      mimeType,
      body: fileStream,
    },
    fields: "id",
  });

  return res.data.id!;
}

/**
 * Delete a file from Google Drive.
 */
export async function deleteFileFromDrive(fileId: string): Promise<void> {
  const drive = getDrive();
  await drive.files.delete({
    fileId,
    supportsAllDrives: true,
  });
}

/**
 * Get a readable stream of a file from Google Drive.
 */
export async function downloadFileFromDrive(
  fileId: string
): Promise<Readable> {
  const drive = getDrive();
  const res = await drive.files.get(
    { fileId, alt: "media", supportsAllDrives: true },
    { responseType: "stream" }
  );
  return res.data as unknown as Readable;
}

/**
 * Get file metadata (size) from Google Drive.
 */
export async function getDriveFileSize(fileId: string): Promise<number> {
  const drive = getDrive();
  const res = await drive.files.get({
    fileId,
    supportsAllDrives: true,
    fields: "size",
  });
  return parseInt(res.data.size || "0", 10);
}
