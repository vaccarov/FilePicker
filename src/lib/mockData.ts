import { Resource } from '@/types';

export const mockResources: Resource[] = [
  // Root level resources
  {
    resource_id: 'mock-folder-1',
    inode_path: { path: 'My Documents' },
    inode_type: 'directory',
  },
  {
    resource_id: 'mock-file-1',
    inode_path: { path: 'document.pdf' },
    inode_type: 'file',
    mime_type: 'application/pdf',
  },
  {
    resource_id: 'mock-folder-2',
    inode_path: { path: 'Images' },
    inode_type: 'directory',
  },
  {
    resource_id: 'mock-file-2',
    inode_path: { path: 'image.jpg' },
    inode_type: 'file',
    mime_type: 'image/jpeg',
  },
  {
    resource_id: 'mock-file-3',
    inode_path: { path: 'spreadsheet.xlsx' },
    inode_type: 'file',
    mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  },
  // Children of 'My Documents' (mock-folder-1)
  {
    resource_id: 'mock-subfolder-1',
    inode_path: { path: 'My Documents/Subfolder A' },
    inode_type: 'directory',
    parent_id: 'mock-folder-1',
  },
  {
    resource_id: 'mock-file-a',
    inode_path: { path: 'My Documents/File A.txt' },
    inode_type: 'file',
    mime_type: 'text/plain',
    parent_id: 'mock-folder-1',
  },
  // Children of 'Images' (mock-folder-2)
  {
    resource_id: 'mock-image-a',
    inode_path: { path: 'Images/Vacation.jpg' },
    inode_type: 'file',
    mime_type: 'image/jpeg',
    parent_id: 'mock-folder-2',
  },
  {
    resource_id: 'mock-image-b',
    inode_path: { path: 'Images/Family.png' },
    inode_type: 'file',
    mime_type: 'image/png',
    parent_id: 'mock-folder-2',
  },
  // Children of 'Subfolder A' (mock-subfolder-1)
  {
    resource_id: 'mock-nested-file',
    inode_path: { path: 'My Documents/Subfolder A/Nested File.doc' },
    inode_type: 'file',
    mime_type: 'application/msword',
    parent_id: 'mock-subfolder-1',
  },
];
