// Initial-rank interface checks from the tableau descent formulas.
// The group descent function is supplied separately by domino_runtime.cjs.
const assert = require('assert');

const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const forkPatterns = [
  [[1,1,1,1], [2,1,2,1]],
  [[1,1,1,0], [2,2,1,1]],
  [[1,1,1,1], [2,3,1,1]]
];

function tableauDescents(list) {
  const result = [forkPatterns.some(p => equal(p, list.slice(0, 2)))];
  for (let i = 1; i < list.length; i++) {
    result.push(list[i - 1][1] + list[i - 1][3] < list[i][1]);
  }
  return result;
}

function transpose(list) {
  return list.map(([label, row, col, vertical]) =>
    [label, col, row, 1 - vertical]);
}

function checkTableauDomain(d, w, pair) {
  const left = d.list(pair.left);
  assert(equal(tableauDescents(left), d.desc(w)),
    'Tableau and group descent sets differ');
  const negated = d.rs(w.map(a => -a));
  assert(equal(d.list(negated.left), transpose(left)),
    'Insertion tableau transpose identity fails');
  assert(equal(d.list(negated.right), transpose(d.list(pair.right))),
    'Recording tableau transpose identity fails');
  return {descentValues: w.length, transposePairs: 1};
}

module.exports = {tableauDescents, checkTableauDomain};
