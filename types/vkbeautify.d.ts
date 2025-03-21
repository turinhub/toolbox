declare module 'vkbeautify' {
  interface VkBeautify {
    xml: (text: string, indent?: string) => string;
    json: (text: string, indent?: string) => string;
    css: (text: string, indent?: string) => string;
    sql: (text: string, indent?: string) => string;
    xmlmin: (text: string, preserveComments?: boolean) => string;
    jsonmin: (text: string) => string;
    cssmin: (text: string, preserveComments?: boolean) => string;
    sqlmin: (text: string) => string;
  }

  const vkbeautify: VkBeautify;
  export default vkbeautify;
} 