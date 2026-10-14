import { describe, it, expect } from 'vitest';
import { db } from '../../../api/src/database';
import { generateNodeCss } from '../services/cssGenerator';
import { createDefaultDocument, createNode } from '@figma-app/document-model';

describe('Milestones 4-7: Auth, Collaboration, Prototyping & Handoff', () => {
  it('manages user authentication and session verification in database', () => {
    const user = db.createUser('Alex Rivera', 'alex@company.com', 'secret_hash_123');
    expect(user.id).toBeDefined();
    expect(user.email).toBe('alex@company.com');

    const token = db.createSession(user.id);
    expect(token).toBeDefined();

    const sessionUser = db.verifySession(token);
    expect(sessionUser?.id).toBe(user.id);
    expect(sessionUser?.name).toBe('Alex Rivera');
  });

  it('manages document permissions and roles (owner, editor, viewer)', () => {
    const docId = 'doc_test_perm';
    const userId = 'usr_test_user';

    // Default permission for unknown doc
    expect(db.getPermission(docId, userId)).toBeNull();

    // Set permission
    db.setPermission(docId, userId, 'owner');
    expect(db.getPermission(docId, userId)).toBe('owner');

    db.setPermission(docId, userId, 'viewer');
    expect(db.getPermission(docId, userId)).toBe('viewer');
  });

  it('handles collaborative anchored comments lifecycle', () => {
    const comment = {
      id: 'cmt_100',
      documentId: 'doc_1',
      pageId: 'page_1',
      authorId: 'usr_1',
      authorName: 'Sarah',
      authorColor: '#ec4899',
      position: { x: 300, y: 150 },
      content: 'Please adjust line-height for mobile.',
      resolved: false,
      createdAt: new Date().toISOString(),
    };

    db.addComment(comment);
    const comments = db.getComments('doc_1');
    expect(comments).toHaveLength(1);
    expect(comments[0].content).toBe('Please adjust line-height for mobile.');

    const resolved = db.resolveComment('doc_1', 'cmt_100');
    expect(resolved).toBe(true);
    expect(db.getComments('doc_1')[0].resolved).toBe(true);
  });

  it('generates accurate CSS for developer handoff inspect panel', () => {
    const card = createNode('rect', {
      name: 'Card Container',
      transform: { x: 100, y: 200, width: 320, height: 180, rotation: 0 },
      cornerRadius: 12,
      fills: [{ id: 'f1', type: 'solid', color: '#1e293b', opacity: 1, visible: true }],
      strokes: [{ id: 's1', color: '#3b82f6', width: 2, visible: true }],
    });

    const handoff = generateNodeCss(card);
    expect(handoff.selector).toBe('.card-container');
    expect(handoff.styles['width']).toBe('320px');
    expect(handoff.styles['height']).toBe('180px');
    expect(handoff.styles['background-color']).toBe('#1e293b');
    expect(handoff.styles['border']).toBe('2px solid #3b82f6');
    expect(handoff.styles['border-radius']).toBe('12px');
    expect(handoff.cssString).toContain('border-radius: 12px;');
  });

  it('handles user session revocation and project management lifecycle', () => {
    const user = db.createUser('Project Owner', 'owner@company.com', 'pass123');
    const token = db.createSession(user.id);
    expect(db.verifySession(token)?.id).toBe(user.id);

    // Create and retrieve projects
    const p1 = db.createProject('Mobile Redesign', user.id);
    expect(p1.id).toBeDefined();
    expect(p1.title).toBe('Mobile Redesign');

    const userProjects = db.getProjects(user.id);
    expect(userProjects).toHaveLength(1);
    expect(userProjects[0].id).toBe(p1.id);

    // // Delete project
    // const deleted = db.deleteProject(p1.id);
    // expect(deleted).toBe(true);
    // expect(db.getProjects(user.id)).toHaveLength(0);

    // Rename project
    const renamed = db.renameProject(p1.id, 'Mobile Redesign v2');
    expect(renamed?.title).toBe('Mobile Redesign v2');

    // Duplicate project
    const duplicated = db.duplicateProject(p1.id, user.id);
    expect(duplicated).toBeDefined();
    expect(duplicated?.title).toBe('Mobile Redesign v2 (Copy)');
    expect(db.getProjects(user.id)).toHaveLength(2);

    // Soft delete (trash) and restore
    const trashed = db.deleteProject(p1.id);
    expect(trashed).toBe(true);
    expect(db.getProjects(user.id)).toHaveLength(1);

    const restored = db.restoreProject(p1.id);
    expect(restored).toBe(true);
    expect(db.getProjects(user.id)).toHaveLength(2);

    // Logout session
    const revoked = db.revokeSession(token);
    expect(revoked).toBe(true);
    expect(db.verifySession(token)).toBeNull();
  });
});
