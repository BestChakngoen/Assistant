/**
 * Software Engineering Quest Curriculum Syllabus Data
 */
export const softwareData = {
    programming: {
        title: "Programming Fundamentals",
        prefix: "💻 01",
        colorClass: "from-cyan-500 to-blue-600",
        badgeColor: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
        desc: "เลือกภาษาหลัก 1-2 ภาษาและเข้าใจมันอย่างลึกซึ้ง เช่น JavaScript/TypeScript (เว็บ/ฟูลสแต็ก), Python (AI/Data/Automation), หรือ Go / Java / C# (ระบบองค์กรใหญ่) เข้าใจเรื่อง Logic, OOP และ Control Flows",
        stages: [
            { title: "Variable Scope & Declaration", active: true },
            { title: "Control Flows (Condition/Loops)" },
            { title: "Object-Oriented Logic (OOP)" },
            { title: "Functions & Closures" },
            { title: "Logic & Boolean Algebra" }
        ]
    },
    dsa: {
        title: "Data Structures & Algorithms",
        prefix: "🧠 02",
        colorClass: "from-violet-500 to-fuchsia-600",
        badgeColor: "bg-violet-500/10 border-violet-500/20 text-violet-400",
        desc: "โครงสร้างข้อมูลและอัลกอริทึม (Arrays, Hash Tables, Trees, Sorting, Searching) สำหรับงานและ Technical Interview",
        stages: [
            { title: "Big O Complexity Analysis" },
            { title: "Linear Arrays & LinkedLists" },
            { title: "Hash Tables & Map Storage" },
            { title: "BST Hierarchical Trees" },
            { title: "Sorting & Binary Searching" }
        ]
    },
    git: {
        title: "Version Control (Git & GitHub)",
        prefix: "🔀 03",
        colorClass: "from-blue-500 to-indigo-600",
        badgeColor: "bg-blue-500/10 border-blue-500/20 text-blue-400",
        desc: "เครื่องมือที่นักพัฒนาทุกคนต้องใช้ทำงานร่วมกันในทีม ฝึกการ Commit, Push, Pull, Branching และการแก้ไข Code Conflicts",
        stages: [
            { title: "Git init & local commits" },
            { title: "Remote pushes & pull requests" },
            { title: "Branching workflows" },
            { title: "Resolving file code conflicts" },
            { title: "Team Code Reviews on GitHub" }
        ]
    },
    database: {
        title: "Database Foundations",
        prefix: "🗄️ 04",
        colorClass: "from-amber-500 to-orange-600",
        badgeColor: "bg-amber-500/10 border-amber-500/20 text-amber-400",
        desc: "วิธีการเก็บและจัดการข้อมูล ทั้งแบบ Relational Database (SQL เช่น PostgreSQL, MySQL) และ NoSQL (เช่น MongoDB, Redis)",
        stages: [
            { title: "Schemas & Primary Key constraints" },
            { title: "SQL Queries and filters" },
            { title: "Relational Table JOINs" },
            { title: "NoSQL document storage & caching" },
            { title: "Transactions & ACID integrity" }
        ]
    },
    network: {
        title: "Web & Network Basics",
        prefix: "🌐 05",
        colorClass: "from-emerald-500 to-teal-600",
        badgeColor: "bg-emerald-500/10 border-emerald-500/20 text-emerald-455",
        desc: "เข้าใจการทำงานของระบบเน็ตเวิร์กพื้นฐาน HTTP/HTTPS, RESTful API, JSON และสถาปัตยกรรมแบบ Client-Server",
        stages: [
            { title: "Client-Server System architecture" },
            { title: "HTTP methods lifecycle" },
            { title: "HTTP Status Codes responses" },
            { title: "RESTful API formatting conventions" },
            { title: "HTTPS SSL & CORS headers" }
        ]
    },
    "clean-code": {
        title: "Clean Code & SOLID",
        prefix: "✨ 06",
        colorClass: "from-pink-500 to-rose-600",
        badgeColor: "bg-pink-500/10 border-pink-500/20 text-pink-400",
        desc: "หลักการเขียนโค้ดให้อ่านง่าย บำรุงรักษาง่าย ไม่ซับซ้อน และสามารถขยายระบบต่อได้ในอนาคต",
        stages: [
            "Meaningful naming standards",
            "DRY & KISS guidelines",
            "Single Responsibility (SRP)",
            "Open/Closed Principle (OCP)",
            "Refactoring patterns"
        ].map(s => ({ title: s }))
    },
    architecture: {
        title: "Software Design & Arch",
        prefix: "🏗️ 07",
        colorClass: "from-indigo-500 to-purple-600",
        badgeColor: "bg-indigo-500/10 border-indigo-500/20 text-indigo-405",
        desc: "เรียนรู้สถาปัตยกรรมระบบ เช่น Monolith vs. Microservices, MVC Pattern และ Design Patterns ต่างๆ เพื่อสร้างระบบที่รองรับผู้ใช้",
        stages: [
            "Monolith vs Microservices patterns",
            "MVC Architecture separation",
            "Design Patterns structure",
            "System Scalability & Load Balancing"
        ].map(s => ({ title: s }))
    },
    cloud: {
        title: "Container & Cloud",
        prefix: "🐳 08",
        colorClass: "from-blue-500 to-sky-600",
        badgeColor: "bg-blue-500/10 border-blue-500/20 text-blue-400",
        desc: "การแพ็กแอปพลิเคชันด้วย Docker และความเข้าใจเบื้องต้นเกี่ยวกับบริการ Cloud ยอดนิยม (AWS, Google Cloud หรือ Azure)",
        stages: [
            "Writing Dockerfiles & configs",
            "Docker Compose operations",
            "Virtual Cloud Instance compute",
            "S3 Object storage system"
        ].map(s => ({ title: s }))
    },
    "ai-assisted": {
        title: "AI-Assisted Dev",
        prefix: "🤖 09",
        colorClass: "from-purple-500 to-pink-600",
        badgeColor: "bg-purple-500/10 border-purple-500/20 text-purple-400",
        desc: "ทักษะการใช้เครื่องมือ AI (เช่น GitHub Copilot, Cursor) ในการช่วยเขียนโค้ด ดีบัก และเพิ่ม Productivity",
        stages: [
            "AI developer prompt engineering",
            "Debugging errors with AI models",
            "AI Refactoring and standards",
            "Generating unit tests automatically"
        ].map(s => ({ title: s }))
    },
    "testing-cicd": {
        title: "Testing & CI/CD",
        prefix: "🧪 10",
        colorClass: "from-teal-500 to-emerald-600",
        badgeColor: "bg-teal-500/10 border-teal-500/20 text-teal-455",
        desc: "การเขียน Unit Test, Integration Test และการตั้งค่าระบบ Automated Pipelines เพื่อตรวจสอบและ Deploy โค้ดโดยอัตโนมัติ",
        stages: [
            "Unit testing components Jest",
            "Integration test environment setup",
            "GitHub Actions workflow pipeline",
            "Automated packaging & deploy"
        ].map(s => ({ title: s }))
    },
    security: {
        title: "Web Security Basics",
        prefix: "🛡️ 11",
        colorClass: "from-red-500 to-rose-600",
        badgeColor: "bg-red-500/10 border-red-500/20 text-red-400",
        desc: "ความปลอดภัยขั้นพื้นฐาน (OWASP Top 10) เช่น การจัดการสิทธิ์ (Authentication & Authorization) ด้วย JWT และการเข้ารหัสข้อมูล",
        stages: [
            "OWASP Top 10 vulnerabilities list",
            "JWT Auth structure & validation",
            "Password secure bcrypt hashes",
            "CORS origins & HTTP Security Headers"
        ].map(s => ({ title: s }))
    }
};
