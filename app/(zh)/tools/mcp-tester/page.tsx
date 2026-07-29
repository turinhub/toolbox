"use client";

import { useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Braces,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Plus,
  Search,
  Server,
  ShieldCheck,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { TurnstileVerification } from "@/components/common/turnstile-verification";
import { englishLocale } from "@/i18n/config";
import type {
  McpHeaderInput,
  McpInspectResult,
  McpTesterRequest,
  McpTesterResponse,
  McpTesterSuccess,
} from "@/lib/mcp-tester/types";

type ToolSummary = {
  name: string;
  title?: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
};

type ResourceSummary = {
  uri: string;
  name?: string;
  title?: string;
  description?: string;
  mimeType?: string;
};

type PromptSummary = {
  name: string;
  title?: string;
  description?: string;
  arguments?: Array<{
    name: string;
    description?: string;
    required?: boolean;
  }>;
};

const EMPTY_HEADER: McpHeaderInput = { name: "", value: "" };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function exampleFromSchema(
  schema?: Record<string, unknown>
): Record<string, unknown> {
  if (!schema || !isRecord(schema.properties)) return {};
  return Object.fromEntries(
    Object.entries(schema.properties).map(([key, definition]) => {
      if (!isRecord(definition)) return [key, null];
      if ("default" in definition) return [key, definition.default];
      if (Array.isArray(definition.enum) && definition.enum.length) {
        return [key, definition.enum[0]];
      }
      if (definition.type === "string") return [key, ""];
      if (definition.type === "number" || definition.type === "integer") {
        return [key, 0];
      }
      if (definition.type === "boolean") return [key, false];
      if (definition.type === "array") return [key, []];
      if (definition.type === "object") {
        return [key, exampleFromSchema(definition)];
      }
      return [key, null];
    })
  );
}

function JsonPanel({ value, empty }: { value: unknown; empty?: string }) {
  return (
    <pre className="max-h-[520px] min-h-32 overflow-auto rounded-md border bg-muted/30 p-4 font-mono text-xs leading-5 whitespace-pre-wrap break-words">
      {value === undefined
        ? empty
        : JSON.stringify(value, null, 2) || String(value)}
    </pre>
  );
}

function connectionConfigKey(endpoint: string, headers: McpHeaderInput[]) {
  return JSON.stringify({ endpoint, headers });
}

export default function McpTesterPage() {
  const t = useTranslations("mcpTester");
  const locale = useLocale();
  const isEnglish = locale === englishLocale;
  const [endpoint, setEndpoint] = useState("");
  const [headers, setHeaders] = useState<McpHeaderInput[]>([
    { ...EMPTY_HEADER },
  ]);
  const [inspection, setInspection] = useState<McpTesterSuccess | null>(null);
  const [inspectionConfigKey, setInspectionConfigKey] = useState<string | null>(
    null
  );
  const [lastResponse, setLastResponse] = useState<McpTesterSuccess | null>(
    null
  );
  const [activeTab, setActiveTab] = useState("tools");
  const [toolSearch, setToolSearch] = useState("");
  const [selectedTool, setSelectedTool] = useState<ToolSummary | null>(null);
  const [toolArguments, setToolArguments] = useState("{}");
  const [operationResult, setOperationResult] = useState<unknown>();
  const [promptArguments, setPromptArguments] = useState<
    Record<string, Record<string, string>>
  >({});
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [confirmToolCall, setConfirmToolCall] = useState(false);
  const [verificationOpen, setVerificationOpen] = useState(false);
  const pendingRequest = useRef<McpTesterRequest | null>(null);

  const requestHeaders = headers.filter(header => header.name.trim());
  const currentConfigKey = connectionConfigKey(endpoint, requestHeaders);
  const activeInspection =
    inspectionConfigKey === currentConfigKey ? inspection : null;
  const inspectData = activeInspection?.data as McpInspectResult | undefined;
  const { tools, resources, prompts } = useMemo(
    () => ({
      tools: (inspectData?.tools ?? []) as ToolSummary[],
      resources: (inspectData?.resources ?? []) as ResourceSummary[],
      prompts: (inspectData?.prompts ?? []) as PromptSummary[],
    }),
    [inspectData]
  );
  const filteredTools = useMemo(() => {
    const query = toolSearch.trim().toLowerCase();
    if (!query) return tools;
    return tools.filter(tool =>
      [tool.name, tool.title, tool.description]
        .filter(Boolean)
        .some(value => value!.toLowerCase().includes(query))
    );
  }, [toolSearch, tools]);

  const handleApiResponse = (
    request: McpTesterRequest,
    response: McpTesterResponse
  ) => {
    if (!response.ok) {
      toast.error(
        t("requestFailed", {
          message: response.error.message,
        })
      );
      return;
    }

    setLastResponse(response);
    if (request.action === "inspect") {
      setInspection(response);
      setInspectionConfigKey(
        connectionConfigKey(request.endpoint, request.headers)
      );
      setOperationResult(undefined);
      setPromptArguments({});
      const nextTools = (response.data as McpInspectResult)
        .tools as ToolSummary[];
      if (nextTools.length) {
        setSelectedTool(nextTools[0]);
        setToolArguments(
          JSON.stringify(exampleFromSchema(nextTools[0].inputSchema), null, 2)
        );
      } else {
        setSelectedTool(null);
        setToolArguments("{}");
      }
      setActiveTab("tools");
      toast.success(t("connected"));
    } else {
      setOperationResult(response.data);
      toast.success(t("success"));
    }
  };

  const runRequest = async (
    body: McpTesterRequest,
    allowVerification = true
  ) => {
    setLoadingAction(body.action);
    try {
      const apiResponse = await fetch("/api/tools/mcp-tester", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const response = (await apiResponse.json()) as McpTesterResponse;
      if (
        allowVerification &&
        !response.ok &&
        response.error.code === "HUMAN_VERIFICATION_REQUIRED"
      ) {
        pendingRequest.current = body;
        setVerificationOpen(true);
        return;
      }
      handleApiResponse(body, response);
    } catch (error) {
      toast.error(
        t("requestFailed", {
          message: error instanceof Error ? error.message : String(error),
        })
      );
    } finally {
      setLoadingAction(null);
    }
  };

  const inspect = () => {
    void runRequest({
      action: "inspect",
      endpoint,
      headers: requestHeaders,
      locale: isEnglish ? "en" : "zh-CN",
    });
  };

  const selectTool = (tool: ToolSummary) => {
    setSelectedTool(tool);
    setOperationResult(undefined);
    setToolArguments(
      JSON.stringify(exampleFromSchema(tool.inputSchema), null, 2)
    );
  };

  const openToolConfirmation = () => {
    try {
      const parsed = JSON.parse(toolArguments);
      if (!isRecord(parsed)) throw new Error("not an object");
      setConfirmToolCall(true);
    } catch {
      toast.error(t("invalidArguments"));
    }
  };

  const callSelectedTool = () => {
    if (!selectedTool || !activeInspection) {
      toast.error(t("configurationChanged"));
      return;
    }
    const parsed = JSON.parse(toolArguments) as Record<string, unknown>;
    setConfirmToolCall(false);
    void runRequest({
      action: "call-tool",
      endpoint,
      headers: requestHeaders,
      locale: isEnglish ? "en" : "zh-CN",
      name: selectedTool.name,
      arguments: parsed,
    });
  };

  const readResource = (resource: ResourceSummary) => {
    if (!activeInspection) {
      toast.error(t("configurationChanged"));
      return;
    }
    setOperationResult(undefined);
    void runRequest({
      action: "read-resource",
      endpoint,
      headers: requestHeaders,
      locale: isEnglish ? "en" : "zh-CN",
      uri: resource.uri,
    });
  };

  const getPrompt = (prompt: PromptSummary) => {
    if (!activeInspection) {
      toast.error(t("configurationChanged"));
      return;
    }
    const argumentsForPrompt = Object.fromEntries(
      (prompt.arguments ?? []).flatMap(argument => {
        const value = promptArguments[prompt.name]?.[argument.name];
        return value === undefined || value === ""
          ? []
          : ([[argument.name, value]] as const);
      })
    );
    setOperationResult(undefined);
    void runRequest({
      action: "get-prompt",
      endpoint,
      headers: requestHeaders,
      locale: isEnglish ? "en" : "zh-CN",
      name: prompt.name,
      arguments: Object.keys(argumentsForPrompt).length
        ? argumentsForPrompt
        : undefined,
    });
  };

  const verifyHuman = async (token: string) => {
    try {
      const response = await fetch("/api/verify-human", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!response.ok) throw new Error(t("verificationRequestFailed"));
      setVerificationOpen(false);
      const request = pendingRequest.current;
      pendingRequest.current = null;
      if (request) await runRequest(request, false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("verificationRequestFailed")
      );
    }
  };

  return (
    <div className="container mx-auto flex flex-col gap-6 py-6">
      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-md border bg-muted/40 text-muted-foreground">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <CardTitle>{t("connection")}</CardTitle>
              <CardDescription className="mt-1">
                {t("connectionDescription")}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="mcp-endpoint">{t("endpoint")}</Label>
            <Input
              id="mcp-endpoint"
              name="endpoint"
              type="url"
              inputMode="url"
              autoComplete="url"
              spellCheck={false}
              placeholder={t("endpointPlaceholder")}
              value={endpoint}
              onChange={event => setEndpoint(event.target.value)}
            />
            <p className="text-xs leading-5 text-muted-foreground">
              {t("endpointHelp")}
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label>{t("headers")}</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setHeaders(current => [...current, { ...EMPTY_HEADER }])
                }
                disabled={headers.length >= 10}
              >
                <Plus className="size-4" aria-hidden="true" />
                {t("addHeader")}
              </Button>
            </div>
            {headers.map((header, index) => (
              <div
                key={index}
                className="grid gap-2 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)_2.75rem]"
              >
                <Input
                  aria-label={`${t("headerName")} ${index + 1}`}
                  name={`header-name-${index}`}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder={index === 0 ? "Authorization" : t("headerName")}
                  value={header.name}
                  onChange={event =>
                    setHeaders(current =>
                      current.map((item, itemIndex) =>
                        itemIndex === index
                          ? { ...item, name: event.target.value }
                          : item
                      )
                    )
                  }
                />
                <Input
                  aria-label={`${t("headerValue")} ${index + 1}`}
                  name={`header-value-${index}`}
                  type="password"
                  autoComplete="new-password"
                  spellCheck={false}
                  placeholder={t("headerValuePlaceholder")}
                  value={header.value}
                  onChange={event =>
                    setHeaders(current =>
                      current.map((item, itemIndex) =>
                        itemIndex === index
                          ? { ...item, value: event.target.value }
                          : item
                      )
                    )
                  }
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-10"
                  aria-label={t("removeHeader", { index: index + 1 })}
                  onClick={() =>
                    setHeaders(current =>
                      current.length === 1
                        ? [{ ...EMPTY_HEADER }]
                        : current.filter((_, itemIndex) => itemIndex !== index)
                    )
                  }
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
            <p className="text-xs leading-5 text-muted-foreground">
              {t("notSaved")}
            </p>
            <Button
              type="button"
              onClick={inspect}
              disabled={!endpoint || loadingAction !== null}
              className="min-w-32"
            >
              {loadingAction === "inspect" ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Server className="size-4" aria-hidden="true" />
              )}
              {loadingAction === "inspect" ? t("inspecting") : t("inspect")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {activeInspection ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{t("serverSummary")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">
                  {t("serverName")}
                </p>
                <p className="mt-1 break-words font-medium">
                  {activeInspection.connection.serverInfo
                    ? `${activeInspection.connection.serverInfo.name} ${activeInspection.connection.serverInfo.version}`
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("protocol")}</p>
                <p className="mt-1 font-mono text-sm">
                  {activeInspection.connection.protocolVersion || "—"}
                </p>
                {activeInspection.connection.protocolEra ? (
                  <Badge variant="secondary" className="mt-2">
                    {activeInspection.connection.protocolEra}
                  </Badge>
                ) : null}
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs text-muted-foreground">
                  {t("capabilities")}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {activeInspection.connection.capabilities.map(capability => (
                    <Badge key={capability} variant="outline">
                      {capability}
                    </Badge>
                  ))}
                </div>
              </div>
              {activeInspection.connection.instructions ? (
                <div className="sm:col-span-2 lg:col-span-4">
                  <p className="text-xs text-muted-foreground">
                    {t("instructions")}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6">
                    {activeInspection.connection.instructions}
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {inspectData?.warnings.length ? (
            <Alert>
              <AlertTitle>{t("warning")}</AlertTitle>
              <AlertDescription>
                <ul className="list-disc space-y-1 pl-5">
                  {inspectData.warnings.map(warning => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          ) : null}

          <Tabs
            value={activeTab}
            onValueChange={value => {
              setActiveTab(value);
              setOperationResult(undefined);
            }}
          >
            <TabsList className="grid h-auto w-full grid-cols-2 sm:grid-cols-4">
              <TabsTrigger value="tools" className="min-h-11">
                {t("tools")} ({tools.length})
              </TabsTrigger>
              <TabsTrigger value="resources" className="min-h-11">
                {t("resources")} ({resources.length})
              </TabsTrigger>
              <TabsTrigger value="prompts" className="min-h-11">
                {t("prompts")} ({prompts.length})
              </TabsTrigger>
              <TabsTrigger value="trace" className="min-h-11">
                {t("trace")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tools" className="mt-4">
              <div className="grid gap-4 lg:grid-cols-[minmax(16rem,0.8fr)_minmax(0,1.4fr)]">
                <Card>
                  <CardHeader className="pb-4">
                    <div className="relative">
                      <Search
                        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <Input
                        aria-label={t("searchTools")}
                        name="tool-search"
                        type="search"
                        placeholder={t("searchTools")}
                        className="pl-9"
                        value={toolSearch}
                        onChange={event => setToolSearch(event.target.value)}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    {filteredTools.length ? (
                      <div className="max-h-[640px] space-y-2 overflow-auto pr-1">
                        {filteredTools.map(tool => (
                          <button
                            key={tool.name}
                            type="button"
                            onClick={() => selectTool(tool)}
                            className="flex min-h-11 w-full items-start justify-between gap-3 rounded-md border p-3 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <span className="min-w-0">
                              <span className="block break-words font-medium">
                                {tool.title || tool.name}
                              </span>
                              <span className="mt-1 block line-clamp-2 text-xs leading-5 text-muted-foreground">
                                {tool.description || t("noDescription")}
                              </span>
                            </span>
                            <ChevronRight
                              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                              aria-hidden="true"
                            />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="py-10 text-center text-sm text-muted-foreground">
                        {t("emptyTools")}
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  {selectedTool ? (
                    <>
                      <CardHeader>
                        <CardTitle className="break-words">
                          {selectedTool.title || selectedTool.name}
                        </CardTitle>
                        <CardDescription>
                          {selectedTool.description || t("noDescription")}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-5">
                        <div className="space-y-2">
                          <Label>{t("inputSchema")}</Label>
                          <JsonPanel value={selectedTool.inputSchema ?? {}} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="mcp-tool-arguments">
                            {t("arguments")}
                          </Label>
                          <Textarea
                            id="mcp-tool-arguments"
                            name="toolArguments"
                            spellCheck={false}
                            placeholder={t("argumentsPlaceholder")}
                            className="min-h-44 font-mono text-xs"
                            value={toolArguments}
                            onChange={event =>
                              setToolArguments(event.target.value)
                            }
                          />
                        </div>
                        <div className="flex justify-end">
                          <Button
                            type="button"
                            onClick={openToolConfirmation}
                            disabled={loadingAction !== null}
                          >
                            {loadingAction === "call-tool" ? (
                              <Loader2
                                className="size-4 animate-spin"
                                aria-hidden="true"
                              />
                            ) : (
                              <Braces className="size-4" aria-hidden="true" />
                            )}
                            {loadingAction === "call-tool"
                              ? t("calling")
                              : t("callTool")}
                          </Button>
                        </div>
                        {operationResult !== undefined ? (
                          <div className="space-y-2 border-t pt-5">
                            <Label>{t("result")}</Label>
                            <JsonPanel value={operationResult} />
                          </div>
                        ) : null}
                      </CardContent>
                    </>
                  ) : (
                    <CardContent className="flex min-h-80 items-center justify-center p-6 text-center text-sm text-muted-foreground">
                      {t("selectTool")}
                    </CardContent>
                  )}
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="resources" className="mt-4">
              <Card>
                <CardContent className="space-y-3 p-4 sm:p-6">
                  {resources.length ? (
                    resources.map(resource => (
                      <div
                        key={resource.uri}
                        className="flex flex-col gap-3 rounded-md border p-4 sm:flex-row sm:items-start sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="font-medium break-words">
                            {resource.title || resource.name || resource.uri}
                          </p>
                          <p className="mt-1 font-mono text-xs break-all text-muted-foreground">
                            {resource.uri}
                          </p>
                          {resource.description ? (
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                              {resource.description}
                            </p>
                          ) : null}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className="shrink-0"
                          disabled={loadingAction !== null}
                          onClick={() => readResource(resource)}
                        >
                          {loadingAction === "read-resource" ? (
                            <Loader2
                              className="size-4 animate-spin"
                              aria-hidden="true"
                            />
                          ) : null}
                          {loadingAction === "read-resource"
                            ? t("reading")
                            : t("readResource")}
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="py-16 text-center text-sm text-muted-foreground">
                      {t("emptyResources")}
                    </p>
                  )}
                  {operationResult !== undefined ? (
                    <div className="space-y-2 border-t pt-5">
                      <Label>{t("result")}</Label>
                      <JsonPanel value={operationResult} />
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="prompts" className="mt-4">
              <Card>
                <CardContent className="space-y-4 p-4 sm:p-6">
                  {prompts.length ? (
                    prompts.map(prompt => (
                      <div
                        key={prompt.name}
                        className="space-y-4 rounded-md border p-4"
                      >
                        <div>
                          <p className="font-medium">
                            {prompt.title || prompt.name}
                          </p>
                          <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            {prompt.description || t("noDescription")}
                          </p>
                        </div>
                        {prompt.arguments?.length ? (
                          <div className="grid gap-3 sm:grid-cols-2">
                            {prompt.arguments.map(argument => (
                              <div key={argument.name} className="space-y-2">
                                <Label
                                  htmlFor={`prompt-${prompt.name}-${argument.name}`}
                                >
                                  {argument.name}
                                  {argument.required ? " *" : ""}
                                </Label>
                                <Input
                                  id={`prompt-${prompt.name}-${argument.name}`}
                                  name={`prompt-${argument.name}`}
                                  autoComplete="off"
                                  spellCheck={false}
                                  value={
                                    promptArguments[prompt.name]?.[
                                      argument.name
                                    ] || ""
                                  }
                                  onChange={event =>
                                    setPromptArguments(current => ({
                                      ...current,
                                      [prompt.name]: {
                                        ...current[prompt.name],
                                        [argument.name]: event.target.value,
                                      },
                                    }))
                                  }
                                />
                                {argument.description ? (
                                  <p className="text-xs text-muted-foreground">
                                    {argument.description}
                                  </p>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        ) : null}
                        <div className="flex justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            disabled={loadingAction !== null}
                            onClick={() => getPrompt(prompt)}
                          >
                            {loadingAction === "get-prompt" ? (
                              <Loader2
                                className="size-4 animate-spin"
                                aria-hidden="true"
                              />
                            ) : null}
                            {loadingAction === "get-prompt"
                              ? t("gettingPrompt")
                              : t("getPrompt")}
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="py-16 text-center text-sm text-muted-foreground">
                      {t("emptyPrompts")}
                    </p>
                  )}
                  {operationResult !== undefined ? (
                    <div className="space-y-2 border-t pt-5">
                      <Label>{t("result")}</Label>
                      <JsonPanel value={operationResult} />
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trace" className="mt-4">
              <Card>
                <CardContent className="p-4 sm:p-6">
                  {lastResponse?.trace.length ? (
                    <div className="space-y-3">
                      {lastResponse.trace.map((entry, index) => (
                        <div
                          key={`${entry.method}-${index}`}
                          className="flex flex-col gap-3 rounded-md border p-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex min-w-0 items-start gap-3">
                            {entry.status === "success" ? (
                              <CheckCircle2
                                className="mt-0.5 size-5 shrink-0 text-green-600 dark:text-green-400"
                                aria-hidden="true"
                              />
                            ) : (
                              <XCircle
                                className="mt-0.5 size-5 shrink-0 text-destructive"
                                aria-hidden="true"
                              />
                            )}
                            <div className="min-w-0">
                              <p className="font-mono text-sm break-words">
                                {entry.method}
                              </p>
                              {entry.detail ? (
                                <p className="mt-1 text-xs break-words text-muted-foreground">
                                  {entry.detail}
                                </p>
                              ) : null}
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <Badge
                              variant={
                                entry.status === "success"
                                  ? "secondary"
                                  : "destructive"
                              }
                            >
                              {entry.status === "success"
                                ? t("success")
                                : t("failed")}
                            </Badge>
                            <span className="text-sm tabular-nums text-muted-foreground">
                              {t("duration", {
                                duration: entry.durationMs,
                              })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="py-16 text-center text-sm text-muted-foreground">
                      {t("emptyTrace")}
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {Object.values(inspectData?.truncated ?? {}).some(Boolean) ? (
            <Alert>
              <AlertTitle>{t("truncated")}</AlertTitle>
            </Alert>
          ) : null}
        </>
      ) : (
        <Card>
          <CardContent className="flex min-h-56 flex-col items-center justify-center gap-3 p-6 text-center">
            <Server
              className="size-9 text-muted-foreground"
              aria-hidden="true"
            />
            <p className="text-sm text-muted-foreground">
              {inspection ? t("configurationChanged") : t("emptyState")}
            </p>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={confirmToolCall} onOpenChange={setConfirmToolCall}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("confirmDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3 rounded-md border bg-muted/30 p-3 text-sm">
            <p className="break-all">
              <span className="font-medium">{t("target")}：</span>
              {endpoint}
            </p>
            <p className="break-words">
              <span className="font-medium">Tool：</span>
              {selectedTool?.name}
            </p>
            <JsonPanel value={JSON.parse(toolArguments || "{}")} />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={callSelectedTool}>
              {t("confirmCall")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <TurnstileVerification
        open={verificationOpen}
        onOpenChange={open => {
          setVerificationOpen(open);
          if (!open) pendingRequest.current = null;
        }}
        title={t("verificationTitle")}
        autoClose={false}
        onVerify={token => void verifyHuman(token)}
        errorMessage={t("verificationFailed")}
        expireMessage={t("verificationExpired")}
      />
    </div>
  );
}
