package plg;
import java.util.Arrays;
import java.util.*;

import ai.djl.translate.TranslateException;

public class SimilarityAnalyzer {

    // ============================================================
    // 1. WORD OVERLAP USING HASHMAP
    // ============================================================

    public static double wordOverlapSimilarity(
            String[] doc1,
            String[] doc2) {

        HashMap<String, Integer> freq1 = new HashMap<>();
        HashMap<String, Integer> freq2 = new HashMap<>();

        for (String word : doc1) {
            freq1.put(
                    word,
                    freq1.getOrDefault(word, 0) + 1
            );
        }

        for (String word : doc2) {
            freq2.put(
                    word,
                    freq2.getOrDefault(word, 0) + 1
            );
        }

        int commonWords = 0;

        for (String word : freq1.keySet()) {

            if (freq2.containsKey(word)) {

                commonWords += Math.min(
                        freq1.get(word),
                        freq2.get(word)
                );
            }
        }

        int maxLength = Math.max(
                doc1.length,
                doc2.length
        );

        if (maxLength == 0) {
            return 100.0;
        }

        return ((double) commonWords / maxLength) * 100.0;
    }


    // ============================================================
    // 2. EXACT MATCH COVERAGE USING RABIN-KARP
    // ============================================================

    public static double exactMatchCoverage(
            String[] doc1,
            String[] doc2) {

        // Identical documents have complete exact coverage
        if (Arrays.equals(doc1, doc2)) {
            return 100.0;
        }

        List<String> matches =
                RabinKarp.rabinKarpDocumentMatches(
                        doc1,
                        doc2
                );

        System.out.println(
        	    "DEBUG Rabin-Karp matches: " + matches.size()
        	);

        if (doc2.length == 0) {
            return 100.0;
        }

        boolean[] covered =
                new boolean[doc2.length];

        for (String match : matches) {

            try {

                int start =
                        match.lastIndexOf("position ");

                int end =
                        match.lastIndexOf("]");

                if (start != -1 && end != -1) {

                    int position =
                            Integer.parseInt(
                                    match.substring(
                                            start + 9,
                                            end
                                    )
                            );

                    if (position >= 0 &&
                            position < doc2.length) {

                        covered[position] = true;

                        if (position + 1 < doc2.length) {
                            covered[position + 1] = true;
                        }
                    }
                }

            } catch (Exception e) {
                // Ignore malformed match
            }
        }

        int coveredCount = 0;

        for (boolean value : covered) {

            if (value) {
                coveredCount++;
            }
        }

        return ((double) coveredCount / doc2.length)
                * 100.0;
    }


    // ============================================================
    // 3. TEXTUAL SIMILARITY
    // ============================================================

    /*
     * Textual similarity uses the existing DSA-based algorithms:
     *
     * Word Overlap       = 40%
     * Edit Similarity    = 30%
     * Exact Match        = 30%
     *
     * This preserves the original scoring system.
     */

    public static double textualSimilarity(
            String[] doc1,
            String[] doc2) {

        double wordOverlap =
                wordOverlapSimilarity(doc1, doc2);

        double editSimilarity =
                EditDistance.editSimilarity(
                        doc1,
                        doc2
                );

        double exactCoverage =
                exactMatchCoverage(doc1, doc2);

        return
                (wordOverlap * 0.40) +
                (editSimilarity * 0.30) +
                (exactCoverage * 0.30);
    }


    // ============================================================
    // 4. SEMANTIC SIMILARITY
    // ============================================================

    /*
     * Combines the document tokens back into sentences/text
     * and uses the pretrained MiniLM model.
     */

    public static double semanticSimilarity(
            String[] doc1,
            String[] doc2)
            throws TranslateException {

        String text1 = String.join(" ", doc1);
        String text2 = String.join(" ", doc2);

        return SemanticSimilarity.semanticSimilarity(
                text1,
                text2
        );
    }


    // ============================================================
    // 5. FINAL COMBINED SIMILARITY
    // ============================================================

    /*
     * Final score:
     *
     * Textual Similarity = 70%
     * Semantic Similarity = 30%
     *
     * This is a project-defined weighting, not a claim of
     * scientifically optimal weights.
     */

