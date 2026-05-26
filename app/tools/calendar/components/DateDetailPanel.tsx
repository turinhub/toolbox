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
      <Card className="w-full md:w-[340px] shrink-0">
        <CardContent className="py-8 text-center text-muted-foreground">
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
    <Card className="w-full md:w-[340px] shrink-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarDays className="h-4 w-4" />
          {format(selectedDate, "yyyy年M月d日 EEEE", { locale: zhCN })}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {/* 农历信息 */}
        <section>
          <h3 className="font-medium text-muted-foreground mb-1.5">农历</h3>
          <p>
            {lunar.yearInChinese}年 {lunar.isLeapMonth ? "闰" : ""}
            {lunar.monthInChinese}月{lunar.dayInChinese}
          </p>
          <p className="text-muted-foreground">
            {lunar.yearInGanZhi}年（{lunar.yearShengXiao}年）{" "}
            {lunar.monthInGanZhi}月 {lunar.dayInGanZhi}日
          </p>
        </section>

        <Separator />

        {/* 星座 & 纳音 */}
        <section className="flex gap-4">
          <div>
            <span className="text-muted-foreground">星座：</span>
            {lunar.xingZuo}座
          </div>
          <div>
            <span className="text-muted-foreground">纳音：</span>
            {lunar.dayNaYin}
          </div>
        </section>

        {/* 节气 */}
        {lunar.jieQi && (
          <>
            <Separator />
            <section>
              <Badge
                variant="secondary"
                className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
              >
                节气：{lunar.jieQi}
              </Badge>
            </section>
          </>
        )}

        {/* 节日 */}
        {allFestivals.length > 0 && (
          <>
            <Separator />
            <section>
              <h3 className="font-medium text-muted-foreground mb-1.5">节日</h3>
              <div className="flex flex-wrap gap-1.5">
                {allFestivals.map((f, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="border-red-300 text-red-600 dark:border-red-700 dark:text-red-400"
                  >
                    {f.name}
                  </Badge>
                ))}
              </div>
            </section>
          </>
        )}

        <Separator />

        {/* 宜 */}
        <section>
          <h3 className="font-medium mb-1.5">
            <span className="text-green-600 dark:text-green-400">宜</span>
          </h3>
          {lunar.dayYi.length > 0 ? (
            <ScrollArea className="max-h-[120px]">
              <div className="flex flex-wrap gap-1">
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

        {/* 忌 */}
        <section>
          <h3 className="font-medium mb-1.5">
            <span className="text-red-600 dark:text-red-400">忌</span>
          </h3>
          {lunar.dayJi.length > 0 ? (
            <ScrollArea className="max-h-[120px]">
              <div className="flex flex-wrap gap-1">
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

        {/* 冲煞 */}
        <section className="text-muted-foreground text-xs space-y-1">
          <p>
            冲{lunar.chong} 煞{lunar.sha}
          </p>
          <p>彭祖百忌：{lunar.pengZuGan}</p>
          <p>{lunar.pengZuZhi}</p>
        </section>

        {/* 吉神凶煞 */}
        {(lunar.dayJiShen.length > 0 || lunar.dayXiongSha.length > 0) && (
          <>
            <Separator />
            <section className="text-xs space-y-2">
              {lunar.dayJiShen.length > 0 && (
                <div>
                  <span className="text-muted-foreground">吉神宜趋：</span>
                  {lunar.dayJiShen.join("、")}
                </div>
              )}
              {lunar.dayXiongSha.length > 0 && (
                <div>
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
