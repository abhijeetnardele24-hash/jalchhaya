import React, { useState, useMemo } from "react";
import { ReliefPoint, ResourceType, AvailabilityStatus } from "../types/schema";
import { Locale, translations } from "../i18n/translations";
import { ReliefCard } from "./ReliefCard";
import { Search, Filter, RefreshCw } from "lucide-react";

interface ReliefBoardProps {
  points: ReliefPoint[];
  locale: Locale;
  onOpenReportModal: (point: ReliefPoint) => void;
  onOpenAttestModal: (point: ReliefPoint) => void;
  onInspectEntity: (point: ReliefPoint) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export const ReliefBoard: React.FC<ReliefBoardProps> = ({
  points,
  locale,
  onOpenReportModal,
  onOpenAttestModal,
  onInspectEntity,
  onRefresh,
  isLoading,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedResourceType, setSelectedResourceType] = useState<ResourceType | "all">("all");
  const [selectedStatus, setSelectedStatus] = useState<AvailabilityStatus | "all">("all");

  const t = translations[locale];

  // Filter logic
  const filteredPoints = useMemo(() => {
    return points.filter((point) => {
      // Search matching name, marathi/hindi name, or address hint
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = point.payload.name.toLowerCase().includes(query);
        const matchesMr = point.payload.name_mr.toLowerCase().includes(query);
        const matchesHi = point.payload.name_hi.toLowerCase().includes(query);
        const matchesAddr = point.payload.address_hint.toLowerCase().includes(query);
        if (!matchesName && !matchesMr && !matchesHi && !matchesAddr) {
          return false;
        }
      }

      // Resource type filter
      if (selectedResourceType !== "all" && point.resourceType !== selectedResourceType) {
        return false;
      }

      // Status filter
      if (selectedStatus !== "all") {
        if (!point.latestObservation) return false;
        if (point.latestObservation.status !== selectedStatus) return false;
      }

      return true;
    });
  }, [points, searchTerm, selectedResourceType, selectedStatus]);

