import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

/* =========================================================
   SAMPLE DOCUMENTS
========================================================= */

const sampleDocuments = [
  {
    id: "doc1",
    name: "Document 1",
    text:
      "My name is Vidya. I am a student studying computer science. " +
      "I enjoy learning algorithms and developing software applications.",
  },
  {
    id: "doc2",
    name: "Document 2",
    text:
      "Hi my name is Vidya. I am a computer science student. " +
      "I enjoy learning algorithms and developing software applications.",
  },
  {
    id: "doc3",
    name: "Document 3",
    text:
      "Machine learning is useful for analyzing large amounts of data. " +
      "Algorithms help computers solve complex problems efficiently.",
  },
];

/* =========================================================
   TEXT UTILITIES
========================================================= */

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

/* =========================================================
   WORD OVERLAP
========================================================= */

function wordOverlap(textA, textB) {
  const a = new Set(tokenize(textA));
  const b = new Set(tokenize(textB));

  if (a.size === 0 || b.size === 0) {
    return 0;
  }

  let common = 0;

  a.forEach((word) => {
    if (b.has(word)) {
      common++;
    }
  });

  return (common / Math.max(a.size, b.size)) * 100;
}

/* =========================================================
   EDIT DISTANCE
========================================================= */

function editDistance(tokensA, tokensB) {
  const rows = tokensA.length + 1;
  const cols = tokensB.length + 1;

  const dp = Array.from({ length: rows }, () =>
    new Array(cols).fill(0)
  );

  for (let i = 0; i < rows; i++) {
    dp[i][0] = i;
  }

  for (let j = 0; j < cols; j++) {
    dp[0][j] = j;
  }

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      if (tokensA[i - 1] === tokensB[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] =
          1 +
          Math.min(
            dp[i - 1][j],
            dp[i][j - 1],
            dp[i - 1][j - 1]
          );
      }
    }
  }

  return dp[rows - 1][cols - 1];
}

function editSimilarity(textA, textB) {
  const a = tokenize(textA);
  const b = tokenize(textB);

  const maxLength = Math.max(a.length, b.length);

  if (maxLength === 0) {
    return 0;
  }

  const distance = editDistance(a, b);

  return Math.max(0, (1 - distance / maxLength) * 100);
}

/* =========================================================
   EXACT 2-GRAM MATCHES
========================================================= */

function getBigrams(tokens) {
  const result = [];

  for (let i = 0; i < tokens.length - 1; i++) {
    result.push({
      phrase: `${tokens[i]} ${tokens[i + 1]}`,
      position: i,
    });
  }

  return result;
}

/* =========================================================
   KMP
========================================================= */

function buildLPS(pattern) {
  const lps = new Array(pattern.length).fill(0);

  let length = 0;
  let i = 1;

  while (i < pattern.length) {
    if (pattern[i] === pattern[length]) {
      length++;
      lps[i] = length;
      i++;
    } else if (length !== 0) {
      length = lps[length - 1];
    } else {
      lps[i] = 0;
      i++;
    }
  }

  return lps;
}

function kmpSearch(text, pattern) {
  if (!pattern.length || !text.length) {
    return [];
  }

  const lps = buildLPS(pattern);
  const matches = [];

  let i = 0;
  let j = 0;

  while (i < text.length) {
    if (text[i] === pattern[j]) {
      i++;
      j++;

      if (j === pattern.length) {
        matches.push(i - j);
        j = lps[j - 1];
      }
    } else if (j !== 0) {
      j = lps[j - 1];
    } else {
      i++;
    }
  }

  return matches;
}

function getKMPMatches(textA, textB) {
  const a = tokenize(textA);
  const b = tokenize(textB);

  const matches = [];

  for (let i = 0; i < a.length - 1; i++) {
    const pattern = [a[i], a[i + 1]];

    const positions = kmpSearch(b, pattern);

    positions.forEach((position) => {
      matches.push({
        phrase: pattern.join(" "),
        position,
      });
    });
  }

  return uniqueMatches(matches);
}

/* =========================================================
   RABIN-KARP
========================================================= */

function hashTokens(tokens) {
  const BASE = 257;
  const MOD = 1000000007;

  let hash = 0;

  for (const token of tokens) {
    for (let i = 0; i < token.length; i++) {
      hash =
        (hash * BASE + token.charCodeAt(i)) % MOD;
    }

    hash =
      (hash * BASE + 31) % MOD;
  }

  return hash;
}

function rabinKarpSearch(text, pattern) {
  if (!pattern.length || pattern.length > text.length) {
    return [];
  }

  const patternHash = hashTokens(pattern);
  const matches = [];

  for (let i = 0; i <= text.length - pattern.length; i++) {
    const window = text.slice(i, i + pattern.length);

    if (hashTokens(window) === patternHash) {
      let exact = true;

      for (let j = 0; j < pattern.length; j++) {
        if (window[j] !== pattern[j]) {
          exact = false;
          break;
        }
      }

      if (exact) {
        matches.push(i);
      }
    }
  }

  return matches;
}

function getRabinKarpMatches(textA, textB) {
  const a = tokenize(textA);
  const b = tokenize(textB);

  const matches = [];

  for (let i = 0; i < a.length - 1; i++) {
    const pattern = [a[i], a[i + 1]];

    const positions = rabinKarpSearch(b, pattern);

    positions.forEach((position) => {
      matches.push({
        phrase: pattern.join(" "),
        position,
      });
    });
  }

  return uniqueMatches(matches);
}

