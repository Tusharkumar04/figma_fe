import { DocumentModel, SceneNode, ID, Transform } from '@figma-app/shared-types';

export interface Command {
  execute(doc: DocumentModel): DocumentModel;
  undo(doc: DocumentModel): DocumentModel;
  description: string;
}

export class AddNodeCommand implements Command {
  description: string;
  constructor(private node: SceneNode, private pageId: ID) {
    this.description = `Add ${this.node.name}`;
  }

  execute(doc: DocumentModel): DocumentModel {
    const updated = { ...doc, nodes: { ...doc.nodes, [this.node.id]: this.node } };
    const page = updated.pages[this.pageId];
    if (page) {
      updated.pages = {
        ...updated.pages,
        [this.pageId]: {
          ...page,
          children: [...page.children, this.node.id],
        },
      };
    }
    return updated;
  }

  undo(doc: DocumentModel): DocumentModel {
    const nextNodes = { ...doc.nodes };
    delete nextNodes[this.node.id];
    const page = doc.pages[this.pageId];
    const nextPages = { ...doc.pages };
    if (page) {
      nextPages[this.pageId] = {
        ...page,
        children: page.children.filter((id) => id !== this.node.id),
      };
    }
    return { ...doc, nodes: nextNodes, pages: nextPages };
  }
}

export class UpdateNodeCommand implements Command {
  description: string;
  constructor(
    private nodeId: ID,
    private newProps: Partial<SceneNode>,
    private prevProps: Partial<SceneNode>
  ) {
    this.description = `Update ${this.nodeId}`;
  }

  execute(doc: DocumentModel): DocumentModel {
    const node = doc.nodes[this.nodeId];
    if (!node) return doc;
    return {
      ...doc,
      nodes: {
        ...doc.nodes,
        [this.nodeId]: { ...node, ...this.newProps } as SceneNode,
      },
    };
  }

  undo(doc: DocumentModel): DocumentModel {
    const node = doc.nodes[this.nodeId];
    if (!node) return doc;
    return {
      ...doc,
      nodes: {
        ...doc.nodes,
        [this.nodeId]: { ...node, ...this.prevProps } as SceneNode,
      },
    };
  }
}

export class DeleteNodesCommand implements Command {
  description: string;
  private savedNodes: Record<ID, SceneNode> = {};
  private pageChildrenPositions: { pageId: ID; index: number; id: ID }[] = [];

  constructor(private nodeIds: ID[], private pageId: ID) {
    this.description = `Delete ${this.nodeIds.length} node(s)`;
  }

  execute(doc: DocumentModel): DocumentModel {
    const nextNodes = { ...doc.nodes };
    this.pageChildrenPositions = [];
    const page = doc.pages[this.pageId];

    this.nodeIds.forEach((id) => {
      if (nextNodes[id]) {
        this.savedNodes[id] = nextNodes[id];
        delete nextNodes[id];
      }
      if (page) {
        const idx = page.children.indexOf(id);
        if (idx !== -1) {
          this.pageChildrenPositions.push({ pageId: this.pageId, index: idx, id });
        }
      }
    });

    const nextPages = { ...doc.pages };
    if (page) {
      nextPages[this.pageId] = {
        ...page,
        children: page.children.filter((id) => !this.nodeIds.includes(id)),
      };
    }

    return { ...doc, nodes: nextNodes, pages: nextPages };
  }

  undo(doc: DocumentModel): DocumentModel {
    const nextNodes = { ...doc.nodes, ...this.savedNodes };
    const page = doc.pages[this.pageId];
    const nextPages = { ...doc.pages };
    if (page) {
      const children = [...page.children];
      this.pageChildrenPositions.forEach((pos) => {
        children.splice(pos.index, 0, pos.id);
      });
      nextPages[this.pageId] = { ...page, children };
    }
    return { ...doc, nodes: nextNodes, pages: nextPages };
  }
}

export type LayerMoveDirection = 'up' | 'down' | 'bring-to-front' | 'send-to-back';

