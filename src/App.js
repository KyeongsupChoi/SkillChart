import React, { useState } from 'react';
import './App.css';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const NightingaleRoseChart = ({ skills, totalScore, maxScore, onActivateAll, batchActivationTime }) => {
  const centerX = 150;
  const centerY = 150;
  const centerRadius = 25;
  const ringWidth = 25;
  const [isHovering, setIsHovering] = React.useState(false);
  
  // Calculate percentage
  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  
  // Check if this is a recent batch activation (within last 100ms)
  const isBatchActivation = batchActivationTime && (Date.now() - batchActivationTime < 100);

  // Color mapping by level with gradients
  const colors = {
    'Beginner': { base: '#86efac', light: '#bbf7d0', dark: '#4ade80', veryLight: '#d1fae5' },
    'Intermediate': { base: '#93c5fd', light: '#bfdbfe', dark: '#60a5fa', veryLight: '#dbeafe' },
    'Advanced': { base: '#fcd34d', light: '#fde68a', dark: '#fbbf24', veryLight: '#fef3c7' },
    'Expert': { base: '#fca5a5', light: '#fecaca', dark: '#f87171', veryLight: '#fee2e2' }
  };

  // Group skills by level
  const levelGroups = {
    'Beginner': [],
    'Intermediate': [],
    'Advanced': [],
    'Expert': []
  };

  skills.forEach((skill, index) => {
    if (levelGroups[skill.level]) {
      levelGroups[skill.level].push({ ...skill, originalIndex: index });
    }
  });

  const levels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

  // Simple seeded random function for consistent asymmetry
  const seededRandom = (seed) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  const createPetalPath = (startAngle, endAngle, innerRadius, outerRadius, layerIndex = 0, petalSeed = 0) => {
    const startRad = (startAngle - 90) * Math.PI / 180;
    const endRad = (endAngle - 90) * Math.PI / 180;
    
    // Add natural asymmetry variations based on seed
    const rand1 = seededRandom(petalSeed);
    const rand2 = seededRandom(petalSeed + 1.5);
    const rand3 = seededRandom(petalSeed + 2.7);
    
    // Add petal curve extension with slight variation
    // Inner petals are shorter, outer petals are longer
    const baseExtension = 0.08 + (layerIndex * 0.04);
    const extensionVariation = (rand1 - 0.5) * 0.06; // ±3% variation
    const petalExtension = outerRadius * (baseExtension + extensionVariation);
    const extendedRadius = outerRadius + petalExtension;
    
    // Add slight angular offset to the tip for asymmetry
    const tipAngleOffset = (rand2 - 0.5) * 3; // ±1.5 degrees
    const asymmetricMidRad = ((startAngle + endAngle) / 2 + tipAngleOffset - 90) * Math.PI / 180;
    
    // Inner arc points
    const x1 = centerX + innerRadius * Math.cos(startRad);
    const y1 = centerY + innerRadius * Math.sin(startRad);
    const x4 = centerX + innerRadius * Math.cos(endRad);
    const y4 = centerY + innerRadius * Math.sin(endRad);
    
    // Outer points with petal shape - add slight width variation
    const leftWidthVariation = 1 + (rand3 - 0.5) * 0.08; // ±4% width variation
    const rightWidthVariation = 1 + (seededRandom(petalSeed + 3.3) - 0.5) * 0.08;
    
    const x2 = centerX + outerRadius * leftWidthVariation * Math.cos(startRad);
    const y2 = centerY + outerRadius * leftWidthVariation * Math.sin(startRad);
    const x3 = centerX + outerRadius * rightWidthVariation * Math.cos(endRad);
    const y3 = centerY + outerRadius * rightWidthVariation * Math.sin(endRad);
    
    // Petal tip (extended point at the middle with asymmetric offset)
    const xPetal = centerX + extendedRadius * Math.cos(asymmetricMidRad);
    const yPetal = centerY + extendedRadius * Math.sin(asymmetricMidRad);
    
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    
    // Calculate point for rounded top-left corner
    // Go 70% of the way up the left edge, then curve the rest
    const cornerRatio = 0.7;
    const xCorner = x1 + (x2 - x1) * cornerRatio;
    const yCorner = y1 + (y2 - y1) * cornerRatio;
    
    // Create petal shape with rounded top-left corner
    const path = `
      M ${x1} ${y1}
      L ${xCorner} ${yCorner}
      Q ${x2} ${y2} ${(x2 + xPetal) / 2} ${(y2 + yPetal) / 2}
      Q ${xPetal} ${yPetal} ${x3} ${y3}
      L ${x4} ${y4}
      A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x1} ${y1}
      Z
    `;
    
    // Return path and transform origin (bottom right corner of petal)
    return {
      path,
      originX: x4,
      originY: y4
    };
  };

  const wedges = [];
  const gradients = [];
  
  // Create concentric rings for each level - render from outer to inner (Expert to Beginner)
  // so that inner petals overlap outer ones
  const reversedLevels = [...levels].reverse();
  reversedLevels.forEach((level, reversedIndex) => {
    const levelIndex = levels.length - 1 - reversedIndex; // Get original index
    const skillsInLevel = levelGroups[level];
    if (skillsInLevel.length === 0) return;

    const innerRadius = centerRadius + (levelIndex * ringWidth);
    const outerRadius = innerRadius + ringWidth;
    
    // Calculate total weight in this level for proportional sizing
    const totalWeight = skillsInLevel.reduce((sum, skill) => sum + skill.weight, 0);
    
    let currentAngle = 0;
    
    skillsInLevel.forEach((skill, skillIndex) => {
      // Angle proportional to weight with petal overlap
      const angleSize = (skill.weight / totalWeight) * 360;
      const petalOverlap = 12; // Degrees of overlap with next petal
      const startAngle = currentAngle - petalOverlap / 2;
      const endAngle = currentAngle + angleSize + petalOverlap / 2;
      
      const color = colors[level];
      const gradientId = `gradient-${level}-${skillIndex}`;
      
      // Create gradient for this segment
      gradients.push(
        <radialGradient key={gradientId} id={gradientId} cx="30%" cy="30%">
          <stop offset="0%" stopColor={color.veryLight} />
          <stop offset="50%" stopColor={color.light} />
          <stop offset="100%" stopColor={color.base} />
        </radialGradient>
      );

      // Create petal with layered shadow effect (inner petals cast shadow on outer)
      const layerDepth = levels.indexOf(level);
      const shadowIntensity = 0.15 + (layerDepth * 0.05);
      
      // Create unique seed for each petal for consistent asymmetry
      const petalSeed = skill.originalIndex * 7.919 + layerDepth * 3.141;
      const strokeVariation = seededRandom(petalSeed + 4.2) * 0.2; // Slight stroke variation
      const strokeWidth = skill.active ? (1.5 + layerDepth * 0.15 + strokeVariation) : (1 + strokeVariation * 0.3);
      
      // Get petal path and transform origin
      const petalData = createPetalPath(startAngle, endAngle, innerRadius, outerRadius, layerDepth, petalSeed);
      
      // Calculate sequential animation index (inner to outer, clockwise)
      // Count petals in all inner levels + current position
      let sequentialIndex = 0;
      for (let i = 0; i < levelIndex; i++) {
        const innerLevel = levels[i];
        sequentialIndex += levelGroups[innerLevel].length;
      }
      sequentialIndex += skillIndex;
      
      // Add staggered bloom animation delay only for batch activation (center button)
      // Individual skill toggles activate instantly (no delay)
      const animationDelay = isBatchActivation ? sequentialIndex * 0.3 : 0;
      
      wedges.push(
        <path
          key={`wedge-${level}-${skillIndex}`}
          d={petalData.path}
          fill={skill.active ? `url(#${gradientId})` : 'none'}
          stroke={skill.active ? color.dark : 'none'}
          strokeWidth={strokeWidth}
          opacity={skill.active ? 1 : 0}
          style={{
            filter: skill.active ? `drop-shadow(0 ${1 + layerDepth}px ${3 + layerDepth * 2}px rgba(0,0,0,${shadowIntensity}))` : 'none',
            transformOrigin: `${petalData.originX}px ${petalData.originY}px`,
            transform: skill.active ? 'scale(1) rotate(0deg)' : 'scale(0) rotate(-15deg)',
            transition: skill.active 
              ? `all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) ${animationDelay}s`
              : 'all 0.5s cubic-bezier(0.36, 0, 0.66, -0.56)',
            pointerEvents: skill.active ? 'auto' : 'none',
          }}
        >
          <title>{`${level} (Weight: ${skill.weight}): ${skill.description.substring(0, 60)}...`}</title>
        </path>
      );
      
      currentAngle = currentAngle + angleSize;
    });
  });

  // Count stats by level
  const stats = {
    'Beginner': { active: 0, total: 0, points: 0 },
    'Intermediate': { active: 0, total: 0, points: 0 },
    'Advanced': { active: 0, total: 0, points: 0 },
    'Expert': { active: 0, total: 0, points: 0 }
  };

  skills.forEach(skill => {
    if (stats[skill.level]) {
      stats[skill.level].total++;
      stats[skill.level].points += skill.weight;
      if (skill.active) {
        stats[skill.level].active++;
      }
    }
  });

  // Outer progress ring dimensions
  const outerRingInnerRadius = centerRadius + (4 * ringWidth) + 5; // 5px gap
  const outerRingWidth = 8;
  const outerRingOuterRadius = outerRingInnerRadius + outerRingWidth;
  
  // Calculate the circumference and progress
  const progressRadius = outerRingInnerRadius + outerRingWidth / 2;
  const circumference = 2 * Math.PI * progressRadius;
  
  return (
    <div className="flower-container">
      <svg width="300" height="300" viewBox="0 0 300 300">
        <defs>
          {gradients}
          <radialGradient id="centerGradient">
            <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
            <stop offset="40%" stopColor="rgba(255,255,200,0.3)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.15)" />
          </radialGradient>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.7" />
          </linearGradient>
        </defs>
        
        {/* Wedges (rings) */}
        {wedges}
        
        {/* Outer progress ring - background */}
        <circle
          cx={centerX}
          cy={centerY}
          r={progressRadius}
          fill="none"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth={outerRingWidth}
        />
        
        {/* Outer progress ring - filled portion */}
        <circle
          cx={centerX}
          cy={centerY}
          r={progressRadius}
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth={outerRingWidth}
          strokeDasharray={`${circumference}`}
          strokeDashoffset={circumference - (circumference * percentage) / 100}
          strokeLinecap="butt"
          transform={`rotate(-90 ${centerX} ${centerY})`}
          style={{
            filter: 'drop-shadow(0 2px 4px rgba(255,255,255,0.3))',
            transition: 'stroke-dashoffset 0.5s ease'
          }}
        />
        
        {/* Percentage text in upper right */}
        <text
          x={centerX + outerRingOuterRadius - 15}
          y={centerY - outerRingOuterRadius + 25}
          textAnchor="middle"
          fill="white"
          fontSize="16"
          fontWeight="700"
          style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}
        >
          {percentage}%
        </text>
        
        {/* Center button - toggle all skills */}
        <g 
          onClick={onActivateAll}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          style={{ 
            cursor: 'pointer',
            transformOrigin: 'center'
          }}
        >
          {/* Center circle - flower center */}
          <circle 
            cx={centerX} 
            cy={centerY} 
            r={centerRadius} 
            fill="url(#centerGradient)"
            stroke={isHovering ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.6)"}
            strokeWidth={isHovering ? "3" : "2.5"}
            style={{ transition: 'all 0.2s ease' }}
          />
          
          {/* Inner flower center detail */}
          <circle 
            cx={centerX} 
            cy={centerY} 
            r={centerRadius * 0.6} 
            fill={isHovering ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.15)"}
            opacity="0.8"
            style={{ transition: 'all 0.2s ease' }}
          />
          
          {/* Center text - show total score */}
          <text
            x={centerX}
            y={centerY - 3}
            textAnchor="middle"
            fill="white"
            fontSize={isHovering ? "19" : "18"}
            fontWeight="700"
            style={{ 
              pointerEvents: 'none',
              transition: 'all 0.2s ease'
            }}
          >
            {totalScore}
          </text>
          <text
            x={centerX}
            y={centerY + 11}
            textAnchor="middle"
            fill={isHovering ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.9)"}
            fontSize={isHovering ? "10" : "9"}
            fontWeight="600"
            style={{ 
              pointerEvents: 'none',
              transition: 'all 0.2s ease'
            }}
          >
            points
          </text>
          
        </g>
      </svg>
    </div>
  );
};

