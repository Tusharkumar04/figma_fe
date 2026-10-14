import { User, DocumentPermission, UserRole, Comment, Project } from '@figma-app/shared-types';
export interface StoredUser extends User {
    passwordHash: string;
}
export declare class InMemoryDatabase {
    users: Map<string, StoredUser>;
    permissions: Map<string, DocumentPermission>;
    comments: Map<string, Comment[]>;
    tokens: Map<string, string>;
    private storageFile;
    constructor();
    saveToDisk(): void;
    loadFromDisk(): void;
    getUserByEmail(email: string): StoredUser | undefined;
    getUserById(id: string): StoredUser | undefined;
    createUser(name: string, email: string, passwordHash: string): StoredUser;
    createSession(userId: string): string;
    verifySession(token: string): StoredUser | null;
    getPermission(documentId: string, userId: string): UserRole | null;
    setPermission(documentId: string, userId: string, role: UserRole): void;
    projects: Map<string, Project>;
    getComments(documentId: string): Comment[];
    addComment(comment: Comment): void;
    resolveComment(documentId: string, commentId: string): boolean;
    createProject(title: string, ownerId: string): Project;
    getProjects(ownerId: string, includeDeleted?: boolean): Project[];
    renameProject(projectId: string, title: string): Project | null;
    duplicateProject(projectId: string, ownerId: string): Project | null;
    deleteProject(projectId: string): boolean;
    restoreProject(projectId: string): boolean;
    revokeSession(token: string): boolean;
}
export declare const db: InMemoryDatabase;
