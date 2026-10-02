# Books Resource REST API Design Blueprint

This document specifies the REST architecture design conventions mapped against the books collection repository resources.

## Base Endpoint Path URL
`https://librarydashboard.com`

---

## Endpoint API Routing Specifications

### 1. List All Available Books
*   **Method:** `GET`
*   **Path:** `/books`
*   **Description:** Retrieves a complete catalog array list containing all book resources stored in the database index inventory.
*   **Success Status Code:** `200 OK`

### 2. Fetch Isolated Individual Book Profile
*   **Method:** `GET`
*   **Path:** `/books/:id` (e.g., `/books/402`)
*   **Description:** Returns full semantic metadata properties matching a specific item using its target unique numeric resource ID identifier parameter.
*   **Success Status Code:** `200 OK`

### 3. Create a New Book Entry
*   **Method:** `POST`
*   **Path:** `/books`
*   **Description:** Allocates database space and registers a new book entity validation blueprint in the system records index.
*   **Example Request Body:**
    ```json
    {
      "title": "Clean Code Architectural Patterns",
      "author": "Robert C. Martin",
      "isbn": "978-0132350884",
      "publishedYear": 2008
    }
    ```
*   **Success Status Code:** `201 Created`

### 4. Modify / Update Extant Book Entities
*   **Method:** `PUT`
*   **Path:** `/books/:id` (e.g., `/books/402`)
*   **Description:** Completely updates or overwrites property values on an existing book entity using structural identification tokens.
*   **Example Request Body:**
    ```json
    {
      "title": "Clean Code Architectural Patterns (Revised Edition)",
      "author": "Robert C. Martin",
      "isbn": "978-0132350884",
      "publishedYear": 2026
    }
    ```
*   **Success Status Code:** `200 OK`

### 5. Remove / Delete a Book Entry
*   **Method:** `DELETE`
*   **Path:** `/books/:id` (e.g., `/books/402`)
*   **Description:** Permanently deletes a book record instance from the system repository storage grids.
*   **Success Status Code:** `204 No Content`

### 6. Filter and List Books by Author
*   **Method:** `GET`
*   **Path:** `/books`
*   **Description:** Filters and returns a subset array of books belonging specifically to an author using a localized query string parameter filter modifier.
*   **Example Request Endpoint String:** `/books?author=Grace+Hopper`
*   **Success Status Code:** `200 OK`

---

## Global System Error Code Mappings

### 1. Status Code `400 Bad Request`
*   **Condition Criteria:** Occurs when the incoming request format payload syntax fails basic schema format validation rules.
*   **Example Scenario:** Attempting to invoke the `POST /books` entry pipeline while omitting a required database data field configuration layer like the text variable `title`, or providing an invalid value mapping structure such as setting the data parameter value fields array payload block to `"publishedYear": "not-a-number"`.

### 2. Status Code `404 Not Found`
*   **Condition Criteria:** Triggered when the unique target path resource pointer references a resource that does not exist in database record tables.
*   **Example Scenario:** Dispatching an update call or pulling values using structural operations targets mapping against `GET /books/999999`, where no record matching unique tracking sequence identification array indexes exist in live database memory.
