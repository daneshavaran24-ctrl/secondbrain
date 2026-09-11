import { NetworkingContact } from "@/services/networkingService";

export interface NetworkNode {
  id: string;
  name: string;
  title?: string;
  category: string;
  status: string;
  strength: number;
  organization?: string;
  tags: string[];
  metAtEvent?: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface NetworkLink {
  source: string | NetworkNode;
  target: string | NetworkNode;
  strength: number;
  type: 'tag' | 'organization' | 'event' | 'category';
}

export const categoryColors: Record<string, string> = {
  mentor: '#8b5cf6',      // Purple
  advisor: '#06b6d4',     // Cyan
  investor: '#10b981',    // Green
  partner: '#3b82f6',     // Blue
  client: '#f59e0b',      // Amber
  peer: '#ec4899',        // Pink
  influencer: '#ef4444',  // Red
  other: '#6b7280',       // Gray
};

export const statusBorderColors: Record<string, string> = {
  hot: '#ef4444',
  warm: '#f59e0b',
  active: '#10b981',
  dormant: '#6b7280',
  cold: '#3b82f6',
};

export const categoryLabels: Record<string, string> = {
  mentor: 'منتور',
  advisor: 'مشاور',
  investor: 'سرمایه‌گذار',
  partner: 'شریک',
  client: 'مشتری',
  peer: 'همتا',
  influencer: 'اینفلوئنسر',
  other: 'سایر',
};

export function contactsToNodes(contacts: NetworkingContact[]): NetworkNode[] {
  return contacts.map(contact => ({
    id: contact.id,
    name: contact.name,
    title: contact.title || undefined,
    category: contact.category || 'other',
    status: contact.status || 'active',
    strength: contact.relationship_strength || 3,
    organization: contact.organization_name || undefined,
    tags: contact.tags || [],
    metAtEvent: contact.met_at_event || undefined,
  }));
}

export function calculateLinks(nodes: NetworkNode[]): NetworkLink[] {
  const links: NetworkLink[] = [];
  const addedLinks = new Set<string>();

  const addLink = (source: string, target: string, strength: number, type: NetworkLink['type']) => {
    const key = [source, target].sort().join('-');
    if (!addedLinks.has(key) && source !== target) {
      addedLinks.add(key);
      links.push({ source, target, strength, type });
    }
  };

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const nodeA = nodes[i];
      const nodeB = nodes[j];
      let totalStrength = 0;
      let linkType: NetworkLink['type'] = 'category';

      // Check shared organization (strongest link)
      if (nodeA.organization && nodeB.organization && 
          nodeA.organization.toLowerCase() === nodeB.organization.toLowerCase()) {
        totalStrength += 0.5;
        linkType = 'organization';
      }

      // Check shared event
      if (nodeA.metAtEvent && nodeB.metAtEvent &&
          nodeA.metAtEvent.toLowerCase() === nodeB.metAtEvent.toLowerCase()) {
        totalStrength += 0.3;
        if (linkType === 'category') linkType = 'event';
      }

      // Check shared tags
      const sharedTags = nodeA.tags.filter(tag => 
        nodeB.tags.some(t => t.toLowerCase() === tag.toLowerCase())
      );
      if (sharedTags.length > 0) {
        totalStrength += Math.min(sharedTags.length * 0.25, 0.5);
        if (linkType === 'category') linkType = 'tag';
      }

      // Check same category (weakest link)
      if (nodeA.category === nodeB.category && totalStrength === 0) {
        totalStrength = 0.15;
        linkType = 'category';
      }

      if (totalStrength > 0) {
        addLink(nodeA.id, nodeB.id, Math.min(totalStrength, 1), linkType);
      }
    }
  }

  return links;
}

export function getNodeRadius(strength: number): number {
  return 12 + (strength - 1) * 4; // 12-28px based on strength 1-5
}

export function getLinkColor(type: NetworkLink['type']): string {
  switch (type) {
    case 'organization': return '#10b981';
    case 'event': return '#8b5cf6';
    case 'tag': return '#3b82f6';
    case 'category': return '#9ca3af';
    default: return '#9ca3af';
  }
}

export function calculateGraphStats(nodes: NetworkNode[], links: NetworkLink[]) {
  const connectionCounts = new Map<string, number>();
  
  links.forEach(link => {
    const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
    const targetId = typeof link.target === 'string' ? link.target : link.target.id;
    connectionCounts.set(sourceId, (connectionCounts.get(sourceId) || 0) + 1);
    connectionCounts.set(targetId, (connectionCounts.get(targetId) || 0) + 1);
  });

  const hubNodes = nodes
    .map(node => ({ node, connections: connectionCounts.get(node.id) || 0 }))
    .sort((a, b) => b.connections - a.connections)
    .slice(0, 3);

  const categoryDistribution = nodes.reduce((acc, node) => {
    acc[node.category] = (acc[node.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalNodes: nodes.length,
    totalLinks: links.length,
    hubNodes,
    categoryDistribution,
    avgConnections: nodes.length > 0 ? (links.length * 2 / nodes.length).toFixed(1) : '0',
  };
}