/*
export class MoveLayerCommand implements Command {
  description: string;
  private prevChildren: ID[] = [];

  constructor(
    private nodeId: ID,
    private pageId: ID,
    private direction: LayerMoveDirection
  ) {
    this.description = `Move layer ${this.direction}`;
  }

  execute(doc: DocumentModel): DocumentModel {
    const page = doc.pages[this.pageId];
    if (!page) return doc;

    const list = [...page.children];
    const idx = list.indexOf(this.nodeId);
    if (idx === -1) return doc;

    this.prevChildren = [...list];

    list.splice(idx, 1);
    if (this.direction === 'bring-to-front') {
      list.push(this.nodeId);
    } else if (this.direction === 'send-to-back') {
      list.unshift(this.nodeId);
    } else if (this.direction === 'up') {
      const target = Math.min(list.length, idx + 1);
      list.splice(target, 0, this.nodeId);
    } else if (this.direction === 'down') {
      const target = Math.max(0, idx - 1);
      list.splice(target, 0, this.nodeId);
    }

    return {
      ...doc,
      pages: {
        ...doc.pages,
        [this.pageId]: { ...page, children: list },
      },
    };
  }

  undo(doc: DocumentModel): DocumentModel {
    const page = doc.pages[this.pageId];
    if (!page) return doc;
    return {
      ...doc,
      pages: {
        ...doc.pages,
        [this.pageId]: { ...page, children: [...this.prevChildren] },
      },
    };
  }
}
*/
export class MoveLayerCommand implements Command {
  description: string;
  private prevChildren: ID[] = [];
  private parentContainerId: ID | null = null;

  constructor(
    private nodeId: ID,
    private pageId: ID,
    private direction: LayerMoveDirection
  ) {
    this.description = `Move layer ${this.direction}`;
  }

  execute(doc: DocumentModel): DocumentModel {
    const node = doc.nodes[this.nodeId];
    const parentId = node?.parent && doc.nodes[node.parent] ? node.parent : null;
    this.parentContainerId = parentId;

    if (parentId && doc.nodes[parentId]) {
      const parent = doc.nodes[parentId];
      const list = [...(parent.children || [])];
      const idx = list.indexOf(this.nodeId);
      if (idx === -1) return doc;

      this.prevChildren = [...list];
      list.splice(idx, 1);

      if (this.direction === 'bring-to-front') {
        list.push(this.nodeId);
      } else if (this.direction === 'send-to-back') {
        list.unshift(this.nodeId);
      } else if (this.direction === 'up') {
        const target = Math.min(list.length, idx + 1);
        list.splice(target, 0, this.nodeId);
      } else if (this.direction === 'down') {
        const target = Math.max(0, idx - 1);
        list.splice(target, 0, this.nodeId);
      }

      return {
        ...doc,
        nodes: {
          ...doc.nodes,
          [parentId]: { ...parent, children: list },
        },
      };
    }

    const page = doc.pages[this.pageId];
    if (!page) return doc;

    const list = [...page.children];
    const idx = list.indexOf(this.nodeId);
    if (idx === -1) return doc;

    this.prevChildren = [...list];

    list.splice(idx, 1);
    if (this.direction === 'bring-to-front') {
      list.push(this.nodeId);
    } else if (this.direction === 'send-to-back') {
      list.unshift(this.nodeId);
    } else if (this.direction === 'up') {
      const target = Math.min(list.length, idx + 1);
      list.splice(target, 0, this.nodeId);
    } else if (this.direction === 'down') {
      const target = Math.max(0, idx - 1);
      list.splice(target, 0, this.nodeId);
    }

    return {
      ...doc,
      pages: {
        ...doc.pages,
        [this.pageId]: { ...page, children: list },
      },
    };
  }

  undo(doc: DocumentModel): DocumentModel {
    if (this.parentContainerId && doc.nodes[this.parentContainerId]) {
      const parent = doc.nodes[this.parentContainerId];
      return {
        ...doc,
        nodes: {
          ...doc.nodes,
          [this.parentContainerId]: { ...parent, children: [...this.prevChildren] },
        },
      };
    }

    const page = doc.pages[this.pageId];
    if (!page) return doc;
    return {
      ...doc,
      pages: {
        ...doc.pages,
        [this.pageId]: { ...page, children: [...this.prevChildren] },
      },
    };
  }
}

