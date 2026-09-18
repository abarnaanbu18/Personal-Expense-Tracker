import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class BackendServer {

    // ================= DATABASE =================

    static final String DB_URL =
            "jdbc:mysql://localhost:3306/expense_tracker";

    static final String DB_USER =
            "root";

    static final String DB_PASSWORD =
            "Abarna@05";


    // ================= MAIN =================

    public static void main(String[] args) throws Exception {

        Class.forName(
                "com.mysql.cj.jdbc.Driver"
        );

        HttpServer server =
                HttpServer.create(
                        new InetSocketAddress(8080),
                        0
                );

        // Home
        server.createContext(
                "/",
                BackendServer::home
        );

        // Signup
        server.createContext(
                "/api/signup",
                BackendServer::signup
        );

        // Login
        server.createContext(
                "/api/login",
                BackendServer::login
        );

        // Transactions
        server.createContext(
                "/api/transactions",
                BackendServer::transactions
        );

        // Budgets
        server.createContext(
                "/api/budgets",
                BackendServer::budgets
        );

        server.setExecutor(null);

        server.start();

        System.out.println(
                "Backend Server Started!"
        );

        System.out.println(
                "http://localhost:8080"
        );
    }


    // ================= HOME =================

    static void home(
            HttpExchange exchange
    ) throws IOException {

        addCors(exchange);

        sendResponse(
                exchange,
                "Expense Tracker Backend is Running!",
                200
        );
    }


    // ================= SIGNUP =================

    static void signup(
            HttpExchange exchange
    ) throws IOException {

        addCors(exchange);

        if (exchange.getRequestMethod()
                .equalsIgnoreCase("OPTIONS")) {

            sendResponse(
                    exchange,
                    "",
                    200
            );

            return;
        }

        if (!exchange.getRequestMethod()
                .equalsIgnoreCase("POST")) {

            sendResponse(
                    exchange,
                    "Only POST method is allowed.",
                    405
            );

            return;
        }

        String requestBody =
                readRequestBody(exchange);

        String name =
                getFormValue(
                        requestBody,
                        "name"
                );

        String email =
                getFormValue(
                        requestBody,
                        "email"
                );

        String password =
                getFormValue(
                        requestBody,
                        "password"
                );

        if (
                name == null ||
                email == null ||
                password == null
        ) {

            sendResponse(
                    exchange,
                    "Missing signup details.",
                    400
            );

            return;
        }

        String sql =
                "INSERT INTO users " +
                "(name, email, password) " +
                "VALUES (?, ?, ?)";

        try (
                Connection connection =
                        DriverManager.getConnection(
                                DB_URL,
                                DB_USER,
                                DB_PASSWORD
                        );

                PreparedStatement statement =
                        connection.prepareStatement(sql)
        ) {

            statement.setString(1, name);
            statement.setString(2, email);
            statement.setString(3, password);

            statement.executeUpdate();

            sendResponse(
                    exchange,
                    "Account created successfully!",
                    200
            );

        } catch (SQLIntegrityConstraintViolationException e) {

            sendResponse(
                    exchange,
                    "Email already exists.",
                    409
            );

        } catch (SQLException e) {

            e.printStackTrace();

            sendResponse(
                    exchange,
                    "Database error.",
                    500
            );
        }
    }


    // ================= LOGIN =================

    static void login(
            HttpExchange exchange
    ) throws IOException {

        addCors(exchange);

        if (exchange.getRequestMethod()
                .equalsIgnoreCase("OPTIONS")) {

            sendResponse(
                    exchange,
                    "",
                    200
            );

            return;
        }

        if (!exchange.getRequestMethod()
                .equalsIgnoreCase("POST")) {

            sendResponse(
                    exchange,
                    "Only POST method is allowed.",
                    405
            );

            return;
        }

        String requestBody =
                readRequestBody(exchange);

        String email =
                getFormValue(
                        requestBody,
                        "email"
                );

        String password =
                getFormValue(
                        requestBody,
                        "password"
                );

        if (
                email == null ||
                password == null
        ) {

            sendResponse(
                    exchange,
                    "Missing login details.",
                    400
            );

            return;
        }

        String sql =
                "SELECT id, name FROM users " +
                "WHERE email = ? AND password = ?";

        try (
                Connection connection =
                        DriverManager.getConnection(
                                DB_URL,
                                DB_USER,
                                DB_PASSWORD
                        );

                PreparedStatement statement =
                        connection.prepareStatement(sql)
        ) {

            statement.setString(1, email);
            statement.setString(2, password);

            ResultSet result =
                    statement.executeQuery();

            if (result.next()) {

                int id =
                        result.getInt("id");

                String name =
                        result.getString("name");

                sendResponse(
                        exchange,
                        "Login successful!|" +
                        id +
                        "|" +
                        name,
                        200
                );

            } else {

                sendResponse(
                        exchange,
                        "Invalid email or password.",
                        401
                );
            }

        } catch (SQLException e) {

            e.printStackTrace();

            sendResponse(
                    exchange,
                    "Database error.",
                    500
            );
        }
    }


    // ================= TRANSACTIONS =================

    static void transactions(
            HttpExchange exchange
    ) throws IOException {

        addCors(exchange);

        String method =
                exchange.getRequestMethod();

        // OPTIONS
        if (method.equalsIgnoreCase("OPTIONS")) {

            sendResponse(
                    exchange,
                    "",
                    200
            );

            return;
        }

        // GET
        if (method.equalsIgnoreCase("GET")) {

            getTransactions(exchange);

            return;
        }

        // POST
        if (method.equalsIgnoreCase("POST")) {

            addTransaction(exchange);

            return;
        }

        // PUT
        if (method.equalsIgnoreCase("PUT")) {

            updateTransaction(exchange);

            return;
        }

        // DELETE
        if (method.equalsIgnoreCase("DELETE")) {

            deleteTransaction(exchange);

            return;
        }

        sendResponse(
                exchange,
                "Method not allowed.",
                405
        );
    }


    // ================= GET TRANSACTIONS =================

    static void getTransactions(
            HttpExchange exchange
    ) throws IOException {

        String query =
                exchange.getRequestURI()
                        .getQuery();

        String userId =
                getQueryValue(
                        query,
                        "user_id"
                );

        if (
                userId == null ||
                userId.isEmpty()
        ) {

            sendResponse(
                    exchange,
                    "User ID is required.",
                    400
            );

            return;
        }

        String sql =
                "SELECT id, description, amount, " +
                "type, category, date " +
                "FROM transactions " +
                "WHERE user_id = ? " +
                "ORDER BY date ASC, id ASC";

        try (
                Connection connection =
                        DriverManager.getConnection(
                                DB_URL,
                                DB_USER,
                                DB_PASSWORD
                        );

                PreparedStatement statement =
                        connection.prepareStatement(sql)
        ) {

            statement.setInt(
                    1,
                    Integer.parseInt(userId)
            );

            ResultSet result =
                    statement.executeQuery();

            List<String> transactionList =
                    new ArrayList<>();

            while (result.next()) {

                int id =
                        result.getInt("id");

                String description =
                        result.getString(
                                "description"
                        );

                double amount =
                        result.getDouble(
                                "amount"
                        );

                String type =
                        result.getString(
                                "type"
                        );

                String category =
                        result.getString(
                                "category"
                        );

                String date =
                        result.getDate(
                                "date"
                        ).toString();

                String json =
                        "{"
                        + "\"id\":" + id + ","
                        + "\"description\":\""
                        + escapeJson(description)
                        + "\","
                        + "\"amount\":" + amount + ","
                        + "\"type\":\""
                        + escapeJson(type)
                        + "\","
                        + "\"category\":\""
                        + escapeJson(category)
                        + "\","
                        + "\"date\":\""
                        + date
                        + "\""
                        + "}";

                transactionList.add(json);
            }

            String response =
                    "[" +
                    String.join(
                            ",",
                            transactionList
                    ) +
                    "]";

            exchange.getResponseHeaders()
                    .set(
                            "Content-Type",
                            "application/json"
                    );

            sendResponse(
                    exchange,
                    response,
                    200
            );

        } catch (NumberFormatException e) {

            sendResponse(
                    exchange,
                    "Invalid user ID.",
                    400
            );

        } catch (SQLException e) {

            e.printStackTrace();

            sendResponse(
                    exchange,
                    "Database error.",
                    500
            );
        }
    }


    // ================= ADD TRANSACTION =================

    static void addTransaction(
            HttpExchange exchange
    ) throws IOException {

        String requestBody =
                readRequestBody(exchange);

        String userId =
                getFormValue(
                        requestBody,
                        "user_id"
                );

        String description =
                getFormValue(
                        requestBody,
                        "description"
                );

        String amount =
                getFormValue(
                        requestBody,
                        "amount"
                );

        String type =
                getFormValue(
                        requestBody,
                        "type"
                );

        String category =
                getFormValue(
                        requestBody,
                        "category"
                );

        String date =
                getFormValue(
                        requestBody,
                        "date"
                );

        if (
                userId == null ||
                description == null ||
                amount == null ||
                type == null ||
                category == null ||
                date == null
        ) {

            sendResponse(
                    exchange,
                    "Missing transaction details.",
                    400
            );

            return;
        }

        String sql =
                "INSERT INTO transactions " +
                "(user_id, description, amount, " +
                "type, category, date) " +
                "VALUES (?, ?, ?, ?, ?, ?)";

        try (
                Connection connection =
                        DriverManager.getConnection(
                                DB_URL,
                                DB_USER,
                                DB_PASSWORD
                        );

                PreparedStatement statement =
                        connection.prepareStatement(sql)
        ) {

            statement.setInt(
                    1,
                    Integer.parseInt(userId)
            );

            statement.setString(
                    2,
                    description
            );

            statement.setDouble(
                    3,
                    Double.parseDouble(amount)
            );

            statement.setString(
                    4,
                    type
            );

            statement.setString(
                    5,
                    category
            );

            statement.setDate(
                    6,
                    Date.valueOf(date)
            );

            statement.executeUpdate();

            sendResponse(
                    exchange,
                    "Transaction added successfully!",
                    200
            );

        } catch (NumberFormatException e) {

            sendResponse(
                    exchange,
                    "Invalid number.",
                    400
            );

        } catch (IllegalArgumentException e) {

            sendResponse(
                    exchange,
                    "Invalid date.",
                    400
            );

        } catch (SQLException e) {

            e.printStackTrace();

            sendResponse(
                    exchange,
                    "Database error.",
                    500
            );
        }
    }


    // ================= UPDATE TRANSACTION =================

    static void updateTransaction(
            HttpExchange exchange
    ) throws IOException {

        String requestBody =
                readRequestBody(exchange);

        String id =
                getFormValue(
                        requestBody,
                        "id"
                );

        String userId =
                getFormValue(
                        requestBody,
                        "user_id"
                );

        String description =
                getFormValue(
                        requestBody,
                        "description"
                );

        String amount =
                getFormValue(
                        requestBody,
                        "amount"
                );

        String type =
                getFormValue(
                        requestBody,
                        "type"
                );

        String category =
                getFormValue(
                        requestBody,
                        "category"
                );

        String date =
                getFormValue(
                        requestBody,
                        "date"
                );

        if (
                id == null ||
                userId == null ||
                description == null ||
                amount == null ||
                type == null ||
                category == null ||
                date == null
        ) {

            sendResponse(
                    exchange,
                    "Missing transaction details.",
                    400
            );

            return;
        }

        String sql =
                "UPDATE transactions SET " +
                "description = ?, " +
                "amount = ?, " +
                "type = ?, " +
                "category = ?, " +
                "date = ? " +
                "WHERE id = ? AND user_id = ?";

        try (
                Connection connection =
                        DriverManager.getConnection(
                                DB_URL,
                                DB_USER,
                                DB_PASSWORD
                        );

                PreparedStatement statement =
                        connection.prepareStatement(sql)
        ) {

            statement.setString(
                    1,
                    description
            );

            statement.setDouble(
                    2,
                    Double.parseDouble(amount)
            );

            statement.setString(
                    3,
                    type
            );

            statement.setString(
                    4,
                    category
            );

            statement.setDate(
                    5,
                    Date.valueOf(date)
            );

            statement.setInt(
                    6,
                    Integer.parseInt(id)
            );

            statement.setInt(
                    7,
                    Integer.parseInt(userId)
            );

            int rows =
                    statement.executeUpdate();

            if (rows > 0) {

                sendResponse(
                        exchange,
                        "Transaction updated successfully!",
                        200
                );

            } else {

                sendResponse(
                        exchange,
                        "Transaction not found.",
                        404
                );
            }

        } catch (NumberFormatException e) {

            sendResponse(
                    exchange,
                    "Invalid number.",
                    400
            );

        } catch (IllegalArgumentException e) {

            sendResponse(
                    exchange,
                    "Invalid date.",
                    400
            );

        } catch (SQLException e) {

            e.printStackTrace();

            sendResponse(
                    exchange,
                    "Database error.",
                    500
            );
        }
    }


    // ================= DELETE TRANSACTION =================

    static void deleteTransaction(
            HttpExchange exchange
    ) throws IOException {

        String query =
                exchange.getRequestURI()
                        .getQuery();

        String id =
                getQueryValue(
                        query,
                        "id"
                );

        String userId =
                getQueryValue(
                        query,
                        "user_id"
                );

        if (
                id == null ||
                userId == null
        ) {

            sendResponse(
                    exchange,
                    "Transaction ID and User ID are required.",
                    400
            );

            return;
        }

        String sql =
                "DELETE FROM transactions " +
                "WHERE id = ? AND user_id = ?";

        try (
                Connection connection =
                        DriverManager.getConnection(
                                DB_URL,
                                DB_USER,
                                DB_PASSWORD
                        );

                PreparedStatement statement =
                        connection.prepareStatement(sql)
        ) {

            statement.setInt(
                    1,
                    Integer.parseInt(id)
            );

            statement.setInt(
                    2,
                    Integer.parseInt(userId)
            );

            int rows =
                    statement.executeUpdate();

            if (rows > 0) {

                sendResponse(
                        exchange,
                        "Transaction deleted successfully!",
                        200
                );

            } else {

                sendResponse(
                        exchange,
                        "Transaction not found.",
                        404
                );
            }

        } catch (NumberFormatException e) {

            sendResponse(
                    exchange,
                    "Invalid transaction ID or user ID.",
                    400
            );

        } catch (SQLException e) {

            e.printStackTrace();

            sendResponse(
                    exchange,
                    "Database error.",
                    500
            );
        }
    }


    // ================= BUDGETS =================

    static void budgets(
            HttpExchange exchange
    ) throws IOException {

        addCors(exchange);

        String method =
                exchange.getRequestMethod();

        // OPTIONS
        if (method.equalsIgnoreCase("OPTIONS")) {

            sendResponse(
                    exchange,
                    "",
                    200
            );

            return;
        }

        // GET
        if (method.equalsIgnoreCase("GET")) {

            getBudgets(exchange);

            return;
        }

        // POST
        if (method.equalsIgnoreCase("POST")) {

            addBudget(exchange);

            return;
        }

        // PUT
        if (method.equalsIgnoreCase("PUT")) {

            updateBudget(exchange);

            return;
        }

        // DELETE
        if (method.equalsIgnoreCase("DELETE")) {

            deleteBudget(exchange);

            return;
        }

        sendResponse(
                exchange,
                "Method not allowed.",
                405
        );
    }


    // ================= GET BUDGETS =================

    static void getBudgets(
            HttpExchange exchange
    ) throws IOException {

        String query =
                exchange.getRequestURI()
                        .getQuery();

        String userId =
                getQueryValue(
                        query,
                        "user_id"
                );

        if (
                userId == null ||
                userId.isEmpty()
        ) {

            sendResponse(
                    exchange,
                    "User ID is required.",
                    400
            );

            return;
        }

        String sql =
                "SELECT id, category, amount " +
                "FROM budgets " +
                "WHERE user_id = ? " +
                "ORDER BY id ASC";

        try (
                Connection connection =
                        DriverManager.getConnection(
                                DB_URL,
                                DB_USER,
                                DB_PASSWORD
                        );

                PreparedStatement statement =
                        connection.prepareStatement(sql)
        ) {

            statement.setInt(
                    1,
                    Integer.parseInt(userId)
            );

            ResultSet result =
                    statement.executeQuery();

            List<String> budgetList =
                    new ArrayList<>();

            while (result.next()) {

                int id =
                        result.getInt("id");

                String category =
                        result.getString("category");

                double amount =
                        result.getDouble("amount");

                String json =
                        "{"
                        + "\"id\":" + id + ","
                        + "\"category\":\""
                        + escapeJson(category)
                        + "\","
                        + "\"amount\":" + amount
                        + "}";

                budgetList.add(json);
            }

            String response =
                    "[" +
                    String.join(
                            ",",
                            budgetList
                    ) +
                    "]";

            exchange.getResponseHeaders()
                    .set(
                            "Content-Type",
                            "application/json"
                    );

            sendResponse(
                    exchange,
                    response,
                    200
            );

        } catch (NumberFormatException e) {

            sendResponse(
                    exchange,
                    "Invalid user ID.",
                    400
            );

        } catch (SQLException e) {

            e.printStackTrace();

            sendResponse(
                    exchange,
                    "Database error.",
                    500
            );
        }
    }


    // ================= ADD BUDGET =================

    static void addBudget(
            HttpExchange exchange
    ) throws IOException {

        String requestBody =
                readRequestBody(exchange);

        String userId =
                getFormValue(
                        requestBody,
                        "user_id"
                );

        String category =
                getFormValue(
                        requestBody,
                        "category"
                );

        String amount =
                getFormValue(
                        requestBody,
                        "amount"
                );

        if (
                userId == null ||
                category == null ||
                amount == null
        ) {

            sendResponse(
                    exchange,
                    "Missing budget details.",
                    400
            );

            return;
        }

        String sql =
                "INSERT INTO budgets " +
                "(user_id, category, amount) " +
                "VALUES (?, ?, ?)";

        try (
                Connection connection =
                        DriverManager.getConnection(
                                DB_URL,
                                DB_USER,
                                DB_PASSWORD
                        );

                PreparedStatement statement =
                        connection.prepareStatement(sql)
        ) {

            statement.setInt(
                    1,
                    Integer.parseInt(userId)
            );

            statement.setString(
                    2,
                    category
            );

            statement.setDouble(
                    3,
                    Double.parseDouble(amount)
            );

            statement.executeUpdate();

            sendResponse(
                    exchange,
                    "Budget added successfully!",
                    200
            );

        } catch (NumberFormatException e) {

            sendResponse(
                    exchange,
                    "Invalid number.",
                    400
            );

        } catch (SQLException e) {

            e.printStackTrace();

            sendResponse(
                    exchange,
                    "Database error.",
                    500
            );
        }
    }


    // ================= UPDATE BUDGET =================

    static void updateBudget(
            HttpExchange exchange
    ) throws IOException {

        String requestBody =
                readRequestBody(exchange);

        String id =
                getFormValue(
                        requestBody,
                        "id"
                );

        String userId =
                getFormValue(
                        requestBody,
                        "user_id"
                );

        String category =
                getFormValue(
                        requestBody,
                        "category"
                );

        String amount =
                getFormValue(
                        requestBody,
                        "amount"
                );

        if (
                id == null ||
                userId == null ||
                category == null ||
                amount == null
        ) {

            sendResponse(
                    exchange,
                    "Missing budget details.",
                    400
            );

            return;
        }

        String sql =
                "UPDATE budgets SET " +
                "category = ?, " +
                "amount = ? " +
                "WHERE id = ? AND user_id = ?";

        try (
                Connection connection =
                        DriverManager.getConnection(
                                DB_URL,
                                DB_USER,
                                DB_PASSWORD
                        );

                PreparedStatement statement =
                        connection.prepareStatement(sql)
        ) {

            statement.setString(
                    1,
                    category
            );

            statement.setDouble(
                    2,
                    Double.parseDouble(amount)
            );

            statement.setInt(
                    3,
                    Integer.parseInt(id)
            );

            statement.setInt(
                    4,
                    Integer.parseInt(userId)
            );

            int rows =
                    statement.executeUpdate();

            if (rows > 0) {

                sendResponse(
                        exchange,
                        "Budget updated successfully!",
                        200
                );

            } else {

                sendResponse(
                        exchange,
                        "Budget not found.",
                        404
                );
            }

        } catch (NumberFormatException e) {

            sendResponse(
                    exchange,
                    "Invalid number.",
                    400
            );

        } catch (SQLException e) {

            e.printStackTrace();

            sendResponse(
                    exchange,
                    "Database error.",
                    500
            );
        }
    }


    // ================= DELETE BUDGET =================

    static void deleteBudget(
            HttpExchange exchange
    ) throws IOException {

        String query =
                exchange.getRequestURI()
                        .getQuery();

        String id =
                getQueryValue(
                        query,
                        "id"
                );

        String userId =
                getQueryValue(
                        query,
                        "user_id"
                );

        if (
                id == null ||
                userId == null
        ) {

            sendResponse(
                    exchange,
                    "Budget ID and User ID are required.",
                    400
            );

            return;
        }

        String sql =
                "DELETE FROM budgets " +
                "WHERE id = ? AND user_id = ?";

        try (
                Connection connection =
                        DriverManager.getConnection(
                                DB_URL,
                                DB_USER,
                                DB_PASSWORD
                        );

                PreparedStatement statement =
                        connection.prepareStatement(sql)
        ) {

            statement.setInt(
                    1,
                    Integer.parseInt(id)
            );

            statement.setInt(
                    2,
                    Integer.parseInt(userId)
            );

            int rows =
                    statement.executeUpdate();

            if (rows > 0) {

                sendResponse(
                        exchange,
                        "Budget deleted successfully!",
                        200
                );

            } else {

                sendResponse(
                        exchange,
                        "Budget not found.",
                        404
                );
            }

        } catch (NumberFormatException e) {

            sendResponse(
                    exchange,
                    "Invalid budget ID or user ID.",
                    400
            );

        } catch (SQLException e) {

            e.printStackTrace();

            sendResponse(
                    exchange,
                    "Database error.",
                    500
            );
        }
    }


    // ================= READ REQUEST BODY =================

    static String readRequestBody(
            HttpExchange exchange
    ) throws IOException {

        InputStream input =
                exchange.getRequestBody();

        return new String(
                input.readAllBytes(),
                StandardCharsets.UTF_8
        );
    }


    // ================= FORM VALUE =================

    static String getFormValue(
            String body,
            String key
    ) {

        if (body == null) {
            return null;
        }

        String[] pairs =
                body.split("&");

        for (String pair : pairs) {

            String[] parts =
                    pair.split("=", 2);

            if (parts.length == 2) {

                String decodedKey =
                        URLDecoder.decode(
                                parts[0],
                                StandardCharsets.UTF_8
                        );

                if (decodedKey.equals(key)) {

                    return URLDecoder.decode(
                            parts[1],
                            StandardCharsets.UTF_8
                    );
                }
            }
        }

        return null;
    }


    // ================= QUERY VALUE =================

    static String getQueryValue(
            String query,
            String key
    ) {

        if (query == null) {
            return null;
        }

        String[] pairs =
                query.split("&");

        for (String pair : pairs) {

            String[] parts =
                    pair.split("=", 2);

            if (parts.length == 2) {

                String decodedKey =
                        URLDecoder.decode(
                                parts[0],
                                StandardCharsets.UTF_8
                        );

                if (decodedKey.equals(key)) {

                    return URLDecoder.decode(
                            parts[1],
                            StandardCharsets.UTF_8
                    );
                }
            }
        }

        return null;
    }


    // ================= JSON ESCAPE =================

    static String escapeJson(
            String value
    ) {

        if (value == null) {
            return "";
        }

        return value
                .replace("\\", "\\\\")
                .replace("\"", "\\\"");
    }


    // ================= CORS =================

    static void addCors(
            HttpExchange exchange
    ) {

        exchange.getResponseHeaders()
                .set(
                        "Access-Control-Allow-Origin",
                        "*"
                );

        exchange.getResponseHeaders()
                .set(
                        "Access-Control-Allow-Methods",
                        "GET, POST, PUT, DELETE, OPTIONS"
                );

        exchange.getResponseHeaders()
                .set(
                        "Access-Control-Allow-Headers",
                        "Content-Type"
                );
    }


    // ================= SEND RESPONSE =================

    static void sendResponse(
            HttpExchange exchange,
            String response,
            int statusCode
    ) throws IOException {

        byte[] bytes =
                response.getBytes(
                        StandardCharsets.UTF_8
                );

        exchange.sendResponseHeaders(
                statusCode,
                bytes.length
        );

        OutputStream output =
                exchange.getResponseBody();

        output.write(bytes);

        output.close();
    }
}