"""
Company-Specific Interview Dataset Generator
Generates labeled training data for training interview evaluation models.

This dataset simulates real candidate responses across multiple companies:
- Accenture
- Cognizant
- TCS
- Infosys
- Wipro
- Google
- Amazon
- Microsoft

Each sample contains:
- company: target company name
- category: 'technical', 'behavioral', or 'coding'
- question: the interview question
- answer: candidate's response
- score: continuous score from 1.0 to 10.0
- label: 'weak', 'average', 'good', 'excellent'
- company_alignment: how well the answer fits company expectations (0-1)
"""

import os
import json
import csv
import random

SEED = 42
random.seed(SEED)

DATA_TEMPLATES = [
    # ─── TECHNICAL: OOP ────────────────────────────────────────────────────────
    {
        "question": "Explain the four pillars of Object-Oriented Programming with real-world examples.",
        "category": "technical",
        "companies": ["accenture", "cognizant", "tcs", "infosys", "wipro"],
        "samples": [
            {
                "label": "excellent",
                "score_range": (8.8, 9.8),
                "company_alignment": 0.95,
                "answer": "The four pillars of OOP are Encapsulation, Abstraction, Inheritance, and Polymorphism. Encapsulation bundles data with the methods that operate on it, hiding internal state using private access modifiers — like a bank account class where balance is private and modified only via deposit or withdraw methods. Abstraction exposes only essential details while hiding implementation complexity — like using an ATM interface without needing to understand banking mainframe protocols. Inheritance allows a child class to inherit properties and behaviors from a parent, promoting reusability — like an Employee base class extended by Developer and Manager classes. Finally, Polymorphism enables entities to take multiple forms through compile-time method overloading or runtime method overriding — such as a Shape class having a draw() method implemented differently in Circle and Square. These pillars enhance code maintainability, scalability, and testability."
            },
            {
                "label": "good",
                "score_range": (7.2, 8.4),
                "company_alignment": 0.82,
                "answer": "OOP is built on four core principles: Encapsulation, Abstraction, Inheritance, and Polymorphism. Encapsulation means keeping data safe by putting variables and methods together in a class and using getters and setters. Abstraction hides the internal complexity from the user, like driving a car using steering and pedals without knowing the internal engine mechanics. Inheritance allows a derived class to reuse code from a base class, like a Car inheriting from a Vehicle class. Polymorphism means many forms, where a method behaves differently based on the object calling it, like function overriding. These principles make programming modular and clean."
            },
            {
                "label": "average",
                "score_range": (5.0, 6.8),
                "company_alignment": 0.58,
                "answer": "OOP has four pillars: encapsulation, abstraction, inheritance, and polymorphism. Encapsulation is wrapping data into a single unit like a capsule. Abstraction is hiding data. Inheritance is when child class takes properties from parent class so we don't rewrite code. Polymorphism is having same function name with different tasks. For example, a person can be a father, student, and employee at the same time."
            },
            {
                "label": "weak",
                "score_range": (2.0, 4.4),
                "company_alignment": 0.25,
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
                "score_range": (8.7, 9.7),
                "company_alignment": 0.92,
                "answer": "Database normalization is the systematic process of organizing database tables to minimize data redundancy and eliminate insert, update, and delete anomalies. 1NF requires atomic values where each column contains indivisible values and each record is uniquely identifiable by a primary key, avoiding repeating groups. 2NF builds on 1NF by requiring that all non-key attributes are fully functionally dependent on the entire primary key, eliminating partial dependencies in composite key scenarios. 3NF requires 2NF compliance plus the removal of transitive dependencies, meaning non-prime attributes must depend solely on the primary key, not on another non-prime attribute. While normalization guarantees ACID compliance and consistency, in read-heavy production microservices we sometimes selectively denormalize to reduce costly joins."
            },
            {
                "label": "good",
                "score_range": (7.0, 8.3),
                "company_alignment": 0.80,
                "answer": "Normalization is used in relational databases to reduce duplicate data and prevent anomalies. 1NF means all values in columns must be atomic, with no multi-valued attributes and a primary key defined. 2NF removes partial dependency, so every column depends on the whole primary key rather than a part of a composite key. 3NF removes transitive dependencies, so if column A determines B and B determines C, C should be moved to another table. It helps keep tables clean, saves storage, and makes data integrity easier to manage."
            },
            {
                "label": "average",
                "score_range": (4.8, 6.5),
                "company_alignment": 0.55,
                "answer": "Normalization is dividing large tables into smaller tables to reduce duplicate data. 1NF has atomic values. 2NF has no partial dependency. 3NF has no transitive dependency. It prevents anomalies when inserting or deleting records in SQL."
            },
            {
                "label": "weak",
                "score_range": (1.5, 3.8),
                "company_alignment": 0.20,
                "answer": "Normalization is making tables normal in SQL so there are no duplicates. There is 1NF, 2NF, 3NF and BCNF. 1NF is first normal form. 2NF is second normal form."
            }
        ]
    },
    # ─── TECHNICAL: REST VS SOAP ───────────────────────────────────────────────
    {
        "question": "Explain the difference between REST and SOAP APIs. When would you use each?",
        "category": "technical",
        "companies": ["accenture", "cognizant", "wipro", "infosys"],
        "samples": [
            {
                "label": "excellent",
                "score_range": (8.6, 9.6),
                "company_alignment": 0.90,
                "answer": "REST is an architectural style based on stateless client-server communication using standard HTTP methods like GET, POST, PUT, DELETE, and typically payloads in lightweight JSON format. It is cacheable, flexible, and has lower overhead, making it the industry standard for web, mobile apps, and microservices. Conversely, SOAP is a strict protocol relying exclusively on XML with formal WSDL contracts. SOAP provides built-in enterprise features such as WS-Security, ACID-compliant transactions via WS-AtomicTransaction, and standardized error handling via SOAP Faults. I would choose REST for 90% of modern web/mobile APIs where developer speed, bandwidth, and caching matter, and choose SOAP for legacy enterprise integrations, financial banking gateways, or telecommunications requiring strict formal contracts and ACID compliance."
            },
            {
                "label": "good",
                "score_range": (7.1, 8.2),
                "company_alignment": 0.78,
                "answer": "REST is an architectural pattern that works over HTTP and mostly uses JSON, though it can use XML. It is lightweight, stateless, and fast. SOAP is a protocol that uses strict XML messages with a WSDL contract. SOAP has built-in security features like WS-Security and supports stateful operations. You use REST for modern web applications and mobile backends because it is simple and fast. You use SOAP in banking or government sectors where strict security contracts are mandatory."
            },
            {
                "label": "average",
                "score_range": (4.5, 6.2),
                "company_alignment": 0.50,
                "answer": "REST uses JSON and HTTP methods like GET and POST. It is easy to use and used in web development. SOAP uses XML and is a protocol. SOAP is slower because XML is heavy. We use REST for websites and SOAP for secure banking."
            },
            {
                "label": "weak",
                "score_range": (1.8, 3.9),
                "company_alignment": 0.22,
                "answer": "REST is modern API and SOAP is old API. REST uses JSON format while SOAP uses XML format. REST is faster."
            }
        ]
    },
    # ─── CODING / DSA: REVERSING STRINGS / ANAGRAMS ────────────────────────────
    {
        "question": "How would you determine if two strings are anagrams of each other? Explain approach and complexity.",
        "category": "coding",
        "companies": ["accenture", "cognizant", "tcs", "google", "amazon"],
        "samples": [
            {
                "label": "excellent",
                "score_range": (8.9, 9.9),
                "company_alignment": 0.94,
                "answer": "An anagram occurs when two strings contain identical character frequencies. The optimal approach uses a frequency hash map or a fixed 26-element array if limited to lowercase ASCII. First, check if both strings have equal lengths; if not, return false immediately in O(1). Then iterate through the first string incrementing counts, and through the second string decrementing counts. If any count drops below zero, return false early. This runs in O(N) time and O(1) auxiliary space (since the alphabet size is constant at 26 or 128 for ASCII). A naive approach of sorting both strings takes O(N log N) time, which is suboptimal for large inputs or streaming data."
            },
            {
                "label": "good",
                "score_range": (7.2, 8.3),
                "company_alignment": 0.81,
                "answer": "To check if two strings are anagrams, we first check if their lengths are equal. If not, they cannot be anagrams. Then we can use a hash map to count occurrences of each character in the first string, and decrement the counts while traversing the second string. If all counts end at zero, they are anagrams. This takes O(n) time and O(k) space where k is unique characters. Another approach is to sort both strings and compare them, which takes O(n log n) time."
            },
            {
                "label": "average",
                "score_range": (4.7, 6.4),
                "company_alignment": 0.53,
                "answer": "To check anagrams, we convert both strings to char arrays, sort them using built-in sort function, and compare if they are equal. The time complexity is O(n log n) because of sorting."
            },
            {
                "label": "weak",
                "score_range": (1.5, 4.0),
                "company_alignment": 0.20,
                "answer": "Anagram means words have same letters like silent and listen. You can loop through each letter and check if it exists in the other string."
            }
        ]
    },
    # ─── BEHAVIORAL: ADAPTABILITY / CHANGE (ACCENTURE & COGNIZANT FAVORITE) ────
    {
        "question": "Tell me about a time you had to adapt to a sudden change in a project or assignment.",
        "category": "behavioral",
        "companies": ["accenture", "cognizant", "wipro", "tcs", "infosys"],
        "samples": [
            {
                "label": "excellent",
                "score_range": (8.8, 9.7),
                "company_alignment": 0.96,
                "answer": "During our final semester capstone project, our client requested a shift from a SQL relational database to MongoDB three weeks before the deadline due to evolving unstructured survey data requirements. As team lead, I first organized an emergency 30-minute sync to evaluate the architectural impact. I divided the work: one member drafted schema models using Mongoose, another handled data migration scripts, while I re-architected the repository query layer. I also scheduled daily 10-minute standups to track blockers. Because of structured task prioritization, we completed the migration within 8 days with zero data loss and delivered the final project with an automated test suite, earning an A grade. This taught me that adaptability is about calm communication, rapid upskilling, and systematic execution."
            },
            {
                "label": "good",
                "score_range": (7.0, 8.2),
                "company_alignment": 0.84,
                "answer": "In college, one of our group members fell ill right before our final project presentation. They were responsible for the entire backend and presentation slides. I volunteered to take over their module. I spent the weekend reading their code, fixing two pending integration bugs, and preparing the slide deck. During the presentation, our team presented smoothly and answered all questions from the external evaluator. It taught me how to stay calm under pressure and help teammates when unexpected situations arise."
            },
            {
                "label": "average",
                "score_range": (4.6, 6.3),
                "company_alignment": 0.52,
                "answer": "Once our teacher changed the topic of our project one week before submission. We were frustrated at first, but we sat together in the library and found new reference papers. We worked day and night and submitted the report on time."
            },
            {
                "label": "weak",
                "score_range": (1.8, 3.8),
                "company_alignment": 0.25,
                "answer": "Changes happen all the time. Whenever there is a change, I just adjust and do whatever the manager or professor tells me to do without complaining."
            }
        ]
    },
    # ─── BEHAVIORAL: WHY THIS COMPANY (ACCENTURE / COGNIZANT SPECIFIC) ────────
    {
        "question": "Why do you want to join our organization specifically?",
        "category": "behavioral",
        "companies": ["accenture", "cognizant"],
        "samples": [
            {
                "label": "excellent",
                "score_range": (8.7, 9.6),
                "company_alignment": 0.97,
                "answer": "I admire your organization's strong leadership in end-to-end digital transformation and cloud modernization, specifically your recent investments in Generative AI platforms and enterprise cloud architecture. Coming from a computer science background where I built full-stack microservices and integrated AI models, I want to apply my problem-solving skills to large-scale global client problems. Moreover, your emphasis on continuous learning through dedicated training academies, internal mobility, and collaborative culture resonates with my career goal of evolving into a cloud solutions architect."
            },
            {
                "label": "good",
                "score_range": (7.1, 8.2),
                "company_alignment": 0.82,
                "answer": "Your company is a recognized multinational leader with great reputation for nurturing freshers and fresh graduates. You offer extensive training programs and give opportunities to work on cutting-edge technologies like Cloud, AI, and DevOps. I want to start my career in an environment where my skills can grow and where I can contribute to high-impact projects."
            },
            {
                "label": "average",
                "score_range": (4.4, 6.0),
                "company_alignment": 0.50,
                "answer": "Your company is very big MNC with good work culture and job security. Many of my seniors joined your company and gave positive reviews about the work environment and salary packages."
            },
            {
                "label": "weak",
                "score_range": (1.5, 3.5),
                "company_alignment": 0.20,
                "answer": "I need a job to start my career and your company is hiring. I am ready to work hard and learn anything."
            }
        ]
    },
    # ─── SYSTEM DESIGN / CLOUD / ARCHITECTURE ──────────────────────────────────
    {
        "question": "How do you design a scalable web application that can handle 100,000 concurrent users?",
        "category": "technical",
        "companies": ["google", "amazon", "microsoft", "cognizant", "accenture"],
        "samples": [
            {
                "label": "excellent",
                "score_range": (8.8, 9.8),
                "company_alignment": 0.93,
                "answer": "Designing for 100k concurrent users requires a decoupled, horizontally scalable architecture across multiple tiers. At the ingress, a global CDN caches static assets, and an Application Load Balancer distributes requests across autoscaling stateless application servers running in containerized clusters like ECS or Kubernetes. For data, I would implement a write-through or cache-aside layer using Redis to absorb heavy read loads, reducing database hits by 80%. The primary database would use read replicas with database connection pooling and sharding. For asynchronous tasks like email notifications or image processing, I'd introduce message queues like Kafka or SQS to decouple producers from consumers and prevent cascading failures. Comprehensive observability via OpenTelemetry, Prometheus, and Grafana ensures proactive monitoring."
            },
            {
                "label": "good",
                "score_range": (7.0, 8.2),
                "company_alignment": 0.80,
                "answer": "To handle 100k users, we need horizontal scaling instead of vertical scaling. We should place a load balancer like Nginx or AWS ALB in front of multiple application servers. We should use Redis or Memcached for caching frequently accessed data to save database queries. The database should have master-slave replication where writes go to master and reads go to replicas. We can also use message queues like RabbitMQ for background jobs and a CDN for static assets like images and CSS."
            },
            {
                "label": "average",
                "score_range": (4.5, 6.3),
                "company_alignment": 0.54,
                "answer": "We can use AWS cloud with auto scaling group. When traffic increases, it creates new EC2 instances. We also need a good database with high RAM and use cache memory to speed up queries."
            },
            {
                "label": "weak",
                "score_range": (1.7, 3.9),
                "company_alignment": 0.22,
                "answer": "Buy bigger servers with more CPU and RAM. Make sure internet bandwidth is high so server doesn't crash."
            }
        ]
    }
]

