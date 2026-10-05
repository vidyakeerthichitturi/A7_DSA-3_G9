package plg;

import java.util.ArrayList;
import java.util.List;

public class RabinKarp {

    private static final long BASE = 257;
    private static final long MOD = 1000000007;

    public static List<Integer> rabinKarpSearch(
            String[] text,
            String[] pattern) {

        List<Integer> positions = new ArrayList<>();

        int m = pattern.length;
        int n = text.length;

        if (m == 0 || n < m) {
            return positions;
        }

        long patternHash = 0;
        long textHash = 0;
        long power = 1;

        for (int i = 0; i < m; i++) {

            patternHash =
                    (patternHash * BASE +
                     pattern[i].hashCode()) % MOD;

            textHash =
                    (textHash * BASE +
                     text[i].hashCode()) % MOD;

            if (i < m - 1) {
                power = (power * BASE) % MOD;
            }
        }

        for (int i = 0; i <= n - m; i++) {

            if (patternHash == textHash) {

                boolean match = true;

                for (int j = 0; j < m; j++) {

                    if (!pattern[j].equals(text[i + j])) {
                        match = false;
                        break;
                    }
                }

                if (match) {
                    positions.add(i);
                }
            }

            if (i < n - m) {

                long outgoing =
                        (text[i].hashCode() * power) % MOD;

                textHash =
                        (textHash - outgoing + MOD) % MOD;

                textHash =
                        (textHash * BASE +
                         text[i + m].hashCode()) % MOD;
            }
        }

        return positions;
    }

    // Compare two documents using Rabin-Karp
    public static List<String> rabinKarpDocumentMatches(
            String[] doc1,
            String[] doc2) {

        List<String> matches = new ArrayList<>();

        int sequenceLength = 2;

        if (doc1.length < sequenceLength ||
            doc2.length < sequenceLength) {

            return matches;
        }

        for (int i = 0;
             i <= doc1.length - sequenceLength;
             i++) {

            String[] pattern =
                    new String[sequenceLength];

            for (int j = 0; j < sequenceLength; j++) {
                pattern[j] = doc1[i + j];
            }

            List<Integer> positions =
                    rabinKarpSearch(doc2, pattern);

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