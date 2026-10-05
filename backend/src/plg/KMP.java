package plg;

import java.util.ArrayList;
import java.util.List;

public class KMP {

    // Build LPS array
    public static int[] buildLPS(String[] pattern) {

        int[] lps = new int[pattern.length];

        int length = 0;
        int i = 1;

        while (i < pattern.length) {

            if (pattern[i].equals(pattern[length])) {

                length++;
                lps[i] = length;
                i++;

            } else {

                if (length != 0) {
                    length = lps[length - 1];
                } else {
                    lps[i] = 0;
                    i++;
                }
            }
        }

        return lps;
    }

    // KMP search
    public static List<Integer> kmpSearch(
            String[] text,
            String[] pattern) {

        List<Integer> positions = new ArrayList<>();

        if (pattern.length == 0 || text.length < pattern.length) {
            return positions;
        }

        int[] lps = buildLPS(pattern);

        int i = 0;
        int j = 0;

        while (i < text.length) {

            if (text[i].equals(pattern[j])) {

                i++;
                j++;

                if (j == pattern.length) {

                    positions.add(i - j);

                    j = lps[j - 1];
                }

            } else {

                if (j != 0) {
                    j = lps[j - 1];
                } else {
                    i++;
                }
            }
        }

        return positions;
    }

    // Compare two documents using 2-word sequences
    public static List<String> kmpDocumentMatches(
            String[] doc1,
            String[] doc2) {

        List<String> matches = new ArrayList<>();

        int sequenceLength = 2;

        if (doc1.length < sequenceLength ||
            doc2.length < sequenceLength) {

            return matches;
        }

        for (int i = 0; i <= doc1.length - sequenceLength; i++) {

            String[] pattern = new String[sequenceLength];

            for (int j = 0; j < sequenceLength; j++) {
                pattern[j] = doc1[i + j];
            }

            List<Integer> positions =
                    kmpSearch(doc2, pattern);

            for (int position : positions) {

                matches.add(
                    pattern[0] + " " +
                    pattern[1] +
                    " [position " + position + "]"
                );
            }
        }

        return matches;
    }
}