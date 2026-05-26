"use client";

import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { CalendarDays } from "lucide-react";
import type { CalendarDay } from "../lib/lunar-utils";

interface DateDetailPanelProps {
  selectedDate: Date;
  days: CalendarDay[];
}

function findDay(days: CalendarDay[], date: Date): CalendarDay | undefined {
  const key = format(date, "yyyy-MM-dd");
  return days.find(d => format(d.date, "yyyy-MM-dd") === key);
}

export default function DateDetailPanel({
  selectedDate,
  days,
}: DateDetailPanelProps) {
  const day = findDay(days, selectedDate);

  if (!day) {
    return (
      <Card className="w-full rounded-3xl border-border/60 xl:sticky xl:top-6">
        <CardContent className="py-12 text-center text-muted-foreground">
          请选择一个日期查看详情
        </CardContent>
      </Card>
    );
  }

  const { lunar } = day;
  const allFestivals = [
    ...lunar.lunarFestivals.map(f => ({ name: f, type: "lunar" as const })),
    ...lunar.solarFestivals.map(f => ({ name: f, type: "solar" as const })),
    ...lunar.otherFestivals.map(f => ({
      name: f,
      type: "other" as const,
    })),
  ];

  return (
    <Card className="w-full rounded-3xl border-border/60 shadow-sm xl:sticky xl:top-6">
      <CardHeader className="space-y-4 border-b border-border/60 bg-muted/20 pb-5">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarDays className="h-4 w-4" />
          {format(selectedDate, "yyyy年M月d日 EEEE", { locale: zhCN })}
        </CardTitle>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-border/60 bg-background/90 p-3">
            <p className="text-xs text-muted-foreground">农历日期</p>
            <p className="mt-1 text-sm font-medium">
              {lunar.yearInChinese}年 {lunar.isLeapMonth ? "闰" : ""}
              {lunar.monthInChinese}月{lunar.dayInChinese}
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-background/90 p-3">
            <p className="text-xs text-muted-foreground">干支与生肖</p>
            <p className="mt-1 text-sm font-medium">
              {lunar.yearInGanZhi}年 {lunar.yearShengXiao}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 p-5 text-sm">
        <section>
          <h3 className="mb-2 font-medium text-muted-foreground">农历信息</h3>
          <p className="leading-6">
            {lunar.yearInGanZhi}年（{lunar.yearShengXiao}年）{" "}
            {lunar.monthInGanZhi}月 {lunar.dayInGanZhi}日
          </p>
        </section>

        <Separator />

        <section className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">星座</p>
            <p className="mt-1 font-medium">{lunar.xingZuo}座</p>
          </div>
          <div className="rounded-2xl bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">纳音</p>
            <p className="mt-1 font-medium">{lunar.dayNaYin}</p>
          </div>
        </section>

        {lunar.jieQi && (
          <>
            <Separator />
            <section>
              <Badge
                variant="secondary"
                className="rounded-full bg-blue-100 px-3 py-1 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
              >
                节气：{lunar.jieQi}
              </Badge>
            </section>
          </>
        )}

        {allFestivals.length > 0 && (
          <>
            <Separator />
            <section>
              <h3 className="mb-2 font-medium text-muted-foreground">节日</h3>
              <div className="flex flex-wrap gap-2">
                {allFestivals.map((f, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="rounded-full border-red-300 text-red-600 dark:border-red-700 dark:text-red-400"
                  >
                    {f.name}
                  </Badge>
                ))}
              </div>
            </section>
          </>
        )}

        <Separator />

        <section className="space-y-3">
          <h3 className="font-medium">
            <span className="text-green-600 dark:text-green-400">宜</span>
          </h3>
          {lunar.dayYi.length > 0 ? (
            <ScrollArea className="max-h-[136px]">
              <div className="flex flex-wrap gap-2">
                {lunar.dayYi.map((item, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="text-xs bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                  >
                    {item}
                  </Badge>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <p className="text-muted-foreground text-xs">无</p>
          )}
        </section>

        <section className="space-y-3">
          <h3 className="font-medium">
            <span className="text-red-600 dark:text-red-400">忌</span>
          </h3>
          {lunar.dayJi.length > 0 ? (
            <ScrollArea className="max-h-[136px]">
              <div className="flex flex-wrap gap-2">
                {lunar.dayJi.map((item, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="text-xs bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                  >
                    {item}
                  </Badge>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <p className="text-muted-foreground text-xs">无</p>
          )}
        </section>

        <Separator />

        <section className="space-y-2 rounded-2xl bg-muted/30 p-3 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">冲煞与彭祖百忌</p>
          <p>
            冲{lunar.chong} 煞{lunar.sha}
          </p>
          <p>彭祖百忌：{lunar.pengZuGan}</p>
          <p>{lunar.pengZuZhi}</p>
        </section>

        {(lunar.dayJiShen.length > 0 || lunar.dayXiongSha.length > 0) && (
          <>
            <Separator />
            <section className="space-y-3 text-xs">
              {lunar.dayJiShen.length > 0 && (
                <div className="rounded-2xl bg-green-500/5 p-3">
                  <span className="text-muted-foreground">吉神宜趋：</span>
                  {lunar.dayJiShen.join("、")}
                </div>
              )}
              {lunar.dayXiongSha.length > 0 && (
                <div className="rounded-2xl bg-red-500/5 p-3">
                  <span className="text-muted-foreground">凶煞宜忌：</span>
                  {lunar.dayXiongSha.join("、")}
                </div>
              )}
            </section>
          </>
        )}
      </CardContent>
    </Card>
  );
}
