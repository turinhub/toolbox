"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  checkConnection,
  getCatalog,
  getTags,
  getManifest,
  deleteManifest,
} from "./lib/registry-service";
import {
  Loader2,
  Search,
  Database,
  Tag as TagIcon,
  FileJson,
  RefreshCw,
  Server,
  Trash2,
} from "lucide-react";

interface RegistryConfig {
  url: string;
  username?: string;
  password?: string;
}

interface SavedConfig {
  name: string;
  config: RegistryConfig;
}

export default function DockerRegistryPage() {
  // Config State
  const [url, setUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Data State
  const [repositories, setRepositories] = useState<string[]>([]);
  const [filteredRepos, setFilteredRepos] = useState<string[]>([]);
  const [repoSearch, setRepoSearch] = useState("");
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  
  const [tags, setTags] = useState<string[]>([]);
  const [filteredTags, setFilteredTags] = useState<string[]>([]);
  const [tagSearch, setTagSearch] = useState("");
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [manifest, setManifest] = useState<any>(null);
  const [digest, setDigest] = useState<string | null>(null);
  const [isLoadingManifest, setIsLoadingManifest] = useState(false);
  const [isManifestOpen, setIsManifestOpen] = useState(false);

  // Saved Configs
  const [savedConfigs, setSavedConfigs] = useState<SavedConfig[]>([]);
  const [configName, setConfigName] = useState("");
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("docker-registry-configs");
    if (saved) {
      try {
        setSavedConfigs(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved configs", e);
      }
    }
  }, []);

  useEffect(() => {
    if (repoSearch) {
      setFilteredRepos(
        repositories.filter((r) =>
          r.toLowerCase().includes(repoSearch.toLowerCase())
        )
      );
    } else {
      setFilteredRepos(repositories);
    }
  }, [repoSearch, repositories]);

  useEffect(() => {
    if (tagSearch) {
      setFilteredTags(
        tags.filter((t) => t.toLowerCase().includes(tagSearch.toLowerCase()))
      );
    } else {
      setFilteredTags(tags);
    }
  }, [tagSearch, tags]);

  const handleConnect = async (configOverride?: RegistryConfig) => {
    const configToUse = configOverride || { url, username, password };

    if (!configToUse.url) {
      toast.error("请输入 Registry URL");
      return;
    }

    setIsConnecting(true);

    try {
      const res = await checkConnection(configToUse);
      if (res.success) {
        toast.success("连接成功");
        setIsConnected(true);
        loadCatalog(configToUse);
      } else {
        toast.error(res.error || "连接失败");
      }
    } catch (e: any) {
      toast.error(e.message || "连接出错");
    } finally {
      setIsConnecting(false);
    }
  };

  const loadCatalog = async (config: RegistryConfig) => {
    try {
      const res = await getCatalog(config);
      if (res.success) {
        setRepositories(res.repositories);
        setFilteredRepos(res.repositories);
      } else {
        toast.error(res.error || "获取仓库列表失败");
      }
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleRepoSelect = async (repo: string) => {
    setSelectedRepo(repo);
    setTags([]);
    setFilteredTags([]);
    setIsLoadingTags(true);
    
    try {
      const res = await getTags({ url, username, password }, repo);
      if (res.success) {
        setTags(res.tags);
        setFilteredTags(res.tags);
      } else {
        toast.error(res.error || "获取 Tags 失败");
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsLoadingTags(false);
    }
  };

  const handleTagSelect = async (tag: string) => {
    setSelectedTag(tag);
    setIsLoadingManifest(true);
    setIsManifestOpen(true);
    setManifest(null);
    setDigest(null);

    try {
      const res = await getManifest(
        { url, username, password },
        selectedRepo!,
        tag
      );
      if (res.success) {
        setManifest(res.manifest);
        setDigest(res.digest || null);
      } else {
        toast.error(res.error || "获取 Manifest 失败");
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsLoadingManifest(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRepo || !digest) return;

    if (!confirm("确定要删除该镜像吗？此操作不可恢复。\n注意：某些 Registry 可能未开启删除功能。")) return;

    try {
      const res = await deleteManifest(
        { url, username, password },
        selectedRepo,
        digest
      );
      if (res.success) {
        toast.success("镜像删除成功");
        setIsManifestOpen(false);
        // Refresh tags
        handleRepoSelect(selectedRepo);
      } else {
        // @ts-ignore
        toast.error(res.error || "删除失败");
      }
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const saveConfig = () => {
    if (!configName) {
      toast.error("请输入配置名称");
      return;
    }
    const newConfig = {
      name: configName,
      config: { url, username, password },
    };
    const newConfigs = [...savedConfigs, newConfig];
    setSavedConfigs(newConfigs);
    localStorage.setItem(
      "docker-registry-configs",
      JSON.stringify(newConfigs)
    );
    toast.success("配置已保存");
    setConfigName("");
  };

  const loadConfig = (saved: SavedConfig) => {
    setUrl(saved.config.url);
    setUsername(saved.config.username || "");
    setPassword(saved.config.password || "");
    setIsConfigDialogOpen(false);
    toast.success(`已加载配置: ${saved.name}`);
    
    // Auto connect
    handleConnect(saved.config);
  };

  const deleteConfig = (index: number) => {
    const newConfigs = [...savedConfigs];
    newConfigs.splice(index, 1);
    setSavedConfigs(newConfigs);
    localStorage.setItem(
      "docker-registry-configs",
      JSON.stringify(newConfigs)
    );
    toast.success("配置已删除");
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">
            Docker Registry 管理
          </h2>
          <p className="text-muted-foreground">
            在线浏览和管理 Docker Registry 镜像仓库
          </p>
        </div>
      </div>

      {/* Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            连接配置
          </CardTitle>
          <CardDescription>配置 Docker Registry 地址和认证信息</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="url">Registry URL</Label>
              <Input
                id="url"
                placeholder="https://registry.example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">用户名 (可选)</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码 (可选)</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4 mt-4">
            <Button onClick={() => handleConnect()} disabled={isConnecting}>
              {isConnecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isConnected ? "重新连接" : "连接 Registry"}
            </Button>
            
            <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">管理配置</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>已保存的配置</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input 
                        placeholder="配置名称" 
                        value={configName}
                        onChange={(e) => setConfigName(e.target.value)}
                    />
                    <Button onClick={saveConfig}>保存当前</Button>
                  </div>
                  <div className="space-y-2">
                    {savedConfigs.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 border rounded hover:bg-muted/50"
                      >
                        <div className="cursor-pointer flex-1" onClick={() => loadConfig(item)}>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-xs text-muted-foreground">{item.config.url}</div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteConfig(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    {savedConfigs.length === 0 && (
                        <div className="text-center text-muted-foreground py-4">暂无保存的配置</div>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {isConnected && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
          {/* Repositories List */}
          <Card className="col-span-1 flex flex-col h-full">
            <CardHeader className="py-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="h-4 w-4" />
                仓库列表 ({repositories.length})
              </CardTitle>
              <div className="relative mt-2">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索仓库..."
                  className="pl-8"
                  value={repoSearch}
                  onChange={(e) => setRepoSearch(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
              <ScrollArea className="h-full">
                <div className="flex flex-col p-2 gap-1">
                  {filteredRepos.map((repo) => (
                    <Button
                      key={repo}
                      variant={selectedRepo === repo ? "secondary" : "ghost"}
                      className="justify-start h-auto py-2 px-3 font-normal"
                      onClick={() => handleRepoSelect(repo)}
                    >
                      <div className="truncate text-left w-full" title={repo}>
                        {repo}
                      </div>
                    </Button>
                  ))}
                  {filteredRepos.length === 0 && (
                    <div className="text-center text-sm text-muted-foreground py-4">
                      未找到仓库
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Tags List */}
          <Card className="col-span-1 md:col-span-2 flex flex-col h-full">
            <CardHeader className="py-4 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <TagIcon className="h-4 w-4" />
                  {selectedRepo ? `${selectedRepo} 的 Tags` : "Tags"} 
                  {selectedRepo && `(${tags.length})`}
                </CardTitle>
                {selectedRepo && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRepoSelect(selectedRepo)}
                    title="刷新"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {selectedRepo && (
                <div className="relative mt-2">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                    placeholder="搜索 Tag..."
                    className="pl-8"
                    value={tagSearch}
                    onChange={(e) => setTagSearch(e.target.value)}
                    />
                </div>
              )}
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0 bg-muted/10">
              {!selectedRepo ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  请从左侧选择一个仓库
                </div>
              ) : isLoadingTags ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ScrollArea className="h-full p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {filteredTags.map((tag) => (
                      <Button
                        key={tag}
                        variant="outline"
                        className="justify-start"
                        onClick={() => handleTagSelect(tag)}
                      >
                        <TagIcon className="mr-2 h-3 w-3" />
                        <span className="truncate" title={tag}>{tag}</span>
                      </Button>
                    ))}
                    {filteredTags.length === 0 && (
                        <div className="col-span-full text-center text-muted-foreground py-8">
                            未找到 Tags
                        </div>
                    )}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Manifest Sheet */}
      <Sheet open={isManifestOpen} onOpenChange={setIsManifestOpen}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
                <FileJson className="h-5 w-5" />
                镜像详情
            </SheetTitle>
            <SheetDescription>
                {selectedRepo}:{selectedTag}
            </SheetDescription>
          </SheetHeader>
          
          <div className="mt-6 space-y-6">
            {isLoadingManifest ? (
                 <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                 </div>
            ) : manifest ? (
                <>
                    <div className="flex justify-end">
                        <Button variant="destructive" size="sm" onClick={handleDelete}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            删除镜像
                        </Button>
                    </div>

                    <div className="space-y-2">
                        <Label>Digest</Label>
                        <div className="text-xs bg-muted p-2 rounded break-all font-mono">
                            {digest}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Manifest JSON</Label>
                        <div className="bg-muted p-4 rounded overflow-auto max-h-[500px] text-xs font-mono whitespace-pre-wrap">
                            {JSON.stringify(manifest, null, 2)}
                        </div>
                    </div>
                </>
            ) : (
                <div className="text-center text-destructive py-4">
                    加载 Manifest 失败
                </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