  return (
    <section aria-labelledby="relief-board-title" style={{ width: "100%" }}>
      {/* Search and Filter Toolbar */}
      <div
        style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border-main)",
          borderRadius: "8px",
          padding: "1rem",
          marginBottom: "1.25rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.875rem",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <Filter size={16} color="var(--color-water)" />
            <h2 id="relief-board-title" style={{ fontSize: "0.9375rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {t.filtersTitle}
            </h2>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginLeft: "0.25rem" }}>
              ({filteredPoints.length} {locale === "mr" ? "उपलब्ध" : locale === "hi" ? "उपलब्ध" : "Active"})
            </span>
          </div>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.25rem",
              fontSize: "0.75rem",
              padding: "0.25rem 0.5rem",
              border: "1px solid var(--border-strong)",
              borderRadius: "4px",
              backgroundColor: "transparent",
              cursor: isLoading ? "not-allowed" : "pointer",
            }}
          >
            <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} />
            <span>{isLoading ? "Querying…" : "Refresh"}</span>
          </button>
        </div>

        {/* Search input */}
        <div style={{ position: "relative" }}>
          <Search
            size={16}
            color="var(--text-light)"
            style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)" }}
          />
          <input
            type="search"
            placeholder={t.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "0.5rem 0.75rem 0.5rem 2.25rem",
              borderRadius: "6px",
              border: "1px solid var(--border-strong)",
              backgroundColor: "var(--bg-canvas)",
              fontSize: "0.875rem",
              fontFamily: "var(--font-sans)",
            }}
          />
        </div>

        {/* Resource Filter Chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }} role="group" aria-label="Resource Type Filter">
          <button
            onClick={() => setSelectedResourceType("all")}
            style={{
              padding: "0.25rem 0.625rem",
              borderRadius: "20px",
              fontSize: "0.75rem",
              fontWeight: 600,
              cursor: "pointer",
              border: selectedResourceType === "all" ? "1px solid var(--color-water)" : "1px solid var(--border-main)",
              backgroundColor: selectedResourceType === "all" ? "var(--color-water-subtle)" : "var(--bg-canvas)",
              color: selectedResourceType === "all" ? "var(--color-water)" : "var(--text-ink)",
            }}
            aria-pressed={selectedResourceType === "all"}
          >
            All Resources
          </button>

          {(["water", "shade", "cooling_centre", "first_aid_ors"] as ResourceType[]).map((type) => (
            <button
              key={type}
              onClick={() => setSelectedResourceType(type)}
              style={{
                padding: "0.25rem 0.625rem",
                borderRadius: "20px",
                fontSize: "0.75rem",
                fontWeight: 600,
                cursor: "pointer",
                border: selectedResourceType === type ? "1px solid var(--color-water)" : "1px solid var(--border-main)",
                backgroundColor: selectedResourceType === type ? "var(--color-water-subtle)" : "var(--bg-canvas)",
                color: selectedResourceType === type ? "var(--color-water)" : "var(--text-ink)",
              }}
              aria-pressed={selectedResourceType === type}
            >
              {t.resourceTypes[type]}
            </button>
          ))}
        </div>

        {/* Status Filter Chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }} role="group" aria-label="Status Filter">
          <button
            onClick={() => setSelectedStatus("all")}
            style={{
              padding: "0.25rem 0.5rem",
              borderRadius: "4px",
              fontSize: "0.6875rem",
              fontWeight: 600,
              cursor: "pointer",
              border: selectedStatus === "all" ? "1px solid var(--text-ink)" : "1px solid var(--border-main)",
              backgroundColor: selectedStatus === "all" ? "var(--bg-muted)" : "transparent",
              color: "var(--text-ink)",
            }}
            aria-pressed={selectedStatus === "all"}
          >
            Any Status
          </button>

          <button
            onClick={() => setSelectedStatus("available")}
            style={{
              padding: "0.25rem 0.5rem",
              borderRadius: "4px",
              fontSize: "0.6875rem",
              fontWeight: 600,
              cursor: "pointer",
              border: selectedStatus === "available" ? "1px solid var(--color-sage)" : "1px solid var(--border-main)",
              backgroundColor: selectedStatus === "available" ? "var(--color-sage-subtle)" : "transparent",
              color: "var(--color-sage)",
            }}
            aria-pressed={selectedStatus === "available"}
          >
            {t.statuses.available}
          </button>

          <button
            onClick={() => setSelectedStatus("crowded")}
            style={{
              padding: "0.25rem 0.5rem",
              borderRadius: "4px",
              fontSize: "0.6875rem",
              fontWeight: 600,
              cursor: "pointer",
              border: selectedStatus === "crowded" ? "1px solid var(--color-amber)" : "1px solid var(--border-main)",
              backgroundColor: selectedStatus === "crowded" ? "var(--color-amber-subtle)" : "transparent",
              color: "var(--color-amber)",
            }}
            aria-pressed={selectedStatus === "crowded"}
          >
            {t.statuses.crowded}
          </button>

          <button
            onClick={() => setSelectedStatus("unavailable")}
            style={{
              padding: "0.25rem 0.5rem",
              borderRadius: "4px",
              fontSize: "0.6875rem",
              fontWeight: 600,
              cursor: "pointer",
              border: selectedStatus === "unavailable" ? "1px solid var(--color-heat)" : "1px solid var(--border-main)",
              backgroundColor: selectedStatus === "unavailable" ? "var(--color-heat-subtle)" : "transparent",
              color: "var(--color-heat)",
            }}
            aria-pressed={selectedStatus === "unavailable"}
          >
            {t.statuses.unavailable}
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      {filteredPoints.length === 0 ? (
        <div
          style={{
            padding: "3rem 1.5rem",
            textAlign: "center",
            backgroundColor: "var(--bg-card)",
            borderRadius: "8px",
            border: "1px solid var(--border-main)",
          }}
        >
          <p style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-ink)" }}>
            {locale === "mr" ? "कोणतीही दिलासा केंद्रे सापडली नाहीत" : locale === "hi" ? "कोई राहत केंद्र नहीं मिला" : "No relief points match your query"}
          </p>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
            Try resetting your zone or resource filter to view all Pune municipal relief stations.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 280px), 1fr))",
            gap: "1rem",
          }}
        >
          {filteredPoints.map((point) => (
            <ReliefCard
              key={point.key}
              point={point}
              locale={locale}
              onOpenReportModal={onOpenReportModal}
              onOpenAttestModal={onOpenAttestModal}
              onInspectEntity={onInspectEntity}
            />
          ))}
        </div>
      )}
    </section>
  );
};
