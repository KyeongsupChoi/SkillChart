import React, { useState } from 'react';

const App = () => {
  // Initial state with skills data
 const backendSkills = [
  { level: 'Beginner', description: 'Basic understanding of server-side programming languages (e.g., Python, Node.js, Java, Ruby)', weight: 5, active: true },
  { level: 'Beginner', description: 'Familiarity with HTTP protocols, request/response cycles, and basic client-server architecture.', weight: 5, active: true },
  { level: 'Beginner', description: 'Ability to set up a simple server using frameworks like Flask, Express, or Django.', weight: 5, active: true },
  { level: 'Beginner', description: 'Basic understanding of databases (SQL or NoSQL) and how to perform CRUD operations (Create, Read, Update, Delete).', weight: 5, active: true },
  { level: 'Beginner', description: 'Awareness of RESTful API concepts and how to create simple endpoints.', weight: 5, active: true },
  { level: 'Beginner', description: 'Setting up a simple web server that responds to HTTP requests.', weight: 5, active: true },
  { level: 'Beginner', description: 'Implementing basic user authentication and handling form data.', weight: 5, active: true },
  { level: 'Beginner', description: 'Writing API endpoints that interact with a database.', weight: 5, active: true },
  { level: 'Beginner', description: 'Implementing data validation and error handling for user input before storing it in the database, ensuring data integrity and security.', weight: 5, active: true },
  { level: 'Intermediate', description: 'Proficient in designing and implementing RESTful APIs with CRUD functionality.', weight: 5, active: true },
  { level: 'Intermediate', description: 'Understanding of relational databases (e.g., MySQL, PostgreSQL) and NoSQL databases (e.g., MongoDB, Redis), including schema design, relationships, and indexing.', weight: 5, active: true },
  { level: 'Intermediate', description: 'Familiar with middleware, routing, and handling file uploads.', weight: 5, active: true },
  { level: 'Intermediate', description: 'Knowledge of authentication methods like OAuth, JWT, and sessions.', weight: 5, active: true },
  { level: 'Intermediate', description: 'Experience with version control systems (e.g., Git) and basic knowledge of continuous integration and deployment (CI/CD).', weight: 5, active: true },
  { level: 'Intermediate', description: 'Developing an API for user management (e.g., authentication, authorization).', weight: 5, active: true },
  { level: 'Intermediate', description: 'Setting up middleware for logging, error handling, and security in a web application.', weight: 5, active: true },
  { level: 'Intermediate', description: 'Connecting your backend with external services via APIs (e.g., payment gateways, third-party APIs).', weight: 5, active: true },
  { level: 'Intermediate', description: 'Designing a relational database schema and optimizing queries.', weight: 5, active: true },
  { level: 'Advanced', description: 'Proficiency in implementing robust authentication and authorization mechanisms, such as Single Sign-On (SSO) and Role-Based Access Control (RBAC), to ensure secure access management.', weight: 0, active: false },
  { level: 'Advanced', description: 'Knowledge of microservices architecture and ability to design and develop microservices-based applications.', weight: 0, active: false },
  { level: 'Advanced', description: 'Proficient in using messaging queues (e.g., RabbitMQ, Kafka) for asynchronous processing and communication.', weight: 0, active: false },
  { level: 'Advanced', description: 'Experience with cloud infrastructure (e.g., AWS, Google Cloud, Azure), containerization (Docker), and orchestration tools (Kubernetes).', weight: 0, active: false },
  { level: 'Advanced', description: 'Understanding of caching strategies, load balancing, and scaling backend systems to handle high traffic.', weight: 0, active: false },
  { level: 'Advanced', description: 'Designing and deploying a microservices-based architecture with services that communicate asynchronously.', weight: 0, active: false },
  { level: 'Advanced', description: 'Setting up continuous integration/continuous deployment (CI/CD) pipelines for automated testing and deployment.', weight: 5, active: true },
  { level: 'Advanced', description: 'Implementing caching strategies (e.g., Redis, Memcached) to optimize API performance.', weight: 5, active: true },
  { level: 'Expert', description: 'Mastery of distributed systems, including managing data consistency, eventual consistency, and CAP theorem implications.', weight: 0, active: false },
  { level: 'Expert', description: 'Expertise in backend architecture patterns (e.g., event-driven architecture, CQRS, serverless) for complex and high-traffic systems.', weight: 0, active: false },
  { level: 'Expert', description: 'Deep knowledge of security best practices, including encryption, secure communication, and data protection in large-scale applications.', weight: 0, active: false },
  { level: 'Expert', description: 'Extensive experience with database replication, sharding, and high availability setups.', weight: 0, active: false },
  { level: 'Expert', description: 'Ability to lead backend development teams, perform code reviews, and ensure code quality standards.', weight: 0, active: false },
  { level: 'Expert', description: 'Familiarity with DevOps tools and practices, including Infrastructure as Code (IaC) and full automation of deployment pipelines.', weight: 0, active: false },
  { level: 'Expert', description: 'Architecting large-scale distributed systems with fault-tolerant and highly available components.', weight: 0, active: false },
  { level: 'Expert', description: 'Implementing advanced security mechanisms like end-to-end encryption and secure API gateways.', weight: 0, active: false },
  { level: 'Expert', description: 'Leading a backend development team, defining project architecture, and overseeing codebase and deployment strategies.', weight: 0, active: false }
];

   const dataScienceSkills = [
    { level: 'Beginner', description: 'Basic understanding of statistics and data analysis.', weight: 5, active: true },
    { level: 'Intermediate', description: 'Proficient in data wrangling: loading, cleaning, and transforming data using libraries like Pandas, NumPy, or R’s dplyr.', weight: 5, active: true },
    { level: 'Advanced', description: 'Proficient in implementing complex machine learning algorithms (e.g., random forests, gradient boosting, neural networks) using libraries like scikit-learn, TensorFlow, or PyTorch.', weight: 0, active: false },
  ];

  // State to manage which skill group is active (backend or data science)
  const [activeGroup, setActiveGroup] = useState('backend');
  const [skills, setSkills] = useState(backendSkills);

  // Function to toggle between backend and data science
  const toggleGroup = (group) => {
    if (group === 'backend') {
      setSkills(backendSkills);
    } else if (group === 'dataScience') {
      setSkills(dataScienceSkills);
    }
    setActiveGroup(group);
  };

  // Calculate total score based on active skills
  const totalScore = skills.reduce((sum, skill) => (skill.active ? sum + skill.weight : sum), 0);

  return (
    <div>
      <div>
        {/* Toggle between backend and data science */}
        <button onClick={() => toggleGroup('backend')} disabled={activeGroup === 'backend'}>Backend Skills</button>
        <button onClick={() => toggleGroup('dataScience')} disabled={activeGroup === 'dataScience'}>Data Science Skills</button>
      </div>

      {/* Total score display */}
      <div className="score">Total Score: {totalScore} / {skills.length * 5}</div>

      {/* Skills table */}
      <table>
        <thead>
          <tr>
            <th>Level</th>
            <th>Description</th>
            <th>Weight</th>
            <th>Toggle Skill</th>
          </tr>
        </thead>
        <tbody>
          {skills.map((skill, index) => (
            <tr key={index} className={skill.active ? '' : 'inactive'}>
              <td>{skill.level}</td>
              <td>{skill.description}</td>
              <td className="weight">{skill.weight}</td>
              <td>
                <input
                  type="checkbox"
                  checked={skill.active}
                  onChange={() => {
                    const updatedSkills = [...skills];
                    updatedSkills[index].active = !updatedSkills[index].active;
                    setSkills(updatedSkills);
                  }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <style jsx>{`
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: center;
        }
        th {
          background-color: #f4f4f4;
        }
        .score {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .weight {
          font-weight: bold;
          color: blue;
        }
        .inactive {
          background-color: #f9f9f9;
          color: #999;
        }
        button {
          padding: 10px 20px;
          margin: 5px;
          background-color: #007bff;
          color: white;
          border: none;
          cursor: pointer;
        }
        button:disabled {
          background-color: #ccc;
        }
      `}</style>
    </div>
  );
};

export default App;
