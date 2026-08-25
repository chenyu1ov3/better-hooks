export const locales = ['en', 'zh-CN'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export type UiDictionary = {
  languageName: string;
  navigation: {
    docs: string;
    hooks: string;
    playground: string;
    changelog: string;
    github: string;
    menu: string;
  };
  nav: {
    docs: string;
    hooks: string;
    playground: string;
    changelog: string;
  };
  actions: {
    copy: string;
    copied: string;
    reset: string;
    openMenu: string;
    closeMenu: string;
    viewDocs: string;
    viewSource: string;
    exploreHooks: string;
    viewOnGitHub: string;
  };
  search: {
    label: string;
    placeholder: string;
    noResults: string;
    clear: string;
  };
  filters: {
    all: string;
    categories: string;
    state: string;
    async: string;
    browserDom: string;
    forms: string;
    storage: string;
    lifecycle: string;
  };
  categories: {
    state: string;
    async: string;
    'browser-dom': string;
    forms: string;
    storage: string;
    lifecycle: string;
  };
  theme: {
    label: string;
    system: string;
    light: string;
    dark: string;
  };
  docs: {
    start: string;
    concepts: string;
    introduction: string;
    installation: string;
    gettingStarted: string;
    react19: string;
    performance: string;
    supportMatrix: string;
    onThisPage: string;
    previous: string;
    next: string;
    editPage: string;
    overview: string;
    signature: string;
    parameters: string;
    returns: string;
    behavior: string;
    ssrRsc: string;
    example: string;
    composition: string;
    source: string;
  };
  common: {
    react19: string;
    clientOnly: string;
    liveExample: string;
    sourceCode: string;
    skipToContent: string;
  };
};

export const dictionaries = {
  en: {
    languageName: 'English',
    navigation: {
      docs: 'Docs',
      hooks: 'Hooks',
      playground: 'Playground',
      changelog: 'Changelog',
      github: 'GitHub',
      menu: 'Menu',
    },
    nav: {
      docs: 'Docs',
      hooks: 'Hooks',
      playground: 'Playground',
      changelog: 'Changelog',
    },
    actions: {
      copy: 'Copy',
      copied: 'Copied',
      reset: 'Reset',
      openMenu: 'Open menu',
      closeMenu: 'Close menu',
      viewDocs: 'View documentation',
      viewSource: 'View source',
      exploreHooks: 'Explore hooks',
      viewOnGitHub: 'View on GitHub',
    },
    search: {
      label: 'Search documentation',
      placeholder: 'Search hooks and docs…',
      noResults: 'No results found.',
      clear: 'Clear search',
    },
    filters: {
      all: 'All hooks',
      categories: 'Categories',
      state: 'State',
      async: 'Async',
      browserDom: 'Browser & DOM',
      forms: 'Forms',
      storage: 'Storage',
      lifecycle: 'Lifecycle',
    },
    categories: {
      state: 'State',
      async: 'Async',
      'browser-dom': 'Browser & DOM',
      forms: 'Forms',
      storage: 'Storage',
      lifecycle: 'Lifecycle',
    },
    theme: {
      label: 'Theme',
      system: 'System',
      light: 'Light',
      dark: 'Dark',
    },
    docs: {
      start: 'Start here',
      concepts: 'Concepts',
      introduction: 'Introduction',
      installation: 'Installation',
      gettingStarted: 'Getting started',
      react19: 'React 19',
      performance: 'Performance',
      supportMatrix: 'Support matrix',
      onThisPage: 'On this page',
      previous: 'Previous',
      next: 'Next',
      editPage: 'Edit this page',
      overview: 'Overview',
      signature: 'Signature',
      parameters: 'Parameters',
      returns: 'Returns',
      behavior: 'Behavior',
      ssrRsc: 'SSR / RSC',
      example: 'Example',
      composition: 'Composition',
      source: 'Source',
    },
    common: {
      react19: 'React 19',
      clientOnly: 'Client Component',
      liveExample: 'Live example',
      sourceCode: 'Source code',
      skipToContent: 'Skip to content',
    },
  },
  'zh-CN': {
    languageName: '简体中文',
    navigation: {
      docs: '文档',
      hooks: 'Hook',
      playground: '在线演练',
      changelog: '更新日志',
      github: 'GitHub',
      menu: '菜单',
    },
    nav: {
      docs: '文档',
      hooks: 'Hook',
      playground: '在线演练',
      changelog: '更新日志',
    },
    actions: {
      copy: '复制',
      copied: '已复制',
      reset: '重置',
      openMenu: '打开菜单',
      closeMenu: '关闭菜单',
      viewDocs: '查看文档',
      viewSource: '查看源码',
      exploreHooks: '查看 Hook',
      viewOnGitHub: '在 GitHub 查看',
    },
    search: {
      label: '搜索文档',
      placeholder: '搜索 Hook 和文档…',
      noResults: '没有找到匹配内容。',
      clear: '清除搜索',
    },
    filters: {
      all: '全部 Hook',
      categories: '分类',
      state: '状态',
      async: '异步',
      browserDom: '浏览器与 DOM',
      forms: '表单',
      storage: '存储',
      lifecycle: '生命周期',
    },
    categories: {
      state: '状态',
      async: '异步',
      'browser-dom': '浏览器与 DOM',
      forms: '表单',
      storage: '存储',
      lifecycle: '生命周期',
    },
    theme: {
      label: '主题',
      system: '跟随系统',
      light: '浅色',
      dark: '深色',
    },
    docs: {
      start: '开始使用',
      concepts: '核心概念',
      introduction: '介绍',
      installation: '安装',
      gettingStarted: '快速开始',
      react19: 'React 19',
      performance: '性能',
      supportMatrix: '支持矩阵',
      onThisPage: '本页内容',
      previous: '上一篇',
      next: '下一篇',
      editPage: '编辑此页',
      overview: '概览',
      signature: '函数签名',
      parameters: '参数',
      returns: '返回值',
      behavior: '行为',
      ssrRsc: 'SSR / RSC',
      example: '示例',
      composition: '组合使用',
      source: '源码',
    },
    common: {
      react19: 'React 19',
      clientOnly: '客户端组件',
      liveExample: '在线示例',
      sourceCode: '示例代码',
      skipToContent: '跳到正文',
    },
  },
} as const satisfies Record<Locale, UiDictionary>;

export function isLocale(value: string): value is Locale {
  return locales.some((locale) => locale === value);
}

export function dictionaryFor(locale: Locale): UiDictionary {
  return dictionaries[locale];
}

export function localePrefix(locale: Locale): '' | '/zh' {
  return locale === 'zh-CN' ? '/zh' : '';
}

export function localeFromSegment(segment: string | undefined): Locale {
  return segment === 'zh' || segment === 'zh-CN' ? 'zh-CN' : defaultLocale;
}