    public static double overallSimilarity(
            String[] doc1,
            String[] doc2)
            throws TranslateException {

        double textual =
                textualSimilarity(
                        doc1,
                        doc2
                );

        double semantic =
                semanticSimilarity(
                        doc1,
                        doc2
                );

        return
                (textual * 0.70) +
                (semantic * 0.30);
    }


    // ============================================================
    // 6. COMPLETE DOCUMENT COMPARISON
    // ============================================================

    public static void compareDocuments(
            Document doc1,
            Document doc2)
            throws TranslateException {

        String[] a = doc1.getTokens();
        String[] b = doc2.getTokens();

        List<String> kmpMatches =
                KMP.kmpDocumentMatches(a, b);

        List<String> rkMatches =
                RabinKarp.rabinKarpDocumentMatches(a, b);

        int distance =
                EditDistance.editDistance(a, b);

        double editSimilarity =
                EditDistance.editSimilarity(a, b);

        double wordOverlap =
                wordOverlapSimilarity(a, b);

        double exactCoverage =
                exactMatchCoverage(a, b);

        double textual =
                textualSimilarity(a, b);

        double semantic =
                semanticSimilarity(a, b);

        double overall =
                overallSimilarity(a, b);


        System.out.println();
        System.out.println("----------------------------------------");

        System.out.println(
                doc1.getName() + " <-> " +
                doc2.getName()
        );

        System.out.println("----------------------------------------");


        // DSA results

        System.out.println(
                "KMP Matches: " +
                kmpMatches.size()
        );

        System.out.println(
                "Rabin-Karp Matches: " +
                rkMatches.size()
        );

        System.out.println(
                "Edit Distance: " +
                distance
        );


        System.out.printf(
                "Edit Similarity: %.2f%%%n",
                editSimilarity
        );


        System.out.printf(
                "Word Overlap: %.2f%%%n",
                wordOverlap
        );


        System.out.printf(
                "Exact Match Coverage: %.2f%%%n",
                exactCoverage
        );


        System.out.println();
        System.out.println("------------- SEMANTIC LAYER ------------");


        System.out.printf(
                "Textual Similarity: %.2f%%%n",
                textual
        );


        System.out.printf(
                "Semantic Similarity: %.2f%%%n",
                semantic
        );


        System.out.println();
        System.out.printf(
                "FINAL COMBINED SIMILARITY: %.2f%%%n",
                overall
        );


        // Explainable evidence

        System.out.println();
        System.out.println("KMP Exact Match Evidence:");

        if (kmpMatches.isEmpty()) {

            System.out.println(
                    "No exact matches found."
            );

        } else {

            for (String match : kmpMatches) {

                System.out.println(
                        "- " + match
                );
            }
        }
    }


    // ============================================================
    // 7. SIMILARITY MATRIX
    // ============================================================

    public static double[][] similarityMatrix(
            List<Document> documents)
            throws TranslateException {

        int n = documents.size();

        double[][] matrix =
                new double[n][n];

        for (int i = 0; i < n; i++) {

            matrix[i][i] = 100.0;

            for (int j = i + 1;
                 j < n;
                 j++) {

                double score =
                        overallSimilarity(
                                documents.get(i).getTokens(),
                                documents.get(j).getTokens()
                        );

                matrix[i][j] = score;
                matrix[j][i] = score;
            }
        }

        return matrix;
    }


    // ============================================================
    // 8. PRINT SIMILARITY MATRIX
    // ============================================================

    public static void printMatrix(
            List<Document> documents,
            double[][] matrix) {

        System.out.println();
        System.out.println(
                "========== SIMILARITY MATRIX =========="
        );

        System.out.printf(
                "%-15s",
                ""
        );

        for (Document doc : documents) {

            System.out.printf(
                    "%-15s",
                    doc.getName()
            );
        }

        System.out.println();


        for (int i = 0;
             i < documents.size();
             i++) {

            System.out.printf(
                    "%-15s",
                    documents.get(i).getName()
            );

            for (int j = 0;
                 j < documents.size();
                 j++) {

                System.out.printf(
                        "%-15.2f",
                        matrix[i][j]
                );
            }

            System.out.println();
        }
    }


