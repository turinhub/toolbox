declare module "*.md" {
  const content: string;
  export default content;
}

declare module "*.mdx" {
  const content: string;
  export default content;
}

// Type declarations for react-syntax-highlighter
declare module 'react-syntax-highlighter' {
  import { ComponentType } from 'react';
  
  export interface SyntaxHighlighterProps {
    language?: string;
    style?: any;
    children: string;
    className?: string;
    customStyle?: React.CSSProperties;
    [key: string]: any;
  }
  
  const SyntaxHighlighter: ComponentType<SyntaxHighlighterProps>;
  export default SyntaxHighlighter;
}

declare module 'react-syntax-highlighter/dist/esm/styles/hljs' {
  export const docco: any;
  export const dark: any;
  export const prism: any;
  export default any;
}

declare module 'react-syntax-highlighter/dist/esm/styles/prism' {
  export const dark: any;
  export const docco: any;
  export default any;
}