package plg;

public class EditDistance {

    // Dynamic Programming Edit Distance
    public static int editDistance(
            String[] a,
            String[] b) {

        int n = a.length;
        int m = b.length;

        int[][] dp = new int[n + 1][m + 1];

        // Base cases
        for (int i = 0; i <= n; i++) {
            dp[i][0] = i;
        }

        for (int j = 0; j <= m; j++) {
            dp[0][j] = j;
        }

        // DP calculation
        for (int i = 1; i <= n; i++) {

            for (int j = 1; j <= m; j++) {

                if (a[i - 1].equals(b[j - 1])) {

                    dp[i][j] = dp[i - 1][j - 1];

                } else {

                    int insert =
                            dp[i][j - 1] + 1;

                    int delete =
                            dp[i - 1][j] + 1;

                    int replace =
                            dp[i - 1][j - 1] + 1;

                    dp[i][j] =
                            Math.min(
                                insert,
                                Math.min(delete, replace)
                            );
                }
            }
        }

        return dp[n][m];
    }

    // Convert edit distance into similarity percentage
    public static double editSimilarity(
            String[] a,
            String[] b) {

        int distance = editDistance(a, b);

        int maxLength =
                Math.max(a.length, b.length);

        if (maxLength == 0) {
            return 100.0;
        }

        return (1.0 -
                ((double) distance / maxLength))
                * 100.0;
    }
}