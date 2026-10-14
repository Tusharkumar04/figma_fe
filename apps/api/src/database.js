"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.InMemoryDatabase = void 0;
class InMemoryDatabase {
    users = new Map();
    permissions = new Map(); // key: `${documentId}:${userId}`
    comments = new Map(); // key: documentId
    tokens = new Map(); // token -> userId
    // constructor() {
    //   // Seed default admin / demo user
    //   const defaultUser: StoredUser = {
    //     id: 'usr_demo_lead',
    //     email: 'lead@studio.design',
    //     name: 'Sarah (Design Lead)',
    //     avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    //     passwordHash: 'demo12345',
    //     createdAt: new Date().toISOString(),
    //   };
    //   this.users.set(defaultUser.email, defaultUser);
    //   this.tokens.set('demo_token_lead', defaultUser.id);
    //   // Default demo doc owner
    //   this.permissions.set(`demo-doc:${defaultUser.id}`, {
    //     documentId: 'demo-doc',
    //     userId: defaultUser.id,
    //     role: 'owner',
    //   });
    // }
    storageFile = process.env.DATA_FILE || './figma_db_store.json';
    constructor() {
        this.loadFromDisk();
        if (this.users.size === 0) {
            const defaultUser = {
                id: 'usr_demo_lead',
                email: 'lead@studio.design',
                name: 'Sarah (Design Lead)',
                avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
                passwordHash: 'demo12345',
                createdAt: new Date().toISOString(),
            };
            this.users.set(defaultUser.email, defaultUser);
            this.tokens.set('demo_token_lead', defaultUser.id);
            this.permissions.set(`demo-doc:${defaultUser.id}`, {
                documentId: 'demo-doc',
                userId: defaultUser.id,
                role: 'owner',
            });
            this.saveToDisk();
        }
    }
    saveToDisk() {
        try {
            const fs = require('fs');
            const data = {
                users: Array.from(this.users.entries()),
                permissions: Array.from(this.permissions.entries()),
                comments: Array.from(this.comments.entries()),
                tokens: Array.from(this.tokens.entries()),
                projects: Array.from(this.projects.entries()),
            };
            fs.writeFileSync(this.storageFile, JSON.stringify(data, null, 2));
        }
        catch (e) { }
    }
    loadFromDisk() {
        try {
            const fs = require('fs');
            if (fs.existsSync(this.storageFile)) {
                const raw = fs.readFileSync(this.storageFile, 'utf8');
                const data = JSON.parse(raw);
                if (data.users)
                    this.users = new Map(data.users);
                if (data.permissions)
                    this.permissions = new Map(data.permissions);
                if (data.comments)
                    this.comments = new Map(data.comments);
                if (data.tokens)
                    this.tokens = new Map(data.tokens);
                if (data.projects)
                    this.projects = new Map(data.projects);
            }
        }
        catch (e) { }
    }
    getUserByEmail(email) {
        return this.users.get(email.toLowerCase());
    }
    getUserById(id) {
        for (const user of this.users.values()) {
            if (user.id === id)
                return user;
        }
        return undefined;
    }
    createUser(name, email, passwordHash) {
        const user = {
            id: `usr_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
            name,
            email: email.toLowerCase(),
            passwordHash,
            createdAt: new Date().toISOString(),
        };
        this.users.set(user.email, user);
        return user;
    }
    createSession(userId) {
        const token = `tok_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 10)}`;
        this.tokens.set(token, userId);
        return token;
    }
    verifySession(token) {
        const userId = this.tokens.get(token);
        if (!userId)
            return null;
        return this.getUserById(userId) || null;
    }
    getPermission(documentId, userId) {
        const perm = this.permissions.get(`${documentId}:${userId}`);
        if (perm)
            return perm.role;
        // Default open access for demo-doc
        if (documentId === 'demo-doc')
            return 'editor';
        return null;
    }
    setPermission(documentId, userId, role) {
        this.permissions.set(`${documentId}:${userId}`, { documentId, userId, role });
    }
    projects = new Map();
    getComments(documentId) {
        return this.comments.get(documentId) || [];
    }
    addComment(comment) {
        const list = this.comments.get(comment.documentId) || [];
        list.push(comment);
        this.comments.set(comment.documentId, list);
    }
    resolveComment(documentId, commentId) {
        const list = this.comments.get(documentId);
        if (!list)
            return false;
        const target = list.find((c) => c.id === commentId);
        if (target) {
            target.resolved = true;
            return true;
        }
        return false;
    }
    // Project Management
    createProject(title, ownerId) {
        const project = {
            id: `prj_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
            title,
            ownerId,
            documentIds: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        this.projects.set(project.id, project);
        return project;
    }
    // getProjects(ownerId: string): Project[] {
    //   const res: Project[] = [];
    //   for (const p of this.projects.values()) {
    //     if (p.ownerId === ownerId) res.push(p);
    //   }
    //   return res;
    // }
    getProjects(ownerId, includeDeleted = false) {
        const res = [];
        for (const p of this.projects.values()) {
            if (p.ownerId === ownerId && (includeDeleted || !p.deletedAt)) {
                res.push(p);
            }
        }
        return res;
    }
    renameProject(projectId, title) {
        const project = this.projects.get(projectId);
        if (!project)
            return null;
        project.title = title;
        project.updatedAt = new Date().toISOString();
        return project;
    }
    duplicateProject(projectId, ownerId) {
        const original = this.projects.get(projectId);
        if (!original)
            return null;
        const duplicated = {
            id: `prj_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
            title: `${original.title} (Copy)`,
            ownerId,
            documentIds: [...original.documentIds],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        this.projects.set(duplicated.id, duplicated);
        return duplicated;
    }
    // deleteProject(projectId: string): boolean {
    //   return this.projects.delete(projectId);
    // }
    deleteProject(projectId) {
        const project = this.projects.get(projectId);
        if (!project)
            return false;
        project.deletedAt = new Date().toISOString();
        return true;
    }
    restoreProject(projectId) {
        const project = this.projects.get(projectId);
        if (!project || !project.deletedAt)
            return false;
        project.deletedAt = null;
        project.updatedAt = new Date().toISOString();
        return true;
    }
    revokeSession(token) {
        return this.tokens.delete(token);
    }
}
exports.InMemoryDatabase = InMemoryDatabase;
exports.db = new InMemoryDatabase();
