# SnapShare Scaling Plan

## 1. Assumptions & Volume Estimates

### Starting Facts & Core Assumptions
- **Registered Users:** 10,000,000
- **Daily Active Users (DAU):** 10% of registered users = **1,000,000 DAU**
- **Daily Uploads:** 1 photo per DAU per day = 1,000,000 uploads/day
- **Daily Feed Views:** 50 feed page views per DAU per day = 50,000,000 views/day
- **Media File Sizes:** Original photo = 2 MB; Generated thumbnail = 50 KB (~0.0488 MB)

### Traffic Calculations
- **Uploads per Second (Average):** 
  \[1,000,000 \text{ uploads} / 86,400 \text{ seconds} = \mathbf{11.57 \text{ uploads/sec}}\]
- **Feed Views per Second (Average):** 
  \[50,000,000 \text{ views} / 86,400 \text{ seconds} = \mathbf{578.70 \text{ views/sec}}\]
- **Feed Views per Second (Peak - 5x surge multiplier):** 
  \[578.70 \text{ views/sec} \times 5 = \mathbf{2,893.52 \text{ views/sec}}\]

### Storage Calculations per Year
- **Storage per Photo Assembly:** \(2\text{ MB} + (50\text{ KB} / 1024) \approx 2.0488\text{ MB}\) per entry.
- **Daily Storage Increment:** \(1,000,000 \times 2.0488\text{ MB} = 2,048,828\text{ MB/day}\)
- **Annual Storage Accumulation:** 
  \[2,048,828\text{ MB/day} \times 365\text{ days} = 747,822,250\text{ MB/year} \approx \mathbf{713.18 \text{ TB/year}}\]

---

## 2. System Paradigm & Storage Strategy

### Read-Heavy vs. Write-Heavy
The system is overwhelmingly **read-heavy**. Comparing average volumes, feed views (\(578.70\text{ views/sec}\)) outpace incoming image uploads (\(11.57\text{ uploads/sec}\)) by a factor of 50 to 1. This means the system architecture must prioritize aggressive caching strategies, content distribution layers, and database read replicas to fulfill persistent feed timelines without degrading core database availability.

### Why Media Files Do Not Belong in the Database
Photos should **never** be stored as Binary Large Objects (BLOBs) directly inside a relational database. High-volume file streams consume massive memory buffers, inflate backup recovery times, bloat the structural indices, and degrade search lookups. Instead, files are externalized to **Object Storage** while the database maintains only lightweight string pointers (`URLs`) mapping to the hosted assets.

---

## 3. Architecture Diagram

[ Users / Clients ]
│         │
┌──────────────────────────┘         └──────────────────────────┐
▼                                                               ▼
[ Content Delivery Network (CDN) ]                             [ Load Balancer ]
│ (Cached Photos & Thumbnails)                                  │
▼                                                               ▼
[ Object Storage (S3 / Cloud Buckets) ]                       [ Application Servers ]
▲                                                          │    │        │
│ (Direct Upload Payload / Async Workers)                  │    │        │
│                                ┌─────────────────────────┘    │        └────────────────────────┐
│                                ▼                              ▼                                 ▼
│                       [ Key-Value Cache ]          [ Message Queue (Broker) ]       [ Primary Database ]
│                                                               │                                 │
│                                                               ▼                                 ▼
└─────────────────────────────────────────────────────── [ Async Workers ]                  [ Read Replica ]

## 4. Component Explanations
- **Content Delivery Network (CDN):** Reduces latency and origins load by caching static images and thumbnails geographically close to the end user.
- **Load Balancer:** Distributes incoming application traffic uniformly across available backend instances to protect servers from single-point exhaustion.
- **App Servers:** Executes core application logic, checks permissions, serves API responses, and routes write traffic to the stateful components.
- **Cache (In-Memory Key-Value Storage):** Stores highly requested database records, user metadata, and computed feed layouts inside RAM to minimize structural lookups.
- **Primary Database:** Operates as the transactional source of truth for writes, handling identity creation, relationships, and image pointer mappings.
- **Read Replica:** Offloads timeline feed queries from the main node by mirroring the primary database dataset in a specialized read-only instance.
- **Object Storage:** Houses the physical image assets within a highly available file engine engineered for massive scale at a low cost.
- **Message Queue:** Acts as an asynchronous buffer that captures resource-heavy tasks, like thumbnail processing jobs, without stalling client HTTP threads.
- **Async Workers:** Pulls tasks from the message queue independently to process and save images without degrading the user experience.

---

## 5. Step-by-Step Upload Flow
1. **Initiate Request:** The client app sends an HTTP `POST` multipart request containing metadata and the binary image payload to the Load Balancer, which proxies it to an App Server.
2. **Metadata Persist:** The App Server validates the request, generates a unique UUID for the photo, and logs a structural record into the **Primary Database** with an initial status of `pending`.
3. **Payload Storage:** The App Server streams the raw 2 MB file block safely into the **Object Storage** bucket under its primary file path key.
4. **Queue Notification:** Once the upload succeeds, the App Server pushes a payload contract `{photo_id: 123, object_url: "..."}` into the **Message Queue** and immediately responds to the user with a `202 Accepted` status code.
5. **Async Compression:** An **Async Worker** pulls the message from the queue, downloads the raw 2 MB photo, scales it down into a uniform 50 KB thumbnail, and pushes the thumbnail back into **Object Storage**.
6. **Final Update:** The worker updates the database record state to `active`, registers the thumbnail's URI pointer, and clears the cache entry for that user's followers to make sure the new post appears on their feeds.

---

## 6. Architecture Trade-offs

### Trade-off 1: Asynchronous Thumbnail Processing vs. Instant Availability
- **Pros:** Immediate user feedback, lower server connection holding times, and protection against heavy processing spikes during peak upload periods.
- **Cons:** Introduces eventual consistency. A user might refresh their feed immediately after uploading and encounter a broken image link if the worker queue is experiencing a backlog.

### Trade-off 2: Active Read Replicas vs. Data Freshness Replication Lag
- **Pros:** Massively scales read throughput, insulating the write master from resource starvation during heavy traffic surges.
- **Cons:** Replication from the primary instance to the read replica is asynchronous. Followers might not see a newly published post for a few seconds depending on network propagation delays.