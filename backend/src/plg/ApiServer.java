package plg;

import io.javalin.Javalin;
import io.javalin.http.HttpStatus;

import ai.djl.ModelException;
import ai.djl.translate.TranslateException;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

public class ApiServer {

    public static void main(String[] args) {

        try {

            // ============================================
            // INITIALIZE SEMANTIC MODEL
            // ============================================

            System.out.println("Loading semantic model...");
            SemanticSimilarity.initialize();
            System.out.println("Semantic model loaded successfully.");

            // ============================================
            // CREATE JAVALIN SERVER
            // ============================================

            Javalin app = Javalin.create(config -> {

                // Allow React frontend
                config.bundledPlugins.enableCors(cors -> {
                    cors.addRule(rule -> {
                        rule.allowHost("http://localhost:5173");
                    });
                });

            });

            // ============================================
            // HOME / HEALTH CHECK
            // ============================================

            app.get("/", ctx -> {

                ctx.json(
                    new ApiResponse(
                        "PlagiaScan API is running!",
                        "READY"
                    )
                );

            });

            // ============================================
            // ANALYZE DOCUMENTS
            // ============================================

            app.post("/analyze", ctx -> {

                try {

                    AnalyzeRequest request =
                            ctx.bodyAsClass(AnalyzeRequest.class);

                    // Validate request
                    if (request == null ||
                        request.documents == null ||
                        request.documents.size() < 2) {

                        ctx.status(HttpStatus.BAD_REQUEST);

                        ctx.json(
                            new ErrorResponse(
                                "At least 2 documents are required."
                            )
                        );

                        return;
                    }

                    // ============================================
                    // CREATE DOCUMENT OBJECTS
                    // ============================================

                    List<Document> documents =
                            new ArrayList<>();

                    for (InputDocument input :
                            request.documents) {

                        if (input.name == null ||
                            input.name.trim().isEmpty()) {

                            input.name = "Document "
                                    + (documents.size() + 1);
                        }

                        if (input.text == null) {
                            input.text = "";
                        }

                        documents.add(
                            new Document(
                                input.name,
                                input.text
                            )
                        );
                    }

                    // ============================================
                    // ANALYZE ALL DOCUMENT PAIRS
                    // ============================================

                    List<PairResult> pairResults =
                            new ArrayList<>();

                    int n = documents.size();

                    double[][] matrix =
                            new double[n][n];

                    // Diagonal = 100%
                    for (int i = 0; i < n; i++) {
                        matrix[i][i] = 100.0;
                    }

                    // Compare every unique pair
                    for (int i = 0; i < n; i++) {

                        for (int j = i + 1; j < n; j++) {

                            Document doc1 =
                                    documents.get(i);

                            Document doc2 =
                                    documents.get(j);

                            String[] a =
                                    doc1.getTokens();

                            String[] b =
                                    doc2.getTokens();

                            // ------------------------------------
                            // DSA ALGORITHMS
                            // ------------------------------------

                            List<String> kmpMatches =
                                    KMP.kmpDocumentMatches(
                                        a,
                                        b
                                    );

                            List<String> rabinKarpMatches =
                                    RabinKarp.rabinKarpDocumentMatches(
                                        a,
                                        b
                                    );

                            int editDistance =
                                    EditDistance.editDistance(
                                        a,
                                        b
                                    );

                            double editSimilarity =
                                    EditDistance.editSimilarity(
                                        a,
                                        b
                                    );

                            double wordOverlap =
                                    SimilarityAnalyzer
                                        .wordOverlapSimilarity(
                                            a,
                                            b
                                        );

                            double exactCoverage =
                                    SimilarityAnalyzer
                                        .exactMatchCoverage(
                                            a,
                                            b
                                        );

                            double textualSimilarity =
                                    SimilarityAnalyzer
                                        .textualSimilarity(
                                            a,
                                            b
                                        );

                            // ------------------------------------
                            // SEMANTIC SIMILARITY
                            // ------------------------------------

                            double semanticSimilarity =
                                    SimilarityAnalyzer
                                        .semanticSimilarity(
                                            a,
                                            b
                                        );

                            // ------------------------------------
                            // FINAL SCORE
                            //
                            // Textual = 70%
                            // Semantic = 30%
                            // ------------------------------------

                            double overallSimilarity =
                                    (textualSimilarity * 0.70)
                                    +
                                    (semanticSimilarity * 0.30);

                            matrix[i][j] =
                                    overallSimilarity;

                            matrix[j][i] =
                                    overallSimilarity;

                            // ------------------------------------
                            // ADD RESULT
                            // ------------------------------------

                            PairResult result =
                                    new PairResult();

                            result.document1 =
                                    doc1.getName();

                            result.document2 =
                                    doc2.getName();

                            result.wordOverlap =
                                    round(wordOverlap);

                            result.editDistance =
                                    editDistance;

                            result.editSimilarity =
                                    round(editSimilarity);

                            result.exactMatchCoverage =
                                    round(exactCoverage);

                            result.textualSimilarity =
                                    round(textualSimilarity);

                            result.semanticSimilarity =
                                    round(semanticSimilarity);

                            result.overallSimilarity =
                                    round(overallSimilarity);

                            result.kmpMatchCount =
                                    kmpMatches.size();

                            result.rabinKarpMatchCount =
                                    rabinKarpMatches.size();

                            result.kmpEvidence =
                                    kmpMatches;

                            result.rabinKarpEvidence =
                                    rabinKarpMatches;

                            // Semantic interpretation
                            if (semanticSimilarity >= 75) {

                                result.semanticInterpretation =
                                        "High semantic similarity detected.";

                            } else if (semanticSimilarity >= 50) {

                                result.semanticInterpretation =
                                        "Moderate semantic similarity detected.";

                            } else {

                                result.semanticInterpretation =
                                        "Low semantic similarity detected.";
                            }

                            pairResults.add(result);
                        }
                    }

                    // ============================================
                    // FIND HIGHEST SIMILARITY PAIR
                    // ============================================

                    PairResult highestPair = null;

                    for (PairResult result :
                            pairResults) {

                        if (highestPair == null ||
                            result.overallSimilarity >
                            highestPair.overallSimilarity) {

                            highestPair = result;
                        }
                    }

                    // ============================================
                    // BUILD RESPONSE
                    // ============================================

                    AnalyzeResponse response =
                            new AnalyzeResponse();

                    response.status = "SUCCESS";

                    response.message =
                            "Documents analyzed successfully.";

                    response.documentCount =
                            documents.size();

                    response.documents =
                            new ArrayList<>();

                    for (Document doc : documents) {

                        response.documents.add(
                            doc.getName()
                        );
                    }

                    response.similarityMatrix =
                            matrix;

                    response.results =
                            pairResults;

                    response.highestSimilarityPair =
                            highestPair;

                    response.note =
                            "The combined score represents similarity "
                            + "detected by the implemented textual and "
                            + "semantic algorithms. It is not a "
                            + "definitive plagiarism judgment.";

                    ctx.json(response);

                } catch (Exception e) {

                    e.printStackTrace();

                    ctx.status(
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );

                    ctx.json(
                        new ErrorResponse(
                            "Analysis failed: "
                            + e.getMessage()
                        )
                    );
                }

            });

            // ============================================
            // START SERVER
            // ============================================

            app.start(8080);

            System.out.println();
            System.out.println(
                "========================================"
            );
            System.out.println(
                "        PLAGIASCAN API SERVER"
            );
            System.out.println(
                "========================================"
            );
            System.out.println(
                "Server running at:"
            );
            System.out.println(
                "http://localhost:8080"
            );
            System.out.println();
            System.out.println(
                "Health check:"
            );
            System.out.println(
                "http://localhost:8080/"
            );
            System.out.println();
            System.out.println(
                "Analysis endpoint:"
            );
            System.out.println(
                "POST http://localhost:8080/analyze"
            );
            System.out.println(
                "========================================"
            );

            // ============================================
            // CLOSE MODEL WHEN SERVER STOPS
            // ============================================

            Runtime.getRuntime().addShutdownHook(
                new Thread(() -> {
                    System.out.println(
                        "Closing semantic model..."
                    );
                    SemanticSimilarity.close();
                })
            );

        } catch (IOException | ModelException e) {

            System.err.println(
                "Failed to initialize semantic model:"
            );

            e.printStackTrace();

        } catch (Exception e) {

            System.err.println(
                "Failed to start PlagiaScan API:"
            );

            e.printStackTrace();
        }
    }

