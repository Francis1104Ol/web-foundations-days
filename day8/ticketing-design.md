# TicketHub Architecture and System Design Document

## 1. System Requirements Framework

### Functional Requirements
- **Event Discovery:** Users must be able to search and browse events by name, location, and date.
- **Seat Management:** Users must be able to view a real-time layout of available seats for a specific event performance.
- **Transactional Booking:** Users must be able to temporarily lock a seat for up to 10 minutes while completing payment checkout processing.
- **Order Tracking:** Users must be able to securely purchase tickets, view their structural receipts, and access their issued barcodes.

### Non-Functional Requirements
- **Correctness & Isolation (Zero Double-Booking):** The system must guarantee that under no circumstances can the exact same seat be sold to two different customers.
- **High Concurrency & Elasticity (Fairness):** The architecture must withstand extreme, sudden spikes in load during a "big sale" rush without dropping requests or crashing, maintaining a fair queue model (First-Come, First-Served).
- **Latency Boundaries:** Standard search page lookups must execute within 150ms, while transactional seat holding must complete within 300ms under high load.

---

## 2. Load and Scalability Capacity Estimations

### Baseline Operational Metrics (Normal Day)
- **Active Traffic Volumetrics:** 50,000 visitors per day × 10 pages viewed = 500,000 total page views daily.
- **Average Read Traffic Throughput:** 
  \[\frac{500,000 \text{ page views}}{86,400 \text{ seconds}} \approx \mathbf{5.78 \text{ requests per second (RPS)}}\]
- **Average Write Traffic (Purchases):** 5,000 tickets sold per day.
  \[\frac{5,000 \text{ transactions}}{86,400 \text{ seconds}} \approx \mathbf{0.058 \text{ checkout writes per second}}\]

### High-Volume Spike Surge Metrics ("Big Sale" Window)
- **Time Constraint:** 10 minutes = 600 seconds.
- **User Load:** 200,000 highly concurrent users.
- **Transactional Sales Ingestion Rate:** 20,000 seats exhausted completely in 600 seconds.
- **Peak Write / Allocation Throughput:** 
  \[\frac{20,000 \text{ seats filled}}{600 \text{ seconds}} \approx \mathbf{33.33 \text{ structural updates per second}}\]
- **Peak Interactive Request Throughput (Page Views / Checking Availability):** Assuming each user refreshes the seating array, checks order status, and submits actions an average of 15 times during this high-anxiety window:
  \[\frac{200,000 \text{ users} \times 15 \text{ interactions}}{600 \text{ seconds}} = \mathbf{5,000 \text{ highly concurrent RPS}}\]

### Structural Traffic Volumetric Comparison
During a high-demand ticket release window, read traffic scales abruptly by a factor of nearly **865x** over standard daily operational averages (from 5.78 RPS to 5,000 RPS). Transactional write actions spike from 0.058 updates/sec up to 33.33 writes/sec, accompanied by concentrated lock contention on a single event's database rows.

---

## 3. Core REST API Design Specification

| Method | Path | Description | Success Status |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/events` | Browses, filters, and searches live catalog events. | `200 OK` |
| `GET` | `/api/v1/events/{id}/seats` | Fetches current seating map configuration and active availability states. | `200 OK` |
| `POST` | `/api/v1/tickets/hold` | Requests an exclusive temporary 10-minute hold lock on specific seat IDs. | `201 Created` |
| `POST` | `/api/v1/payments/checkout` | Processes payment and finalizes the ownership transaction. | `200 OK` |
| `GET` | `/api/v1/orders/{id}` | Fetches detailed digital receipts and encrypted barcode images. | `200 OK` |

### Payload Example: Securing a Temporary Hold (`POST /api/v1/tickets/hold`)

#### Request JSON Body
```json
{
  "event_id": 9042,
  "seat_ids":,
  "user_id": 88192
}
```

#### Response JSON Body (`201 Created`)
```json
{
  "hold_id": "hld_771a9f0e",
  "status": "held",
  "expires_at": "2026-10-05T19:00:00Z",
  "seat_ids":,
  "total_price": 250.00
}
```

---

## 4. Relational Data Model Schema

### Relational Tables Structure

#### `users`
- `id` (INT, Primary Key, Auto-Increment)
- `email` (VARCHAR(100), Unique, Not Null)
- `name` (VARCHAR(100), Not Null)

#### `events`
- `id` (INT, Primary Key, Auto-Increment)
- `title` (VARCHAR(150), Not Null)
- `date` (TIMESTAMP, Not Null)
- `venue` (VARCHAR(100), Not Null)

#### `seats`
- `id` (INT, Primary Key, Auto-Increment)
- `event_id` (INT, Foreign Key referencing `events(id)`, Not Null)
- `seat_number` (VARCHAR(10), Not Null)
- `status` (VARCHAR(20), Not Null) -- e.g., 'available', 'held', 'sold'
- `held_by_user_id` (INT, Foreign Key referencing `users(id)`, Nullable)
- `hold_expires_at` (TIMESTAMP, Nullable)
- `version` (INT, Not Null, Default 1) -- Required for Optimistic Locking

#### `orders`
- `id` (INT, Primary Key, Auto-Increment)
- `user_id` (INT, Foreign Key referencing `users(id)`, Not Null)
- `event_id` (INT, Foreign Key referencing `events(id)`, Not Null)
- `total_amount` (DECIMAL(10,2), Not Null)
- `payment_status` (VARCHAR(20), Not Null) -- e.g., 'pending', 'completed', 'failed'
- `created_at` (TIMESTAMP, Default Current_Timestamp)

### Entity Relationships Mapping
- **`users` to `orders` (1:N):** A customer can complete multiple ticket transactions over time, but each order is tied to a single user account.
- **`events` to `seats` (1:N):** An individual concert or show features thousands of mapped seats. Each physical seat record is explicitly tied to one event mapping instance.
- **`users` to `seats` (1:N / Conditional):** A user can hold or purchase multiple distinct seats across event instances.

---

## 5. Absolute Prevention of Double-Booking

To eliminate race conditions where two clients simultaneously try to acquire the final seat, TicketHub applies an **Optimistic Concurrency Control (OCC)** strategy combined with strict ACID relational database isolation levels. 

### Implementation Mechanism
Every seat record carries a structural `version` integer column. When an app server processes a request to secure a seat hold, it reads the row data alongside its current version integer. The update statement then uses a conditional query verification logic:

```sql
UPDATE seats 
SET status = 'held', 
    held_by_user_id = 88192, 
    hold_expires_at = NOW() + INTERVAL '10 minutes', 
    version = version + 1
