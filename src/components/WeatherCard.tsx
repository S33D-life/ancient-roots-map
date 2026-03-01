/**
 * Weather card for tree pages — shows current conditions + 3-day forecast.
 * Uses mock data (future: OpenWeather One Call).
 */
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Wind, Droplets, Eye, Sun } from "lucide-react";
import { useWeather, formatTemp, formatWind, type WeatherSnapshot } from "@/hooks/use-weather";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

interface WeatherCardProps {
  latitude: number | null;
  longitude: number | null;
  tempUnit?: string;
  windUnit?: string;
}

const WeatherCard = ({ latitude, longitude, tempUnit = "C", windUnit = "km/h" }: WeatherCardProps) => {
  const { weather, loading } = useWeather(latitude, longitude);
  const [forecastOpen, setForecastOpen] = useState(false);

  if (loading || !weather) return null;

  return (
    <Card className="border-border/40 bg-card/60 backdrop-blur overflow-hidden">
      <div
        className="h-0.5"
        style={{
          background: "linear-gradient(90deg, hsl(var(--primary) / 0.3), hsl(200 70% 50% / 0.4), transparent)",
        }}
      />
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-serif tracking-widest uppercase text-muted-foreground flex items-center gap-2">
            <Sun className="w-4 h-4 text-primary/60" />
            Weather at the Tree
          </h3>
          <Badge variant="outline" className="text-[9px] font-mono border-border/40 text-muted-foreground/60">
            {weather.source === "mock" ? "simulated" : "live"}
          </Badge>
        </div>

        {/* Current conditions */}
        <div className="flex items-center gap-4">
          <span className="text-4xl">{weather.weatherIcon}</span>
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-serif text-foreground">{formatTemp(weather.temp, tempUnit)}</span>
              <span className="text-xs text-muted-foreground">
                Feels {formatTemp(weather.feelsLike, tempUnit)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground font-serif">{weather.weatherDesc}</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2">
          <div className="flex flex-col items-center gap-0.5 text-[10px] text-muted-foreground">
            <Wind className="w-3.5 h-3.5" />
            <span>{formatWind(weather.windSpeed, windUnit)}</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 text-[10px] text-muted-foreground">
            <Droplets className="w-3.5 h-3.5" />
            <span>{weather.humidity}%</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 text-[10px] text-muted-foreground">
            <Eye className="w-3.5 h-3.5" />
            <span>{(weather.visibility / 1000).toFixed(0)}km</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 text-[10px] text-muted-foreground">
            <Sun className="w-3.5 h-3.5" />
            <span>UV {weather.uvi}</span>
          </div>
        </div>

        {/* Precipitation */}
        {(weather.rain1h || weather.snow1h) && (
          <div className="flex gap-3 text-xs text-muted-foreground font-serif">
            {weather.rain1h && <span>🌧️ {weather.rain1h}mm rain/h</span>}
            {weather.snow1h && <span>❄️ {weather.snow1h}mm snow/h</span>}
          </div>
        )}

        {/* Alerts */}
        {weather.alerts.length > 0 && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-serif font-medium text-destructive">{weather.alerts[0].event}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{weather.alerts[0].description}</p>
            </div>
          </div>
        )}

        {/* 3-day forecast */}
        <Collapsible open={forecastOpen} onOpenChange={setForecastOpen}>
          <CollapsibleTrigger className="w-full flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground font-serif transition-colors pt-1">
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${forecastOpen ? "rotate-180" : ""}`} />
            3-day forecast
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <div className="space-y-1.5">
              {weather.dailyForecast.map((day) => (
                <div key={day.date} className="flex items-center justify-between text-xs font-serif px-1 py-1 rounded bg-secondary/20">
                  <span className="text-muted-foreground w-16">
                    {new Date(day.date + "T12:00:00").toLocaleDateString(undefined, { weekday: "short" })}
                  </span>
                  <span>{day.weatherIcon}</span>
                  <span className="text-foreground">
                    {formatTemp(day.tempMax, tempUnit)} / {formatTemp(day.tempMin, tempUnit)}
                  </span>
                  <span className="text-muted-foreground/60 w-10 text-right">{day.pop}%💧</span>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};

export default WeatherCard;