    // ============================================================
    // ROUNDING
    // ============================================================

    private static double round(double value) {

        return Math.round(value * 100.0) / 100.0;
    }

    // ============================================================
    // GET /
    // ============================================================

    public static class ApiResponse {

        public String message;
        public String status;

        public ApiResponse() {
        }

        public ApiResponse(
                String message,
                String status) {

            this.message = message;
            this.status = status;
        }
    }

    // ============================================================
    // ERROR RESPONSE
    // ============================================================

    public static class ErrorResponse {

        public String error;

        public ErrorResponse() {
        }

        public ErrorResponse(String error) {
            this.error = error;
        }
    }

    // ============================================================
    // INPUT DOCUMENT
    // ============================================================

    public static class InputDocument {

        public String name;
        public String text;

        public InputDocument() {
        }
    }

    // ============================================================
    // ANALYZE REQUEST
    // ============================================================

    public static class AnalyzeRequest {

        public List<InputDocument> documents;

        public AnalyzeRequest() {
        }
    }

    // ============================================================
    // PAIR RESULT
    // ============================================================

    public static class PairResult {

        public String document1;
        public String document2;

        public double wordOverlap;

        public int editDistance;

        public double editSimilarity;

        public double exactMatchCoverage;

        public double textualSimilarity;

        public double semanticSimilarity;

        public double overallSimilarity;

        public int kmpMatchCount;

        public int rabinKarpMatchCount;

        public List<String> kmpEvidence;

        public List<String> rabinKarpEvidence;

        public String semanticInterpretation;

        public PairResult() {
        }
    }

    // ============================================================
    // ANALYZE RESPONSE
    // ============================================================

    public static class AnalyzeResponse {

        public String status;

        public String message;

        public int documentCount;

        public List<String> documents;

        public double[][] similarityMatrix;

        public List<PairResult> results;

        public PairResult highestSimilarityPair;

        public String note;

        public AnalyzeResponse() {
        }
    }
}