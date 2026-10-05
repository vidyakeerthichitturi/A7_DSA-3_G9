package plg;

import ai.djl.ModelException;
import ai.djl.translate.TranslateException;

import java.io.IOException;

public class SemanticTest {

    public static void main(String[] args) {

        try {

            System.out.println("Loading semantic model...");
            System.out.println("This may take some time on the first run.");

            SemanticSimilarity.initialize();

            String text1 =
                    "The student completed the assignment quickly.";

            String text2 =
                    "The learner finished the task in a short time.";

            String text3 =
                    "The weather is very cold today.";

            System.out.println();
            System.out.println("======================================");
            System.out.println("SEMANTIC SIMILARITY TEST");
            System.out.println("======================================");

            double similar =
                    SemanticSimilarity.semanticSimilarity(
                            text1,
                            text2
                    );

            double unrelated =
                    SemanticSimilarity.semanticSimilarity(
                            text1,
                            text3
                    );

            System.out.println();
            System.out.println("Sentence 1:");
            System.out.println(text1);

            System.out.println();
            System.out.println("Sentence 2:");
            System.out.println(text2);

            System.out.printf(
                    "Semantic Similarity: %.2f%%%n",
                    similar
            );

            System.out.println();
            System.out.println("--------------------------------------");

            System.out.println();
            System.out.println("Sentence 1:");
            System.out.println(text1);

            System.out.println();
            System.out.println("Sentence 3:");
            System.out.println(text3);

            System.out.printf(
                    "Semantic Similarity: %.2f%%%n",
                    unrelated
            );

            System.out.println();
            System.out.println("======================================");

            SemanticSimilarity.close();

        } catch (IOException | ModelException | TranslateException e) {

            System.out.println();
            System.out.println("ERROR:");
            e.printStackTrace();
        }
    }
}