// scripts/config.js
// Zentrale Konfiguration: Spalten, KPIs, Input-Felder

(function(window) {
  window.ClarityConfig = {
    // Eingabefelder (vom User editierbar)
    INPUT_KEYS: [
      "Adspend", "Impr", "Reach", "Clicks", "Leads", "Survey",
      "SurveyQuali", "Calendly", "Termine", "SalesCall", "Units", "Revenue", "Cash"
    ],

    ALL_COLUMNS: [
      "Tag", "Datum", "Adspend", "Impr", "Reach", "CPM", "Clicks", "CTR", "CPC",
      "Leads", "LP-%", "CPL", "Survey", "VideoCR-%", "CPS",
      "SurveyQuali", "SurveyQuali-%", "SurveyQuali-€", "Calendly", "Booking-%", "Booking-€",
      "Termine", "Quali-%", "Termin-€", "SalesCall", "SUR-%", "SUR-€",
      "Units", "CC%", "LC%", "Revenue", "Cash", "CC-Rate%", "CPA", "EPA-C",
      "R-P/L", "C-P/L", "R-ROI", "C-ROI"
    ],

    YEAR_COLUMNS: [
      "Monat", "Adspend", "Impr", "Reach", "CPM", "Clicks", "CTR", "CPC",
      "Leads", "LP-%", "CPL", "Survey", "VideoCR-%", "CPS",
      "SurveyQuali", "SurveyQuali-%", "SurveyQuali-€", "Calendly", "Booking-%", "Booking-€",
      "Termine", "Quali-%", "Termin-€", "SalesCall", "SUR-%", "SUR-€",
      "Units", "CC%", "LC%", "Revenue", "Cash", "CC-Rate%", "CPA", "EPA-C",
      "R-P/L", "C-P/L", "R-ROI", "C-ROI"
    ],

    // Berechnete KPI-Felder (grau hinterlegt)
    KPI_COLS: [
      "CPM", "CTR", "CPC", "LP-%", "CPL", "VideoCR-%", "CPS",
      "SurveyQuali-%", "SurveyQuali-€", "Booking-%", "Booking-€",
      "Quali-%", "Termin-€", "SUR-%", "SUR-€", "CC%", "LC%",
      "CC-Rate%", "CPA", "EPA-C", "R-P/L", "C-P/L", "R-ROI", "C-ROI"
    ]
  };
})(window);