const App = () => {
  const [scrolled, setScrolled] = React.useState(false);
  const [lastScrollY, setLastScrollY] = React.useState(0);
  const [navbarExpanded, setNavbarExpanded] = React.useState(false);
  const [batchActivationTime, setBatchActivationTime] = React.useState(null);

  React.useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const toggleNavbar = () => {
    setNavbarExpanded(!navbarExpanded);
  };

  const backendSkills = [
    { level: 'Beginner', description: 'Basic understanding of server-side programming languages (e.g., Python, Node.js, PHP, Java, C#, Ruby)', weight: 1, active: false },
    { level: 'Beginner', description: 'Familiarity with HTTP protocols, request/response cycles, and basic client-server architecture.', weight: 1, active: false },
    { level: 'Beginner', description: 'Ability to set up a simple server using frameworks like Flask, Express, or Django.', weight: 1, active: false },
    { level: 'Beginner', description: 'Basic understanding of databases (SQL or NoSQL) and how to perform CRUD operations (Create, Read, Update, Delete).', weight: 1, active: false },
    { level: 'Beginner', description: 'Awareness of RESTful API concepts and how to create simple endpoints.', weight: 1, active: false },
    { level: 'Beginner', description: 'Setting up a simple web server that responds to HTTP requests.', weight: 1, active: false },
    { level: 'Beginner', description: 'Implementing basic user authentication and handling form data.', weight: 1, active: false },
    { level: 'Beginner', description: 'Writing API endpoints that interact with a database.', weight: 1, active: false },
    { level: 'Beginner', description: 'Implementing data validation and error handling for user input before storing it in the database, ensuring data integrity and security.', weight: 1, active: false },
    { level: 'Intermediate', description: 'Proficient in designing and implementing RESTful APIs with CRUD functionality.', weight: 2, active: false },
    { level: 'Intermediate', description: 'Understanding of relational databases (e.g., MySQL, PostgreSQL) and NoSQL databases (e.g., MongoDB, Redis), including schema design, relationships, and indexing.', weight: 2, active: false },
    { level: 'Intermediate', description: 'Familiar with middleware, routing, and handling file uploads.', weight: 2, active: false },
    { level: 'Intermediate', description: 'Knowledge of authentication methods like OAuth, JWT, and sessions.', weight: 2, active: false },
    { level: 'Intermediate', description: 'Experience with version control systems (e.g., Git) and basic knowledge of continuous integration and deployment (CI/CD).', weight: 2, active: false },
    { level: 'Intermediate', description: 'Developing an API for user management (e.g., authentication, authorization).', weight: 2, active: false },
    { level: 'Intermediate', description: 'Setting up middleware for logging, error handling, and security in a web application.', weight: 2, active: false },
    { level: 'Intermediate', description: 'Connecting your backend with external services via APIs (e.g., payment gateways, third-party APIs).', weight: 2, active: false },
    { level: 'Intermediate', description: 'Designing a relational database schema and optimizing queries.', weight: 2, active: false },
    { level: 'Advanced', description: 'Proficiency in implementing robust authentication and authorization mechanisms, such as Single Sign-On (SSO) and Role-Based Access Control (RBAC), to ensure secure access management.', weight: 4, active: false },
    { level: 'Advanced', description: 'Knowledge of microservices architecture and ability to design and develop microservices-based applications.', weight: 4, active: false },
    { level: 'Advanced', description: 'Proficient in using messaging queues (e.g., RabbitMQ, Kafka) for asynchronous processing and communication.', weight: 4, active: false },
    { level: 'Advanced', description: 'Experience with cloud infrastructure (e.g., AWS, Google Cloud, Azure), containerization (Docker), and orchestration tools (Kubernetes).', weight: 4, active: false },
    { level: 'Advanced', description: 'Understanding of caching strategies, load balancing, and scaling backend systems to handle high traffic.', weight: 4, active: false },
    { level: 'Advanced', description: 'Designing and deploying a microservices-based architecture with services that communicate asynchronously.', weight: 4, active: false },
    { level: 'Advanced', description: 'Setting up continuous integration/continuous deployment (CI/CD) pipelines for automated testing and deployment.', weight: 4, active: false },
    { level: 'Advanced', description: 'Implementing caching strategies (e.g., Redis, Memcached) to optimize API performance.', weight: 4, active: false },
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

  const frontendSkills = [
    { level: 'Beginner', description: 'Knowledge of common HTML elements', weight: 1, active: false },
    { level: 'Beginner', description: 'Knowledge of common CSS selectors - how to set background colours and borders', weight: 1, active: false },
    { level: 'Beginner', description: 'Knowledge of flex positioning', weight: 1, active: false },
    { level: 'Beginner', description: 'Knowledge of Javascript DOM access', weight: 1, active: false },
    { level: 'Beginner', description: 'Knowledge of Javascript programming - how to use arrays and array methods, and how to use objects and object methods', weight: 1, active: false },
    { level: 'Beginner', description: 'How to use fetch API, and structure HTTP requests', weight: 1, active: false },
    { level: 'Beginner', description: 'Basic usage of React / Vue / etc - using state, creating components and hooks', weight: 1, active: false },
    { level: 'Intermediate', description: 'Using TypeScript', weight: 2, active: false },
    { level: 'Intermediate', description: 'Understanding React component structure such as smart vs dumb components', weight: 2, active: false },
    { level: 'Intermediate', description: 'Familiarity with Next.js', weight: 2, active: false },
    { level: 'Intermediate', description: 'Usage of React/Tanstack Query', weight: 2, active: false },
    { level: 'Intermediate', description: 'Usage of global state', weight: 2, active: false },
    { level: 'Intermediate', description: 'Knowledge of responsive CSS rules', weight: 2, active: false },
    { level: 'Intermediate', description: 'Proficiency with JavaScript fundamental data structures and methods', weight: 2, active: false },
    { level: 'Intermediate', description: 'JS modules and their structure - importing, different kinds of exports, and their use cases', weight: 2, active: false },
    { level: 'Intermediate', description: 'Building your app and getting it to run on a server', weight: 2, active: false },
    { level: 'Advanced', description: 'Understanding contextual usage of global state vs local state', weight: 4, active: false },
    { level: 'Advanced', description: 'Familiarity with Chrome web app profiling (lighthouse?)', weight: 4, active: false },
    { level: 'Advanced', description: 'Strong competence with Next.js SSR/SSG features', weight: 4, active: false },
    { level: 'Advanced', description: 'Competence with HTTP requests and making requests efficiently - batching, splitting requests, minimising refetches', weight: 4, active: false },
    { level: 'Advanced', description: 'Creating NPM libraries, including NPM library project structure, and registering project to NPM', weight: 4, active: false },
    { level: 'Advanced', description: 'Lazy loading of code and pages', weight: 4, active: false },
    { level: 'Expert', description: 'Understanding React rendering flow and placement of state and data fetching', weight: 8, active: false },
    { level: 'Expert', description: 'Understanding techniques to minimise excess rerenders', weight: 8, active: false },
    { level: 'Expert', description: 'Competence in using memory profiling and React Dev Tools to inspect and improve app performance', weight: 8, active: false }
  ];

  const dataScienceSkills = [
    { level: 'Beginner', description: 'Basic understanding of statistics and data analysis.', weight: 1, active: false },
    { level: 'Beginner', description: 'Familiarity with spreadsheets or basic data manipulation tools (e.g., Excel).', weight: 1, active: false },
    { level: 'Beginner', description: 'Ability to use simple data visualization tools (e.g., Excel, Google Sheets, or Python\'s matplotlib and seaborn).', weight: 1, active: false },
    { level: 'Beginner', description: 'Introductory knowledge of programming (Python or R) and basic libraries (e.g., Pandas, NumPy).', weight: 1, active: false },
    { level: 'Beginner', description: 'Basic knowledge of data types (structured, semi-structured, and unstructured data).', weight: 1, active: false },
    { level: 'Beginner', description: 'Plotting simple graphs (bar charts, line graphs) to visualize data.', weight: 1, active: false },
    { level: 'Beginner', description: 'Calculating mean, median, mode, variance, and other basic statistical metrics.', weight: 1, active: false },
    { level: 'Beginner', description: 'Loading and cleaning small datasets.', weight: 1, active: false },
    { level: 'Beginner', description: 'Basic ability to automate repetitive data related tasks with simple scripts in Python or R.', weight: 1, active: false },
    { level: 'Intermediate', description: 'Proficient in data wrangling: loading, cleaning, and transforming data using libraries like Pandas, NumPy, or R\'s dplyr.', weight: 2, active: false },
    { level: 'Intermediate', description: 'Good understanding of probability, statistical testing (e.g., hypothesis testing, confidence intervals), and distributions.', weight: 2, active: false },
    { level: 'Intermediate', description: 'Basic knowledge of machine learning algorithms (e.g., linear regression, decision trees) and their applications.', weight: 2, active: false },
    { level: 'Intermediate', description: 'Experience with data visualization libraries (e.g., matplotlib, seaborn, or ggplot2).', weight: 2, active: false },
    { level: 'Intermediate', description: 'Ability to perform exploratory data analysis (EDA) and extract insights from datasets.', weight: 2, active: false },
    { level: 'Intermediate', description: 'Familiarity with supervised and unsupervised learning concepts.', weight: 2, active: false },
    { level: 'Intermediate', description: 'Cleaning and transforming large datasets using Pandas or NumPy.', weight: 2, active: false },
    { level: 'Intermediate', description: 'Implementing and evaluating simple machine learning models like linear regression or K-means clustering.', weight: 2, active: false },
    { level: 'Intermediate', description: 'Performing A/B testing or statistical analysis on datasets.', weight: 2, active: false },
    { level: 'Advanced', description: 'Proficient in implementing complex machine learning algorithms (e.g., random forests, gradient boosting, neural networks) using libraries like scikit-learn, TensorFlow, or PyTorch.', weight: 4, active: false },
    { level: 'Advanced', description: 'Strong understanding of feature engineering, hyperparameter tuning, model evaluation, and optimization techniques.', weight: 4, active: false },
    { level: 'Advanced', description: 'Experience working with large-scale datasets and using cloud platforms for data storage and computation (e.g., AWS, GCP, Azure).', weight: 4, active: false },
    { level: 'Advanced', description: 'Familiarity with big data tools and frameworks (e.g., Hadoop, Spark).', weight: 4, active: false },
    { level: 'Advanced', description: 'Ability to work with databases (SQL) and unstructured data (e.g., text data with NLP).', weight: 4, active: false },
    { level: 'Advanced', description: 'Knowledge of deep learning and more advanced topics like natural language processing (NLP), reinforcement learning, or computer vision.', weight: 4, active: false },
    { level: 'Advanced', description: 'Building and fine-tuning machine learning models for production.', weight: 4, active: false },
    { level: 'Advanced', description: 'Creating predictive models using time series analysis or deep learning methods.', weight: 4, active: false },
    { level: 'Advanced', description: 'Implementing machine learning pipelines for automated model training and deployment.', weight: 4, active: false },
    { level: 'Expert', description: 'Mastery of complex algorithms and advanced techniques, such as deep learning architectures (e.g., CNNs, RNNs, Transformers) or reinforcement learning.', weight: 8, active: false },
    { level: 'Expert', description: 'Deep understanding of data science workflows, MLOps (machine learning operations), and the deployment of machine learning models in production environments.', weight: 8, active: false },
    { level: 'Expert', description: 'Expertise in using cloud platforms, distributed computing, and handling real-time data streams.', weight: 8, active: false },
    { level: 'Expert', description: 'Strong ability to create custom machine learning models, handle imbalanced data, and apply transfer learning.', weight: 8, active: false },
    { level: 'Expert', description: 'Leadership experience in designing large-scale data science projects, mentoring teams, and making data-driven business decisions.', weight: 8, active: false },
    { level: 'Expert', description: 'Designing and implementing custom deep learning architectures for complex problems (e.g., image recognition, natural language understanding).', weight: 8, active: false },
    { level: 'Expert', description: 'Leading a team of data scientists in building scalable and efficient data pipelines.', weight: 8, active: false },
    { level: 'Expert', description: 'Managing and deploying machine learning models at scale for real-time or high-impact applications.', weight: 8, active: false },
    { level: 'Expert', description: 'Developing and deploying end-to-end AI systems and integrating them with business operations.', weight: 8, active: false },
  ];

  const pythonSkills = [
    { level: "Beginner", description: "Basic understanding of Python syntax and data structures (lists, tuples, dictionaries, sets).", weight: 1, active: false },
    { level: "Beginner", description: "Ability to write simple programs using variables, loops, conditionals, and functions.", weight: 1, active: false },
    { level: "Beginner", description: "Understanding basic concepts like input/output, string manipulation, and basic error handling.", weight: 1, active: false },
    { level: "Beginner", description: "Able to import built-in Python modules (e.g., math, os, random) and third-party libraries, using functions from imported modules.", weight: 1, active: false },
    { level: "Beginner", description: "Writing a program to print Fibonacci numbers.", weight: 1, active: false },
    { level: "Beginner", description: "Using loops to iterate over data structures.", weight: 1, active: false },
    { level: "Beginner", description: "Able to create lists using compact syntax for mapping and filtering operations.", weight: 1, active: false },
    { level: "Beginner", description: "Ability to open, read, write, and close files, including working with text files and handling exceptions related to file operations.", weight: 1, active: false },
    { level: "Beginner", description: "Understanding slicing in lists and strings, ability to use slice notation to extract portions of lists, tuples, and strings efficiently.", weight: 1, active: false },
    { level: "Intermediate", description: "Deeper understanding of data structures and algorithms.", weight: 2, active: false },
    { level: "Intermediate", description: "Familiarity with object-oriented programming (OOP) principles: classes, inheritance, polymorphism, encapsulation.", weight: 2, active: false },
    { level: "Intermediate", description: "Ability to use third-party libraries and frameworks (e.g., Pandas, NumPy, Flask).", weight: 2, active: false },
    { level: "Intermediate", description: "Understanding of error handling using exceptions.", weight: 2, active: false },
    { level: "Intermediate", description: "Familiarity with modules, packages, and Python's standard library.", weight: 2, active: false },
    { level: "Intermediate", description: "Writing a web scraper using libraries like BeautifulSoup or Scrapy.", weight: 2, active: false },
    { level: "Intermediate", description: "Creating a simple web application using Flask or Django.", weight: 2, active: false },
    { level: "Intermediate", description: "Data manipulation and analysis using Pandas and NumPy.", weight: 2, active: false },
    { level: "Intermediate", description: "Implementing algorithms like sorting or searching.", weight: 2, active: false },
    { level: "Advanced", description: "Proficient in working with complex data structures (e.g., generators, iterators).", weight: 4, active: false },
    { level: "Advanced", description: "Expert in OOP, design patterns, and advanced Python concepts (e.g., decorators, context managers).", weight: 4, active: false },
    { level: "Advanced", description: "Proficiency in performance optimization (e.g., time complexity, memory usage).", weight: 4, active: false },
    { level: "Advanced", description: "Understanding concurrency and parallelism (using threading, multiprocessing, async/await).", weight: 4, active: false },
    { level: "Advanced", description: "Experience with debugging, testing (unit tests, integration tests), and version control (e.g., Git).", weight: 4, active: false },
    { level: "Advanced", description: "Developing a large-scale application with efficient data handling.", weight: 4, active: false },
    { level: "Advanced", description: "Building and maintaining APIs with complex architectures.", weight: 4, active: false },
    { level: "Advanced", description: "Writing unit tests and utilizing continuous integration (CI/CD).", weight: 4, active: false },
    { level: "Advanced", description: "Implementing machine learning models with libraries like TensorFlow or PyTorch.", weight: 4, active: false },
    { level: "Expert", description: "Mastery of Python internals, such as memory management, garbage collection, and bytecode.", weight: 8, active: false },
    { level: "Expert", description: "Ability to contribute to Python core development or design custom libraries and tools.", weight: 8, active: false },
    { level: "Expert", description: "Deep understanding of multithreading, asynchronous programming, and distributed systems.", weight: 8, active: false },
    { level: "Expert", description: "Familiarity with low-level programming concepts (e.g., interfacing Python with C/C++).", weight: 8, active: false },
    { level: "Expert", description: "Knowledge of various domains such as web development, machine learning, automation, data science, and scripting.", weight: 8, active: false },
    { level: "Expert", description: "Designing complex, scalable systems and APIs for production.", weight: 8, active: false },
    { level: "Expert", description: "Implementing and optimizing large-scale machine learning pipelines.", weight: 8, active: false },
    { level: "Expert", description: "Contributing to open-source Python projects or writing custom Python extensions.", weight: 8, active: false },
    { level: "Expert", description: "Identify bottlenecks, profile code, and implement optimizations using tools like cProfile, timeit, and optimizing with techniques such as just-in-time compilation (e.g., using Numba or Cython).", weight: 8, active: false },
  ];

  const sqlSkills = [
    { level: "Beginner", description: "Understanding basic SQL syntax and queries.", weight: 1, active: false },
    { level: "Beginner", description: "Ability to create simple queries to retrieve data using SELECT, WHERE, and ORDER BY clauses.", weight: 1, active: false },
    { level: "Beginner", description: "Familiarity with basic data operations like INSERT, UPDATE, and DELETE.", weight: 1, active: false },
    { level: "Beginner", description: "Basic knowledge of filtering data with operators like =, >, <, LIKE, and IN.", weight: 1, active: false },
    { level: "Beginner", description: "Writing a query to select data from a table based on specific conditions.", weight: 1, active: false },
    { level: "Beginner", description: "Sorting and filtering results using ORDER BY and WHERE.", weight: 1, active: false },
    { level: "Beginner", description: "Inserting new rows into a table.", weight: 1, active: false },
    { level: "Beginner", description: "Familiarity with one of common SQL connection libraries (e.g., psycopg2, SQLAlchemy, JDBC, mysql).", weight: 1, active: false },
    { level: "Beginner", description: "Basic ability to automate repetitive data related tasks with simple scripts in Python or R.", weight: 1, active: false },
    { level: "Intermediate", description: "Proficiency with JOIN operations (INNER, LEFT, RIGHT, FULL OUTER) to combine data from multiple tables.", weight: 2, active: false },
    { level: "Intermediate", description: "Ability to group and aggregate data using GROUP BY and aggregate functions (COUNT, SUM, AVG, MAX, MIN).", weight: 2, active: false },
    { level: "Intermediate", description: "Understanding of subqueries and nested queries.", weight: 2, active: false },
    { level: "Intermediate", description: "Knowledge of database constraints (e.g., primary keys, foreign keys, unique constraints) and indexes.", weight: 2, active: false },
    { level: "Intermediate", description: "Experience with database normalization and designing relational database schemas.", weight: 2, active: false },
    { level: "Intermediate", description: "Joining multiple tables to retrieve related data.", weight: 2, active: false },
    { level: "Intermediate", description: "Writing queries to summarize data using group functions like COUNT or SUM.", weight: 2, active: false },
    { level: "Intermediate", description: "Creating database tables and defining relationships between them.", weight: 2, active: false },
    { level: "Intermediate", description: "Can use SSMS, DataGrip and DBeaver to interact with databases, execute queries, and manage database objects. Familiar with their user interfaces, including how to connect to a database, navigate schemas, and run SQL scripts.", weight: 2, active: false },
    { level: "Advanced", description: "Advanced query optimization techniques to improve query performance (e.g., indexing, query plans).", weight: 4, active: false },
    { level: "Advanced", description: "Ability to write complex stored procedures, functions, and triggers.", weight: 4, active: false },
    { level: "Advanced", description: "Proficiency in advanced SQL features like WITH (CTE, Common Table Expressions) and window functions (e.g., ROW_NUMBER(), RANK()).", weight: 4, active: false },
    { level: "Advanced", description: "Knowledge of database transactions, ACID properties, and handling concurrency and isolation levels.", weight: 4, active: false },
    { level: "Advanced", description: "Proficient in database security, user roles, and permissions management.", weight: 4, active: false },
    { level: "Advanced", description: "Ability to design normalized database schemas, ensuring data integrity and optimizing for scalability and performance.", weight: 4, active: false },
    { level: "Advanced", description: "Optimizing slow queries by analyzing query plans and using appropriate indexing.", weight: 4, active: false },
    { level: "Advanced", description: "Implementing transaction-safe SQL queries and managing concurrency.", weight: 4, active: false },
    { level: "Advanced", description: "Proficiency in designing and optimizing extract, transform, load (ETL) processes, and managing data in data warehouses.", weight: 4, active: false },
    { level: "Expert", description: "Deep understanding of database architecture and internals (e.g., how indexes work, locking mechanisms, execution plans).", weight: 8, active: false },
    { level: "Expert", description: "Proficiency in advanced optimization techniques and tuning complex queries for performance.", weight: 8, active: false },
    { level: "Expert", description: "Ability to manage and configure database replication, backup, recovery, and high availability setups.", weight: 8, active: false },
    { level: "Expert", description: "Designing and implementing highly scalable database architectures for enterprise applications.", weight: 8, active: false },
    { level: "Expert", description: "Performing complex query optimization and database tuning for high-performance systems.", weight: 8, active: false },
    { level: "Expert", description: "Configuring and maintaining database clusters and replication systems.", weight: 8, active: false },
    { level: "Expert", description: "Expertise in handling large-scale databases: Ability to manage, optimize, and maintain large databases with billions of rows, ensuring performance and reliability.", weight: 8, active: false },
    { level: "Expert", description: "Proficiency in NoSQL databases: Deep understanding of non-relational databases (e.g., MongoDB, Cassandra), and when to use them for different use cases compared to traditional SQL databases.", weight: 8, active: false },
  ];

  const llmSkills = [
    { level: "Beginner", description: "Basic understanding of LLMs, their capabilities, and common use cases (e.g., ChatGPT, Claude, GPT-4).", weight: 1, active: false },
    { level: "Beginner", description: "Ability to write effective prompts to get desired outputs from LLMs.", weight: 1, active: false },
    { level: "Beginner", description: "Familiarity with API-based LLM services (OpenAI API, Anthropic API, etc.).", weight: 1, active: false },
    { level: "Beginner", description: "Understanding of tokens, context windows, and basic API parameters (temperature, max_tokens).", weight: 1, active: false },
    { level: "Intermediate", description: "Experience integrating LLM APIs into applications with proper error handling and rate limiting.", weight: 2, active: false },
    { level: "Intermediate", description: "Knowledge of prompt engineering techniques (few-shot learning, chain-of-thought, role prompting).", weight: 2, active: false },
    { level: "Intermediate", description: "Understanding of embeddings and vector databases for semantic search and RAG (Retrieval-Augmented Generation).", weight: 2, active: false },
    { level: "Intermediate", description: "Ability to implement streaming responses and handle long-running LLM requests.", weight: 2, active: false },
    { level: "Intermediate", description: "Experience with function calling / tool use to extend LLM capabilities.", weight: 2, active: false },
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
      case "frontend":
        setSkills(frontendSkills);
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
    setNavbarExpanded(false); // Close navbar on mobile after selection
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

  const toggleAllSkills = () => {
    const allActive = skills.every(skill => skill.active);
    const updatedSkills = skills.map(skill => ({ ...skill, active: !allActive }));
    setSkills(updatedSkills);
    setBatchActivationTime(Date.now()); // Mark this as a batch activation
    
    // Clear the batch activation flag after animation sequence completes
    setTimeout(() => {
      setBatchActivationTime(null);
    }, skills.length * 300 + 1000); // Total animation time + buffer
  };

  const exportToPDF = async () => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      
      // Add header
      pdf.setFontSize(24);
      pdf.setTextColor(102, 126, 234);
      pdf.text('SkillChart', margin, 20);
      
      // Format category name
      const categoryNames = {
        'backend': 'Backend',
        'frontend': 'Frontend',
        'dataScience': 'Data Science',
        'python': 'Python',
        'sql': 'SQL',
        'llm': 'LLM'
      };
      const categoryName = categoryNames[activeGroup] || activeGroup;
      
      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Category: ${categoryName}`, margin, 28);
      
      // Add score summary
      pdf.setFontSize(14);
      pdf.setTextColor(50, 50, 50);
      pdf.text(`Total Score: ${totalScore} / ${maxScore} (${percentage}%)`, margin, 38);
      
      // Capture the chart using SVG to data URL conversion
      const chartElement = document.querySelector('.flower-container svg');
      if (chartElement) {
        try {
          // Get the SVG's viewBox dimensions
          const viewBox = chartElement.getAttribute('viewBox').split(' ');
          const svgWidth = parseFloat(viewBox[2]);
          const svgHeight = parseFloat(viewBox[3]);
          
          // Serialize SVG to string
          const svgData = new XMLSerializer().serializeToString(chartElement);
          
          // Create a canvas with padding for the chart
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const padding = 40;
          const canvasSize = 600;
          
          canvas.width = canvasSize;
          canvas.height = canvasSize;
          
          // Draw gradient background
          const gradient = ctx.createLinearGradient(0, 0, canvasSize, canvasSize);
          gradient.addColorStop(0, '#667eea');
          gradient.addColorStop(1, '#764ba2');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvasSize, canvasSize);
          
          // Load and draw SVG centered on canvas
          const img = new Image();
          
          await new Promise((resolve, reject) => {
            img.onload = () => {
              // Calculate centered position
              const drawSize = canvasSize - (padding * 2);
              const xOffset = padding;
              const yOffset = padding;
              
              ctx.drawImage(img, xOffset, yOffset, drawSize, drawSize);
              resolve();
            };
            img.onerror = reject;
            
            // Convert SVG to data URL
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);
            img.src = url;
          });
          
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = 80;
          const imgHeight = 80;
          const xPos = (pageWidth - imgWidth) / 2;
          
          pdf.addImage(imgData, 'PNG', xPos, 45, imgWidth, imgHeight);
        } catch (chartError) {
          console.warn('Could not capture chart, continuing without it:', chartError);
        }
      }
      
      // Add active skills list
      let yPos = 135;
      pdf.setFontSize(16);
      pdf.setTextColor(50, 50, 50);
      pdf.text('Active Skills', margin, yPos);
      yPos += 8;
      
      // Group active skills by level
      const activeByLevel = {
        'Beginner': [],
        'Intermediate': [],
        'Advanced': [],
        'Expert': []
      };
      
      skills.forEach(skill => {
        if (skill.active && activeByLevel[skill.level]) {
          activeByLevel[skill.level].push(skill);
        }
      });
      
      // Add skills by level
      const levels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
      const levelColors = {
        'Beginner': [134, 239, 172],
        'Intermediate': [147, 197, 253],
        'Advanced': [252, 211, 77],
        'Expert': [252, 165, 165]
      };
      
      levels.forEach(level => {
        const skillsInLevel = activeByLevel[level];
        if (skillsInLevel.length > 0) {
          // Check if we need a new page
          if (yPos > pageHeight - 40) {
            pdf.addPage();
            yPos = 20;
          }
          
          // Level header
          pdf.setFontSize(12);
          pdf.setTextColor(...levelColors[level]);
          pdf.text(`${level} (${skillsInLevel.length} skills)`, margin, yPos);
          yPos += 6;
          
          // Skills in this level
          pdf.setFontSize(9);
          pdf.setTextColor(60, 60, 60);
          
          skillsInLevel.forEach((skill, index) => {
            // Check if we need a new page
            if (yPos > pageHeight - 20) {
              pdf.addPage();
              yPos = 20;
            }
            
            // Wrap text to fit within margins
            const maxWidth = pageWidth - (2 * margin);
            const lines = pdf.splitTextToSize(`${index + 1}. ${skill.description} (Weight: ${skill.weight})`, maxWidth);
            
            lines.forEach(line => {
              if (yPos > pageHeight - 15) {
                pdf.addPage();
                yPos = 20;
              }
              pdf.text(line, margin + 3, yPos);
              yPos += 5;
            });
            
            yPos += 1;
          });
          
          yPos += 3;
        }
      });
      
      // Add footer
      const timestamp = new Date().toLocaleDateString();
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`Generated on ${timestamp}`, margin, pageHeight - 10);
      
      // Save the PDF
      pdf.save(`SkillChart_${categoryName.replace(/\s+/g, '_')}_${timestamp.replace(/\//g, '-')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      console.error('Error details:', error.message, error.stack);
      alert(`Failed to generate PDF: ${error.message || 'Unknown error'}. Please check the console for details.`);
    }
  };

  return (
    <div className="app-container">
      {scrolled && (
        <button 
          className="scroll-to-top-btn"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Scroll to top"
        >
          ↑
        </button>
      )}
      <div className="content-wrapper">
        <div className={`sticky-header ${scrolled ? 'hidden' : ''}`}>
          <div className="header-grid">
            <div className="header-left">
              <div className="navbar-header">
                <h1 className="navbar-brand">SkillChart</h1>
                <button 
                  className="navbar-toggler"
                  onClick={toggleNavbar}
                  aria-label="Toggle navigation"
                  aria-expanded={navbarExpanded}
                >
                  <span className="navbar-toggler-icon"></span>
                  <span className="navbar-toggler-icon"></span>
                  <span className="navbar-toggler-icon"></span>
                </button>
              </div>

              <div className={`navbar-collapse ${navbarExpanded ? 'show' : ''}`}>
                <nav className="skill-tabs">
                  <button 
                    className={`tab-button ${activeGroup === "backend" ? "active" : ""}`}
                    onClick={() => toggleGroup("backend")}
                  >
                    Backend
                  </button>
                  <button 
                    className={`tab-button ${activeGroup === "frontend" ? "active" : ""}`}
                    onClick={() => toggleGroup("frontend")}
                  >
                    Frontend
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

                <div className="feature-buttons">
                  <button className="feature-btn" disabled>
                    <span className="feature-icon">🌐</span>
                    i18n
                  </button>
                  <button className="feature-btn" disabled>
                    <span className="feature-icon">🌙</span>
                    Dark Mode
                  </button>
                  <button className="feature-btn" onClick={exportToPDF}>
                    <span className="feature-icon">📄</span>
                    Export PDF
                  </button>
                  <button className="feature-btn" disabled>
                    <span className="feature-icon">🖼️</span>
                    Export IMG
                  </button>
                </div>

                <div className="feature-disclaimer">
                  Features in development
                </div>
              </div>
            </div>

            <div className="header-right">
              <NightingaleRoseChart 
                skills={skills} 
                totalScore={totalScore} 
                maxScore={maxScore} 
                onActivateAll={toggleAllSkills}
                batchActivationTime={batchActivationTime}
              />
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
