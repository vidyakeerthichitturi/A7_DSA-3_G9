package plg;

import ai.djl.ModelException;
import ai.djl.inference.Predictor;
import ai.djl.repository.zoo.Criteria;
import ai.djl.repository.zoo.ZooModel;
import ai.djl.huggingface.translator.TextEmbeddingTranslatorFactory;
import ai.djl.training.util.ProgressBar;
import ai.djl.translate.TranslateException;

import java.io.IOException;

public class SemanticSimilarity {

    private static ZooModel<String, float[]> model;
    private static Predictor<String, float[]> predictor;

    // Load the pretrained semantic model
    public static void initialize() throws IOException, ModelException {

        Criteria<String, float[]> criteria =
                Criteria.builder()
                        .setTypes(String.class, float[].class)
                        .optModelUrls(
                            "djl://ai.djl.huggingface.pytorch/"
                            + "sentence-transformers/all-MiniLM-L6-v2"
                        )
                        .optEngine("PyTorch")
                        .optTranslatorFactory(
                            new TextEmbeddingTranslatorFactory()
                        )
                        .optProgress(new ProgressBar())
                        .build();

        model = criteria.loadModel();

        predictor = model.newPredictor();
    }

    // Convert text into an embedding vector
    public static float[] getEmbedding(String text)
            throws TranslateException {

        return predictor.predict(text);
    }

    // Calculate cosine similarity
    public static double cosineSimilarity(
            float[] vectorA,
            float[] vectorB) {

        double dotProduct = 0.0;
        double magnitudeA = 0.0;
        double magnitudeB = 0.0;

        for (int i = 0; i < vectorA.length; i++) {

            dotProduct +=
                    vectorA[i] * vectorB[i];

            magnitudeA +=
                    vectorA[i] * vectorA[i];

            magnitudeB +=
                    vectorB[i] * vectorB[i];
        }

        magnitudeA = Math.sqrt(magnitudeA);
        magnitudeB = Math.sqrt(magnitudeB);

        if (magnitudeA == 0 || magnitudeB == 0) {
            return 0.0;
        }

        return dotProduct /
                (magnitudeA * magnitudeB);
    }

    // Calculate semantic similarity percentage
    public static double semanticSimilarity(
            String text1,
            String text2)
            throws TranslateException {

        float[] embedding1 =
                getEmbedding(text1);

        float[] embedding2 =
                getEmbedding(text2);

        double similarity =
                cosineSimilarity(
                    embedding1,
                    embedding2
                );

        /*
         * Cosine similarity normally ranges
         * from -1 to +1.
         *
         * Convert it to a percentage.
         */

        double percentage =
                ((similarity + 1.0) / 2.0) * 100.0;

        return percentage;
    }

    // Close the model when finished
    public static void close() {

        if (predictor != null) {
            predictor.close();
        }

        if (model != null) {
            model.close();
        }
    }
}