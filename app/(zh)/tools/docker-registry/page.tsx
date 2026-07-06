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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { useLocale } from "next-intl";
import { englishLocale } from "@/i18n/config";

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
  const isEnglish = useLocale() === englishLocale;
  const copy = isEnglish
    ? {
        enterUrl: "Enter a Registry URL.",
        connected: "Connected",
        connectFailed: "Connection failed",
        connectError: "Connection error",
        catalogFailed: "Failed to load repository list",
        tagsFailed: "Failed to load tags",
        manifestFailed: "Failed to load manifest",
        deleteConfirm:
          "Delete this image? This action cannot be undone.\nNote: some registries may not have deletion enabled.",
        imageDeleted: "Image deleted",
        deleteFailed: "Delete failed",
        enterConfigName: "Enter a config name.",
        configSaved: "Config saved",
        configLoaded: "Config loaded: {name}",
        configDeleted: "Config deleted",
        connectionTitle: "Connection config",
        connectionDescription:
          "Configure Docker Registry URL and authentication.",
        username: "Username (optional)",
        password: "Password (optional)",
        reconnect: "Reconnect",
        connect: "Connect Registry",
        manageConfigs: "Manage configs",
        savedConfigs: "Saved configs",
        configName: "Config name",
        saveCurrent: "Save current",
        deleteConfig: "Delete config {name}",
        noConfigs: "No saved configs",
        repoList: "Repositories",
        searchRepos: "Search repositories...",
        noRepos: "No repositories found",
        tagsOf: "{repo} tags",
        refreshTags: "Refresh tags",
        searchTags: "Search tags...",
        selectRepo: "Select a repository from the left",
        noTags: "No tags found",
        imageDetail: "Image details",
        deleteImage: "Delete image",
        loadManifestFailed: "Failed to load manifest",
        confirmDeleteConfig: "Delete config?",
        deleteConfigPrefix: 'This will delete config "{name}". ',
        irreversible: "This action cannot be undone.",
        cancel: "Cancel",
        delete: "Delete",
      }
    : {
        enterUrl: "请输入 Registry URL",
        connected: "连接成功",
        connectFailed: "连接失败",
        connectError: "连接出错",
        catalogFailed: "获取仓库列表失败",
        tagsFailed: "获取 Tags 失败",
        manifestFailed: "获取 Manifest 失败",
        deleteConfirm:
          "确定要删除该镜像吗？此操作不可恢复。\n注意：某些 Registry 可能未开启删除功能。",
        imageDeleted: "镜像删除成功",
        deleteFailed: "删除失败",
        enterConfigName: "请输入配置名称",
        configSaved: "配置已保存",
        configLoaded: "已加载配置: {name}",
        configDeleted: "配置已删除",
        connectionTitle: "连接配置",
        connectionDescription: "配置 Docker Registry 地址和认证信息",
        username: "用户名 (可选)",
        password: "密码 (可选)",
        reconnect: "重新连接",
        connect: "连接 Registry",
        manageConfigs: "管理配置",
        savedConfigs: "已保存的配置",
        configName: "配置名称",
        saveCurrent: "保存当前",
        deleteConfig: "删除配置 {name}",
        noConfigs: "暂无保存的配置",
        repoList: "仓库列表",
        searchRepos: "搜索仓库…",
        noRepos: "未找到仓库",
        tagsOf: "{repo} 的 Tags",
        refreshTags: "刷新 Tags",
        searchTags: "搜索 Tag…",
        selectRepo: "请从左侧选择一个仓库",
        noTags: "未找到 Tags",
        imageDetail: "镜像详情",
        deleteImage: "删除镜像",
        loadManifestFailed: "加载 Manifest 失败",
        confirmDeleteConfig: "确认删除配置",
        deleteConfigPrefix: "将删除配置「{name}」。",
        irreversible: "此操作无法撤销。",
        cancel: "取消",
        delete: "删除",
      };
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
  const [deleteConfigIndex, setDeleteConfigIndex] = useState<number | null>(
    null
  );

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
        repositories.filter(r =>
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
        tags.filter(t => t.toLowerCase().includes(tagSearch.toLowerCase()))
      );
    } else {
      setFilteredTags(tags);
    }
  }, [tagSearch, tags]);

  const handleConnect = async (configOverride?: RegistryConfig) => {
    const configToUse = configOverride || { url, username, password };

    if (!configToUse.url) {
      toast.error(copy.enterUrl);
      return;
    }

    setIsConnecting(true);

    try {
      const res = await checkConnection(configToUse);
      if (res.success) {
        toast.success(copy.connected);
        setIsConnected(true);
        loadCatalog(configToUse);
      } else {
        toast.error(res.error || copy.connectFailed);
      }
    } catch (e: any) {
      toast.error(e.message || copy.connectError);
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
        toast.error(res.error || copy.catalogFailed);
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
        toast.error(res.error || copy.tagsFailed);
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
        toast.error(res.error || copy.manifestFailed);
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsLoadingManifest(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRepo || !digest) return;

    if (
      !confirm(
        copy.deleteConfirm
      )
    )
      return;

    try {
      const res = await deleteManifest(
        { url, username, password },
        selectedRepo,
        digest
      );
      if (res.success) {
        toast.success(copy.imageDeleted);
        setIsManifestOpen(false);
        // Refresh tags
        handleRepoSelect(selectedRepo);
      } else {
        // @ts-ignore
        toast.error(res.error || copy.deleteFailed);
      }
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const saveConfig = () => {
    if (!configName) {
      toast.error(copy.enterConfigName);
      return;
    }
    const newConfig = {
      name: configName,
      config: { url, username, password },
    };
    const newConfigs = [...savedConfigs, newConfig];
    setSavedConfigs(newConfigs);
    localStorage.setItem("docker-registry-configs", JSON.stringify(newConfigs));
    toast.success(copy.configSaved);
    setConfigName("");
  };

  const loadConfig = (saved: SavedConfig) => {
    setUrl(saved.config.url);
    setUsername(saved.config.username || "");
    setPassword(saved.config.password || "");
    setIsConfigDialogOpen(false);
    toast.success(copy.configLoaded.replace("{name}", saved.name));

    // Auto connect
    handleConnect(saved.config);
  };

  const confirmDeleteConfig = () => {
    if (deleteConfigIndex === null) return;
    const newConfigs = [...savedConfigs];
    newConfigs.splice(deleteConfigIndex, 1);
    setSavedConfigs(newConfigs);
    localStorage.setItem("docker-registry-configs", JSON.stringify(newConfigs));
    setDeleteConfigIndex(null);
    toast.success(copy.configDeleted);
  };

  return (
    <div className="flex flex-col container mx-auto p-4 gap-6">
      {/* Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            {copy.connectionTitle}
          </CardTitle>
          <CardDescription>{copy.connectionDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col col-span-2 gap-2">
              <Label htmlFor="url">Registry URL</Label>
              <Input
                id="url"
                placeholder="https://registry.example.com"
                value={url}
                onChange={e => setUrl(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="username">{copy.username}</Label>
              <Input
                id="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">{copy.password}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-4 mt-4">
            <Button onClick={() => handleConnect()} disabled={isConnecting}>
              {isConnecting && (
                <Loader2 data-icon="inline-start" className="animate-spin" />
              )}
              {isConnected ? copy.reconnect : copy.connect}
            </Button>

            <Dialog
              open={isConfigDialogOpen}
              onOpenChange={setIsConfigDialogOpen}
            >
              <DialogTrigger asChild>
                <Button variant="outline">{copy.manageConfigs}</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{copy.savedConfigs}</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                  <div className="flex gap-2">
                    <Input
                      id="docker-config-name"
                      name="configName"
                      autoComplete="off"
                      placeholder={copy.configName}
                      value={configName}
                      onChange={e => setConfigName(e.target.value)}
                    />
                    <Button onClick={saveConfig}>{copy.saveCurrent}</Button>
                  </div>
                  <div className="flex flex-col gap-2">
                    {savedConfigs.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 border rounded hover:bg-muted/50"
                      >
                        <button
                          type="button"
                          className="flex-1 rounded-sm text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          onClick={() => loadConfig(item)}
                        >
                          <div className="font-medium">{item.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {item.config.url}
                          </div>
                        </button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteConfigIndex(index)}
                          aria-label={copy.deleteConfig.replace(
                            "{name}",
                            item.name
                          )}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    {savedConfigs.length === 0 && (
                      <div className="text-center text-muted-foreground py-4">
                        {copy.noConfigs}
                      </div>
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
                {copy.repoList} ({repositories.length})
              </CardTitle>
              <div className="relative mt-2">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="docker-repo-search"
                  name="repoSearch"
                  autoComplete="off"
                  spellCheck={false}
                  placeholder={copy.searchRepos}
                  className="pl-8"
                  value={repoSearch}
                  onChange={e => setRepoSearch(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
              <ScrollArea className="h-full">
                <div className="flex flex-col p-2 gap-1">
                  {filteredRepos.map(repo => (
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
                      {copy.noRepos}
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
                  {selectedRepo
                    ? copy.tagsOf.replace("{repo}", selectedRepo)
                    : "Tags"}
                  {selectedRepo && `(${tags.length})`}
                </CardTitle>
                {selectedRepo && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRepoSelect(selectedRepo)}
                    aria-label={copy.refreshTags}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {selectedRepo && (
                <div className="relative mt-2">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="docker-tag-search"
                    name="tagSearch"
                    autoComplete="off"
                    spellCheck={false}
                    placeholder={copy.searchTags}
                    className="pl-8"
                    value={tagSearch}
                    onChange={e => setTagSearch(e.target.value)}
                  />
                </div>
              )}
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0 bg-muted/10">
              {!selectedRepo ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  {copy.selectRepo}
                </div>
              ) : isLoadingTags ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ScrollArea className="h-full p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {filteredTags.map(tag => (
                      <Button
                        key={tag}
                        variant="outline"
                        className="justify-start"
                        onClick={() => handleTagSelect(tag)}
                      >
                        <TagIcon className="mr-2 h-3 w-3" />
                        <span className="truncate" title={tag}>
                          {tag}
                        </span>
                      </Button>
                    ))}
                    {filteredTags.length === 0 && (
                      <div className="col-span-full text-center text-muted-foreground py-8">
                        {copy.noTags}
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
              {copy.imageDetail}
            </SheetTitle>
            <SheetDescription>
              {selectedRepo}:{selectedTag}
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col mt-6 gap-6">
            {isLoadingManifest ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : manifest ? (
              <>
                <div className="flex justify-end">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                  >
                    <Trash2 data-icon="inline-start" />
                    {copy.deleteImage}
                  </Button>
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Digest</Label>
                  <div className="text-xs bg-muted p-2 rounded break-all font-mono">
                    {digest}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Manifest JSON</Label>
                  <div className="bg-muted p-4 rounded overflow-auto max-h-[500px] text-xs font-mono whitespace-pre-wrap">
                    {JSON.stringify(manifest, null, 2)}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-destructive py-4">
                {copy.loadManifestFailed}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={deleteConfigIndex !== null}
        onOpenChange={open => !open && setDeleteConfigIndex(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.confirmDeleteConfig}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfigIndex !== null && (
                <>
                  {copy.deleteConfigPrefix.replace(
                    "{name}",
                    savedConfigs[deleteConfigIndex]?.name ?? ""
                  )}
                  <span className="text-destructive">{copy.irreversible}</span>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{copy.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteConfig}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {copy.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