export type AlignmentType = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';

export class AlignNodesCommand implements Command {
  description: string;
  private prevTransforms: Record<ID, Transform> = {};

  constructor(private nodeIds: ID[], private alignment: AlignmentType) {
    this.description = `Align ${this.alignment}`;
  }

  // execute(doc: DocumentModel): DocumentModel {
  //   if (this.nodeIds.length < 2) return doc;
  //   const nodes = this.nodeIds.map((id) => doc.nodes[id]).filter(Boolean);
  //   if (nodes.length < 2) return doc;
  execute(doc: DocumentModel): DocumentModel {
    if (this.nodeIds.length === 0) return doc;

    const nodes = this.nodeIds.map((id) => doc.nodes[id]).filter(Boolean);
    if (nodes.length === 0) return doc;

    this.prevTransforms = {};
    nodes.forEach((n) => {
      this.prevTransforms[n.id] = { ...n.transform };
    });

    const nextNodes = { ...doc.nodes };

    if (nodes.length === 1) {
      const n = nodes[0];
      const parent = n.parent ? doc.nodes[n.parent] : null;
      const bounds = parent
        ? { minX: parent.transform.x, maxX: parent.transform.x + parent.transform.width, minY: parent.transform.y, maxY: parent.transform.y + parent.transform.height }
        : { minX: 100, maxX: 1200, minY: 100, maxY: 800 };

      let x = n.transform.x;
      let y = n.transform.y;

      switch (this.alignment) {
        case 'left':
          x = bounds.minX;
          break;
        case 'center':
          x = bounds.minX + (bounds.maxX - bounds.minX - n.transform.width) / 2;
          break;
        case 'right':
          x = bounds.maxX - n.transform.width;
          break;
        case 'top':
          y = bounds.minY;
          break;
        case 'middle':
          y = bounds.minY + (bounds.maxY - bounds.minY - n.transform.height) / 2;
          break;
        case 'bottom':
          y = bounds.maxY - n.transform.height;
          break;
      }

      nextNodes[n.id] = { ...n, transform: { ...n.transform, x, y } };
      return { ...doc, nodes: nextNodes };
    }

    const minX = Math.min(...nodes.map((n) => n.transform.x));
    const maxX = Math.max(...nodes.map((n) => n.transform.x + n.transform.width));
    const minY = Math.min(...nodes.map((n) => n.transform.y));
    const maxY = Math.max(...nodes.map((n) => n.transform.y + n.transform.height));

    nodes.forEach((n) => {
      let x = n.transform.x;
      let y = n.transform.y;

      switch (this.alignment) {
        case 'left':
          x = minX;
          break;
        case 'center':
          x = minX + (maxX - minX - n.transform.width) / 2;
          break;
        case 'right':
          x = maxX - n.transform.width;
          break;
        case 'top':
          y = minY;
          break;
        case 'middle':
          y = minY + (maxY - minY - n.transform.height) / 2;
          break;
        case 'bottom':
          y = maxY - n.transform.height;
          break;
      }

      nextNodes[n.id] = {
        ...n,
        transform: { ...n.transform, x, y },
      };
    });

    return { ...doc, nodes: nextNodes };
  }

  undo(doc: DocumentModel): DocumentModel {
    const nextNodes = { ...doc.nodes };
    Object.entries(this.prevTransforms).forEach(([id, tr]) => {
      if (nextNodes[id]) {
        nextNodes[id] = { ...nextNodes[id], transform: { ...tr } };
      }
    });
    return { ...doc, nodes: nextNodes };
  }
}

export type DistributionType = 'horizontal' | 'vertical';

export class DistributeNodesCommand implements Command {
  description: string;
  private prevTransforms: Record<ID, Transform> = {};

