import { MetadataRoute } from 'next';
import { toolCategories } from '@/lib/routes';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://turinhub.com';
  
  // 首页
  const homePage = {
    url: baseUrl,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 1,
  };

  // 工具页面
  const toolPages = toolCategories.flatMap(category => 
    category.tools.map(tool => ({
      url: `${baseUrl}${tool.path}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  );

  // 工具列表页
  const toolsListPage = {
    url: `${baseUrl}/tools`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  };

  return [homePage, toolsListPage, ...toolPages];
}