    // ============================================================
    // 9. RANK DOCUMENT PAIRS
    // ============================================================

    public static void printRanking(
            List<Document> documents,
            double[][] matrix) {

        class Pair {

            String name1;
            String name2;
            double score;

            Pair(
                    String name1,
                    String name2,
                    double score
            ) {

                this.name1 = name1;
                this.name2 = name2;
                this.score = score;
            }
        }


        List<Pair> pairs =
                new ArrayList<>();


        for (int i = 0;
             i < documents.size();
             i++) {

            for (int j = i + 1;
                 j < documents.size();
                 j++) {

                pairs.add(
                        new Pair(
                                documents.get(i).getName(),
                                documents.get(j).getName(),
                                matrix[i][j]
                        )
                );
            }
        }


        pairs.sort(
                (p1, p2) ->
                        Double.compare(
                                p2.score,
                                p1.score
                        )
        );


        System.out.println();
        System.out.println(
                "========== SIMILARITY RANKING =========="
        );


        for (int i = 0;
             i < pairs.size();
             i++) {

            Pair p = pairs.get(i);

            System.out.printf(
                    "%d. %s <-> %s : %.2f%%%n",
                    i + 1,
                    p.name1,
                    p.name2,
                    p.score
            );
        }


        if (!pairs.isEmpty()) {

            Pair highest = pairs.get(0);

            System.out.println();

            System.out.println(
                    "Highest Similarity Pair: " +
                    highest.name1 +
                    " <-> " +
                    highest.name2
            );

            System.out.printf(
                    "Highest Similarity Score: %.2f%%%n",
                    highest.score
            );
        }
    }


    // ============================================================
    // 10. EXPLAINABLE REPORT
    // ============================================================

    public static void printExplainableReport(
            Document doc1,
            Document doc2)
            throws TranslateException {

        String[] a = doc1.getTokens();
        String[] b = doc2.getTokens();


        double wordOverlap =
                wordOverlapSimilarity(a, b);

        double editSimilarity =
                EditDistance.editSimilarity(a, b);

        double exactCoverage =
                exactMatchCoverage(a, b);

        double textual =
                textualSimilarity(a, b);

        double semantic =
                semanticSimilarity(a, b);

        double overall =
                overallSimilarity(a, b);


        List<String> kmpMatches =
                KMP.kmpDocumentMatches(a, b);


        System.out.println();

        System.out.println(
                "========== EXPLAINABLE REPORT =========="
        );


        System.out.println(
                "Document 1: " +
                doc1.getName()
        );

        System.out.println(
                "Document 2: " +
                doc2.getName()
        );


        System.out.println();

        System.out.printf(
                "Word Overlap: %.2f%%%n",
                wordOverlap
        );

        System.out.printf(
                "Edit Similarity: %.2f%%%n",
                editSimilarity
        );

        System.out.printf(
                "Exact Match Coverage: %.2f%%%n",
                exactCoverage
        );


        System.out.println();

        System.out.printf(
                "Textual Similarity: %.2f%%%n",
                textual
        );

        System.out.printf(
                "Semantic Similarity: %.2f%%%n",
                semantic
        );


        System.out.println();

        System.out.printf(
                "FINAL COMBINED SIMILARITY: %.2f%%%n",
                overall
        );


        System.out.println();

        System.out.println(
                "Matched Text Evidence:"
        );


        if (kmpMatches.isEmpty()) {

            System.out.println(
                    "- No exact phrase matches found."
            );

        } else {

            for (String match : kmpMatches) {

                System.out.println(
                        "- " + match
                );
            }
        }


        System.out.println();

        System.out.println(
                "Semantic Analysis:"
        );

        if (semantic >= 75) {

            System.out.println(
                    "- High semantic similarity detected."
            );

        } else if (semantic >= 50) {

            System.out.println(
                    "- Moderate semantic similarity detected."
            );

        } else {

            System.out.println(
                    "- Low semantic similarity detected."
            );
        }


        System.out.println();

        System.out.println(
                "Note: The combined score represents "
                + "similarity detected by the implemented "
                + "textual and semantic algorithms. "
                + "It is not a definitive plagiarism judgment."
        );
    }
}