  constructor(private nodeIds: ID[], private distribution: DistributionType) {
    this.description = `Distribute ${this.distribution}`;
  }

  execute(doc: DocumentModel): DocumentModel {
    if (this.nodeIds.length < 3) return doc;

    const nodes = this.nodeIds.map((id) => doc.nodes[id]).filter(Boolean);
    if (nodes.length < 3) return doc;

    this.prevTransforms = {};
    nodes.forEach((n) => {
      this.prevTransforms[n.id] = { ...n.transform };
    });

    const nextNodes = { ...doc.nodes };

    if (this.distribution === 'horizontal') {
      const sorted = [...nodes].sort((a, b) => a.transform.x - b.transform.x);
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const totalSpan = last.transform.x + last.transform.width - first.transform.x;
      const totalNodesWidth = sorted.reduce((sum, n) => sum + n.transform.width, 0);
      const gap = (totalSpan - totalNodesWidth) / (sorted.length - 1);

      let currentX = first.transform.x;
      sorted.forEach((n) => {
        nextNodes[n.id] = {
          ...n,
          transform: { ...n.transform, x: currentX },
        };
        currentX += n.transform.width + gap;
      });
    } else {
      const sorted = [...nodes].sort((a, b) => a.transform.y - b.transform.y);
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const totalSpan = last.transform.y + last.transform.height - first.transform.y;
      const totalNodesHeight = sorted.reduce((sum, n) => sum + n.transform.height, 0);
      const gap = (totalSpan - totalNodesHeight) / (sorted.length - 1);

      let currentY = first.transform.y;
      sorted.forEach((n) => {
        nextNodes[n.id] = {
          ...n,
          transform: { ...n.transform, y: currentY },
        };
        currentY += n.transform.height + gap;
      });
    }

    return { ...doc, nodes: nextNodes };
  }

  undo(doc: DocumentModel): DocumentModel {
    const nextNodes = { ...doc.nodes };
    Object.entries(this.prevTransforms).forEach(([id, tr]) => {
      if (nextNodes[id]) {
        nextNodes[id] = { ...nextNodes[id], transform: { ...tr } };
      }
    });
    return { ...doc, nodes: nextNodes };
  }
}

/*
Original BatchAddNodesCommand:
export class BatchAddNodesCommand implements Command {
  description: string;

  constructor(private nodes: SceneNode[], private pageId: ID) {
    this.description = `Add ${nodes.length} nodes`;
  }

  execute(doc: DocumentModel): DocumentModel {
    const nextNodes = { ...doc.nodes };
    const newIds: ID[] = [];

    this.nodes.forEach((node) => {
      nextNodes[node.id] = node;
      newIds.push(node.id);
    });

    const page = doc.pages[this.pageId];
    const nextPages = { ...doc.pages };
    if (page) {
      nextPages[this.pageId] = {
        ...page,
        children: [...page.children, ...newIds],
      };
    }

    return { ...doc, nodes: nextNodes, pages: nextPages };
  }

  undo(doc: DocumentModel): DocumentModel {
    const nextNodes = { ...doc.nodes };
    const addedIds = new Set(this.nodes.map((n) => n.id));

    this.nodes.forEach((node) => {
      delete nextNodes[node.id];
    });

    const page = doc.pages[this.pageId];
    const nextPages = { ...doc.pages };
    if (page) {
      nextPages[this.pageId] = {
        ...page,
        children: page.children.filter((id) => !addedIds.has(id)),
      };
    }

    return { ...doc, nodes: nextNodes, pages: nextPages };
  }
}
*/
export class BatchAddNodesCommand implements Command {
  description: string;

  constructor(private nodes: SceneNode[], private pageId: ID) {
    this.description = `Add ${nodes.length} nodes`;
  }

