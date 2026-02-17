import React, { useState } from 'react';
import './App.css';

const FlowerVisualization = ({ score, maxScore }) => {
  const percentage = (score / maxScore) * 100;
  const centerX = 150;
  const centerY = 150;
  
  // Calculate number of layers based on percentage (1-7 layers)
  const numLayers = Math.max(1, Math.min(7, Math.ceil(percentage / 15)));
  let totalPetals = 0;

  const getColor = (layerIndex, petalIndex, petalsInLayer) => {
    const hue = ((layerIndex * 50 + petalIndex * (360 / petalsInLayer)) % 360);
    const saturation = 65 + (percentage / 100) * 30;
    const lightness = 45 + layerIndex * 5;
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  const getGradientId = (layerIndex, petalIndex) => {
    return `petalGradient-${layerIndex}-${petalIndex}`;
  };

  const layers = [];
  const gradients = [];

  // Build layers from outside to inside (so inner layers appear on top)
  for (let layer = numLayers - 1; layer >= 0; layer--) {
    const petalsInLayer = Math.max(5, 8 - layer); // Outer layers have more petals
    const layerRadius = 35 + layer * 15; // Distance from center
    const petalLength = 25 + layer * 5; // Outer petals are longer
    const petalWidth = 12 + layer * 3;
    const rotation = layer * 15; // Rotate each layer for staggered effect

    for (let i = 0; i < petalsInLayer; i++) {
      const angle = (360 / petalsInLayer) * i + rotation;
      const angleRad = (angle * Math.PI) / 180;
      
      const baseX = centerX + layerRadius * Math.cos(angleRad);
      const baseY = centerY + layerRadius * Math.sin(angleRad);
      
      const color = getColor(layer, i, petalsInLayer);
      const gradientId = getGradientId(layer, i);
      
      // Create gradient for each petal
      gradients.push(
        <linearGradient key={gradientId} id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.9" />
          <stop offset="50%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.7" />
        </linearGradient>
      );

      // Create petal path for more natural shape
      const petalPath = `
        M ${baseX},${baseY}
        Q ${baseX + petalWidth * Math.cos(angleRad + Math.PI/2)},${baseY + petalWidth * Math.sin(angleRad + Math.PI/2)}
          ${baseX + petalLength * Math.cos(angleRad)},${baseY + petalLength * Math.sin(angleRad)}
        Q ${baseX + petalWidth * Math.cos(angleRad - Math.PI/2)},${baseY + petalWidth * Math.sin(angleRad - Math.PI/2)}
          ${baseX},${baseY}
        Z
      `;

      layers.push(
        <path
          key={`petal-${layer}-${i}`}
          d={petalPath}
          fill={`url(#${gradientId})`}
          stroke={color}
          strokeWidth="0.5"
          opacity={0.9 - layer * 0.05}
          style={{
            filter: `drop-shadow(0 ${2 + layer}px ${3 + layer * 2}px rgba(0,0,0,${0.15 + layer * 0.05}))`,
          }}
        />
      );
      totalPetals++;
    }
  }

  return (
    <div className="flower-container">
      <svg width="300" height="300" viewBox="0 0 300 300">
        <defs>
          {gradients}
        </defs>
        
        {/* Background circle */}
        <circle cx={centerX} cy={centerY} r="140" fill="rgba(255,255,255,0.03)" />
        
        {/* Petals (rendered from outside to inside) */}
        {layers}
        
        {/* Center of flower with texture */}
        <circle 
          cx={centerX} 
          cy={centerY} 
          r="18" 
          fill="url(#centerGradient)"
          style={{
            filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.3))',
          }}
        />
        <defs>
          <radialGradient id="centerGradient">
            <stop offset="0%" stopColor="#FFD700" />
            <stop offset="70%" stopColor="#FFA500" />
            <stop offset="100%" stopColor="#FF8C00" />
          </radialGradient>
        </defs>
        
        {/* Center details */}
        {[...Array(12)].map((_, i) => {
          const angle = (i * 30 * Math.PI) / 180;
          const dotRadius = 10;
          return (
            <circle
              key={`dot-${i}`}
              cx={centerX + dotRadius * Math.cos(angle)}
              cy={centerY + dotRadius * Math.sin(angle)}
              r="1.5"
              fill="#8B4513"
              opacity="0.6"
            />
          );
        })}
      </svg>
      <div className="flower-score-label">{numLayers} layers • {totalPetals} petals</div>
    </div>
  );
};

