package plg;

public class Document {

    private String name;
    private String[] tokens;

    public Document(String name, String text) {
        this.name = name;
        this.tokens = preprocessText(text);
    }

    private String[] preprocessText(String text) {

        text = text.toLowerCase();

        text = text.replaceAll("[^a-z0-9\\s]", "");

        text = text.trim().replaceAll("\\s+", " ");

        if (text.isEmpty()) {
            return new String[0];
        }

        return text.split(" ");
    }

    public String getName() {
        return name;
    }

    public String[] getTokens() {
        return tokens;
    }

    public void printTokens() {

        System.out.println(name + " Tokens:");

        for (String token : tokens) {
            System.out.print(token + " ");
        }

        System.out.println();
    }
}