function uniqueMatches(matches) {
  const seen = new Set();

  return matches.filter((match) => {
    const key = `${match.phrase}-${match.position}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

/* =========================================================
   EXACT COVERAGE
========================================================= */

function exactCoverage(textA, textB) {
  const a = tokenize(textA);
  const b = tokenize(textB);

  if (a.length < 2 || b.length < 2) {
    return 0;
  }

  const matches = getRabinKarpMatches(textA, textB);

  const possible = Math.max(a.length - 1, 1);

  return Math.min(100, (matches.length / possible) * 100);
}

/* =========================================================
   TEXTUAL SIMILARITY
========================================================= */

function textualSimilarity(textA, textB) {
  const overlap = wordOverlap(textA, textB);
  const edit = editSimilarity(textA, textB);
  const exact = exactCoverage(textA, textB);

  return overlap * 0.4 + edit * 0.3 + exact * 0.3;
}

/* =========================================================
   FRONTEND SEMANTIC DEMO
========================================================= */

/*
  Temporary frontend approximation.

  The actual project uses:
  sentence-transformers/all-MiniLM-L6-v2
  through Java + DJL.

  This function exists only so the frontend works
  before the Java backend is connected.
*/

function semanticDemo(textA, textB) {
  const a = tokenize(textA);
  const b = tokenize(textB);

  if (!a.length || !b.length) {
    return 0;
  }

  const setA = new Set(a);
  const setB = new Set(b);

  let common = 0;

  setA.forEach((word) => {
    if (setB.has(word)) {
      common++;
    }
  });

  const lexical =
    common / Math.max(setA.size, setB.size);

  /*
    Give the demo semantic layer a moderate baseline
    so it visually represents a semantic model.

    This is NOT the actual MiniLM score.
  */
  return Math.min(100, 45 + lexical * 55);
}

/* =========================================================
   FINAL SCORE
========================================================= */

function calculateComparison(docA, docB) {
  const textual = textualSimilarity(
    docA.text,
    docB.text
  );

  const semantic = semanticDemo(
    docA.text,
    docB.text
  );

  const finalScore =
    textual * 0.7 +
    semantic * 0.3;

  const kmpMatches = getKMPMatches(
    docA.text,
    docB.text
  );

  const rabinKarpMatches =
    getRabinKarpMatches(
      docA.text,
      docB.text
    );

  return {
    docA: docA.name,
    docB: docB.name,
    textual,
    semantic,
    finalScore,
    wordOverlap: wordOverlap(
      docA.text,
      docB.text
    ),
    editSimilarity: editSimilarity(
      docA.text,
      docB.text
    ),
    exactCoverage: exactCoverage(
      docA.text,
      docB.text
    ),
    kmpMatches,
    rabinKarpMatches,
  };
}

/* =========================================================
   MAIN APP
========================================================= */

export default function App() {
  const [activePage, setActivePage] =
    useState("Dashboard");

  const [documents, setDocuments] =
    useState([]);

  const [comparisons, setComparisons] =
    useState([]);
    const [reportHistory, setReportHistory] = useState(() => {
  try {
    return JSON.parse(
      localStorage.getItem("plagiascan_reports") || "[]"
    );
  } catch {
    return [];
  }
});
 useEffect(() => {
    localStorage.setItem(
      "plagiascan_reports",
      JSON.stringify(reportHistory)
    );
  }, [reportHistory]);

  const [selectedComparison, setSelectedComparison] =
    useState(null);

  const [dragging, setDragging] =
    useState(false);

  const [analyzing, setAnalyzing] =
    useState(false);

  const [notification, setNotification] =
    useState("");

  const [showDetails, setShowDetails] =
    useState(false);

  const fileInputRef = useRef(null);

  /* =======================================================
     NOTIFICATION
  ======================================================= */

  function notify(message) {
    setNotification(message);

    setTimeout(() => {
      setNotification("");
    }, 2500);
  }

  /* =======================================================
     NAVIGATION
  ======================================================= */

  function navigate(page) {
    setActivePage(page);
    setShowDetails(false);
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  /* =======================================================
     ADD DOCUMENTS BUTTON
  ======================================================= */

  function handleAddDocuments() {
    navigate("Documents");

    setTimeout(() => {
      fileInputRef.current?.click();
    }, 100);
  }
  function startNewComparison() {
  setDocuments([]);
  setComparisons([]);
  setSelectedComparison(null);

  navigate("Documents");

  notify("New comparison workspace started.");
}

  /* =======================================================
     FILE READING
  ======================================================= */

  function processFiles(fileList) {
    const files = Array.from(fileList || []);

    if (!files.length) {
      return;
    }

    let processed = 0;

    files.forEach((file) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        const text = String(
          event.target?.result || ""
        );

        if (!text.trim()) {
          notify(
            `${file.name} could not be read as text.`
          );
          return;
        }

        const newDocument = {
          id: `${Date.now()}-${Math.random()}`,
          name: file.name,
          text,
        };

        setDocuments((current) => [
          ...current,
          newDocument,
        ]);

        processed++;

        if (processed === files.length) {
          notify(
            `${processed} document${
              processed > 1 ? "s" : ""
            } added.`
          );
        }
      };

      reader.onerror = () => {
        notify(`Could not read ${file.name}.`);
      };

      /*
        Browser FileReader can directly read text-based files.
      */
      reader.readAsText(file);
    });
  }

  /* =======================================================
     FILE INPUT
  ======================================================= */

  function handleFileChange(event) {
    processFiles(event.target.files);

    /*
      Reset the input so selecting the same file again
      still triggers onChange.
    */
    event.target.value = "";
  }

  /* =======================================================
     DRAG & DROP
  ======================================================= */

  function handleDragOver(event) {
    event.preventDefault();
    setDragging(true);
  }

  function handleDragLeave(event) {
    event.preventDefault();
    setDragging(false);
  }

  function handleDrop(event) {
    event.preventDefault();
    setDragging(false);

    processFiles(event.dataTransfer.files);
  }

  /* =======================================================
     REMOVE DOCUMENT
  ======================================================= */

  function removeDocument(id) {
    setDocuments((current) =>
      current.filter((doc) => doc.id !== id)
    );

    setComparisons([]);
    setSelectedComparison(null);

    notify("Document removed.");
  }

  /* =======================================================
     CLEAR WORKSPACE
  ======================================================= */

  function clearWorkspace() {
    setDocuments([]);
    setComparisons([]);
    setSelectedComparison(null);

    notify("Workspace cleared.");
  }

  /* =======================================================
     ANALYZE DOCUMENTS
  ======================================================= */

  async function analyzeDocuments() {
  if (documents.length < 2) {
    notify("Add at least 2 documents before analyzing.");
    return;
  }

  setAnalyzing(true);

  try {
    const response = await fetch(
      "http://localhost:8080/analyze",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documents: documents.map((doc) => ({
            name: doc.name,
            text: doc.text,
          })),
        }),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Backend returned status ${response.status}`
      );
    }

    const data = await response.json();

    console.log(
      "PlagiaScan Java backend response:",
      data
    );

    if (
      !data.results ||
      !Array.isArray(data.results)
    ) {
      throw new Error(
        "Invalid response received from Java backend."
      );
    }

    const results = data.results.map((pair) => {
  const kmpEvidence = Array.isArray(pair.kmpEvidence)
    ? pair.kmpEvidence
    : [];

  const rabinKarpEvidence = Array.isArray(
    pair.rabinKarpEvidence
  )
    ? pair.rabinKarpEvidence
    : [];

  // Convert Java evidence strings into the
  // object format expected by the React UI.
  const allMatches = [
    ...kmpEvidence,
    ...rabinKarpEvidence,
  ].map((match) => ({
    phrase: match,
  }));

  return {
    docA: pair.document1,
    docB: pair.document2,

    textual: Number(
      pair.textualSimilarity ?? 0
    ),

    semantic: Number(
      pair.semanticSimilarity ?? 0
    ),

    finalScore: Number(
      pair.overallSimilarity ?? 0
    ),

    wordOverlap: Number(
      pair.wordOverlap ?? 0
    ),

    editSimilarity: Number(
      pair.editSimilarity ?? 0
    ),

    exactCoverage: Number(
      pair.exactMatchCoverage ?? 0
    ),

    kmpMatches: allMatches,

    rabinKarpMatches: rabinKarpEvidence.map(
      (match) => ({
        phrase: match,
      })
    ),
  };
});

    results.sort(
      (a, b) =>
        b.finalScore - a.finalScore
    );
    const newReport = {
  id: crypto.randomUUID(),
  createdAt: new Date().toISOString(),
  documentCount: documents.length,
  documents: documents.map((doc) => doc.name),
  comparisons: results,
};

setReportHistory((current) => [
  newReport,
  ...current,
]);

    setComparisons(results);

    setSelectedComparison(
      results[0] || null
    );

    setAnalyzing(false);

    navigate("Comparisons");

    notify(
      `Analysis complete. ${results.length} pairwise comparisons created.`
    );

  } catch (error) {
    console.error(
      "PlagiaScan analysis error:",
      error
    );

    setAnalyzing(false);

    notify(
      `Analysis failed: ${
        error.message ||
        "Could not connect to Java backend."
      }`
    );
  }
}
  /* =======================================================
     FIND HIGHEST COMPARISON
  ======================================================= */

  const highestComparison = useMemo(() => {
    if (!comparisons.length) {
      return null;
    }

    return comparisons.reduce(
      (highest, current) =>
        current.finalScore >
        highest.finalScore
          ? current
          : highest
    );
  }, [comparisons]);

  /* =======================================================
     SIMILARITY MATRIX
  ======================================================= */

  const similarityMatrix = useMemo(() => {
    return documents.map((rowDoc) => {
      return documents.map((columnDoc) => {
        if (rowDoc.id === columnDoc.id) {
          return 100;
        }

        const comparison = comparisons.find(
          (item) =>
            (item.docA === rowDoc.name &&
              item.docB === columnDoc.name) ||
            (item.docA === columnDoc.name &&
              item.docB === rowDoc.name)
        );

        return comparison
          ? comparison.finalScore
          : 0;
      });
    });
  }, [documents, comparisons]);

  /* =======================================================
     VIEW DETAILS
  ======================================================= */

  function viewDetails(comparison) {
    setSelectedComparison(comparison);
    setShowDetails(true);

    navigate("Comparisons");
  }

  /* =======================================================
     GENERATE REPORT
  ======================================================= */

  function generateReport() {
    if (!comparisons.length) {
      notify("Analyze documents first.");
      return;
    }

    let report = "";

    report += "PLAGIASCAN ANALYSIS REPORT\n";
    report += "===========================\n\n";

    report += `Documents analyzed: ${documents.length}\n`;
    report += `Comparisons: ${comparisons.length}\n\n`;

    if (highestComparison) {
      report += "HIGHEST SIMILARITY\n";
      report += "------------------\n";

      report += `${highestComparison.docA} <-> ${highestComparison.docB}\n`;

      report += `Final Score: ${highestComparison.finalScore.toFixed(
        2
      )}%\n`;

      report += `Textual Similarity: ${highestComparison.textual.toFixed(
        2
      )}%\n`;

      report += `Semantic Similarity: ${highestComparison.semantic.toFixed(
        2
      )}%\n\n`;
    }

    report += "PAIRWISE RESULTS\n";
    report += "----------------\n";

    comparisons.forEach((comparison, index) => {
      report += `${index + 1}. ${comparison.docA} <-> ${comparison.docB}\n`;

      report += `   Final: ${comparison.finalScore.toFixed(
        2
      )}%\n`;

      report += `   Textual: ${comparison.textual.toFixed(
        2
      )}%\n`;

      report += `   Semantic: ${comparison.semantic.toFixed(
        2
      )}%\n`;

      report += `   Word Overlap: ${comparison.wordOverlap.toFixed(
        2
      )}%\n`;

      report += `   Edit Similarity: ${comparison.editSimilarity.toFixed(
        2
      )}%\n`;

      report += `   Exact Coverage: ${comparison.exactCoverage.toFixed(
        2
      )}%\n\n`;
    });

    report +=
      "NOTE: Similarity scores are analytical indicators and are not by themselves a definitive plagiarism judgment.\n";

    const blob = new Blob([report], {
      type: "text/plain",
    });

    const url = URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;
    link.download = "plagiascan-report.txt";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    notify("Report downloaded.");
  }

  /* =======================================================
     FORMAT
  ======================================================= */

  function formatScore(score) {
    return `${score.toFixed(2)}%`;
  }

  /* =======================================================
     SEMANTIC INTERPRETATION
  ======================================================= */

  function semanticInterpretation(score) {
    if (score >= 75) {
      return "High semantic similarity detected.";
    }

    if (score >= 50) {
      return "Moderate semantic similarity detected.";
    }

    return "Low semantic similarity detected.";
  }

  /* =======================================================
     DASHBOARD
  ======================================================= */

  function Dashboard() {
    return (
      <>
        <div className="topbar">
          <div>
            <div className="eyebrow">
              PLAGIASCAN
            </div>

            <h1>Dashboard</h1>
          </div>

          <div className="status">
            <span className="status-dot"></span>
            System Ready
          </div>
        </div>

        <section className="hero">
          <div>
            <div className="section-label">
              DOCUMENT INTELLIGENCE
            </div>

            <h2>
              Analyze document
              <br />
              similarity with clarity.
            </h2>

            <p>
              PlagiaScan combines multiple
              similarity techniques with
              explainable evidence to show
              exactly where documents overlap.
            </p>
          </div>

          <button
            className="primary-btn"
            onClick={handleAddDocuments}
          >
            Add Documents →
          </button>
        </section>

        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              D
            </div>

            <div>
              <p>DOCUMENTS</p>
              <h3>{documents.length}</h3>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              C
            </div>

            <div>
              <p>COMPARISONS</p>
              <h3>{comparisons.length}</h3>
            </div>
          </div>

          <div className="stat-card highlight">
            <div className="stat-icon">
              %
            </div>

            <div>
              <p>HIGHEST SIMILARITY</p>

              <h3>
                {highestComparison
                  ? formatScore(
                      highestComparison.finalScore
                    )
                  : "—"}
              </h3>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              ✓
            </div>

            <div>
              <p>STATUS</p>

              <h3>
                {analyzing
                  ? "Analyzing"
                  : "Ready"}
              </h3>
            </div>
          </div>
        </section>

        <div className="dashboard-grid">
          <section className="panel">
            <div className="panel-header">
              <div>
                <div className="section-label">
                  SIMILARITY MATRIX
                </div>

                <h2>
                  Document relationships
                </h2>
              </div>

              <button
                className="small-btn"
                onClick={() =>
                  navigate("Comparisons")
                }
              >
                View Details →
              </button>
            </div>

            <div className="matrix">
              {documents.length === 0 ? (
                <p>No documents available.</p>
              ) : (
                <>
                  <div className="matrix-row">
                    <div></div>

                    {documents.map(
                      (doc) => (
                        <div
                          className="matrix-header"
                          key={doc.id}
                        >
                          {doc.name}
                        </div>
                      )
                    )}
                  </div>

                  {documents.map(
                    (rowDoc, rowIndex) => (
                      <div
                        className="matrix-row"
                        key={rowDoc.id}
                      >
                        <div className="row-label">
                          {rowDoc.name}
                        </div>

                        {documents.map(
                          (columnDoc, columnIndex) => {
                            const score =
                              similarityMatrix[
                                rowIndex
                              ]?.[columnIndex] ??
                              0;

                            return (
                              <div
                                className={`matrix-cell ${
                                  rowIndex ===
                                  columnIndex
                                    ? "diagonal"
                                    : score >= 50
                                    ? "high"
                                    : "low"
                                }`}
                                key={
                                  columnDoc.id
                                }
                              >
                                {formatScore(
                                  score
                                )}
                              </div>
                            );
                          }
                        )}
                      </div>
                    )
                  )}
                </>
              )}
            </div>
          </section>

          <section className="panel ranking-panel">
            <div className="panel-header">
              <div>
                <div className="section-label">
                  RANKING
                </div>

                <h2>
                  Most similar pairs
                </h2>
              </div>

              <button
                className="small-btn"
                onClick={() =>
                  navigate("Comparisons")
                }
              >
                Open →
              </button>
            </div>

            {comparisons.length === 0 ? (
              <div className="ranking-item">
                <span>
                  No comparisons yet.
                </span>
              </div>
            ) : (
              comparisons
                .slice(0, 5)
                .map(
                  (comparison, index) => (
                    <button
                      className="ranking-item"
                      key={`${comparison.docA}-${comparison.docB}`}
                      onClick={() =>
                        viewDetails(
                          comparison
                        )
                      }
                    >
                      <span className="rank">
                        0{index + 1}
                      </span>

                      <span className="pair">
                        <strong>
                          {comparison.docA} ↔{" "}
                          {comparison.docB}
                        </strong>

                        <span>
                          Textual{" "}
                          {formatScore(
                            comparison.textual
                          )}
                        </span>
                      </span>

                      <span className="score">
                        {formatScore(
                          comparison.finalScore
                        )}
                      </span>
                    </button>
                  )
                )
            )}
          </section>
        </div>

        {highestComparison && (
          <section className="panel evidence-panel">
            <div className="panel-header">
              <div>
                <div className="section-label">
                  EXPLAINABLE EVIDENCE
                </div>

                <h2>
                  Highest similarity pair
                </h2>
              </div>

              <span className="match-score">
                {formatScore(
                  highestComparison.finalScore
                )}
              </span>
            </div>

            <div className="evidence-content">
              <div className="documents">
                <div className="document">
                  <span>
                    DOCUMENT A
                  </span>

                  <strong>
                    {highestComparison.docA}
                  </strong>
                </div>

                <div className="arrow">
                  ↔
                </div>

                <div className="document">
                  <span>
                    DOCUMENT B
                  </span>

                  <strong>
                    {highestComparison.docB}
                  </strong>
                </div>
              </div>

              <div className="evidence-grid">
                <div className="evidence-card">
                  <span>
                    TEXTUAL
                  </span>

                  <strong>
                    {formatScore(
                      highestComparison.textual
                    )}
                  </strong>
                </div>

                <div className="evidence-card">
                  <span>
                    SEMANTIC
                  </span>

                  <strong>
                    {formatScore(
                      highestComparison.semantic
                    )}
                  </strong>
                </div>

                <div className="evidence-card">
                  <span>
                    EXACT COVERAGE
                  </span>

                  <strong>
                    {formatScore(
                      highestComparison.exactCoverage
                    )}
                  </strong>
                </div>
              </div>

              <div className="matched-section">
                <h3>
                  Matched phrases
                </h3>

                <div className="match-tags">
                  {highestComparison.kmpMatches
                    .slice(0, 8)
                    .map(
                      (match, index) => (
                        <span
                          key={`${match.phrase}-${index}`}
                        >
                          {match.phrase}
                        </span>
                      )
                    )}

                  {!highestComparison.kmpMatches
                    .length && (
                    <span>
                      No exact phrases detected.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        <footer>
          <span>
            PlagiaScan · Explainable Similarity
            Analysis
          </span>

          <span>
            {documents.length} documents ·{" "}
            {comparisons.length} comparisons
          </span>
        </footer>
      </>
    );
  }

  /* =======================================================
     DOCUMENTS PAGE
  ======================================================= */

  function DocumentsPage() {
    return (
      <>
      <div className="topbar">
  <div>
    <div className="eyebrow">
      PLAGIASCAN
    </div>

    <h1>Documents</h1>
  </div>

  <div className="document-actions">
    <button
      className="small-btn"
      onClick={startNewComparison}
    >
      + New Comparison
    </button>

    <button
      className="small-btn"
      onClick={() =>
        fileInputRef.current?.click()
      }
    >
      + Add Files
    </button>
  </div>
</div>

        <div className="documents-page">
          <section className="documents-intro">
            <div>
              <div className="section-label">
                WORKSPACE
              </div>

              <h2>
                Add documents for analysis.
              </h2>

              <p>
                Upload your documents and
                compare them using multiple
                similarity techniques.
              </p>
            </div>

            <div className="document-count">
              <span>
                {documents.length}
              </span>

              documents
            </div>
          </section>

          <section
            className={`upload-zone ${
              dragging ? "dragging" : ""
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="upload-icon">
              ↑
            </div>

            <h3>
              Drop your documents here
            </h3>

            <p>
              Drag and drop files into this
              area or browse your computer.
            </p>

            <label className="browse-button">
              Browse Files

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".txt,.md,.csv,.json,.html"
                onChange={handleFileChange}
              />
            </label>

            <div className="upload-support">
              TXT · MD · CSV · JSON · HTML
            </div>
          </section>

          <section className="documents-section">
            <div className="documents-section-header">
              <div>
                <div className="section-label">
                  DOCUMENTS
                </div>

                <h3>
                  Workspace files
                </h3>
              </div>

              <span className="file-count">
                {documents.length} file
                {documents.length !== 1
                  ? "s"
                  : ""}
              </span>
            </div>

            {documents.length === 0 ? (
              <div className="empty-documents">
                <div className="empty-icon">
                  +
                </div>

                <h3>
                  No documents yet
                </h3>

                <p>
                  Add documents to begin
                  similarity analysis.
                </p>
              </div>
            ) : (
              <div className="document-list">
                {documents.map(
                  (document) => (
                    <div
                      className="document-card"
                      key={document.id}
                    >
                      <div className="document-file-icon">
                        DOC
                      </div>

                      <div className="document-info">
                        <div className="document-name">
                          {document.name}
                        </div>

                        <div className="document-meta">
                          <span>
                            {tokenize(
                              document.text
                            ).length}{" "}
                            words
                          </span>

                          <span>·</span>

                          <span>
                            Ready
                          </span>
                        </div>
                      </div>

                      <button
                        className="remove-button"
                        onClick={() =>
                          removeDocument(
                            document.id
                          )
                        }
                        title="Remove document"
                      >
                        ×
                      </button>
                    </div>
                  )
                )}
              </div>
            )}

            <div className="document-actions">
              <div className="analysis-note">
                <span className="analysis-note-icon">
                  i
                </span>

                <span>
                  At least 2 documents are
                  required for comparison.
                </span>
              </div>

              <button
                className="analyze-button"
                disabled={
                  documents.length < 2 ||
                  analyzing
                }
                onClick={
                  analyzeDocuments
                }
              >
                {analyzing
                  ? "Analyzing..."
                  : "Analyze Documents →"}
              </button>
            </div>

            <div
              style={{
                marginTop: "10px",
                textAlign: "right",
              }}
            >
              <button
                className="small-btn"
                onClick={clearWorkspace}
              >
                Clear Workspace
              </button>
            </div>
          </section>
        </div>
      </>
    );
  }

  /* =======================================================
     COMPARISONS PAGE
  ======================================================= */

  function ComparisonsPage() {
    return (
      <>
        <div className="topbar">
          <div>
            <div className="eyebrow">
              ANALYSIS
            </div>

            <h1>Comparisons</h1>
          </div>

          <button
            className="small-btn"
            onClick={() =>
              navigate("Documents")
            }
          >
            Manage Documents →
          </button>
        </div>

        {comparisons.length === 0 ? (
          <div className="page-placeholder">
            <div className="placeholder-icon">
              %
            </div>

            <h2>
              No comparisons yet
            </h2>

            <p>
              Add at least two documents
              and run an analysis.
            </p>

            <button
              className="primary-btn"
              onClick={() =>
                navigate("Documents")
              }
            >
              Add Documents
            </button>
          </div>
        ) : (
          <>
            <section className="panel">
              <div className="panel-header">
                <div>
                  <div className="section-label">
                    PAIRWISE ANALYSIS
                  </div>

                  <h2>
                    Document comparisons
                  </h2>
                </div>

                <span className="match-score">
                  {comparisons.length}
                </span>
              </div>

              {comparisons.map(
                (comparison, index) => (
                  <button
                    className="ranking-item"
                    key={`${comparison.docA}-${comparison.docB}`}
                    onClick={() =>
                      setSelectedComparison(
                        comparison
                      )
                    }
                  >
                    <span className="rank">
                      0{index + 1}
                    </span>

                    <span className="pair">
                      <strong>
                        {comparison.docA} ↔{" "}
                        {comparison.docB}
                      </strong>

                      <span>
                        Textual{" "}
                        {formatScore(
                          comparison.textual
                        )}{" "}
                        · Semantic{" "}
                        {formatScore(
                          comparison.semantic
                        )}
                      </span>
                    </span>

                    <span className="score">
                      {formatScore(
                        comparison.finalScore
                      )}
                    </span>
                  </button>
                )
              )}
            </section>

            {selectedComparison && (
              <section className="panel evidence-panel">
                <div className="panel-header">
                  <div>
                    <div className="section-label">
                      SELECTED COMPARISON
                    </div>

                    <h2>
                      {selectedComparison.docA}{" "}
                      ↔{" "}
                      {selectedComparison.docB}
                    </h2>
                  </div>

                  <span className="match-score">
                    {formatScore(
                      selectedComparison.finalScore
                    )}
                  </span>
                </div>

                <div className="evidence-content">
                  <div className="evidence-grid">
                    <div className="evidence-card">
                      <span>
                        WORD OVERLAP
                      </span>

                      <strong>
                        {formatScore(
                          selectedComparison.wordOverlap
                        )}
                      </strong>
                    </div>

                    <div className="evidence-card">
                      <span>
                        EDIT SIMILARITY
                      </span>

                      <strong>
                        {formatScore(
                          selectedComparison.editSimilarity
                        )}
                      </strong>
                    </div>

                    <div className="evidence-card">
                      <span>
                        EXACT COVERAGE
                      </span>

                      <strong>
                        {formatScore(
                          selectedComparison.exactCoverage
                        )}
                      </strong>
                    </div>

                    <div className="evidence-card">
                      <span>
                        TEXTUAL
                      </span>

                      <strong>
                        {formatScore(
                          selectedComparison.textual
                        )}
                      </strong>
                    </div>

                    <div className="evidence-card">
                      <span>
                        SEMANTIC
                      </span>

                      <strong>
                        {formatScore(
                          selectedComparison.semantic
                        )}
                      </strong>
                    </div>

                    <div className="evidence-card">
                      <span>
                        FINAL
                      </span>

                      <strong>
                        {formatScore(
                          selectedComparison.finalScore
                        )}
                      </strong>
                    </div>
                  </div>

                  <div className="matched-section">
                    <h3>
                      KMP / Rabin-Karp matched
                      phrases
                    </h3>

                    <div className="match-tags">
                      {selectedComparison.kmpMatches
                        .slice(0, 15)
                        .map(
                          (
                            match,
                            index
                          ) => (
                            <span
                              key={`${match.phrase}-${index}`}
                            >
                              {match.phrase}
                            </span>
                          )
                        )}

                      {!selectedComparison
                        .kmpMatches
                        .length && (
                        <span>
                          No exact phrase
                          matches detected.
                        </span>
                      )}
                    </div>

                    <p
                      style={{
                        marginTop: "15px",
                        color:
                          "var(--text-muted)",
                        fontSize: "11px",
                      }}
                    >
                      {
                        semanticInterpretation(
                          selectedComparison.semantic
                        )
                      }
                    </p>
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </>
    );
  }

  /* =======================================================
     REPORTS PAGE
  ======================================================= */
function deleteReport(reportId) {
  setReportHistory((current) =>
    current.filter((report) => report.id !== reportId)
  );

  notify("Report deleted.");
}

function downloadSavedReport(reportData) {
  let report = "";

  report += "PLAGIASCAN ANALYSIS REPORT\n";
  report += "===========================\n\n";

  report += `Documents analyzed: ${reportData.documentCount}\n`;
  report += `Comparisons: ${reportData.comparisons.length}\n`;
  report += `Date: ${new Date(
    reportData.createdAt
  ).toLocaleString()}\n\n`;

  const highest = reportData.comparisons.reduce(
    (highest, current) =>
      current.finalScore > highest.finalScore
        ? current
        : highest,
    reportData.comparisons[0]
  );

  if (highest) {
    report += "HIGHEST SIMILARITY\n";
    report += "------------------\n";

    report += `${highest.docA} <-> ${highest.docB}\n`;
    report += `Final Score: ${highest.finalScore.toFixed(2)}%\n`;
    report += `Textual Similarity: ${highest.textual.toFixed(2)}%\n`;
    report += `Semantic Similarity: ${highest.semantic.toFixed(2)}%\n\n`;
  }

  report += "PAIRWISE RESULTS\n";
  report += "----------------\n";

  reportData.comparisons.forEach((comparison, index) => {
    report += `${index + 1}. ${comparison.docA} <-> ${comparison.docB}\n`;
    report += `   Final: ${comparison.finalScore.toFixed(2)}%\n`;
    report += `   Textual: ${comparison.textual.toFixed(2)}%\n`;
    report += `   Semantic: ${comparison.semantic.toFixed(2)}%\n`;
    report += `   Word Overlap: ${comparison.wordOverlap.toFixed(2)}%\n`;
    report += `   Edit Similarity: ${comparison.editSimilarity.toFixed(2)}%\n`;
    report += `   Exact Coverage: ${comparison.exactCoverage.toFixed(2)}%\n\n`;
  });

  report +=
    "NOTE: Similarity scores are analytical indicators and are not by themselves a definitive plagiarism judgment.\n";

  const blob = new Blob([report], {
    type: "text/plain",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download = `plagiascan-report-${reportData.id}.txt`;

  document.body.appendChild(link);

  link.click();

  document.body.removeChild(link);

  URL.revokeObjectURL(url);

  notify("Report downloaded.");
}

function ReportsPage() {
  return (
    <>
      <div className="topbar">
        <div>
          <div className="eyebrow">
            OUTPUT
          </div>

          <h1>Reports</h1>
        </div>
      </div>

      {reportHistory.length === 0 ? (
        <div className="page-placeholder">
          <div className="placeholder-icon">
            R
          </div>

          <h2>
            No reports yet
          </h2>

          <p>
            Complete a document comparison and
            your report will appear here.
          </p>

          <button
            className="primary-btn"
            onClick={() =>
              navigate("Documents")
            }
          >
            Start a Comparison →
          </button>
        </div>
      ) : (
        <>
          <div
            style={{
              marginBottom: "24px",
              color: "var(--text-muted)",
              fontSize: "12px",
              lineHeight: 1.7,
            }}
          >
            Your completed comparisons are saved here.
            You can return to Reports anytime to view,
            download, or delete previous comparison reports.
          </div>

          <section className="panel">
            <div className="panel-header">
              <div>
                <div className="section-label">
                  COMPARISON HISTORY
                </div>

                <h2>
                  Previous Reports
                </h2>
              </div>

              <span className="match-score">
                {reportHistory.length}
              </span>
            </div>

            <div className="evidence-content">
              {reportHistory.map(
                (report, reportIndex) => {
                  const highest =
                    report.comparisons.reduce(
                      (best, current) =>
                        current.finalScore >
                        best.finalScore
                          ? current
                          : best,
                      report.comparisons[0]
                    );

                  return (
                    <div
                      key={report.id}
                      style={{
                        border: "1px solid var(--border)",
                        borderRadius: "14px",
                        padding: "20px",
                        marginBottom: "14px",
                        background:
                          "rgba(255,255,255,0.015)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent:
                            "space-between",
                          alignItems: "flex-start",
                          gap: "20px",
                        }}
                      >
                        <div>
                          <div
                            className="section-label"
                          >
                            COMPARISON #
                            {reportHistory.length -
                              reportIndex}
                          </div>

                          <h3
                            style={{
                              marginTop: "8px",
                              marginBottom: "8px",
                            }}
                          >
                            {report.documents.join(
                              " · "
                            )}
                          </h3>

                          <p
                            style={{
                              color:
                                "var(--text-muted)",
                              fontSize: "11px",
                              margin: 0,
                            }}
                          >
                            {new Date(
                              report.createdAt
                            ).toLocaleString()}{" "}
                            ·{" "}
                            {report.documentCount}{" "}
                            documents ·{" "}
                            {
                              report.comparisons
                                .length
                            } comparisons
                          </p>
                        </div>

                        <div
                          style={{
                            textAlign: "right",
                          }}
                        >
                          <span
                            style={{
                              display: "block",
                              color:
                                "var(--text-muted)",
                              fontSize: "10px",
                              letterSpacing:
                                "0.15em",
                              marginBottom: "5px",
                            }}
                          >
                            HIGHEST SCORE
                          </span>

                          <strong
                            style={{
                              fontSize: "20px",
                              color:
                                "#a98cff",
                            }}
                          >
                            {formatScore(
                              highest?.finalScore ||
                                0
                            )}
                          </strong>
                        </div>
                      </div>

                      {highest && (
                        <div
                          style={{
                            marginTop: "18px",
                            paddingTop: "16px",
                            borderTop:
                              "1px solid var(--border)",
                            color:
                              "var(--text-muted)",
                            fontSize: "12px",
                          }}
                        >
                          Highest similarity:

                          <strong
                            style={{
                              color:
                                "var(--text-primary)",
                              marginLeft: "5px",
                            }}
                          >
                            {highest.docA} ↔{" "}
                            {highest.docB}
                          </strong>
                        </div>
                      )}

                      <details
                        style={{
                          marginTop: "16px",
                        }}
                      >
                        <summary
                          style={{
                            cursor: "pointer",
                            color:
                              "var(--text-muted)",
                            fontSize: "11px",
                          }}
                        >
                          View comparison results
                        </summary>

                        <div
                          style={{
                            marginTop: "14px",
                          }}
                        >
                          {report.comparisons.map(
                            (comparison, index) => (
                              <div
                                key={`${report.id}-${index}`}
                                style={{
                                  display: "flex",
                                  justifyContent:
                                    "space-between",
                                  alignItems:
                                    "center",
                                  padding:
                                    "10px 0",
                                  borderBottom:
                                    "1px solid var(--border)",
                                  fontSize: "11px",
                                }}
                              >
                                <span>
                                  {comparison.docA}{" "}
                                  ↔{" "}
                                  {comparison.docB}
                                </span>

                                <strong>
                                  {formatScore(
                                    comparison.finalScore
                                  )}
                                </strong>
                              </div>
                            )
                          )}
                        </div>
                      </details>

                      <div
                        style={{
                          display: "flex",
                          justifyContent:
                            "flex-end",
                          gap: "10px",
                          marginTop: "18px",
                        }}
                      >
                        <button
                          className="small-btn"
                          onClick={() =>
                            downloadSavedReport(
                              report
                            )
                          }
                        >
                          Download ↓
                        </button>

                        <button
                          className="small-btn"
                          onClick={() =>
                            deleteReport(
                              report.id
                            )
                          }
                          style={{
                            color: "#ff7b7b",
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </section>
        </>
      )}
    </>
  );
}

  /* =======================================================
     PAGE ROUTER
  ======================================================= */

  function renderPage() {
    switch (activePage) {
      case "Documents":
        return <DocumentsPage />;

      case "Comparisons":
        return <ComparisonsPage />;

      case "Reports":
        return <ReportsPage />;

      case "Dashboard":
      default:
        return <Dashboard />;
    }
  }

  /* =======================================================
     APP
  ======================================================= */

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-icon">
            P
          </div>

          <div>
            <h2>PlagiaScan</h2>

            <span>
              Similarity Analyzer
            </span>
          </div>
        </div>

        <nav>
          <button
            className={`nav-item ${
              activePage === "Dashboard"
                ? "active"
                : ""
            }`}
            onClick={() =>
              navigate("Dashboard")
            }
          >
            <span>⌂</span>
            Dashboard
          </button>

          <button
            className={`nav-item ${
              activePage === "Documents"
                ? "active"
                : ""
            }`}
            onClick={() =>
              navigate("Documents")
            }
          >
            <span>□</span>
            Documents
          </button>

          <button
            className={`nav-item ${
              activePage === "Comparisons"
                ? "active"
                : ""
            }`}
            onClick={() =>
              navigate("Comparisons")
            }
          >
            <span>◇</span>
            Comparisons
          </button>

          <button
            className={`nav-item ${
              activePage === "Reports"
                ? "active"
                : ""
            }`}
            onClick={() =>
              navigate("Reports")
            }
          >
            <span>▤</span>
            Reports
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="status">
            <span className="status-dot"></span>
            System Ready
          </div>
        </div>
      </aside>

      <main className="main-content">
        {renderPage()}
      </main>

      {notification && (
        <div
          style={{
            position: "fixed",
            right: "24px",
            bottom: "24px",
            zIndex: 1000,
            padding: "12px 16px",
            border: "1px solid #2b2f36",
            borderRadius: "8px",
            background: "#14161b",
            color: "#f1f1f1",
            fontSize: "12px",
            boxShadow:
              "0 10px 30px rgba(0,0,0,0.35)",
          }}
        >
          {notification}
        </div>
      )}
    </div>
  );
}