const App = () => {
  const backendSkills = [
    { level: 'Beginner', description: 'Basic understanding of server-side programming languages (e.g., Python, Node.js, Java, Ruby)', weight: 1, active: true },
    { level: 'Beginner', description: 'Familiarity with HTTP protocols, request/response cycles, and basic client-server architecture.', weight: 1, active: true },
    { level: 'Beginner', description: 'Ability to set up a simple server using frameworks like Flask, Express, or Django.', weight: 1, active: true },
    { level: 'Beginner', description: 'Basic understanding of databases (SQL or NoSQL) and how to perform CRUD operations (Create, Read, Update, Delete).', weight: 1, active: true },
    { level: 'Beginner', description: 'Awareness of RESTful API concepts and how to create simple endpoints.', weight: 1, active: true },
    { level: 'Beginner', description: 'Setting up a simple web server that responds to HTTP requests.', weight: 1, active: true },
    { level: 'Beginner', description: 'Implementing basic user authentication and handling form data.', weight: 1, active: true },
    { level: 'Beginner', description: 'Writing API endpoints that interact with a database.', weight: 1, active: true },
    { level: 'Beginner', description: 'Implementing data validation and error handling for user input before storing it in the database, ensuring data integrity and security.', weight: 1, active: true },
    { level: 'Intermediate', description: 'Proficient in designing and implementing RESTful APIs with CRUD functionality.', weight: 2, active: true },
    { level: 'Intermediate', description: 'Understanding of relational databases (e.g., MySQL, PostgreSQL) and NoSQL databases (e.g., MongoDB, Redis), including schema design, relationships, and indexing.', weight: 2, active: true },
    { level: 'Intermediate', description: 'Familiar with middleware, routing, and handling file uploads.', weight: 2, active: true },
    { level: 'Intermediate', description: 'Knowledge of authentication methods like OAuth, JWT, and sessions.', weight: 2, active: true },
    { level: 'Intermediate', description: 'Experience with version control systems (e.g., Git) and basic knowledge of continuous integration and deployment (CI/CD).', weight: 2, active: true },
    { level: 'Intermediate', description: 'Developing an API for user management (e.g., authentication, authorization).', weight: 2, active: true },
    { level: 'Intermediate', description: 'Setting up middleware for logging, error handling, and security in a web application.', weight: 2, active: true },
    { level: 'Intermediate', description: 'Connecting your backend with external services via APIs (e.g., payment gateways, third-party APIs).', weight: 2, active: true },
    { level: 'Intermediate', description: 'Designing a relational database schema and optimizing queries.', weight: 2, active: true },
    { level: 'Advanced', description: 'Proficiency in implementing robust authentication and authorization mechanisms, such as Single Sign-On (SSO) and Role-Based Access Control (RBAC), to ensure secure access management.', weight: 4, active: false },
    { level: 'Advanced', description: 'Knowledge of microservices architecture and ability to design and develop microservices-based applications.', weight: 4, active: false },
    { level: 'Advanced', description: 'Proficient in using messaging queues (e.g., RabbitMQ, Kafka) for asynchronous processing and communication.', weight: 4, active: false },
    { level: 'Advanced', description: 'Experience with cloud infrastructure (e.g., AWS, Google Cloud, Azure), containerization (Docker), and orchestration tools (Kubernetes).', weight: 4, active: false },
    { level: 'Advanced', description: 'Understanding of caching strategies, load balancing, and scaling backend systems to handle high traffic.', weight: 4, active: false },
    { level: 'Advanced', description: 'Designing and deploying a microservices-based architecture with services that communicate asynchronously.', weight: 4, active: false },
    { level: 'Advanced', description: 'Setting up continuous integration/continuous deployment (CI/CD) pipelines for automated testing and deployment.', weight: 4, active: true },
    { level: 'Advanced', description: 'Implementing caching strategies (e.g., Redis, Memcached) to optimize API performance.', weight: 4, active: true },
    { level: 'Expert', description: 'Mastery of distributed systems, including managing data consistency, eventual consistency, and CAP theorem implications.', weight: 8, active: false },
    { level: 'Expert', description: 'Expertise in backend architecture patterns (e.g., event-driven architecture, CQRS, serverless) for complex and high-traffic systems.', weight: 8, active: false },
    { level: 'Expert', description: 'Deep knowledge of security best practices, including encryption, secure communication, and data protection in large-scale applications.', weight: 8, active: false },
    { level: 'Expert', description: 'Extensive experience with database replication, sharding, and high availability setups.', weight: 8, active: false },
    { level: 'Expert', description: 'Ability to lead backend development teams, perform code reviews, and ensure code quality standards.', weight: 8, active: false },
    { level: 'Expert', description: 'Familiarity with DevOps tools and practices, including Infrastructure as Code (IaC) and full automation of deployment pipelines.', weight: 8, active: false },
    { level: 'Expert', description: 'Architecting large-scale distributed systems with fault-tolerant and highly available components.', weight: 8, active: false },
    { level: 'Expert', description: 'Implementing advanced security mechanisms like end-to-end encryption and secure API gateways.', weight: 8, active: false },
    { level: 'Expert', description: 'Leading a backend development team, defining project architecture, and overseeing codebase and deployment strategies.', weight: 8, active: false }
  ];

  const dataScienceSkills = [
    { level: 'Beginner', description: 'Basic understanding of statistics and data analysis.', weight: 1, active: true },
    { level: 'Intermediate', description: 'Proficient in data wrangling: loading, cleaning, and transforming data using libraries like Pandas, NumPy, or R\'s dplyr.', weight: 2, active: true },
    { level: 'Advanced', description: 'Proficient in implementing complex machine learning algorithms (e.g., random forests, gradient boosting, neural networks) using libraries like scikit-learn, TensorFlow, or PyTorch.', weight: 4, active: false },
  ];

  const pythonSkills = [
    { level: "Beginner", description: "Basic understanding of Python syntax and standard library.", weight: 1, active: true },
    { level: "Intermediate", description: "Experience with Python frameworks like Flask, Django, or FastAPI.", weight: 2, active: true },
    { level: "Advanced", description: "Proficient in writing optimized Python code for performance-critical applications.", weight: 4, active: false },
  ];

  const sqlSkills = [
    { level: "Beginner", description: "Basic knowledge of SQL syntax and queries.", weight: 1, active: true },
    { level: "Intermediate", description: "Proficient in designing relational database schemas and writing complex joins.", weight: 2, active: true },
    { level: "Advanced", description: "Experience with database optimization, indexing, and stored procedures.", weight: 4, active: false },
  ];

  const llmSkills = [
    { level: "Beginner", description: "Basic understanding of LLMs, their capabilities, and common use cases (e.g., ChatGPT, Claude, GPT-4).", weight: 1, active: true },
    { level: "Beginner", description: "Ability to write effective prompts to get desired outputs from LLMs.", weight: 1, active: true },
    { level: "Beginner", description: "Familiarity with API-based LLM services (OpenAI API, Anthropic API, etc.).", weight: 1, active: true },
    { level: "Beginner", description: "Understanding of tokens, context windows, and basic API parameters (temperature, max_tokens).", weight: 1, active: true },
    { level: "Intermediate", description: "Experience integrating LLM APIs into applications with proper error handling and rate limiting.", weight: 2, active: true },
    { level: "Intermediate", description: "Knowledge of prompt engineering techniques (few-shot learning, chain-of-thought, role prompting).", weight: 2, active: true },
    { level: "Intermediate", description: "Understanding of embeddings and vector databases for semantic search and RAG (Retrieval-Augmented Generation).", weight: 2, active: true },
    { level: "Intermediate", description: "Ability to implement streaming responses and handle long-running LLM requests.", weight: 2, active: true },
    { level: "Intermediate", description: "Experience with function calling / tool use to extend LLM capabilities.", weight: 2, active: true },
    { level: "Advanced", description: "Proficient in building RAG systems with document chunking, embedding strategies, and retrieval optimization.", weight: 4, active: false },
    { level: "Advanced", description: "Experience fine-tuning or customizing LLMs for specific domains or tasks.", weight: 4, active: false },
    { level: "Advanced", description: "Knowledge of LLM evaluation metrics, benchmarking, and testing strategies.", weight: 4, active: false },
    { level: "Advanced", description: "Implementing multi-agent systems or orchestrating multiple LLM calls for complex workflows.", weight: 4, active: false },
    { level: "Advanced", description: "Understanding of LLM security concerns (prompt injection, data leakage, content filtering).", weight: 4, active: false },
    { level: "Expert", description: "Expertise in LLM architecture, attention mechanisms, and transformer models.", weight: 8, active: false },
    { level: "Expert", description: "Experience with local LLM deployment, quantization, and optimization techniques.", weight: 8, active: false },
    { level: "Expert", description: "Building production-grade LLM applications with monitoring, cost optimization, and scalability.", weight: 8, active: false },
    { level: "Expert", description: "Contributing to open-source LLM frameworks or developing custom LLM solutions.", weight: 8, active: false },
  ];

  const [activeGroup, setActiveGroup] = useState("backend");
  const [skills, setSkills] = useState(backendSkills);

  const toggleGroup = (group) => {
    switch (group) {
      case "backend":
        setSkills(backendSkills);
        break;
      case "dataScience":
        setSkills(dataScienceSkills);
        break;
      case "python":
        setSkills(pythonSkills);
        break;
      case "sql":
        setSkills(sqlSkills);
        break;
      case "llm":
        setSkills(llmSkills);
        break;
      default:
        break;
    }
    setActiveGroup(group);
  };

  const totalScore = skills.reduce((sum, skill) => (skill.active ? sum + skill.weight : sum), 0);
  const maxScore = skills.reduce((sum, skill) => sum + skill.weight, 0);
  const percentage = Math.round((totalScore / maxScore) * 100);

  const getLevelColor = (level) => {
    switch (level) {
      case 'Beginner':
        return 'level-beginner';
      case 'Intermediate':
        return 'level-intermediate';
      case 'Advanced':
        return 'level-advanced';
      case 'Expert':
        return 'level-expert';
      default:
        return '';
    }
  };

  const getLevelRowClass = (level) => {
    switch (level) {
      case 'Beginner':
        return 'level-beginner-row';
      case 'Intermediate':
        return 'level-intermediate-row';
      case 'Advanced':
        return 'level-advanced-row';
      case 'Expert':
        return 'level-expert-row';
      default:
        return '';
    }
  };

  return (
    <div className="app-container">
      <div className="content-wrapper">
        <div className="sticky-header">
          <nav className="skill-tabs">
            <h1 className="tab-title">SkillChart</h1>
            <button 
              className={`tab-button ${activeGroup === "backend" ? "active" : ""}`}
              onClick={() => toggleGroup("backend")}
            >
              Backend
            </button>
            <button 
              className={`tab-button ${activeGroup === "dataScience" ? "active" : ""}`}
              onClick={() => toggleGroup("dataScience")}
            >
              Data Science
            </button>
            <button 
              className={`tab-button ${activeGroup === "python" ? "active" : ""}`}
              onClick={() => toggleGroup("python")}
            >
              Python
            </button>
            <button 
              className={`tab-button ${activeGroup === "sql" ? "active" : ""}`}
              onClick={() => toggleGroup("sql")}
            >
              SQL
            </button>
            <button 
              className={`tab-button ${activeGroup === "llm" ? "active" : ""}`}
              onClick={() => toggleGroup("llm")}
            >
              LLM
            </button>
          </nav>

          <div className="score-card">
            <div className="score-content">
              <div className="score-info-wrapper">
                <div className="score-info">
                  <div className="score-label">Your Score</div>
                  <div className="score-value">{totalScore} / {maxScore}</div>
                  <div className="score-percentage">{percentage}%</div>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
              <FlowerVisualization score={totalScore} maxScore={maxScore} />
            </div>
          </div>
        </div>

        <div className="skills-table-container">
          <table className="skills-table">
            <thead>
              <tr>
                <th className="col-level">Level</th>
                <th className="col-description">Description</th>
                <th className="col-weight">Weight</th>
                <th className="col-toggle">Active</th>
              </tr>
            </thead>
            <tbody>
              {skills.map((skill, index) => (
                <tr key={index} className={`skill-row ${getLevelRowClass(skill.level)} ${skill.active ? "" : "inactive"}`}>
                  <td className="col-level">
                    <span className={`level-badge ${getLevelColor(skill.level)}`}>
                      {skill.level}
                    </span>
                  </td>
                  <td className="col-description">{skill.description}</td>
                  <td className="col-weight">{skill.weight}</td>
                  <td className="col-toggle">
                    <label className="checkbox-wrapper">
                      <input
                        type="checkbox"
                        checked={skill.active}
                        onChange={() => {
                          const updatedSkills = [...skills];
                          updatedSkills[index].active = !updatedSkills[index].active;
                          setSkills(updatedSkills);
                        }}
                      />
                      <span className="checkmark"></span>
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default App;
