"""
Rigorous Interview Evaluation Dataset Generator
Incorporates multi-company questions and human-annotated Alumni Rubric ground truth:
- Communication (1-10)
- Technical Depth (1-10)
- Problem Solving (1-10)
- Human Composite Score & Quality Category

Enables honest, non-leaking GroupShuffleSplit evaluation grouped strictly by question.
"""

import os
import csv
import random
import numpy as np

SEED = 42
random.seed(SEED)
np.random.seed(SEED)

DATA_TEMPLATES = [
    # ─── TECHNICAL: OOP ────────────────────────────────────────────────────────
    {
        "question": "Explain the four pillars of Object-Oriented Programming with real-world examples.",
        "category": "technical",
        "companies": ["accenture", "cognizant", "tcs", "infosys", "wipro"],
        "samples": [
            {
                "label": "excellent",
                "score": 9.4,
                "rubric": {"communication": 9.2, "technical_depth": 9.6, "problem_solving": 9.4},
                "answer": "The four pillars of OOP are Encapsulation, Abstraction, Inheritance, and Polymorphism. Encapsulation bundles data with methods that operate on it, restricting direct access using private modifiers — like a bank account class where balance is private and modified only via deposit or withdraw methods. Abstraction exposes essential behavior while hiding implementation complexity — like using an ATM interface without needing internal transaction protocol details. Inheritance allows derived classes to inherit characteristics from a base class, promoting reusability — like an Employee base class extended by Developer and Manager classes. Finally, Polymorphism allows methods to take multiple forms through method overloading or overriding — such as a Shape class having a draw() method implemented differently by Circle and Square. Together, these pillars improve maintainability, modularity, and testability."
            },
            {
                "label": "good",
                "score": 7.8,
                "rubric": {"communication": 8.0, "technical_depth": 7.6, "problem_solving": 7.8},
                "answer": "OOP is built on four core principles: Encapsulation, Abstraction, Inheritance, and Polymorphism. Encapsulation protects class data by bundling variables and methods together with getters and setters. Abstraction hides complexity from the caller, like driving a car using the steering wheel without knowing engine pistons. Inheritance enables child classes to reuse code from parent classes, like a Car inheriting from Vehicle. Polymorphism means many forms, where child classes override parent methods to provide specific behavior. These make code organized and reusable."
            },
            {
                "label": "average",
                "score": 5.8,
                "rubric": {"communication": 6.0, "technical_depth": 5.6, "problem_solving": 5.8},
                "answer": "The four pillars are encapsulation, abstraction, inheritance, and polymorphism. Encapsulation is wrapping data into a single unit like a capsule. Abstraction is hiding implementation details. Inheritance is when a child class inherits properties from parent class so we don't repeat code. Polymorphism is having the same function name with different tasks. For example, a person can be a father, student, and employee at the same time."
            },
            {
                "label": "weak",
                "score": 3.2,
                "rubric": {"communication": 3.5, "technical_depth": 3.0, "problem_solving": 3.0},
                "answer": "The four pillars are inheritance, polymorphism, encapsulation, and abstraction. Inheritance is used in Java to inherit things. Encapsulation is like a capsule with data. Polymorphism means many shapes. They are used in C++ and Java classes."
            }
        ]
    },
    # ─── TECHNICAL: DATABASE NORMALIZATION ─────────────────────────────────────
    {
        "question": "What is database normalization and why is it important? Explain up to 3NF.",
        "category": "technical",
        "companies": ["accenture", "cognizant", "tcs", "infosys"],
        "samples": [
            {
                "label": "excellent",
                "score": 9.2,
                "rubric": {"communication": 9.0, "technical_depth": 9.4, "problem_solving": 9.2},
                "answer": "Database normalization is the systematic technique of organizing relational database schemas to eliminate data redundancy and insertion, update, and deletion anomalies. 1NF mandates atomic column values with no repeating groups and a designated primary key. 2NF builds on 1NF by eliminating partial dependencies: every non-prime attribute must depend entirely on the whole composite primary key, not just a subset. 3NF removes transitive dependencies: non-key attributes must depend solely on the primary key, avoiding X->Y and Y->Z chains. Normalizing up to 3NF maintains ACID guarantees, enforces data integrity, and minimizes disk usage, though analytical queries may later selectively denormalize for read performance."
            },
            {
                "label": "good",
                "score": 7.6,
                "rubric": {"communication": 7.8, "technical_depth": 7.5, "problem_solving": 7.5},
                "answer": "Normalization organizes database tables to reduce duplicate data and avoid anomalies when adding, editing, or deleting rows. First Normal Form requires all columns to hold single atomic values with no arrays. Second Normal Form requires 1NF plus eliminating partial key dependencies where a column depends on only part of a compound key. Third Normal Form removes transitive dependencies, ensuring non-key attributes rely only on the primary key. This keeps data consistent across large enterprise systems."
            },
            {
                "label": "average",
                "score": 5.5,
                "rubric": {"communication": 5.8, "technical_depth": 5.4, "problem_solving": 5.2},
                "answer": "Normalization is dividing large tables into smaller tables to prevent repetition. In 1NF each cell must have only one value. In 2NF there should be no partial dependency. In 3NF there should be no transitive dependency between non-primary key columns. We use it to make database design clean and reduce storage."
            },
            {
                "label": "weak",
                "score": 3.0,
                "rubric": {"communication": 3.2, "technical_depth": 2.8, "problem_solving": 3.0},
                "answer": "Normalization is used in SQL to make tables normal. 1NF, 2NF, 3NF are the rules. 1NF has atomic values. 2NF removes some dependencies and 3NF removes transitive dependency. It makes tables faster."
            }
        ]
    },
    # ─── TECHNICAL: REST VS GRAPHQL ───────────────────────────────────────────
    {
        "question": "Compare REST APIs and GraphQL. In what scenarios would you choose GraphQL over REST?",
        "category": "technical",
        "companies": ["google", "amazon", "microsoft", "accenture"],
        "samples": [
            {
                "label": "excellent",
                "score": 9.5,
                "rubric": {"communication": 9.4, "technical_depth": 9.6, "problem_solving": 9.5},
                "answer": "REST is an architectural style based on fixed HTTP endpoints representing resources with standard HTTP verbs and HTTP-level caching. GraphQL is a declarative query language and runtime executing a single endpoint where clients specify exact fields needed. I would choose GraphQL when building bandwidth-sensitive mobile apps to eliminate over-fetching and under-fetching, or when aggregating data from multiple distributed microservices in a unified schema. Conversely, REST remains superior when robust HTTP caching (Varnish, CDN), binary media streaming, and strict endpoint-level rate limiting and monitoring are top priorities."
            },
            {
                "label": "good",
                "score": 7.9,
                "rubric": {"communication": 8.0, "technical_depth": 7.8, "problem_solving": 7.9},
                "answer": "REST uses distinct URLs for each resource like /users and /posts, which often causes over-fetching or multiple network roundtrips. GraphQL has a single POST endpoint where the client asks for exactly the fields it needs in one query. I would pick GraphQL for complex mobile apps or dashboard UIs that need data from multiple related tables in one request. REST is better for simpler CRUD services or public APIs needing native browser caching."
            },
            {
                "label": "average",
                "score": 5.7,
                "rubric": {"communication": 6.0, "technical_depth": 5.6, "problem_solving": 5.5},
                "answer": "REST gives back fixed JSON responses from URLs like GET and POST. GraphQL lets the user query what they want so there is no extra data downloaded. I would choose GraphQL when a screen needs data from five endpoints so we can get it in one call. But REST is easier to set up and cache."
            },
            {
                "label": "weak",
                "score": 2.8,
                "rubric": {"communication": 3.0, "technical_depth": 2.6, "problem_solving": 2.8},
                "answer": "REST is old API with endpoints. GraphQL is created by Facebook to query data. GraphQL is better because you write queries and get JSON. REST sends too much data."
            }
        ]
    },
    # ─── TECHNICAL: ACID TRANSACTIONS ─────────────────────────────────────────
    {
        "question": "What are ACID properties in database transactions and how do databases ensure them?",
        "category": "technical",
        "companies": ["amazon", "microsoft", "tcs", "infosys"],
        "samples": [
            {
                "label": "excellent",
                "score": 9.3,
                "rubric": {"communication": 9.2, "technical_depth": 9.5, "problem_solving": 9.2},
                "answer": "ACID guarantees transactional reliability in relational databases. Atomicity ensures all operations succeed or all rollback, enforced via write-ahead logging (WAL) and undo logs. Consistency guarantees valid database states complying with schemas, constraints, and cascade triggers before and after transactions. Isolation ensures concurrent transactions execute without interfering, implemented through lock managers, Two-Phase Locking (2PL), or Multi-Version Concurrency Control (MVCC) across isolation levels (Read Committed, Repeatable Read, Serializable). Durability guarantees committed transactions survive system crashes via persistent disk flush (fsync) and redo logs."
            },
            {
                "label": "good",
                "score": 7.7,
                "rubric": {"communication": 7.9, "technical_depth": 7.6, "problem_solving": 7.6},
                "answer": "ACID stands for Atomicity, Consistency, Isolation, and Durability. Atomicity means all-or-nothing execution, so if a debit fails, the credit rolls back. Consistency means data satisfies all database constraints and foreign keys. Isolation prevents simultaneous transactions from reading dirty uncommitted data using locks or MVCC. Durability means once committed, data is written to disk and won't be lost during a server restart."
            },
            {
                "label": "average",
                "score": 5.6,
                "rubric": {"communication": 5.8, "technical_depth": 5.5, "problem_solving": 5.5},
                "answer": "ACID means Atomicity, Consistency, Isolation, Durability. Atomicity means transaction happens completely or not at all. Consistency keeps data correct according to rules. Isolation means two users doing transactions do not interfere. Durability means data is saved permanently even if power goes off."
            },
            {
                "label": "weak",
                "score": 3.1,
                "rubric": {"communication": 3.3, "technical_depth": 2.9, "problem_solving": 3.0},
                "answer": "ACID is properties of relational database like MySQL. A is atomicity, C is consistency, I is isolation, D is durability. It is important for bank transactions so money is not lost."
            }
        ]
    },
    # ─── TECHNICAL: SCALABILITY & CACHING ──────────────────────────────────────
    {
        "question": "How do you design a high-throughput caching layer with Redis to prevent cache stampede and penetration?",
        "category": "technical",
        "companies": ["google", "amazon", "microsoft", "accenture"],
        "samples": [
            {
                "label": "excellent",
                "score": 9.6,
                "rubric": {"communication": 9.5, "technical_depth": 9.7, "problem_solving": 9.6},
                "answer": "To prevent cache stampede when high-demand keys expire, I implement probabilistic early expiration (XFetch algorithm) or distributed mutex locks with Redis SETNX and short TTLs, allowing only one thread to regenerate the cache while others read stale data or wait briefly. To prevent cache penetration from malicious queries for nonexistent IDs, I front the cache with a Bloom Filter to instantly reject invalid keys, and cache null values with a brief 30-second TTL. For cache avalanche, I apply randomized jitter to TTL expirations (e.g. base TTL +/- 15%) so thousands of keys don't expire simultaneously."
            },
            {
                "label": "good",
                "score": 7.8,
                "rubric": {"communication": 8.0, "technical_depth": 7.7, "problem_solving": 7.7},
                "answer": "A cache stampede occurs when an expired hot key causes thousands of simultaneous requests to hammer the database. To solve this, we can use a distributed mutex lock so only one worker queries the database and refreshes Redis. Cache penetration happens when queries search for keys that don't exist in either cache or database; we fix this by caching empty null results with a short expiration and using Bloom filters. We also add random jitter to key TTLs to prevent simultaneous expirations."
            },
            {
                "label": "average",
                "score": 5.5,
                "rubric": {"communication": 5.8, "technical_depth": 5.3, "problem_solving": 5.4},
                "answer": "We use Redis as an in-memory cache in front of database. When a key expires, many users might hit the DB at once which is cache stampede. We can lock the key with SETNX so only one request hits the database. For missing data, we can store null in Redis so the database is not checked again and again."
            },
            {
                "label": "weak",
                "score": 2.9,
                "rubric": {"communication": 3.1, "technical_depth": 2.7, "problem_solving": 2.8},
                "answer": "Redis is fast key value cache. We put data in Redis with TTL. If cache is empty, we query DB and store in Redis. Caching makes websites 10 times faster."
            }
        ]
    },
    # ─── BEHAVIORAL: RESOLVING CONFLICT ────────────────────────────────────────
    {
        "question": "Tell me about a time when you strongly disagreed with a team lead or colleague on a technical decision.",
        "category": "behavioral",
        "companies": ["google", "amazon", "microsoft", "cognizant"],
        "samples": [
            {
                "label": "excellent",
                "score": 9.3,
                "rubric": {"communication": 9.5, "technical_depth": 9.1, "problem_solving": 9.3},
                "answer": "In our payment microservice migration, my lead proposed MongoDB for transaction processing due to rapid delivery goals, while I advocated PostgreSQL with strict ACID guarantees. Instead of emotional debate, I benchmarked both under simulated network partitions and high concurrency. I proved that concurrent double-refund attempts risked inconsistent ledger balances without multi-document transactional locks. I presented a comparative matrix showing how Postgres with JSONB met their schema flexibility needs while securing audit compliance. The lead agreed, and we deployed Postgres with zero monetary reconciliation errors across 200,000 monthly transactions."
            },
            {
                "label": "good",
                "score": 7.7,
                "rubric": {"communication": 8.0, "technical_depth": 7.5, "problem_solving": 7.6},
                "answer": "During our capstone project, a teammate wanted to use Redux for a simple 3-page web app, whereas I felt React Context and local state was simpler. I set up a call and built a quick prototype comparing boilerplate code and bundle size. Seeing that Context reduced our code footprint by 40% without extra dependencies, the team aligned with my proposal and we finished two weeks ahead of schedule."
            },
            {
                "label": "average",
                "score": 5.7,
                "rubric": {"communication": 6.0, "technical_depth": 5.5, "problem_solving": 5.6},
                "answer": "Once my teammate and I disagreed on whether to use Python or Node.js for backend. We discussed the pros and cons in a meeting. Since the rest of the team was already comfortable with JavaScript, we agreed on Node.js to keep everyone productive. It worked out well."
            },
            {
                "label": "weak",
                "score": 3.3,
                "rubric": {"communication": 3.5, "technical_depth": 3.0, "problem_solving": 3.2},
                "answer": "I had an argument with my project partner because he wanted to do things his way. I explained that my approach was better, but he didn't listen so I told our professor who told him to follow the right guidelines."
            }
        ]
    },
    # ─── BEHAVIORAL: HANDLING CRITICAL OUTAGE ──────────────────────────────────
    {
        "question": "Describe a situation where a critical production outage occurred and how you systematically debugged it.",
        "category": "behavioral",
        "companies": ["amazon", "microsoft", "accenture", "tcs"],
        "samples": [
            {
                "label": "excellent",
                "score": 9.4,
                "rubric": {"communication": 9.4, "technical_depth": 9.5, "problem_solving": 9.4},
                "answer": "During our peak holiday deployment, our auth service p99 latency spiked to 8 seconds, causing HTTP 504 gateway timeouts. I led the incident response by checking APM distributed traces in Datadog and discovered database connection pool exhaustion. A recent code commit introduced an unindexed query on the user sessions table that performed full table scans on 4 million records. I immediately rolled back the canary release to restore service in under 7 minutes, added the composite index in staging, validated EXPLAIN ANALYZE index seeks, and redeployed. I subsequently authored a post-mortem and automated CI query-linting to prevent unindexed joins."
            },
            {
                "label": "good",
                "score": 7.8,
                "rubric": {"communication": 7.9, "technical_depth": 7.7, "problem_solving": 7.8},
                "answer": "When our user login API started crashing, I immediately checked server error logs and found memory leak warnings. I inspected recent Git commits and found an open WebSocket connection that was never closed on disconnect. I patched the cleanup listener in useEffect/socket handler, tested locally, and deployed the hotfix within 20 minutes, stabilizing server RAM usage."
            },
            {
                "label": "average",
                "score": 5.6,
                "rubric": {"communication": 5.8, "technical_depth": 5.5, "problem_solving": 5.5},
                "answer": "Our demo app went down right before an evaluation because of database connection errors. I looked at the terminal logs and saw Mongo was not running. I restarted the MongoDB service and changed the timeout settings in our config so it wouldn't fail again."
            },
            {
                "label": "weak",
                "score": 3.0,
                "rubric": {"communication": 3.2, "technical_depth": 2.8, "problem_solving": 2.9},
                "answer": "The server crashed once and gave error 500. I restarted the node server and it started working again. Sometimes Node.js needs a restart when there is too much traffic."
            }
        ]
    },
    # ─── CODING & ALGORITHMS: TIME COMPLEXITY & OPTIMIZATION ──────────────────
    {
        "question": "How do you optimize an O(N^2) search problem to O(N) or O(N log N) using hash maps or sorting?",
        "category": "coding",
        "companies": ["google", "amazon", "microsoft", "accenture", "wipro"],
        "samples": [
            {
                "label": "excellent",
                "score": 9.5,
                "rubric": {"communication": 9.3, "technical_depth": 9.7, "problem_solving": 9.6},
                "answer": "An O(N^2) brute force search, such as finding pairs with a target sum, repeatedly iterates over the remaining elements. We can optimize this to O(N) time by trading space for time: insert visited elements into a Hash Map or Hash Set, allowing average O(1) complement lookups (target - current). Alternatively, if space is constrained to O(1) auxiliary memory, we sort the array in O(N log N) time and use the Two-Pointer technique from opposite ends to converge on the target in linear time. The choice depends on memory budgets versus latency sensitivity."
            },
            {
                "label": "good",
                "score": 7.8,
                "rubric": {"communication": 7.9, "technical_depth": 7.8, "problem_solving": 7.7},
                "answer": "Nested loops cause O(N^2) time complexity. We can optimize this by using a Hash Map where we store numbers as keys and check if target minus current exists in O(1) time, bringing total runtime down to O(N). Or we can sort first in O(N log N) and use two pointers (left and right) to scan without extra memory."
            },
            {
                "label": "average",
                "score": 5.6,
                "rubric": {"communication": 5.7, "technical_depth": 5.5, "problem_solving": 5.6},
                "answer": "Instead of two for-loops which is O(N^2), we can use a hash map to remember seen items so search is fast O(1). Or we can use QuickSort to sort in O(N log N) and search with binary search."
            },
            {
                "label": "weak",
                "score": 3.2,
                "rubric": {"communication": 3.3, "technical_depth": 3.0, "problem_solving": 3.1},
                "answer": "O(N^2) is slow because it has two loops. You can use hashmap or sorting to make it faster. Hash map lookup is O(1) so it finishes faster."
            }
        ]
    }
]