  execute(doc: DocumentModel): DocumentModel {
    const nextNodes = { ...doc.nodes };
    const batchNodeIds = new Set(this.nodes.map((n) => n.id));
    const newRootIds: ID[] = [];

    this.nodes.forEach((node) => {
      nextNodes[node.id] = node;
    });

    this.nodes.forEach((node) => {
      const parentInDoc = node.parent && (doc.nodes[node.parent] || batchNodeIds.has(node.parent));
      if (!parentInDoc) {
        newRootIds.push(node.id);
      } else if (node.parent && doc.nodes[node.parent] && !batchNodeIds.has(node.parent)) {
        const p = nextNodes[node.parent];
        if (p && (!p.children || !p.children.includes(node.id))) {
          nextNodes[node.parent] = {
            ...p,
            children: [...(p.children || []), node.id],
          };
        }
      }
    });

    const page = doc.pages[this.pageId];
    const nextPages = { ...doc.pages };
    if (page) {
      nextPages[this.pageId] = {
        ...page,
        children: [...page.children, ...newRootIds],
      };
    }

    return { ...doc, nodes: nextNodes, pages: nextPages };
  }

  undo(doc: DocumentModel): DocumentModel {
    const nextNodes = { ...doc.nodes };
    const addedIds = new Set(this.nodes.map((n) => n.id));

    this.nodes.forEach((node) => {
      delete nextNodes[node.id];
      if (node.parent && nextNodes[node.parent]) {
        const p = nextNodes[node.parent];
        if (p.children && p.children.some((id) => addedIds.has(id))) {
          nextNodes[node.parent] = {
            ...p,
            children: p.children.filter((id) => !addedIds.has(id)),
          };
        }
      }
    });

    const page = doc.pages[this.pageId];
    const nextPages = { ...doc.pages };
    if (page) {
      nextPages[this.pageId] = {
        ...page,
        children: page.children.filter((id) => !addedIds.has(id)),
      };
    }

    return { ...doc, nodes: nextNodes, pages: nextPages };
  }
}

export class BatchUpdateNodesCommand implements Command {
  description: string;

  constructor(
    private updates: { id: ID; newProps: Partial<SceneNode>; prevProps: Partial<SceneNode> }[]
  ) {
    this.description = `Update ${updates.length} nodes`;
  }

  execute(doc: DocumentModel): DocumentModel {
    const nextNodes = { ...doc.nodes };
    this.updates.forEach(({ id, newProps }) => {
      const node = nextNodes[id];
      if (node) {
        nextNodes[id] = { ...node, ...newProps } as SceneNode;
      }
    });
    return { ...doc, nodes: nextNodes };
  }

  undo(doc: DocumentModel): DocumentModel {
    const nextNodes = { ...doc.nodes };
    this.updates.forEach(({ id, prevProps }) => {
      const node = nextNodes[id];
      if (node) {
        nextNodes[id] = { ...node, ...prevProps } as SceneNode;
      }
    });
    return { ...doc, nodes: nextNodes };
  }
}

/*
export class GroupNodesCommand implements Command {
  description: string;
  private prevPositions: { pageId: ID; index: number; id: ID }[] = [];
}
Original GroupNodesCommand and UngroupNodesCommand:
export class GroupNodesCommand implements Command {
  description: string;
  private prevPositions: { pageId: ID; index: number; id: ID }[] = [];

  constructor(
    private groupNode: SceneNode,
    private memberIds: ID[],
    private pageId: ID
  ) {
    this.description = `Group ${memberIds.length} nodes`;
  }
  ...
}
*/

export class GroupNodesCommand implements Command {
  description: string;
  private prevPositions: { pageId: ID; index: number; id: ID }[] = [];
  private prevParents: Record<ID, ID | null> = {};
  private parentContainerId: ID | null = null;
  private prevContainerChildren: ID[] = [];

  constructor(
    private groupNode: SceneNode,
    private memberIds: ID[],
    private pageId: ID
  ) {
    this.description = `Group ${memberIds.length} nodes`;
  }

