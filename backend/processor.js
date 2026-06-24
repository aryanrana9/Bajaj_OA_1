/**
 * Processes the graph nodes and returns hierarchical insights.
 * 
 * @param {string[]} data - Array of node strings (e.g. ["A->B", "A->C"])
 * @param {Object} credentials - Identity details
 * @param {string} credentials.user_id
 * @param {string} credentials.email_id
 * @param {string} credentials.college_roll_number
 */
export function processGraph(data, credentials) {
  const invalid_entries = [];
  const duplicate_edges_set = new Set();
  const seen_edges = new Set();
  const child_to_parent = {};
  const valid_kept_edges = [];
  
  // Track all unique nodes that are part of valid kept edges
  const nodes_set = new Set();

  if (!Array.isArray(data)) {
    return {
      ...credentials,
      hierarchies: [],
      invalid_entries: [],
      duplicate_edges: [],
      summary: {
        total_trees: 0,
        total_cycles: 0,
        largest_tree_root: null
      }
    };
  }

  // Track the first appearance index of each node in the input data
  // to preserve original ordering of components.
  const first_appearance_idx = {};

  data.forEach((entry, index) => {
    if (typeof entry !== 'string') {
      invalid_entries.push(String(entry));
      return;
    }

    const trimmed = entry.trim();
    
    // Pattern X->Y where X and Y are single uppercase letters
    const match = trimmed.match(/^([A-Z])->([A-Z])$/);
    if (!match) {
      invalid_entries.push(entry); // Push original string as requested
      return;
    }

    const parent = match[1];
    const child = match[2];

    // Self-loops are treated as invalid
    if (parent === child) {
      invalid_entries.push(entry);
      return;
    }

    // Keep track of node first appearance in raw input for ordering later
    if (first_appearance_idx[parent] === undefined) {
      first_appearance_idx[parent] = index;
    }
    if (first_appearance_idx[child] === undefined) {
      first_appearance_idx[child] = index;
    }

    const edge_str = `${parent}->${child}`;

    // Duplicate Check
    if (seen_edges.has(edge_str)) {
      duplicate_edges_set.add(edge_str);
      return;
    }
    seen_edges.add(edge_str);

    // Multi-parent Check:
    // If the child already has a parent, the first-encountered parent wins.
    // Subsequent parents are silently discarded.
    if (child_to_parent[child] !== undefined) {
      // Silently discard
      return;
    }

    // Accept edge
    child_to_parent[child] = parent;
    valid_kept_edges.push({ parent, child });
    nodes_set.add(parent);
    nodes_set.add(child);
  });

  // Build Adjacency List for directed traversal
  const adj = {};
  // Build Undirected Adjacency List for finding connected components
  const undirected_adj = {};

  nodes_set.forEach(node => {
    adj[node] = [];
    undirected_adj[node] = [];
  });

  valid_kept_edges.forEach(({ parent, child }) => {
    adj[parent].push(child);
    undirected_adj[parent].push(child);
    undirected_adj[child].push(parent);
  });

  // Find connected components
  const visited = new Set();
  const components = [];

  nodes_set.forEach(node => {
    if (!visited.has(node)) {
      const component = [];
      const queue = [node];
      visited.add(node);

      while (queue.length > 0) {
        const curr = queue.shift();
        component.push(curr);

        const neighbors = undirected_adj[curr] || [];
        neighbors.forEach(nbr => {
          if (!visited.has(nbr)) {
            visited.add(nbr);
            queue.push(nbr);
          }
        });
      }
      components.push(component);
    }
  });

  const hierarchies = [];

  components.forEach(component => {
    // Find all root candidates in this component (nodes with no parent in child_to_parent)
    const roots = component.filter(node => child_to_parent[node] === undefined);

    // Track minimum appearance index of any node in the component to sort components later
    const component_min_idx = Math.min(...component.map(node => first_appearance_idx[node]));

    if (roots.length === 1) {
      // Valid Tree
      const root = roots[0];

      // Recursive tree builder
      const buildTree = (currNode) => {
        const children = adj[currNode] || [];
        // Sort children alphabetically for deterministic presentation
        const sortedChildren = [...children].sort();
        const treeNode = {};
        sortedChildren.forEach(child => {
          treeNode[child] = buildTree(child);
        });
        return treeNode;
      };

      // Recursive depth calculator
      const getDepth = (currNode) => {
        const children = adj[currNode] || [];
        let maxChildDepth = 0;
        children.forEach(child => {
          maxChildDepth = Math.max(maxChildDepth, getDepth(child));
        });
        return 1 + maxChildDepth;
      };

      hierarchies.push({
        root,
        tree: {
          [root]: buildTree(root)
        },
        depth: getDepth(root),
        _min_idx: component_min_idx // Temporary property for sorting
      });
    } else {
      // Cyclic component (0 roots)
      // Lexicographically smallest node in the component is the root
      const sortedNodes = [...component].sort();
      const root = sortedNodes[0];

      hierarchies.push({
        root,
        tree: {},
        has_cycle: true,
        _min_idx: component_min_idx // Temporary property for sorting
      });
    }
  });

  // Sort hierarchies by the order in which their component first appeared in the input
  hierarchies.sort((a, b) => a._min_idx - b._min_idx);

  // Remove temporary properties
  hierarchies.forEach(h => {
    delete h._min_idx;
  });

  // Summary Metrics
  const tree_hierarchies = hierarchies.filter(h => !h.has_cycle);
  const cycle_hierarchies = hierarchies.filter(h => h.has_cycle);

  const total_trees = tree_hierarchies.length;
  const total_cycles = cycle_hierarchies.length;

  let largest_tree_root = null;
  if (total_trees > 0) {
    // Sort tree hierarchies by depth descending, then alphabetically ascending by root
    const sortedTrees = [...tree_hierarchies].sort((a, b) => {
      if (b.depth !== a.depth) {
        return b.depth - a.depth;
      }
      return a.root.localeCompare(b.root);
    });
    largest_tree_root = sortedTrees[0].root;
  }

  return {
    user_id: credentials.user_id,
    email_id: credentials.email_id,
    college_roll_number: credentials.college_roll_number,
    hierarchies,
    invalid_entries,
    duplicate_edges: Array.from(duplicate_edges_set),
    summary: {
      total_trees,
      total_cycles,
      largest_tree_root
    }
  };
}