WHERE id = 1041 
  AND status = 'available' 
  AND version = 1;
```

### Race Condition Resolution
If two incoming connection queries attempt to write to seat `1041` simultaneously:
1. Both find `version = 1`.
2. The Database Management System (DBMS) locks the physical index row for the first transaction. The row updates successfully, changing the version value to `2`.
3. When the second transaction tries to write, its conditional evaluation `WHERE version = 1` fails immediately because the state has changed.
4. The database engine returns a zero-row-affected confirmation back to the app server. The app server catches this fail metric, cancels the transaction, and safely prompts the second customer with a clear rejection: *"This seat has just been claimed by another user."*

---

## 6. High-Availability Scaling Architecture Diagram

[ 200,000 Concurrent Users ]
│
▼
[ Route 53 Geolocation DNS ]
│
▼
[ CloudFlare Edge Security / CDN ]
│ (Caches Event Details / Seating Configurations)
▼
[ AWS Application Load Balancer ]
│
┌──────────────────────────┴──────────────────────────┐
▼                                                     ▼
[ App Server Instance A ]                             [ App Server Instance B ]
│                                                     │
├───────────────────► [ Redis Cache Cluster ] ◄───────┤ (Checks Active Seat Locks)
│                                                     │
▼                                                     ▼
[ Transaction Virtual Queue ]                         [ Transaction Virtual Queue ]
(SQS Ticket Ingestion Buffer)                         (SQS Ticket Ingestion Buffer)
│                                                     │
└───────────────────► [ Write-Master DB Node ] ◄───────┘ (Processes OCC Version Changes)
│ (Streaming Replication Logs)
▼
[ Read-Replica DB Cluster ] (Feeds General Seating Feeds)
### Component Survival Mechanics
- **CloudFlare Edge CDN:** Caches static event pages, venue descriptions, and baseline seating configurations. This offloads **90%+** of standard read traffic from the app servers, shielding backend nodes from sudden traffic spikes.
- **Redis Cache Cluster:** Tracks active seat hold flags in-memory with automatic TTL expiration tracking. Before querying the relational database, app instances scan Redis. If a seat is flagged as locked, the lookup drops early, protecting the persistent storage engine from read exhaustion.
- **AWS SQS Virtual Queue:** When traffic surpasses safe thresholds during a big release, the system routes incoming checkout requests into a rate-limited queue buffer. This prevents app servers and databases from running out of active worker connections, keeping the infrastructure stable.
- **Write-Master & Read-Replica Split:** Writes (holds and payments) route explicitly through the primary Master DB node using strict version controls. Meanwhile, all passive dashboard updates and seat maps are handled by read-replicas, preventing write blockades from halting user navigation paths.

---

## 7. Deep Architecture Performance Trade-offs

### Trade-off 1: Optimistic Locking vs. Pessimistic Row Locking
- **Pros of Optimistic Locking:** High execution speeds and zero database thread deadlocks. Transactions exit immediately if version counts conflict, leaving database resources open to handle other requests.
- **Cons:** If 50 users try to claim the exact same high-value seat simultaneously, 49 requests will fail instantly, forcing clients to manually re-select a new seat position and try again.

### Trade-off 2: Virtual Ingestion Queue Buffering vs. Real-time API Feedback
- **Pros:** Guarantees absolute system stability. Rather than dropping connections under a 5,000 RPS load surge, requests are queued safely, keeping server nodes healthy.
- **Cons:** Introduces minor delays. Users are placed in a virtual waiting line rather than getting immediate checkout confirmation, which requires long-polling or WebSocket connections to update the frontend state when their turn arrives.