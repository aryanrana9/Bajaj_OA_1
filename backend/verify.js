import { processGraph } from './processor.js';
import assert from 'assert';

const credentials = {
  user_id: "johndoe_17091999",
  email_id: "john.doe@college.edu",
  college_roll_number: "21CS1001"
};

function testExamplePayload() {
  console.log("Running testExamplePayload...");
  
  const data = [
    "A->B", "A->C", "B->D", "C->E", "E->F",
    "X->Y", "Y->Z", "Z->X",
    "P->Q", "Q->R",
    "G->H", "G->H", "G->I",
    "hello", "1->2", "A->"
  ];

  const result = processGraph(data, credentials);

  // Assert user credentials
  assert.strictEqual(result.user_id, credentials.user_id);
  assert.strictEqual(result.email_id, credentials.email_id);
  assert.strictEqual(result.college_roll_number, credentials.college_roll_number);

  // Assert invalid_entries
  assert.deepStrictEqual(result.invalid_entries, ["hello", "1->2", "A->"]);

  // Assert duplicate_edges
  assert.deepStrictEqual(result.duplicate_edges, ["G->H"]);

  // Assert summaries
  assert.strictEqual(result.summary.total_trees, 3);
  assert.strictEqual(result.summary.total_cycles, 1);
  assert.strictEqual(result.summary.largest_tree_root, "A");

  // Assert hierarchies length
  assert.strictEqual(result.hierarchies.length, 4);

  // Check hierarchy 1: Root A
  assert.strictEqual(result.hierarchies[0].root, "A");
  assert.deepStrictEqual(result.hierarchies[0].tree, {
    "A": {
      "B": { "D": {} },
      "C": {
        "E": { "F": {} }
      }
    }
  });
  assert.strictEqual(result.hierarchies[0].depth, 4);
  assert.strictEqual(result.hierarchies[0].has_cycle, undefined);

  // Check hierarchy 2: Root X (Cycle)
  assert.strictEqual(result.hierarchies[1].root, "X");
  assert.deepStrictEqual(result.hierarchies[1].tree, {});
  assert.strictEqual(result.hierarchies[1].has_cycle, true);
  assert.strictEqual(result.hierarchies[1].depth, undefined);

  // Check hierarchy 3: Root P
  assert.strictEqual(result.hierarchies[2].root, "P");
  assert.deepStrictEqual(result.hierarchies[2].tree, {
    "P": {
      "Q": { "R": {} }
    }
  });
  assert.strictEqual(result.hierarchies[2].depth, 3);

  // Check hierarchy 4: Root G
  assert.strictEqual(result.hierarchies[3].root, "G");
  assert.deepStrictEqual(result.hierarchies[3].tree, {
    "G": {
      "H": {},
      "I": {}
    }
  });
  assert.strictEqual(result.hierarchies[3].depth, 2);

  console.log("testExamplePayload PASSED!\n");
}

function testMultiParentCase() {
  console.log("Running testMultiParentCase...");
  
  // A->D is first, B->D is second. B->D should be silently discarded.
  const data = [
    "A->D", "B->D", "A->C", "B->E"
  ];

  const result = processGraph(data, credentials);

  // Root A should have C and D
  // Root B should have E (D was discarded as child of B)
  assert.strictEqual(result.hierarchies.length, 2);
  
  const rootA = result.hierarchies.find(h => h.root === "A");
  const rootB = result.hierarchies.find(h => h.root === "B");

  assert.ok(rootA);
  assert.ok(rootB);

  assert.deepStrictEqual(rootA.tree, {
    "A": { "C": {}, "D": {} }
  });
  assert.strictEqual(rootA.depth, 2);

  assert.deepStrictEqual(rootB.tree, {
    "B": { "E": {} }
  });
  assert.strictEqual(rootB.depth, 2);

  assert.deepStrictEqual(result.duplicate_edges, []);
  assert.deepStrictEqual(result.invalid_entries, []);

  console.log("testMultiParentCase PASSED!\n");
}

function testTieBreaker() {
  console.log("Running testTieBreaker...");

  // Two trees: Z->Y (depth 2) and M->N (depth 2).
  // largest_tree_root should break tie lexicographically: "M" < "Z" => "M"
  const data = [
    "Z->Y", "M->N"
  ];

  const result = processGraph(data, credentials);
  assert.strictEqual(result.summary.largest_tree_root, "M");

  console.log("testTieBreaker PASSED!\n");
}

function runAll() {
  try {
    testExamplePayload();
    testMultiParentCase();
    testTieBreaker();
    console.log("ALL TESTS PASSED SUCCESSFULLY!");
  } catch (err) {
    console.error("TEST FAILED:", err);
    process.exit(1);
  }
}

runAll();