  execute(doc: DocumentModel): DocumentModel {
    const page = doc.pages[this.pageId];
    if (!page) return doc;

    this.prevParents = {};
    this.memberIds.forEach((id) => {
      this.prevParents[id] = doc.nodes[id]?.parent || null;
    });

    const firstMember = doc.nodes[this.memberIds[0]];
    const commonParentId = firstMember?.parent || null;
    const allShareParent = Boolean(
      commonParentId && this.memberIds.every((id) => (doc.nodes[id]?.parent || null) === commonParentId)
    );
    this.parentContainerId = allShareParent && commonParentId && doc.nodes[commonParentId] ? commonParentId : null;

    const nextNodes = { ...doc.nodes };
    const actualGroupNode: SceneNode = {
      ...this.groupNode,
      parent: this.parentContainerId,
    };
    nextNodes[actualGroupNode.id] = actualGroupNode;

    this.memberIds.forEach((id) => {
      if (nextNodes[id]) {
        nextNodes[id] = { ...nextNodes[id], parent: actualGroupNode.id };
      }
    });

    const nextPages = { ...doc.pages };

    if (this.parentContainerId && nextNodes[this.parentContainerId]) {
      const container = nextNodes[this.parentContainerId];
      this.prevContainerChildren = container.children ? [...container.children] : [];
      let containerChildren = [...this.prevContainerChildren];
      const firstIdx = containerChildren.findIndex((id) => this.memberIds.includes(id));
      containerChildren = containerChildren.filter((id) => !this.memberIds.includes(id));
      if (firstIdx !== -1) {
        containerChildren.splice(firstIdx, 0, actualGroupNode.id);
      } else {
        containerChildren.push(actualGroupNode.id);
      }
      nextNodes[this.parentContainerId] = {
        ...container,
        children: containerChildren,
      };
    } else {
      this.prevPositions = [];
      this.memberIds.forEach((id) => {
        const idx = page.children.indexOf(id);
        if (idx !== -1) {
          this.prevPositions.push({ pageId: this.pageId, index: idx, id });
        }
      });
      const firstIdx = page.children.findIndex((id) => this.memberIds.includes(id));
      const remainingChildren = page.children.filter((id) => !this.memberIds.includes(id));
      const newPageChildren = [...remainingChildren];
      if (firstIdx !== -1) {
        newPageChildren.splice(firstIdx, 0, actualGroupNode.id);
      } else {
        newPageChildren.push(actualGroupNode.id);
      }
      nextPages[this.pageId] = {
        ...page,
        children: newPageChildren,
      };
    }

    return { ...doc, nodes: nextNodes, pages: nextPages };
  }

  undo(doc: DocumentModel): DocumentModel {
    const nextNodes = { ...doc.nodes };
    delete nextNodes[this.groupNode.id];

    this.memberIds.forEach((id) => {
      if (nextNodes[id]) {
        nextNodes[id] = { ...nextNodes[id], parent: this.prevParents[id] ?? null };
      }
    });

    if (this.parentContainerId && nextNodes[this.parentContainerId]) {
      const container = nextNodes[this.parentContainerId];
      nextNodes[this.parentContainerId] = {
        ...container,
        children: [...this.prevContainerChildren],
      };
      return { ...doc, nodes: nextNodes };
    }

    const page = doc.pages[this.pageId];
    const nextPages = { ...doc.pages };
    if (page) {
      let children = page.children.filter((id) => id !== this.groupNode.id);
      this.prevPositions.forEach((pos) => {
        children.splice(pos.index, 0, pos.id);
      });
      nextPages[this.pageId] = { ...page, children };
    }

    return { ...doc, nodes: nextNodes, pages: nextPages };
  }
}

export class UngroupNodesCommand implements Command {
  description: string;
  private savedGroup: SceneNode | null = null;
  private groupPosition: number = -1;
  private parentContainerId: ID | null = null;
  private prevContainerChildren: ID[] = [];

  constructor(
    private groupId: ID,
    private pageId: ID
  ) {
    this.description = `Ungroup`;
  }

