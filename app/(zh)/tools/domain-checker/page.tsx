"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  normalizeDomainInput,
  getDomainErrorCode,
} from "@/lib/domain-checker/input";
import {
  SECURITY_HEADERS,
  type CheckResult,
  type DomainErrorCode,
  type DomainReport,
} from "@/lib/domain-checker/types";
import { ResultFields } from "@/app/(zh)/tools/domain-checker/result-fields";

const TABS = ["basic", "dns", "ssl", "whois", "performance"] as const;
type Tab = (typeof TABS)[number];
const isTab = (value: string | null): value is Tab =>
  TABS.includes(value as Tab);

function ResultNotice({ result }: { result: CheckResult<unknown> }) {
  const t = useTranslations("domainChecker");
  if (!result.error) return null;
  return (
    <Alert variant={result.status === "error" ? "destructive" : "default"}>
      <AlertCircle className="size-4" aria-hidden="true" />
      <AlertTitle>{t(`statuses.${result.status}`)}</AlertTitle>
      <AlertDescription>{t(`errors.${result.error}`)}</AlertDescription>
    </Alert>
  );
}

export default function DomainCheckerPage() {
  const t = useTranslations("domainChecker");
  const locale = useLocale();
  const [input, setInput] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<DomainErrorCode | null>(null);
  const [report, setReport] = useState<DomainReport | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("basic");
  const inputRef = useRef<HTMLInputElement>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const number = (value: number) => new Intl.NumberFormat(locale).format(value);
  const date = (value?: string) =>
    value && Number.isFinite(Date.parse(value))
      ? new Intl.DateTimeFormat(locale, {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(value))
      : undefined;

  useEffect(() => {
    const syncTab = () => {
      const value = new URLSearchParams(window.location.search).get("tab");
      setActiveTab(isTab(value) ? value : "basic");
    };
    syncTab();
    window.addEventListener("popstate", syncTab);
    return () => {
      window.removeEventListener("popstate", syncTab);
      controllerRef.current?.abort();
      controllerRef.current = null;
    };
  }, []);

  const changeTab = (value: string) => {
    if (!isTab(value)) return;
    setActiveTab(value);
    const url = new URL(window.location.href);
    if (value === "basic") url.searchParams.delete("tab");
    else url.searchParams.set("tab", value);
    window.history.replaceState(null, "", url);
  };

  const checkDomain = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isChecking) return;
    try {
      normalizeDomainInput(input);
    } catch (error) {
      setError(getDomainErrorCode(error));
      inputRef.current?.focus();
      return;
    }
    setError(null);
    setReport(null);
    setIsChecking(true);
    const controller = new AbortController();
    controllerRef.current = controller;
    const timer = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch("/api/tools/domain-checker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
        signal: controller.signal,
      });
      if (!response.ok) {
        const code =
          response.status === 400 || response.status === 403
            ? getDomainErrorCodeFromResponse(await response.json())
            : "networkFailed";
        setError(code);
        inputRef.current?.focus();
        toast.error(t(`errors.${code}`));
        return;
      }
      const result: DomainReport = await response.json();
      setReport(result);
      if (TABS.some(tab => result[tab].status !== "success"))
        toast.warning(t("partialDone"));
      else toast.success(t("done"));
    } catch {
      if (controllerRef.current !== controller) return;
      setError(controller.signal.aborted ? "timeout" : "networkFailed");
      toast.error(t("failed"));
    } finally {
      clearTimeout(timer);
      if (controllerRef.current === controller) {
        controllerRef.current = null;
        setIsChecking(false);
      }
    }
  };

  const ssl = report?.ssl.data;
  const registration = report?.whois.data;
  const http = report?.performance.data;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>
            <h2 className="text-lg">{t("inputTitle")}</h2>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {t("inputDescription")}
          </p>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={checkDomain}
            className="space-y-3"
            aria-busy={isChecking}
          >
            <Label htmlFor="domain-input">{t("inputLabel")}</Label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                ref={inputRef}
                id="domain-input"
                name="domain"
                type="text"
                inputMode="url"
                autoComplete="url"
                spellCheck={false}
                value={input}
                onChange={event => {
                  setInput(event.target.value);
                  setError(null);
                }}
                placeholder={t("placeholder")}
                disabled={isChecking}
                aria-invalid={Boolean(error)}
                aria-describedby={
                  error ? "domain-error domain-hint" : "domain-hint"
                }
                className="h-11 min-w-0 flex-1 font-mono"
              />
              <Button
                type="submit"
                disabled={isChecking || !input.trim()}
                className="h-11 min-w-32 gap-2"
              >
                {isChecking ? (
                  <Loader2
                    className="size-4 animate-spin motion-reduce:animate-none"
                    aria-hidden="true"
                  />
                ) : null}
                {t(isChecking ? "checking" : "start")}
              </Button>
            </div>
            <p
              id="domain-hint"
              className="text-xs leading-5 text-muted-foreground"
            >
              {t("inputHint")}
            </p>
            {error ? (
              <p
                id="domain-error"
                role="alert"
                className="text-sm text-destructive"
              >
                {t(`errors.${error}`)}
              </p>
            ) : null}
          </form>
        </CardContent>
      </Card>

      {isChecking || report ? (
        <section
          aria-label={t("progress")}
          className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5"
        >
          {TABS.map(tab => (
            <div
              key={tab}
              className="flex min-w-0 items-start gap-2 rounded-md border p-3 text-sm"
            >
              {isChecking ? (
                <Loader2
                  className="mt-0.5 size-4 shrink-0 animate-spin motion-reduce:animate-none"
                  aria-hidden="true"
                />
              ) : report?.[tab].status === "success" ? (
                <CheckCircle2
                  className="mt-0.5 size-4 shrink-0 text-success"
                  aria-hidden="true"
                />
              ) : (
                <AlertCircle
                  className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
              )}
              <div className="min-w-0">
                <p className="break-words font-medium">{t(tab)}</p>
                <p className="text-xs text-muted-foreground">
                  {isChecking
                    ? t("pending")
                    : t(`statuses.${report![tab].status}`)}
                </p>
              </div>
            </div>
          ))}
        </section>
      ) : null}

      <Card aria-busy={isChecking}>
        <CardHeader>
          <CardTitle>
            <h2 className="text-lg">{t("result")}</h2>
          </CardTitle>
          {report ? (
            <p
              className="break-words font-mono text-sm text-muted-foreground"
              translate="no"
            >
              {report.target.hostname}
            </p>
          ) : null}
        </CardHeader>
        <CardContent className="min-w-0">
          <Tabs value={activeTab} onValueChange={changeTab}>
            <TabsList className="mb-4 flex h-auto w-full flex-wrap justify-start gap-1">
              {TABS.map(tab => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="min-h-11 flex-1 whitespace-normal"
                >
                  {t(tab)}
                </TabsTrigger>
              ))}
            </TabsList>
            {!report ? (
              <TabsContent value={activeTab}>
                <p
                  role="status"
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  {t(isChecking ? "checking" : "empty")}
                </p>
              </TabsContent>
            ) : (
              <>
                <TabsContent value="basic" className="space-y-4">
                  <ResultNotice result={report.basic} />
                  <Badge
                    variant={
                      report.basic.status === "success"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {t(
                      report.basic.status === "success"
                        ? "resolved"
                        : "resolutionFailed"
                    )}
                  </Badge>
                  <ResultFields
                    fields={[
                      {
                        label: t("hostname"),
                        value: report.target.hostname,
                        mono: true,
                      },
                      {
                        label: t("targetUrl"),
                        value: report.target.url,
                        mono: true,
                      },
                      {
                        label: t("protocol"),
                        value: report.target.protocol
                          .replace(":", "")
                          .toUpperCase(),
                        mono: true,
                      },
                      {
                        label: t("port"),
                        value: number(report.target.port),
                        mono: true,
                      },
                      {
                        label: t("addresses"),
                        value: report.basic.data?.addresses
                          .map(
                            address =>
                              `IPv${address.family}  ${address.address}`
                          )
                          .join("\n"),
                        mono: true,
                      },
                      { label: t("checkedAt"), value: date(report.checkedAt) },
                    ]}
                  />
                  <p className="text-sm leading-6 text-muted-foreground">
                    {t("dnsNote")}
                  </p>
                </TabsContent>
                <TabsContent value="dns" className="space-y-4">
                  <ResultNotice result={report.dns} />
                  {report.dns.data?.failedTypes.length ? (
                    <p className="text-sm text-muted-foreground">
                      {t("dnsPartial", {
                        types: report.dns.data.failedTypes.join(", "),
                      })}
                    </p>
                  ) : null}
                  {report.dns.data &&
                  Object.values(report.dns.data.records).some(
                    values => values.length
                  ) ? (
                    <ResultFields
                      fields={Object.entries(report.dns.data.records)
                        .filter(([, values]) => values.length > 0)
                        .map(([label, values]) => ({
                          label,
                          value: values.join("\n"),
                          mono: true,
                        }))}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {t("noRecords")}
                    </p>
                  )}
                </TabsContent>
                <TabsContent value="ssl" className="space-y-4">
                  <ResultNotice result={report.ssl} />
                  {ssl ? (
                    <>
                      {ssl.validFrom ? (
                        <Badge
                          variant={ssl.valid ? "secondary" : "destructive"}
                        >
                          {t(ssl.valid ? "valid" : "invalid")}
                        </Badge>
                      ) : null}
                      <ResultFields
                        fields={[
                          {
                            label: t("sslTarget"),
                            value: `${ssl.hostname}:${ssl.port}`,
                            mono: true,
                          },
                          { label: t("issuer"), value: ssl.issuer },
                          {
                            label: t("subject"),
                            value: ssl.subject,
                            mono: true,
                          },
                          {
                            label: t("subjectAltName"),
                            value: ssl.subjectAltName,
                            mono: true,
                          },
                          { label: t("validFrom"), value: date(ssl.validFrom) },
                          { label: t("validTo"), value: date(ssl.validTo) },
                          {
                            label: t("daysLeft"),
                            value:
                              ssl.daysLeft !== undefined
                                ? t("days", { count: number(ssl.daysLeft) })
                                : undefined,
                          },
                          {
                            label: t("tlsProtocol"),
                            value: ssl.protocol,
                            mono: true,
                          },
                          { label: t("cipher"), value: ssl.cipher, mono: true },
                          {
                            label: t("fingerprint"),
                            value: ssl.fingerprint,
                            mono: true,
                          },
                        ]}
                      />
                    </>
                  ) : null}
                  <p className="text-sm leading-6 text-muted-foreground">
                    {t("sslNote")}
                  </p>
                </TabsContent>
                <TabsContent value="whois" className="space-y-4">
                  <ResultNotice result={report.whois} />
                  {registration ? (
                    <ResultFields
                      fields={[
                        {
                          label: t("registrationDomain"),
                          value: registration.domain,
                          mono: true,
                        },
                        {
                          label: t("registrar"),
                          value: registration.registrar,
                        },
                        {
                          label: t("registrationDate"),
                          value: date(registration.registrationDate),
                        },
                        {
                          label: t("expirationDate"),
                          value: date(registration.expirationDate),
                        },
                        {
                          label: t("updatedDate"),
                          value: date(registration.updatedDate),
                        },
                        {
                          label: t("domainStatuses"),
                          value: registration.statuses.join("\n"),
                          mono: true,
                        },
                        {
                          label: t("nameServers"),
                          value: registration.nameServers.join("\n"),
                          mono: true,
                        },
                        {
                          label: t("source"),
                          value: registration.sourceUrl,
                          mono: true,
                        },
                      ]}
                    />
                  ) : null}
                  <p className="text-sm leading-6 text-muted-foreground">
                    {t("registrationNote")}
                  </p>
                </TabsContent>
                <TabsContent value="performance" className="space-y-6">
                  <ResultNotice result={report.performance} />
                  {http ? (
                    <>
                      <ResultFields
                        fields={[
                          {
                            label: t("responseTime"),
                            value: `${number(http.responseTime)} ms`,
                            mono: true,
                          },
                          {
                            label: t("httpStatus"),
                            value:
                              http.httpStatus !== undefined
                                ? String(http.httpStatus)
                                : undefined,
                            mono: true,
                          },
                          {
                            label: t(
                              report.performance.status === "success"
                                ? "finalUrl"
                                : "lastUrl"
                            ),
                            value: http.finalUrl,
                            mono: true,
                          },
                        ]}
                      />
                      <section className="space-y-3">
                        <h3 className="font-medium">{t("hops")}</h3>
                        {http.hops.length ? (
                          <ol className="space-y-3">
                            {http.hops.map((hop, index) => (
                              <li
                                key={`${index}-${hop.url}`}
                                className="min-w-0 rounded-md border p-3 text-sm"
                              >
                                <p
                                  className="break-words font-mono"
                                  translate="no"
                                >
                                  {hop.url}
                                </p>
                                <p className="mt-2 flex flex-wrap gap-3 text-muted-foreground">
                                  <span>
                                    {t("hopStatus")}:{" "}
                                    <span className="font-mono tabular-nums text-foreground">
                                      {hop.status}
                                    </span>
                                  </span>
                                  <span>
                                    {t("method")}: {hop.method}
                                  </span>
                                  <span>
                                    {t("hopTime")}:{" "}
                                    <span className="tabular-nums">
                                      {number(hop.responseTime)} ms
                                    </span>
                                  </span>
                                </p>
                                {hop.location ? (
                                  <p className="mt-2 break-words font-mono text-xs text-muted-foreground">
                                    {t("nextUrl")}: {hop.location}
                                  </p>
                                ) : null}
                              </li>
                            ))}
                          </ol>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            {t("noHops")}
                          </p>
                        )}
                      </section>
                      {Object.keys(http.headers).length ? (
                        <section className="space-y-3">
                          <h3 className="font-medium">{t("headers")}</h3>
                          <ResultFields
                            fields={Object.entries(http.headers).map(
                              ([label, value]) => ({ label, value, mono: true })
                            )}
                          />
                        </section>
                      ) : null}
                      {http.hops.length ? (
                        <section className="space-y-3">
                          <h3 className="font-medium">
                            {t("securityHeaders")}
                          </h3>
                          <ul className="space-y-2">
                            {SECURITY_HEADERS.map(header => (
                              <li
                                key={header}
                                className="flex flex-wrap items-center justify-between gap-2 text-sm"
                              >
                                <span
                                  className="break-all font-mono"
                                  translate="no"
                                >
                                  {header}
                                </span>
                                <Badge variant="outline">
                                  {t(
                                    header === "strict-transport-security" &&
                                      http.finalUrl?.startsWith("http:")
                                      ? "notApplicable"
                                      : http.headers[header]
                                        ? "present"
                                        : "missing"
                                  )}
                                </Badge>
                              </li>
                            ))}
                          </ul>
                          <p className="text-sm leading-6 text-muted-foreground">
                            {t("headersNote")}
                          </p>
                        </section>
                      ) : null}
                    </>
                  ) : null}
                  <p className="text-sm leading-6 text-muted-foreground">
                    {t("httpNote")}
                  </p>
                </TabsContent>
              </>
            )}
          </Tabs>
        </CardContent>
      </Card>
      <Alert>
        <AlertCircle className="size-4" aria-hidden="true" />
        <AlertTitle>{t("helpTitle")}</AlertTitle>
        <AlertDescription>{t("helpDescription")}</AlertDescription>
      </Alert>
    </div>
  );
}

function getDomainErrorCodeFromResponse(response: unknown): DomainErrorCode {
  // 输入类错误由服务端再次校验，其他响应统一显示可恢复的连接错误。
  const code =
    response && typeof response === "object" && "error" in response
      ? response.error
      : null;
  return code === "invalidInput" ||
    code === "unsupportedProtocol" ||
    code === "credentialsNotAllowed" ||
    code === "humanVerificationRequired"
    ? code
    : "networkFailed";
}
