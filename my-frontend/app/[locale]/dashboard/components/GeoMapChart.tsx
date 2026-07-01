"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { scaleLinear } from "d3-scale";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
  Marker,
} from "@vnedyalk0v/react19-simple-maps";
import type { Coordinates } from "@vnedyalk0v/react19-simple-maps";

// Global cache for geography data and in-flight requests to prevent redundant fetches
const geographyCache: Record<string, any> = {};
const geographyRequests: Record<string, Promise<any> | undefined> = {};

export interface GeoDataPoint {
  name: string;
  value: number;
  coordinates?: [number, number];
}

export interface GeoMapConfig {
  type?: "geo_map" | "bubble_map" | "choropleth_map";
  geoUrl?: string;
  data: GeoDataPoint[];
  valueRange?: [number, number];
  colorRange?: [string, string];
  defaultColor?: string;
  noDataColor?: string;
  strokeColor?: string;
  noDataStrokeColor?: string;
  projection?: "geoMercator" | "geoEqualEarth";
  center?: [number, number];
  zoom?: number;
  hoverColor?: string;
  showLegend?: boolean;
  legendTitle?: string;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  country: string;
  value?: number;
}

const defaultGeoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";

export default function GeoMapChart({ config }: { config: GeoMapConfig }) {
  const {
    type = "choropleth_map",
    geoUrl = defaultGeoUrl,
    data,
    valueRange,
    colorRange = ["#DDD6FE", "#7C3AED"],
    defaultColor = "#F8FAFC",
    noDataColor = "#F1F5F9",
    strokeColor = "#ffffff",
    noDataStrokeColor = "#E2E8F0",
    projection = "geoMercator",
    center = [10, 20],
    zoom = 1,
    hoverColor = "#8B5CF6",
    showLegend = true,
    legendTitle = "",
  } = config;

  const [geographyData, setGeographyData] = useState<any>(geographyCache[geoUrl] || null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Load geography data if not in cache
  useEffect(() => {
    if (geographyCache[geoUrl]) {
        if (geographyData !== geographyCache[geoUrl]) {
            setGeographyData(geographyCache[geoUrl]);
        }
        return;
    }

    if (geographyRequests[geoUrl]) {
        geographyRequests[geoUrl].then(data => {
            setGeographyData(data);
        });
        return;
    }

    // Assign to geographyRequests immediately to block other components in the same tick
    geographyRequests[geoUrl] = fetch(geoUrl)
      .then(res => res.json())
      .then(data => {
        geographyCache[geoUrl] = data;
        delete geographyRequests[geoUrl];
        setGeographyData(data);
        return data;
      })
      .catch(err => {
        console.error("Failed to load geography data", err);
        delete geographyRequests[geoUrl];
        return null;
      });
  }, [geoUrl, geographyData]);

  const values = data.map((d) => d.value);
  const min = valueRange?.[0] ?? Math.min(...values);
  const max = valueRange?.[1] ?? Math.max(...values);

  const colorScale = scaleLinear<string>().domain([min, max]).range(colorRange);
  const sizeScale = scaleLinear().domain([min, max]).range([4, 15]);

  const dataByCountry = new Map(
    data.map((d) => [d.name.toLowerCase(), d.value])
  );

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent, country: string, value?: number) => {
      const rect = mapContainerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setTooltip({
        visible: true,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        country,
        value: value ?? dataByCountry.get(country.toLowerCase()),
      });
    },
    [dataByCountry]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!tooltip?.visible) return;
      const rect = mapContainerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setTooltip((prev) =>
        prev
          ? {
              ...prev,
              x: e.clientX - rect.left,
              y: e.clientY - rect.top,
            }
          : null
      );
    },
    [tooltip?.visible]
  );

  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  return (
    <div className="w-full h-full flex flex-col">
      <div
        ref={mapContainerRef}
        className="flex-1 min-h-0 relative"
        onMouseMove={handleMouseMove}
      >
        <ComposableMap
          projection={projection}
          style={{ width: "100%", height: "100%" }}
        >
          <ZoomableGroup center={center as Coordinates} zoom={zoom}>
            {geographyData && (
              <Geographies geography={geographyData}>
                {({ geographies }) =>
                  geographies.map((geo, idx) => {
                    const countryName = (geo.properties.name as string) || "Unknown";
                    const value = dataByCountry.get(countryName.toLowerCase());
                    const hasData = value !== undefined;

                    const isChoropleth = type === "choropleth_map" || type === "geo_map";
                    const fillColor = (hasData && isChoropleth) ? colorScale(value) : noDataColor;
                    const stroke = hasData ? strokeColor : noDataStrokeColor;
                    const strokeWidth = hasData ? 1 : 0.5;

                    return (
                      <Geography
                        key={geo.rsmKey || geo.id || `geo-${idx}`}
                        geography={geo}
                        fill={fillColor}
                        stroke={stroke}
                        strokeWidth={strokeWidth}
                        style={{
                          default: { outline: "none", transition: "all 0.2s ease" },
                          hover: { outline: "none", fill: hasData ? hoverColor : noDataColor },
                          pressed: { outline: "none" },
                        }}
                        onMouseEnter={(e: any) => handleMouseEnter(e, countryName)}
                        onMouseLeave={handleMouseLeave}
                      />
                    );
                  })
                }
              </Geographies>
            )}

            {type === "bubble_map" && data.map((d, i) => {
              if (!d.coordinates) return null;
              return (
                <Marker key={`${d.name}-${i}`} coordinates={d.coordinates as Coordinates}>
                  <circle
                    r={sizeScale(d.value)}
                    fill={colorScale(d.value)}
                    stroke="#fff"
                    strokeWidth={1}
                    fillOpacity={0.7}
                    onMouseEnter={(e: any) => handleMouseEnter(e, d.name, d.value)}
                    onMouseLeave={handleMouseLeave}
                    className="transition-transform hover:scale-125"
                  />
                </Marker>
              );
            })}
          </ZoomableGroup>
        </ComposableMap>

        {tooltip?.visible && (
          <div
            className="absolute z-50 pointer-events-none"
            style={{
              left: tooltip.x,
              top: tooltip.y - 8,
              transform: "translate(-50%, -100%)",
            }}
          >
            <div className="bg-slate-900 text-white border shadow-lg rounded-md px-3 py-1.5 min-w-[100px] text-center animate-in fade-in zoom-in-95 duration-200">
              <div className="text-xs font-bold whitespace-nowrap">
                {tooltip.country}
              </div>
              {tooltip.value !== undefined && (
                <div className="text-[11px] font-medium opacity-90">
                  {tooltip.value.toLocaleString()}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showLegend && (
        <div className="flex items-center justify-center gap-3 mt-2 px-4">
          <span className="text-[10px] font-bold text-slate-500">{min.toLocaleString()}</span>
          <div
            className="flex-1 max-w-[120px] h-1.5 rounded-full"
            style={{
              background: `linear-gradient(to right, ${colorRange[0]}, ${colorRange[1]})`,
            }}
          />
          <span className="text-[10px] font-bold text-slate-500">{max.toLocaleString()}</span>
        </div>
      )}
    </div>
  );
}
