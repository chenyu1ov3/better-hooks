type HastNode = {
  type?: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};

function isElement(node: HastNode, tagName?: string): boolean {
  return node.type === 'element' && (tagName === undefined || node.tagName === tagName);
}

function textContent(node: HastNode): string {
  if (node.type === 'text') return node.value ?? '';
  return node.children?.map(textContent).join('') ?? '';
}

function visit(node: HastNode) {
  if (
    isElement(node, 'figure') &&
    node.properties &&
    Object.hasOwn(node.properties, 'data-rehype-pretty-code-figure') &&
    node.children
  ) {
    const titleIndex = node.children.findIndex(
      (child) =>
        isElement(child) &&
        child.properties &&
        Object.hasOwn(child.properties, 'data-rehype-pretty-code-title'),
    );
    const pre = node.children.find((child) => isElement(child, 'pre'));

    if (titleIndex >= 0 && pre) {
      pre.properties ??= {};
      pre.properties['data-title'] = textContent(node.children[titleIndex]);
      node.children.splice(titleIndex, 1);
    }
  }

  node.children?.forEach(visit);
}

export function rehypeCodeFrameMetadata() {
  return (tree: HastNode) => visit(tree);
}