  execute(doc: DocumentModel): DocumentModel {
    const group = doc.nodes[this.groupId];
    const page = doc.pages[this.pageId];
    if (!group || !page) return doc;

    this.savedGroup = group;
    this.parentContainerId = group.parent && doc.nodes[group.parent] ? group.parent : null;
    const memberIds = group.children || [];

    const nextNodes = { ...doc.nodes };
    delete nextNodes[this.groupId];

    memberIds.forEach((id) => {
      if (nextNodes[id]) {
        nextNodes[id] = { ...nextNodes[id], parent: this.parentContainerId };
      }
    });

    if (this.parentContainerId && nextNodes[this.parentContainerId]) {
      const container = nextNodes[this.parentContainerId];
      this.prevContainerChildren = container.children ? [...container.children] : [];
      let containerChildren = [...this.prevContainerChildren];
      const gIdx = containerChildren.indexOf(this.groupId);
      if (gIdx !== -1) {
        containerChildren.splice(gIdx, 1, ...memberIds);
      } else {
        containerChildren.push(...memberIds);
      }
      nextNodes[this.parentContainerId] = {
        ...container,
        children: containerChildren,
      };
      return { ...doc, nodes: nextNodes };
    }

    this.groupPosition = page.children.indexOf(this.groupId);
    const children = [...page.children];
    if (this.groupPosition !== -1) {
      children.splice(this.groupPosition, 1, ...memberIds);
    } else {
      children.push(...memberIds);
    }

    return {
      ...doc,
      nodes: nextNodes,
      pages: {
        ...doc.pages,
        [this.pageId]: { ...page, children },
      },
    };
  }

  undo(doc: DocumentModel): DocumentModel {
    if (!this.savedGroup) return doc;
    const group = this.savedGroup;
    const memberIds = group.children || [];
    const nextNodes = { ...doc.nodes, [group.id]: group };

    memberIds.forEach((id) => {
      if (nextNodes[id]) {
        nextNodes[id] = { ...nextNodes[id], parent: group.id };
      }
    });

    if (this.parentContainerId && nextNodes[this.parentContainerId]) {
      const container = nextNodes[this.parentContainerId];
      nextNodes[this.parentContainerId] = {
        ...container,
        children: [...this.prevContainerChildren],
      };
      return { ...doc, nodes: nextNodes };
    }

    const page = doc.pages[this.pageId];
    if (!page) return doc;

    let children = page.children.filter((id) => !memberIds.includes(id));
    if (this.groupPosition !== -1) {
      children.splice(this.groupPosition, 0, group.id);
    } else {
      children.push(group.id);
    }

    return {
      ...doc,
      nodes: nextNodes,
      pages: {
        ...doc.pages,
        [this.pageId]: { ...page, children },
      },
    };
  }
}

export class ReorderNodesCommand implements Command {
  description: string;
  private pageId: ID;
  private newChildren: ID[];
  private prevChildren: ID[];

  constructor(
    pageId: ID,
    newChildren: ID[],
    prevChildren: ID[]
  ) {
    this.description = 'Reorder layers';
    this.pageId = pageId;
    this.newChildren = [...newChildren];
    this.prevChildren = [...prevChildren];
  }

  execute(doc: DocumentModel): DocumentModel {
    const page = doc.pages[this.pageId];
    if (!page) return doc;
    return {
      ...doc,
      pages: {
        ...doc.pages,
        [this.pageId]: { ...page, children: [...this.newChildren] },
      },
    };
  }

  undo(doc: DocumentModel): DocumentModel {
    const page = doc.pages[this.pageId];
    if (!page) return doc;
    return {
      ...doc,
      pages: {
        ...doc.pages,
        [this.pageId]: { ...page, children: [...this.prevChildren] },
      },
    };
  }
}

/*
Snapshot command used for structural edits (layer reordering, container moves) that
are computed in one pass. Stores the resulting document and restores the previous one.
*/
export class DocumentSnapshotCommand implements Command {
  description: string;

  constructor(
    private nextDoc: DocumentModel,
    private prevDoc: DocumentModel,
    description = 'Edit document'
  ) {
    this.description = description;
  }

  execute(): DocumentModel {
    return this.nextDoc;
  }

  undo(): DocumentModel {
    return this.prevDoc;
  }
}
