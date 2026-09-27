"use client";

import { useEffect, useState } from "react";

import { wmoEmoji, wmoText } from "@/lib/weather";

type Props = {
  defaultCity: string;
  cities: string[];
};

type WeatherData = {
  city: string;
  temp: number;
  feels: number;
  humidity: number;
  wind: number;
  text: string;
  emoji: string;
  daily: { date: string; emoji: string; min: number; max: number }[];
};

// 天气预报卡:数据来自 Open-Meteo(免费、无需 Key)。
// 地区可切换,访客的选择存在自己浏览器里。
const CACHE_TTL = 30 * 60 * 1000; // 30 分钟缓存,减少请求

export default function WeatherCard({
  defaultCity,
  cities,
}: Props) {
  const regionList = [defaultCity, ...cities].filter(Boolean);
  const [city, setCity] = useState(defaultCity || cities[0] || "");
  const [data, setData] = useState<WeatherData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!city) return;
    let cancelled = false;
    const cacheKey = `weather:${city}`;

    // 先看缓存(30 分钟内有效)
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached) as { at: number; data: WeatherData };
        if (Date.now() - parsed.at < CACHE_TTL) {
          setData(parsed.data);
          setError("");
          return;
        }
      }
    } catch {
      // 忽略缓存异常
    }

    setLoading(true);
    setError("");
    (async () => {
      try {
        // 1. 城市名 → 经纬度(Open-Meteo 地理编码,中文可用)
        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=zh&format=json`,
        );
        const geo = (await geoRes.json()) as {
          results?: { latitude: number; longitude: number; name: string }[];
        };
        const hit = geo.results?.[0];
        if (!hit) {
          setError("找不到这个城市");
          setLoading(false);
          return;
        }
        // 2. 拉天气
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${hit.latitude}&longitude=${hit.longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=4`,
        );
        const raw = (await res.json()) as {
          current?: {
            temperature_2m: number;
            apparent_temperature: number;
            relative_humidity_2m: number;
            weather_code: number;
            wind_speed_10m: number;
          };
          daily?: {
            time: string[];
            weather_code: number[];
            temperature_2m_max: number[];
            temperature_2m_min: number[];
          };
        };
        if (!raw.current) throw new Error("天气数据异常");
        const daily = (raw.daily?.time ?? []).slice(0, 3).map((date, i) => ({
          date,
          emoji: wmoEmoji(raw.daily!.weather_code[i]),
          min: Math.round(raw.daily!.temperature_2m_min[i]),
          max: Math.round(raw.daily!.temperature_2m_max[i]),
        }));
        const next: WeatherData = {
          city: hit.name,
          temp: Math.round(raw.current.temperature_2m),
          feels: Math.round(raw.current.apparent_temperature),
          humidity: Math.round(raw.current.relative_humidity_2m),
          wind: Math.round(raw.current.wind_speed_10m),
          text: wmoText(raw.current.weather_code),
          emoji: wmoEmoji(raw.current.weather_code),
          daily,
        };
        if (!cancelled) setData(next);
        try {
          sessionStorage.setItem(
            cacheKey,
            JSON.stringify({ at: Date.now(), data: next }),
          );
        } catch {
          // 忽略
        }
      } catch {
        if (!cancelled) setError("天气数据获取失败");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [city]);

  if (!city) return null;

  return (
    <section className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-semibold">
          <span className="inline-block h-4 w-1 rounded-full bg-accent" />
          天气预报
        </h3>
        {regionList.length > 1 && (
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="rounded-lg border border-border bg-transparent px-2 py-1 text-xs outline-none"
          >
            {regionList.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        )}
      </div>

      {loading && !data && <p className="mt-3 text-sm opacity-60">天气加载中…</p>}
      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

      {data && (
        <>
          <div className="mt-3 flex items-center gap-3">
            <span className="text-4xl">{data.emoji}</span>
            <div>
              <p className="text-3xl font-bold">{data.temp}°C</p>
              <p className="text-xs opacity-60">
                {data.city} · {data.text}
              </p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-lg bg-foreground/5 p-2">
              <p className="opacity-60">体感</p>
              <p className="mt-0.5 font-medium">{data.feels}°C</p>
            </div>
            <div className="rounded-lg bg-foreground/5 p-2">
              <p className="opacity-60">湿度</p>
              <p className="mt-0.5 font-medium">{data.humidity}%</p>
            </div>
            <div className="rounded-lg bg-foreground/5 p-2">
              <p className="opacity-60">风速</p>
              <p className="mt-0.5 font-medium">{data.wind}km/h</p>
            </div>
          </div>

          {data.daily.length > 0 && (
            <div className="mt-3 space-y-1.5 text-xs">
              {data.daily.map((day) => (
                <div
                  key={day.date}
                  className="flex items-center justify-between rounded-lg bg-foreground/5 px-2.5 py-1.5"
                >
                  <span className="opacity-60">{day.date.slice(5)}</span>
                  <span>{day.emoji}</span>
                  <span className="font-medium">
                    {day.min}° ~ {day.max}°
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
