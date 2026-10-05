package plg;

import java.util.ArrayList;
import java.util.List;
import java.util.Scanner;

import ai.djl.ModelException;
import ai.djl.translate.TranslateException;

public class Main {

    public static void main(String[] args) {

        Scanner scanner = new Scanner(System.in);

        try {

            // =====================================================
            // HEADER
            // =====================================================

            System.out.println();
            System.out.println("========================================");
            System.out.println("  DOCUMENT SIMILARITY ANALYZER");
            System.out.println("========================================");


            // =====================================================
            // INPUT DOCUMENTS
            // =====================================================

            System.out.print("Enter number of documents: ");

            int n = Integer.parseInt(
                    scanner.nextLine().trim()
            );

            List<Document> documents =
                    new ArrayList<>();

            for (int i = 0; i < n; i++) {

                System.out.println();
                System.out.println("Document " + (i + 1));

                System.out.print("Name: ");
                String name = scanner.nextLine();

                System.out.print("Text: ");
                String text = scanner.nextLine();

                documents.add(
                        new Document(name, text)
                );
            }


            // =====================================================
            // LOAD SEMANTIC MODEL
            // =====================================================

            System.out.println();
            System.out.println("Loading semantic model...");

            SemanticSimilarity.initialize();

            System.out.println("Semantic model: READY");


            // =====================================================
            // PAIRWISE RESULTS
            // =====================================================

            System.out.println();
            System.out.println("========================================");
            System.out.println("           PAIRWISE RESULTS");
            System.out.println("========================================");

            for (int i = 0;
                 i < documents.size();
                 i++) {

                for (int j = i + 1;
                     j < documents.size();
                     j++) {

                    Document doc1 = documents.get(i);
                    Document doc2 = documents.get(j);

                    String[] a = doc1.getTokens();
                    String[] b = doc2.getTokens();

                    double textual =
                            SimilarityAnalyzer.textualSimilarity(
                                    a, b
                            );

                    double semantic =
                            SimilarityAnalyzer.semanticSimilarity(
                                    a, b
                            );

                    double finalScore =
                            SimilarityAnalyzer.overallSimilarity(
                                    a, b
                            );

                    System.out.println();
                    System.out.println(
                            doc1.getName()
                            + " <-> "
                            + doc2.getName()
                    );

                    System.out.printf(
                            "Textual Similarity  : %.2f%%%n",
                            textual
                    );

                    System.out.printf(
                            "Semantic Similarity : %.2f%%%n",
                            semantic
                    );

                    System.out.printf(
                            "Final Similarity    : %.2f%%%n",
                            finalScore
                    );
                }
            }


            // =====================================================
            // SIMILARITY MATRIX
            // =====================================================

            double[][] matrix =
                    SimilarityAnalyzer.similarityMatrix(
                            documents
                    );

            System.out.println();
            System.out.println("========================================");
            System.out.println("          SIMILARITY MATRIX");
            System.out.println("========================================");

            SimilarityAnalyzer.printMatrix(
                    documents,
                    matrix
            );


            // =====================================================
            // RANKING
            // =====================================================

            SimilarityAnalyzer.printRanking(
                    documents,
                    matrix
            );


            // =====================================================
            // FIND HIGHEST SIMILARITY PAIR
            // =====================================================

            if (documents.size() >= 2) {

                double highestScore = -1.0;

                int first = 0;
                int second = 1;

                for (int i = 0;
                     i < documents.size();
                     i++) {

                    for (int j = i + 1;
                         j < documents.size();
                         j++) {

                        if (matrix[i][j] > highestScore) {

                            highestScore =
                                    matrix[i][j];

                            first = i;
                            second = j;
                        }
                    }
                }


                // =================================================
                // EXPLAINABLE REPORT
                // =================================================

                System.out.println();
                System.out.println("========================================");
                System.out.println("       EXPLAINABLE EVIDENCE");
                System.out.println("========================================");

                SimilarityAnalyzer.printExplainableReport(
                        documents.get(first),
                        documents.get(second)
                );
            }


            // =====================================================
            // FINAL
            // =====================================================

            System.out.println();
            System.out.println("========================================");
            System.out.println("          ANALYSIS COMPLETE");
            System.out.println("========================================");

            System.out.println(
                    "Algorithms used:"
            );

            System.out.println(
                    "KMP | Rabin-Karp | Edit Distance | "
                    + "Word Overlap | Semantic Similarity"
            );

            System.out.println();
            System.out.println(
                    "Note: Similarity scores indicate textual "
                    + "and semantic similarity and are not a "
                    + "definitive plagiarism judgment."
            );


        } catch (NumberFormatException e) {

            System.out.println(
                    "ERROR: Enter a valid number of documents."
            );

        } catch (ModelException e) {

            System.out.println(
                    "ERROR: Semantic model could not be loaded."
            );

            e.printStackTrace();

        } catch (TranslateException e) {

            System.out.println(
                    "ERROR: Semantic similarity calculation failed."
            );

            e.printStackTrace();

        } catch (Exception e) {

            System.out.println(
                    "ERROR: Something went wrong."
            );

            e.printStackTrace();

        } finally {

            SemanticSimilarity.close();

            scanner.close();
        }
    }
}