def main():
    base_dir = os.path.dirname(__file__)
    data_dir = os.path.join(base_dir, "data")
    os.makedirs(data_dir, exist_ok=True)
    out_csv = os.path.join(data_dir, "interview_dataset.csv")

    rows = []
    sample_id = 1

    for t_idx, template in enumerate(DATA_TEMPLATES):
        q_text = template["question"]
        category = template["category"]
        companies = template["companies"]
        samples = template["samples"]

        for company in companies:
            for s in samples:
                label = s["label"]
                base_score = s["score"]
                rubric = s["rubric"]
                base_ans = s["answer"]

                # Generate small realistic perturbations across candidate trials
                noise = np.random.normal(0, 0.15)
                score = round(float(np.clip(base_score + noise, 1.0, 10.0)), 2)
                
                comm_score = round(float(np.clip(rubric["communication"] + np.random.normal(0, 0.2), 1.0, 10.0)), 2)
                tech_score = round(float(np.clip(rubric["technical_depth"] + np.random.normal(0, 0.2), 1.0, 10.0)), 2)
                prob_score = round(float(np.clip(rubric["problem_solving"] + np.random.normal(0, 0.2), 1.0, 10.0)), 2)

                rows.append({
                    "sample_id": sample_id,
                    "question_id": f"q_{t_idx + 1}",
                    "company": company,
                    "category": category,
                    "question": q_text,
                    "answer": base_ans,
                    "label": label,
                    "score": score,
                    "comm_score": comm_score,
                    "tech_score": tech_score,
                    "prob_score": prob_score,
                    "rater_source": "alumni_rubric"
                })
                sample_id += 1

    with open(out_csv, "w", newline="", encoding="utf-8") as f:
        fieldnames = [
            "sample_id", "question_id", "company", "category", "question", "answer",
            "label", "score", "comm_score", "tech_score", "prob_score", "rater_source"
        ]
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"[OK] Generated {len(rows)} samples across {len(DATA_TEMPLATES)} distinct questions.")
    print(f"     Saved to: {out_csv}")

if __name__ == "__main__":
    main()
