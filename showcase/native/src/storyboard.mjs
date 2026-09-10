// Illustrative motion specimen only. Replace with source-backed project content.
// Keep prior variants; select by ID rather than replacing the previous option.
export const board = {
  revision: 'illustration-r1',
  fps: 30, width: 1920, height: 1080, targetSeconds: 6,
  shots: [
    {id: 'opening', selected: 'rise', entrance: 18, settled: 54, exit: 18,
      purpose: 'Review a title entrance, not product behavior',
      variants: [
        {id: 'rise', title: 'Illustrative motion study', subtitle: 'No live product data or behavior', motion: 'rise'},
        {id: 'fade', title: 'Illustrative motion study', subtitle: 'Alternative: restrained fade', motion: 'fade'}
      ]},
    {id: 'closing', selected: 'fade', entrance: 18, settled: 54, exit: 18,
      purpose: 'Review the closing reading hold',
      variants: [
        {id: 'fade', title: 'Replace with verified content', subtitle: 'Keep source, identity and freshness together', motion: 'fade'},
        {id: 'rise', title: 'Replace with verified content', subtitle: 'Alternative entrance, same timing', motion: 'rise'}
      ]}
  ]
};