def generate_variations(text, multiplier=2):
    """Generates slight variations in phrasing for data augmentation."""
    prefixes = [
        "",
        "In my experience, ",
        "To answer your question, ",
        "From what I understand, ",
        "Basically, ",
        "Certainly. "
    ]
    suffixes = [
        "",
        " That summarizes my approach.",
        " Hope this clarifies the concept.",
        " This has worked effectively in projects I worked on.",
        " That's how I would tackle this."
    ]
    results = [text]
    for _ in range(multiplier - 1):
        p = random.choice(prefixes)
        s = random.choice(suffixes)
        results.append(f"{p}{text}{s}".strip())
    return results

def build_dataset():
    data = []
    
    for item in DATA_TEMPLATES:
        question = item["question"]
        category = item["category"]
        companies = item["companies"]
        
        for sample in item["samples"]:
            label = sample["label"]
            score_min, score_max = sample["score_range"]
            alignment = sample["company_alignment"]
            base_answer = sample["answer"]
            
            variations = generate_variations(base_answer, multiplier=3)
            
            for company in companies:
                for var_answer in variations:
                    score = round(random.uniform(score_min, score_max), 2)
                    data.append({
                        "company": company,
                        "category": category,
                        "question": question,
                        "answer": var_answer,
                        "score": score,
                        "label": label,
                        "company_alignment": round(alignment + random.uniform(-0.04, 0.04), 2)
                    })
    
    random.shuffle(data)
    return data

def main():
    output_dir = os.path.join(os.path.dirname(__file__), "data")
    os.makedirs(output_dir, exist_ok=True)
    
    dataset = build_dataset()
    
    csv_path = os.path.join(output_dir, "interview_dataset.csv")
    json_path = os.path.join(output_dir, "interview_dataset.json")
    
    # Save CSV
    keys = ["company", "category", "question", "answer", "score", "label", "company_alignment"]
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=keys)
        writer.writeheader()
        writer.writerows(dataset)
        
    # Save JSON
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(dataset, f, indent=2)
        
    print(f"[OK] Generated {len(dataset)} interview training samples!")
    print(f"     CSV : {csv_path}")
    print(f"     JSON: {json_path}")

if __name__ == "__main__":
    main()
