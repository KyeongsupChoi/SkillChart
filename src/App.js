import React, { useState } from 'react';
import './App.css';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const NightingaleRoseChart = ({ skills, totalScore, maxScore, onActivateAll, batchActivationTime, getDescription }) => {
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
          <title>{`${level} (Weight: ${skill.weight}): ${getDescription(skill).substring(0, 60)}...`}</title>
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
  const [language, setLanguage] = React.useState('en');
  const [darkMode, setDarkMode] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Set scrolled state when scrolled down for chart shrinking
      setScrolled(currentScrollY > 50);
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const toggleNavbar = () => {
    setNavbarExpanded(!navbarExpanded);
  };

  const backendSkills = [
    { level: 'Beginner', description: { en: 'Basic understanding of server-side programming languages (e.g., Python, Node.js, PHP, Java, C#, Ruby)', ko: '서버 측 프로그래밍 언어에 대한 기본 이해 (예: Python, Node.js, PHP, Java, C#, Ruby)' }, weight: 1, active: false },
    { level: 'Beginner', description: { en: 'Familiarity with HTTP protocols, request/response cycles, and basic client-server architecture.', ko: 'HTTP 프로토콜, 요청/응답 주기 및 기본 클라이언트-서버 아키텍처에 대한 이해' }, weight: 1, active: false },
    { level: 'Beginner', description: { en: 'Ability to set up a simple server using frameworks like Flask, Express, or Django.', ko: 'Flask, Express 또는 Django와 같은 프레임워크를 사용하여 간단한 서버를 설정하는 능력' }, weight: 1, active: false },
    { level: 'Beginner', description: { en: 'Basic understanding of databases (SQL or NoSQL) and how to perform CRUD operations (Create, Read, Update, Delete).', ko: '데이터베이스(SQL 또는 NoSQL)에 대한 기본 이해 및 CRUD 작업(생성, 읽기, 업데이트, 삭제) 수행 방법' }, weight: 1, active: false },
    { level: 'Beginner', description: { en: 'Awareness of RESTful API concepts and how to create simple endpoints.', ko: 'RESTful API 개념에 대한 인식 및 간단한 엔드포인트 생성 방법' }, weight: 1, active: false },
    { level: 'Beginner', description: { en: 'Setting up a simple web server that responds to HTTP requests.', ko: 'HTTP 요청에 응답하는 간단한 웹 서버 설정' }, weight: 1, active: false },
    { level: 'Beginner', description: { en: 'Implementing basic user authentication and handling form data.', ko: '기본 사용자 인증 구현 및 양식 데이터 처리' }, weight: 1, active: false },
    { level: 'Beginner', description: { en: 'Writing API endpoints that interact with a database.', ko: '데이터베이스와 상호 작용하는 API 엔드포인트 작성' }, weight: 1, active: false },
    { level: 'Beginner', description: { en: 'Implementing data validation and error handling for user input before storing it in the database, ensuring data integrity and security.', ko: '데이터베이스에 저장하기 전에 사용자 입력에 대한 데이터 검증 및 오류 처리를 구현하여 데이터 무결성과 보안 보장' }, weight: 1, active: false },
    { level: 'Intermediate', description: { en: 'Proficient in designing and implementing RESTful APIs with CRUD functionality.', ko: 'CRUD 기능을 갖춘 RESTful API 설계 및 구현에 능숙함' }, weight: 2, active: false },
    { level: 'Intermediate', description: { en: 'Understanding of relational databases (e.g., MySQL, PostgreSQL) and NoSQL databases (e.g., MongoDB, Redis), including schema design, relationships, and indexing.', ko: '관계형 데이터베이스(예: MySQL, PostgreSQL) 및 NoSQL 데이터베이스(예: MongoDB, Redis)에 대한 이해, 스키마 설계, 관계 및 인덱싱 포함' }, weight: 2, active: false },
    { level: 'Intermediate', description: { en: 'Familiar with middleware, routing, and handling file uploads.', ko: '미들웨어, 라우팅 및 파일 업로드 처리에 익숙함' }, weight: 2, active: false },
    { level: 'Intermediate', description: { en: 'Knowledge of authentication methods like OAuth, JWT, and sessions.', ko: 'OAuth, JWT 및 세션과 같은 인증 방법에 대한 지식' }, weight: 2, active: false },
    { level: 'Intermediate', description: { en: 'Experience with version control systems (e.g., Git) and basic knowledge of continuous integration and deployment (CI/CD).', ko: '버전 관리 시스템(예: Git)에 대한 경험과 지속적 통합 및 배포(CI/CD)에 대한 기본 지식' }, weight: 2, active: false },
    { level: 'Intermediate', description: { en: 'Developing an API for user management (e.g., authentication, authorization).', ko: '사용자 관리를 위한 API 개발(예: 인증, 권한 부여)' }, weight: 2, active: false },
    { level: 'Intermediate', description: { en: 'Setting up middleware for logging, error handling, and security in a web application.', ko: '웹 애플리케이션에서 로깅, 오류 처리 및 보안을 위한 미들웨어 설정' }, weight: 2, active: false },
    { level: 'Intermediate', description: { en: 'Connecting your backend with external services via APIs (e.g., payment gateways, third-party APIs).', ko: 'API를 통해 백엔드를 외부 서비스(예: 결제 게이트웨이, 타사 API)와 연결' }, weight: 2, active: false },
    { level: 'Intermediate', description: { en: 'Designing a relational database schema and optimizing queries.', ko: '관계형 데이터베이스 스키마 설계 및 쿼리 최적화' }, weight: 2, active: false },
    { level: 'Advanced', description: { en: 'Proficiency in implementing robust authentication and authorization mechanisms, such as Single Sign-On (SSO) and Role-Based Access Control (RBAC), to ensure secure access management.', ko: '단일 로그인(SSO) 및 역할 기반 액세스 제어(RBAC)와 같은 강력한 인증 및 권한 부여 메커니즘 구현에 능숙하여 안전한 액세스 관리 보장' }, weight: 4, active: false },
    { level: 'Advanced', description: { en: 'Knowledge of microservices architecture and ability to design and develop microservices-based applications.', ko: '마이크로서비스 아키텍처에 대한 지식과 마이크로서비스 기반 애플리케이션을 설계 및 개발하는 능력' }, weight: 4, active: false },
    { level: 'Advanced', description: { en: 'Proficient in using messaging queues (e.g., RabbitMQ, Kafka) for asynchronous processing and communication.', ko: '비동기 처리 및 통신을 위해 메시지 큐(예: RabbitMQ, Kafka) 사용에 능숙함' }, weight: 4, active: false },
    { level: 'Advanced', description: { en: 'Experience with cloud infrastructure (e.g., AWS, Google Cloud, Azure), containerization (Docker), and orchestration tools (Kubernetes).', ko: '클라우드 인프라(예: AWS, Google Cloud, Azure), 컨테이너화(Docker) 및 오케스트레이션 도구(Kubernetes)에 대한 경험' }, weight: 4, active: false },
    { level: 'Advanced', description: { en: 'Understanding of caching strategies, load balancing, and scaling backend systems to handle high traffic.', ko: '캐싱 전략, 로드 밸런싱 및 높은 트래픽을 처리하기 위한 백엔드 시스템 확장에 대한 이해' }, weight: 4, active: false },
    { level: 'Advanced', description: { en: 'Designing and deploying a microservices-based architecture with services that communicate asynchronously.', ko: '비동기적으로 통신하는 서비스를 사용하여 마이크로서비스 기반 아키텍처 설계 및 배포' }, weight: 4, active: false },
    { level: 'Advanced', description: { en: 'Setting up continuous integration/continuous deployment (CI/CD) pipelines for automated testing and deployment.', ko: '자동화된 테스트 및 배포를 위한 지속적 통합/지속적 배포(CI/CD) 파이프라인 설정' }, weight: 4, active: false },
    { level: 'Advanced', description: { en: 'Implementing caching strategies (e.g., Redis, Memcached) to optimize API performance.', ko: 'API 성능을 최적화하기 위한 캐싱 전략(예: Redis, Memcached) 구현' }, weight: 4, active: false },
    { level: 'Expert', description: { en: 'Mastery of distributed systems, including managing data consistency, eventual consistency, and CAP theorem implications.', ko: '데이터 일관성, 최종 일관성 및 CAP 정리의 의미를 관리하는 것을 포함한 분산 시스템 숙달' }, weight: 8, active: false },
    { level: 'Expert', description: { en: 'Expertise in backend architecture patterns (e.g., event-driven architecture, CQRS, serverless) for complex and high-traffic systems.', ko: '복잡하고 트래픽이 많은 시스템을 위한 백엔드 아키텍처 패턴(예: 이벤트 중심 아키텍처, CQRS, 서버리스)에 대한 전문 지식' }, weight: 8, active: false },
    { level: 'Expert', description: { en: 'Deep knowledge of security best practices, including encryption, secure communication, and data protection in large-scale applications.', ko: '대규모 애플리케이션에서 암호화, 보안 통신 및 데이터 보호를 포함한 보안 모범 사례에 대한 깊은 지식' }, weight: 8, active: false },
    { level: 'Expert', description: { en: 'Extensive experience with database replication, sharding, and high availability setups.', ko: '데이터베이스 복제, 샤딩 및 고가용성 설정에 대한 광범위한 경험' }, weight: 8, active: false },
    { level: 'Expert', description: { en: 'Ability to lead backend development teams, perform code reviews, and ensure code quality standards.', ko: '백엔드 개발 팀을 이끌고 코드 검토를 수행하며 코드 품질 표준을 보장하는 능력' }, weight: 8, active: false },
    { level: 'Expert', description: { en: 'Familiarity with DevOps tools and practices, including Infrastructure as Code (IaC) and full automation of deployment pipelines.', ko: 'Infrastructure as Code(IaC) 및 배포 파이프라인의 완전 자동화를 포함한 DevOps 도구 및 관행에 대한 친숙함' }, weight: 8, active: false },
    { level: 'Expert', description: { en: 'Architecting large-scale distributed systems with fault-tolerant and highly available components.', ko: '내결함성과 고가용성 구성 요소를 갖춘 대규모 분산 시스템 설계' }, weight: 8, active: false },
    { level: 'Expert', description: { en: 'Implementing advanced security mechanisms like end-to-end encryption and secure API gateways.', ko: '종단 간 암호화 및 보안 API 게이트웨이와 같은 고급 보안 메커니즘 구현' }, weight: 8, active: false },
    { level: 'Expert', description: { en: 'Leading a backend development team, defining project architecture, and overseeing codebase and deployment strategies.', ko: '백엔드 개발 팀을 이끌고 프로젝트 아키텍처를 정의하며 코드베이스 및 배포 전략을 감독' }, weight: 8, active: false }
  ];

  const frontendSkills = [
    { level: 'Beginner', description: { en: 'Knowledge of common HTML elements', ko: '일반적인 HTML 요소에 대한 지식' }, weight: 1, active: false },
    { level: 'Beginner', description: { en: 'Knowledge of common CSS selectors - how to set background colours and borders', ko: '일반적인 CSS 선택자에 대한 지식 - 배경색 및 테두리 설정 방법' }, weight: 1, active: false },
    { level: 'Beginner', description: { en: 'Knowledge of flex positioning', ko: 'Flex 포지셔닝에 대한 지식' }, weight: 1, active: false },
    { level: 'Beginner', description: { en: 'Knowledge of Javascript DOM access', ko: 'Javascript DOM 접근에 대한 지식' }, weight: 1, active: false },
    { level: 'Beginner', description: { en: 'Knowledge of Javascript programming - how to use arrays and array methods, and how to use objects and object methods', ko: 'Javascript 프로그래밍 지식 - 배열 및 배열 메서드 사용 방법, 객체 및 객체 메서드 사용 방법' }, weight: 1, active: false },
    { level: 'Beginner', description: { en: 'How to use fetch API, and structure HTTP requests', ko: 'Fetch API 사용 방법 및 HTTP 요청 구조화' }, weight: 1, active: false },
    { level: 'Beginner', description: { en: 'Basic usage of React / Vue / etc - using state, creating components and hooks', ko: 'React / Vue 등의 기본 사용법 - 상태 사용, 컴포넌트 및 훅 생성' }, weight: 1, active: false },
    { level: 'Intermediate', description: { en: 'Using TypeScript', ko: 'TypeScript 사용' }, weight: 2, active: false },
    { level: 'Intermediate', description: { en: 'Understanding React component structure such as smart vs dumb components', ko: '스마트 컴포넌트와 덤 컴포넌트와 같은 React 컴포넌트 구조 이해' }, weight: 2, active: false },
    { level: 'Intermediate', description: { en: 'Familiarity with Next.js', ko: 'Next.js에 대한 친숙함' }, weight: 2, active: false },
    { level: 'Intermediate', description: { en: 'Usage of React/Tanstack Query', ko: 'React/Tanstack Query 사용' }, weight: 2, active: false },
    { level: 'Intermediate', description: { en: 'Usage of global state', ko: '전역 상태 사용' }, weight: 2, active: false },
    { level: 'Intermediate', description: { en: 'Knowledge of responsive CSS rules', ko: '반응형 CSS 규칙에 대한 지식' }, weight: 2, active: false },
    { level: 'Intermediate', description: { en: 'Proficiency with JavaScript fundamental data structures and methods', ko: 'JavaScript 기본 데이터 구조 및 메서드에 대한 숙련도' }, weight: 2, active: false },
    { level: 'Intermediate', description: { en: 'JS modules and their structure - importing, different kinds of exports, and their use cases', ko: 'JS 모듈 및 구조 - 가져오기, 다양한 종류의 내보내기 및 사용 사례' }, weight: 2, active: false },
    { level: 'Intermediate', description: { en: 'Building your app and getting it to run on a server', ko: '앱을 빌드하고 서버에서 실행하기' }, weight: 2, active: false },
    { level: 'Advanced', description: { en: 'Understanding contextual usage of global state vs local state', ko: '전역 상태 대 로컬 상태의 상황별 사용 이해' }, weight: 4, active: false },
    { level: 'Advanced', description: { en: 'Familiarity with Chrome web app profiling (lighthouse?)', ko: 'Chrome 웹 앱 프로파일링(Lighthouse)에 대한 친숙함' }, weight: 4, active: false },
    { level: 'Advanced', description: { en: 'Strong competence with Next.js SSR/SSG features', ko: 'Next.js SSR/SSG 기능에 대한 강력한 역량' }, weight: 4, active: false },
    { level: 'Advanced', description: { en: 'Competence with HTTP requests and making requests efficiently - batching, splitting requests, minimising refetches', ko: 'HTTP 요청 및 효율적인 요청 작성 역량 - 배칭, 요청 분할, 재요청 최소화' }, weight: 4, active: false },
    { level: 'Advanced', description: { en: 'Creating NPM libraries, including NPM library project structure, and registering project to NPM', ko: 'NPM 라이브러리 프로젝트 구조를 포함한 NPM 라이브러리 생성 및 NPM에 프로젝트 등록' }, weight: 4, active: false },
    { level: 'Advanced', description: { en: 'Lazy loading of code and pages', ko: '코드 및 페이지의 지연 로딩' }, weight: 4, active: false },
    { level: 'Expert', description: { en: 'Understanding React rendering flow and placement of state and data fetching', ko: 'React 렌더링 흐름 및 상태와 데이터 가져오기 배치 이해' }, weight: 8, active: false },
    { level: 'Expert', description: { en: 'Understanding techniques to minimise excess rerenders', ko: '과도한 리렌더링을 최소화하는 기술 이해' }, weight: 8, active: false },
    { level: 'Expert', description: { en: 'Competence in using memory profiling and React Dev Tools to inspect and improve app performance', ko: '메모리 프로파일링 및 React Dev Tools를 사용하여 앱 성능을 검사하고 개선하는 역량' }, weight: 8, active: false }
  ];

  const dataScienceSkills = [
    { level: 'Beginner', description: { en: 'Basic understanding of statistics and data analysis.', ko: '통계 및 데이터 분석에 대한 기본 이해' }, weight: 1, active: false },
    { level: 'Beginner', description: { en: 'Familiarity with spreadsheets or basic data manipulation tools (e.g., Excel).', ko: '스프레드시트 또는 기본 데이터 조작 도구(예: Excel)에 대한 친숙함' }, weight: 1, active: false },
    { level: 'Beginner', description: { en: 'Ability to use simple data visualization tools (e.g., Excel, Google Sheets, or Python\'s matplotlib and seaborn).', ko: '간단한 데이터 시각화 도구(예: Excel, Google Sheets 또는 Python의 matplotlib 및 seaborn) 사용 능력' }, weight: 1, active: false },
    { level: 'Beginner', description: { en: 'Introductory knowledge of programming (Python or R) and basic libraries (e.g., Pandas, NumPy).', ko: '프로그래밍(Python 또는 R) 및 기본 라이브러리(예: Pandas, NumPy)에 대한 입문 지식' }, weight: 1, active: false },
    { level: 'Beginner', description: { en: 'Basic knowledge of data types (structured, semi-structured, and unstructured data).', ko: '데이터 유형(구조화, 반구조화 및 비구조화 데이터)에 대한 기본 지식' }, weight: 1, active: false },
    { level: 'Beginner', description: { en: 'Plotting simple graphs (bar charts, line graphs) to visualize data.', ko: '데이터를 시각화하기 위한 간단한 그래프(막대 차트, 선 그래프) 그리기' }, weight: 1, active: false },
    { level: 'Beginner', description: { en: 'Calculating mean, median, mode, variance, and other basic statistical metrics.', ko: '평균, 중앙값, 최빈값, 분산 및 기타 기본 통계 지표 계산' }, weight: 1, active: false },
    { level: 'Beginner', description: { en: 'Loading and cleaning small datasets.', ko: '작은 데이터 세트 로드 및 정리' }, weight: 1, active: false },
    { level: 'Beginner', description: { en: 'Basic ability to automate repetitive data related tasks with simple scripts in Python or R.', ko: 'Python 또는 R의 간단한 스크립트로 반복적인 데이터 관련 작업을 자동화하는 기본 능력' }, weight: 1, active: false },
    { level: 'Intermediate', description: { en: 'Proficient in data wrangling: loading, cleaning, and transforming data using libraries like Pandas, NumPy, or R\'s dplyr.', ko: '데이터 랭글링에 능숙함: Pandas, NumPy 또는 R의 dplyr과 같은 라이브러리를 사용하여 데이터 로드, 정리 및 변환' }, weight: 2, active: false },
    { level: 'Intermediate', description: { en: 'Good understanding of probability, statistical testing (e.g., hypothesis testing, confidence intervals), and distributions.', ko: '확률, 통계 테스트(예: 가설 검정, 신뢰 구간) 및 분포에 대한 양호한 이해' }, weight: 2, active: false },
    { level: 'Intermediate', description: { en: 'Basic knowledge of machine learning algorithms (e.g., linear regression, decision trees) and their applications.', ko: '머신러닝 알고리즘(예: 선형 회귀, 의사결정 트리) 및 응용 프로그램에 대한 기본 지식' }, weight: 2, active: false },
    { level: 'Intermediate', description: { en: 'Experience with data visualization libraries (e.g., matplotlib, seaborn, or ggplot2).', ko: '데이터 시각화 라이브러리(예: matplotlib, seaborn 또는 ggplot2)에 대한 경험' }, weight: 2, active: false },
    { level: 'Intermediate', description: { en: 'Ability to perform exploratory data analysis (EDA) and extract insights from datasets.', ko: '탐색적 데이터 분석(EDA)을 수행하고 데이터 세트에서 인사이트를 추출하는 능력' }, weight: 2, active: false },
    { level: 'Intermediate', description: { en: 'Familiarity with supervised and unsupervised learning concepts.', ko: '지도 학습 및 비지도 학습 개념에 대한 친숙함' }, weight: 2, active: false },
    { level: 'Intermediate', description: { en: 'Cleaning and transforming large datasets using Pandas or NumPy.', ko: 'Pandas 또는 NumPy를 사용하여 대규모 데이터 세트 정리 및 변환' }, weight: 2, active: false },
    { level: 'Intermediate', description: { en: 'Implementing and evaluating simple machine learning models like linear regression or K-means clustering.', ko: '선형 회귀 또는 K-평균 클러스터링과 같은 간단한 머신러닝 모델 구현 및 평가' }, weight: 2, active: false },
    { level: 'Intermediate', description: { en: 'Performing A/B testing or statistical analysis on datasets.', ko: '데이터 세트에 대한 A/B 테스트 또는 통계 분석 수행' }, weight: 2, active: false },
    { level: 'Advanced', description: { en: 'Proficient in implementing complex machine learning algorithms (e.g., random forests, gradient boosting, neural networks) using libraries like scikit-learn, TensorFlow, or PyTorch.', ko: 'scikit-learn, TensorFlow 또는 PyTorch와 같은 라이브러리를 사용하여 복잡한 머신러닝 알고리즘(예: 랜덤 포레스트, 그래디언트 부스팅, 신경망) 구현에 능숙함' }, weight: 4, active: false },
    { level: 'Advanced', description: { en: 'Strong understanding of feature engineering, hyperparameter tuning, model evaluation, and optimization techniques.', ko: '피처 엔지니어링, 하이퍼파라미터 튜닝, 모델 평가 및 최적화 기술에 대한 강력한 이해' }, weight: 4, active: false },
    { level: 'Advanced', description: { en: 'Experience working with large-scale datasets and using cloud platforms for data storage and computation (e.g., AWS, GCP, Azure).', ko: '대규모 데이터 세트 작업 및 데이터 저장 및 계산을 위한 클라우드 플랫폼(예: AWS, GCP, Azure) 사용 경험' }, weight: 4, active: false },
    { level: 'Advanced', description: { en: 'Familiarity with big data tools and frameworks (e.g., Hadoop, Spark).', ko: '빅데이터 도구 및 프레임워크(예: Hadoop, Spark)에 대한 친숙함' }, weight: 4, active: false },
    { level: 'Advanced', description: { en: 'Ability to work with databases (SQL) and unstructured data (e.g., text data with NLP).', ko: '데이터베이스(SQL) 및 비구조화 데이터(예: NLP를 사용한 텍스트 데이터) 작업 능력' }, weight: 4, active: false },
    { level: 'Advanced', description: { en: 'Knowledge of deep learning and more advanced topics like natural language processing (NLP), reinforcement learning, or computer vision.', ko: '딥러닝 및 자연어 처리(NLP), 강화 학습 또는 컴퓨터 비전과 같은 고급 주제에 대한 지식' }, weight: 4, active: false },
    { level: 'Advanced', description: { en: 'Building and fine-tuning machine learning models for production.', ko: '프로덕션용 머신러닝 모델 구축 및 미세 조정' }, weight: 4, active: false },
    { level: 'Advanced', description: { en: 'Creating predictive models using time series analysis or deep learning methods.', ko: '시계열 분석 또는 딥러닝 방법을 사용하여 예측 모델 생성' }, weight: 4, active: false },
    { level: 'Advanced', description: { en: 'Implementing machine learning pipelines for automated model training and deployment.', ko: '자동화된 모델 학습 및 배포를 위한 머신러닝 파이프라인 구현' }, weight: 4, active: false },
    { level: 'Expert', description: { en: 'Mastery of complex algorithms and advanced techniques, such as deep learning architectures (e.g., CNNs, RNNs, Transformers) or reinforcement learning.', ko: '딥러닝 아키텍처(예: CNN, RNN, Transformer) 또는 강화 학습과 같은 복잡한 알고리즘 및 고급 기술 숙달' }, weight: 8, active: false },
    { level: 'Expert', description: { en: 'Deep understanding of data science workflows, MLOps (machine learning operations), and the deployment of machine learning models in production environments.', ko: '데이터 사이언스 워크플로우, MLOps(머신러닝 운영) 및 프로덕션 환경에서 머신러닝 모델 배포에 대한 깊은 이해' }, weight: 8, active: false },
    { level: 'Expert', description: { en: 'Expertise in using cloud platforms, distributed computing, and handling real-time data streams.', ko: '클라우드 플랫폼, 분산 컴퓨팅 및 실시간 데이터 스트림 처리 사용에 대한 전문 지식' }, weight: 8, active: false },
    { level: 'Expert', description: { en: 'Strong ability to create custom machine learning models, handle imbalanced data, and apply transfer learning.', ko: '맞춤형 머신러닝 모델 생성, 불균형 데이터 처리 및 전이 학습 적용에 대한 강력한 능력' }, weight: 8, active: false },
    { level: 'Expert', description: { en: 'Leadership experience in designing large-scale data science projects, mentoring teams, and making data-driven business decisions.', ko: '대규모 데이터 사이언스 프로젝트 설계, 팀 멘토링 및 데이터 기반 비즈니스 의사결정에 대한 리더십 경험' }, weight: 8, active: false },
    { level: 'Expert', description: { en: 'Designing and implementing custom deep learning architectures for complex problems (e.g., image recognition, natural language understanding).', ko: '복잡한 문제(예: 이미지 인식, 자연어 이해)를 위한 맞춤형 딥러닝 아키텍처 설계 및 구현' }, weight: 8, active: false },
    { level: 'Expert', description: { en: 'Leading a team of data scientists in building scalable and efficient data pipelines.', ko: '확장 가능하고 효율적인 데이터 파이프라인 구축에서 데이터 사이언티스트 팀을 이끄는 리더십' }, weight: 8, active: false },
    { level: 'Expert', description: { en: 'Managing and deploying machine learning models at scale for real-time or high-impact applications.', ko: '실시간 또는 영향력이 큰 애플리케이션을 위해 대규모로 머신러닝 모델 관리 및 배포' }, weight: 8, active: false },
    { level: 'Expert', description: { en: 'Developing and deploying end-to-end AI systems and integrating them with business operations.', ko: '엔드투엔드 AI 시스템 개발 및 배포, 비즈니스 운영과 통합' }, weight: 8, active: false },
  ];

  const pythonSkills = [
    { level: "Beginner", description: { en: "Basic understanding of Python syntax and data structures (lists, tuples, dictionaries, sets).", ko: "Python 구문 및 데이터 구조(리스트, 튜플, 딕셔너리, 세트)에 대한 기본 이해" }, weight: 1, active: false },
    { level: "Beginner", description: { en: "Ability to write simple programs using variables, loops, conditionals, and functions.", ko: "변수, 루프, 조건문 및 함수를 사용하여 간단한 프로그램을 작성하는 능력" }, weight: 1, active: false },
    { level: "Beginner", description: { en: "Understanding basic concepts like input/output, string manipulation, and basic error handling.", ko: "입출력, 문자열 조작 및 기본 오류 처리와 같은 기본 개념 이해" }, weight: 1, active: false },
    { level: "Beginner", description: { en: "Able to import built-in Python modules (e.g., math, os, random) and third-party libraries, using functions from imported modules.", ko: "내장 Python 모듈(예: math, os, random) 및 타사 라이브러리를 가져오고 가져온 모듈의 함수를 사용하는 능력" }, weight: 1, active: false },
    { level: "Beginner", description: { en: "Writing a program to print Fibonacci numbers.", ko: "피보나치 수를 출력하는 프로그램 작성" }, weight: 1, active: false },
    { level: "Beginner", description: { en: "Using loops to iterate over data structures.", ko: "루프를 사용하여 데이터 구조 반복" }, weight: 1, active: false },
    { level: "Beginner", description: { en: "Able to create lists using compact syntax for mapping and filtering operations.", ko: "매핑 및 필터링 작업을 위한 간결한 구문을 사용하여 리스트 생성 능력" }, weight: 1, active: false },
    { level: "Beginner", description: { en: "Ability to open, read, write, and close files, including working with text files and handling exceptions related to file operations.", ko: "파일 열기, 읽기, 쓰기 및 닫기 능력, 텍스트 파일 작업 및 파일 작업 관련 예외 처리 포함" }, weight: 1, active: false },
    { level: "Beginner", description: { en: "Understanding slicing in lists and strings, ability to use slice notation to extract portions of lists, tuples, and strings efficiently.", ko: "리스트 및 문자열의 슬라이싱 이해, 슬라이스 표기법을 사용하여 리스트, 튜플 및 문자열의 일부를 효율적으로 추출하는 능력" }, weight: 1, active: false },
    { level: "Intermediate", description: { en: "Deeper understanding of data structures and algorithms.", ko: "데이터 구조 및 알고리즘에 대한 깊은 이해" }, weight: 2, active: false },
    { level: "Intermediate", description: { en: "Familiarity with object-oriented programming (OOP) principles: classes, inheritance, polymorphism, encapsulation.", ko: "객체 지향 프로그래밍(OOP) 원칙에 대한 친숙함: 클래스, 상속, 다형성, 캡슐화" }, weight: 2, active: false },
    { level: "Intermediate", description: { en: "Ability to use third-party libraries and frameworks (e.g., Pandas, NumPy, Flask).", ko: "타사 라이브러리 및 프레임워크(예: Pandas, NumPy, Flask) 사용 능력" }, weight: 2, active: false },
    { level: "Intermediate", description: { en: "Understanding of error handling using exceptions.", ko: "예외를 사용한 오류 처리에 대한 이해" }, weight: 2, active: false },
    { level: "Intermediate", description: { en: "Familiarity with modules, packages, and Python's standard library.", ko: "모듈, 패키지 및 Python 표준 라이브러리에 대한 친숙함" }, weight: 2, active: false },
    { level: "Intermediate", description: { en: "Writing a web scraper using libraries like BeautifulSoup or Scrapy.", ko: "BeautifulSoup 또는 Scrapy와 같은 라이브러리를 사용하여 웹 스크래퍼 작성" }, weight: 2, active: false },
    { level: "Intermediate", description: { en: "Creating a simple web application using Flask or Django.", ko: "Flask 또는 Django를 사용하여 간단한 웹 애플리케이션 생성" }, weight: 2, active: false },
    { level: "Intermediate", description: { en: "Data manipulation and analysis using Pandas and NumPy.", ko: "Pandas 및 NumPy를 사용한 데이터 조작 및 분석" }, weight: 2, active: false },
    { level: "Intermediate", description: { en: "Implementing algorithms like sorting or searching.", ko: "정렬 또는 검색과 같은 알고리즘 구현" }, weight: 2, active: false },
    { level: "Advanced", description: { en: "Proficient in working with complex data structures (e.g., generators, iterators).", ko: "복잡한 데이터 구조(예: 제너레이터, 반복자) 작업에 능숙함" }, weight: 4, active: false },
    { level: "Advanced", description: { en: "Expert in OOP, design patterns, and advanced Python concepts (e.g., decorators, context managers).", ko: "OOP, 디자인 패턴 및 고급 Python 개념(예: 데코레이터, 컨텍스트 매니저)에 대한 전문 지식" }, weight: 4, active: false },
    { level: "Advanced", description: { en: "Proficiency in performance optimization (e.g., time complexity, memory usage).", ko: "성능 최적화(예: 시간 복잡도, 메모리 사용량)에 대한 숙련도" }, weight: 4, active: false },
    { level: "Advanced", description: { en: "Understanding concurrency and parallelism (using threading, multiprocessing, async/await).", ko: "동시성 및 병렬성 이해(스레딩, 멀티프로세싱, async/await 사용)" }, weight: 4, active: false },
    { level: "Advanced", description: { en: "Experience with debugging, testing (unit tests, integration tests), and version control (e.g., Git).", ko: "디버깅, 테스트(단위 테스트, 통합 테스트) 및 버전 관리(예: Git)에 대한 경험" }, weight: 4, active: false },
    { level: "Advanced", description: { en: "Developing a large-scale application with efficient data handling.", ko: "효율적인 데이터 처리를 갖춘 대규모 애플리케이션 개발" }, weight: 4, active: false },
    { level: "Advanced", description: { en: "Building and maintaining APIs with complex architectures.", ko: "복잡한 아키텍처를 갖춘 API 구축 및 유지 관리" }, weight: 4, active: false },
    { level: "Advanced", description: { en: "Writing unit tests and utilizing continuous integration (CI/CD).", ko: "단위 테스트 작성 및 지속적 통합(CI/CD) 활용" }, weight: 4, active: false },
    { level: "Advanced", description: { en: "Implementing machine learning models with libraries like TensorFlow or PyTorch.", ko: "TensorFlow 또는 PyTorch와 같은 라이브러리로 머신러닝 모델 구현" }, weight: 4, active: false },
    { level: "Expert", description: { en: "Mastery of Python internals, such as memory management, garbage collection, and bytecode.", ko: "메모리 관리, 가비지 컬렉션 및 바이트코드와 같은 Python 내부 숙달" }, weight: 8, active: false },
    { level: "Expert", description: { en: "Ability to contribute to Python core development or design custom libraries and tools.", ko: "Python 핵심 개발에 기여하거나 맞춤형 라이브러리 및 도구를 설계하는 능력" }, weight: 8, active: false },
    { level: "Expert", description: { en: "Deep understanding of multithreading, asynchronous programming, and distributed systems.", ko: "멀티스레딩, 비동기 프로그래밍 및 분산 시스템에 대한 깊은 이해" }, weight: 8, active: false },
    { level: "Expert", description: { en: "Familiarity with low-level programming concepts (e.g., interfacing Python with C/C++).", ko: "저수준 프로그래밍 개념(예: Python과 C/C++ 인터페이싱)에 대한 친숙함" }, weight: 8, active: false },
    { level: "Expert", description: { en: "Knowledge of various domains such as web development, machine learning, automation, data science, and scripting.", ko: "웹 개발, 머신러닝, 자동화, 데이터 사이언스 및 스크립팅과 같은 다양한 도메인에 대한 지식" }, weight: 8, active: false },
    { level: "Expert", description: { en: "Designing complex, scalable systems and APIs for production.", ko: "프로덕션을 위한 복잡하고 확장 가능한 시스템 및 API 설계" }, weight: 8, active: false },
    { level: "Expert", description: { en: "Implementing and optimizing large-scale machine learning pipelines.", ko: "대규모 머신러닝 파이프라인 구현 및 최적화" }, weight: 8, active: false },
    { level: "Expert", description: { en: "Contributing to open-source Python projects or writing custom Python extensions.", ko: "오픈소스 Python 프로젝트에 기여하거나 맞춤형 Python 확장 작성" }, weight: 8, active: false },
    { level: "Expert", description: { en: "Identify bottlenecks, profile code, and implement optimizations using tools like cProfile, timeit, and optimizing with techniques such as just-in-time compilation (e.g., using Numba or Cython).", ko: "병목 현상 식별, 코드 프로파일링 및 cProfile, timeit과 같은 도구를 사용한 최적화 구현, JIT 컴파일(예: Numba 또는 Cython 사용)과 같은 기술로 최적화" }, weight: 8, active: false },
  ];

  const sqlSkills = [
    { level: "Beginner", description: { en: "Understanding basic SQL syntax and queries.", ko: "기본 SQL 구문 및 쿼리 이해" }, weight: 1, active: false },
    { level: "Beginner", description: { en: "Ability to create simple queries to retrieve data using SELECT, WHERE, and ORDER BY clauses.", ko: "SELECT, WHERE 및 ORDER BY 절을 사용하여 데이터를 검색하는 간단한 쿼리 작성 능력" }, weight: 1, active: false },
    { level: "Beginner", description: { en: "Familiarity with basic data operations like INSERT, UPDATE, and DELETE.", ko: "INSERT, UPDATE 및 DELETE와 같은 기본 데이터 작업에 대한 친숙함" }, weight: 1, active: false },
    { level: "Beginner", description: { en: "Basic knowledge of filtering data with operators like =, >, <, LIKE, and IN.", ko: "=, >, <, LIKE 및 IN과 같은 연산자를 사용한 데이터 필터링에 대한 기본 지식" }, weight: 1, active: false },
    { level: "Beginner", description: { en: "Writing a query to select data from a table based on specific conditions.", ko: "특정 조건에 따라 테이블에서 데이터를 선택하는 쿼리 작성" }, weight: 1, active: false },
    { level: "Beginner", description: { en: "Sorting and filtering results using ORDER BY and WHERE.", ko: "ORDER BY 및 WHERE를 사용하여 결과 정렬 및 필터링" }, weight: 1, active: false },
    { level: "Beginner", description: { en: "Inserting new rows into a table.", ko: "테이블에 새 행 삽입" }, weight: 1, active: false },
    { level: "Beginner", description: { en: "Familiarity with one of common SQL connection libraries (e.g., psycopg2, SQLAlchemy, JDBC, mysql).", ko: "일반적인 SQL 연결 라이브러리(예: psycopg2, SQLAlchemy, JDBC, mysql) 중 하나에 대한 친숙함" }, weight: 1, active: false },
    { level: "Beginner", description: { en: "Basic ability to automate repetitive data related tasks with simple scripts in Python or R.", ko: "Python 또는 R의 간단한 스크립트로 반복적인 데이터 관련 작업을 자동화하는 기본 능력" }, weight: 1, active: false },
    { level: "Intermediate", description: { en: "Proficiency with JOIN operations (INNER, LEFT, RIGHT, FULL OUTER) to combine data from multiple tables.", ko: "여러 테이블의 데이터를 결합하기 위한 JOIN 작업(INNER, LEFT, RIGHT, FULL OUTER)에 대한 숙련도" }, weight: 2, active: false },
    { level: "Intermediate", description: { en: "Ability to group and aggregate data using GROUP BY and aggregate functions (COUNT, SUM, AVG, MAX, MIN).", ko: "GROUP BY 및 집계 함수(COUNT, SUM, AVG, MAX, MIN)를 사용하여 데이터를 그룹화하고 집계하는 능력" }, weight: 2, active: false },
    { level: "Intermediate", description: { en: "Understanding of subqueries and nested queries.", ko: "서브쿼리 및 중첩 쿼리에 대한 이해" }, weight: 2, active: false },
    { level: "Intermediate", description: { en: "Knowledge of database constraints (e.g., primary keys, foreign keys, unique constraints) and indexes.", ko: "데이터베이스 제약 조건(예: 기본 키, 외래 키, 고유 제약 조건) 및 인덱스에 대한 지식" }, weight: 2, active: false },
    { level: "Intermediate", description: { en: "Experience with database normalization and designing relational database schemas.", ko: "데이터베이스 정규화 및 관계형 데이터베이스 스키마 설계 경험" }, weight: 2, active: false },
    { level: "Intermediate", description: { en: "Joining multiple tables to retrieve related data.", ko: "관련 데이터를 검색하기 위해 여러 테이블 조인" }, weight: 2, active: false },
    { level: "Intermediate", description: { en: "Writing queries to summarize data using group functions like COUNT or SUM.", ko: "COUNT 또는 SUM과 같은 그룹 함수를 사용하여 데이터를 요약하는 쿼리 작성" }, weight: 2, active: false },
    { level: "Intermediate", description: { en: "Creating database tables and defining relationships between them.", ko: "데이터베이스 테이블 생성 및 관계 정의" }, weight: 2, active: false },
    { level: "Intermediate", description: { en: "Can use SSMS, DataGrip and DBeaver to interact with databases, execute queries, and manage database objects. Familiar with their user interfaces, including how to connect to a database, navigate schemas, and run SQL scripts.", ko: "SSMS, DataGrip 및 DBeaver를 사용하여 데이터베이스와 상호 작용하고 쿼리를 실행하며 데이터베이스 객체를 관리할 수 있음. 데이터베이스 연결, 스키마 탐색 및 SQL 스크립트 실행 방법을 포함한 사용자 인터페이스에 익숙함" }, weight: 2, active: false },
    { level: "Advanced", description: { en: "Advanced query optimization techniques to improve query performance (e.g., indexing, query plans).", ko: "쿼리 성능을 향상시키기 위한 고급 쿼리 최적화 기술(예: 인덱싱, 쿼리 계획)" }, weight: 4, active: false },
    { level: "Advanced", description: { en: "Ability to write complex stored procedures, functions, and triggers.", ko: "복잡한 저장 프로시저, 함수 및 트리거 작성 능력" }, weight: 4, active: false },
    { level: "Advanced", description: { en: "Proficiency in advanced SQL features like WITH (CTE, Common Table Expressions) and window functions (e.g., ROW_NUMBER(), RANK()).", ko: "WITH(CTE, 공통 테이블 표현식) 및 윈도우 함수(예: ROW_NUMBER(), RANK())와 같은 고급 SQL 기능에 대한 숙련도" }, weight: 4, active: false },
    { level: "Advanced", description: { en: "Knowledge of database transactions, ACID properties, and handling concurrency and isolation levels.", ko: "데이터베이스 트랜잭션, ACID 속성 및 동시성 및 격리 수준 처리에 대한 지식" }, weight: 4, active: false },
    { level: "Advanced", description: { en: "Proficient in database security, user roles, and permissions management.", ko: "데이터베이스 보안, 사용자 역할 및 권한 관리에 능숙함" }, weight: 4, active: false },
    { level: "Advanced", description: { en: "Ability to design normalized database schemas, ensuring data integrity and optimizing for scalability and performance.", ko: "정규화된 데이터베이스 스키마를 설계하고 데이터 무결성을 보장하며 확장성과 성능을 최적화하는 능력" }, weight: 4, active: false },
    { level: "Advanced", description: { en: "Optimizing slow queries by analyzing query plans and using appropriate indexing.", ko: "쿼리 계획 분석 및 적절한 인덱싱을 사용하여 느린 쿼리 최적화" }, weight: 4, active: false },
    { level: "Advanced", description: { en: "Implementing transaction-safe SQL queries and managing concurrency.", ko: "트랜잭션 안전 SQL 쿼리 구현 및 동시성 관리" }, weight: 4, active: false },
    { level: "Advanced", description: { en: "Proficiency in designing and optimizing extract, transform, load (ETL) processes, and managing data in data warehouses.", ko: "ETL(추출, 변환, 로드) 프로세스 설계 및 최적화, 데이터 웨어하우스의 데이터 관리에 대한 숙련도" }, weight: 4, active: false },
    { level: "Expert", description: { en: "Deep understanding of database architecture and internals (e.g., how indexes work, locking mechanisms, execution plans).", ko: "데이터베이스 아키텍처 및 내부(예: 인덱스 작동 방식, 잠금 메커니즘, 실행 계획)에 대한 깊은 이해" }, weight: 8, active: false },
    { level: "Expert", description: { en: "Proficiency in advanced optimization techniques and tuning complex queries for performance.", ko: "고급 최적화 기술 및 성능을 위한 복잡한 쿼리 튜닝에 대한 숙련도" }, weight: 8, active: false },
    { level: "Expert", description: { en: "Ability to manage and configure database replication, backup, recovery, and high availability setups.", ko: "데이터베이스 복제, 백업, 복구 및 고가용성 설정을 관리하고 구성하는 능력" }, weight: 8, active: false },
    { level: "Expert", description: { en: "Designing and implementing highly scalable database architectures for enterprise applications.", ko: "엔터프라이즈 애플리케이션을 위한 고도로 확장 가능한 데이터베이스 아키텍처 설계 및 구현" }, weight: 8, active: false },
    { level: "Expert", description: { en: "Performing complex query optimization and database tuning for high-performance systems.", ko: "고성능 시스템을 위한 복잡한 쿼리 최적화 및 데이터베이스 튜닝 수행" }, weight: 8, active: false },
    { level: "Expert", description: { en: "Configuring and maintaining database clusters and replication systems.", ko: "데이터베이스 클러스터 및 복제 시스템 구성 및 유지 관리" }, weight: 8, active: false },
    { level: "Expert", description: { en: "Expertise in handling large-scale databases: Ability to manage, optimize, and maintain large databases with billions of rows, ensuring performance and reliability.", ko: "대규모 데이터베이스 처리 전문 지식: 수십억 개의 행이 있는 대규모 데이터베이스를 관리, 최적화 및 유지 관리하여 성능과 안정성을 보장하는 능력" }, weight: 8, active: false },
    { level: "Expert", description: { en: "Proficiency in NoSQL databases: Deep understanding of non-relational databases (e.g., MongoDB, Cassandra), and when to use them for different use cases compared to traditional SQL databases.", ko: "NoSQL 데이터베이스에 대한 숙련도: 비관계형 데이터베이스(예: MongoDB, Cassandra)에 대한 깊은 이해 및 기존 SQL 데이터베이스와 비교하여 다양한 사용 사례에 사용할 시기" }, weight: 8, active: false },
  ];

  const llmSkills = [
    { level: "Beginner", description: { en: "Basic understanding of LLMs, their capabilities, and common use cases (e.g., ChatGPT, Claude, GPT-4).", ko: "LLM, 기능 및 일반적인 사용 사례(예: ChatGPT, Claude, GPT-4)에 대한 기본 이해" }, weight: 1, active: false },
    { level: "Beginner", description: { en: "Ability to write effective prompts to get desired outputs from LLMs.", ko: "LLM에서 원하는 출력을 얻기 위한 효과적인 프롬프트 작성 능력" }, weight: 1, active: false },
    { level: "Beginner", description: { en: "Familiarity with API-based LLM services (OpenAI API, Anthropic API, etc.).", ko: "API 기반 LLM 서비스(OpenAI API, Anthropic API 등)에 대한 친숙함" }, weight: 1, active: false },
    { level: "Beginner", description: { en: "Understanding of tokens, context windows, and basic API parameters (temperature, max_tokens).", ko: "토큰, 컨텍스트 윈도우 및 기본 API 매개변수(temperature, max_tokens)에 대한 이해" }, weight: 1, active: false },
    { level: "Beginner", description: { en: "Basic knowledge of different LLM models and their strengths (GPT-4, Claude, Gemini, Llama).", ko: "다양한 LLM 모델과 강점(GPT-4, Claude, Gemini, Llama)에 대한 기본 지식" }, weight: 1, active: false },
    { level: "Beginner", description: { en: "Understanding cost considerations when using LLM APIs (token pricing, request limits).", ko: "LLM API 사용 시 비용 고려 사항(토큰 가격, 요청 제한) 이해" }, weight: 1, active: false },
    { level: "Beginner", description: { en: "Awareness of ethical considerations and limitations of LLMs (hallucinations, biases).", ko: "LLM의 윤리적 고려 사항 및 한계(환각, 편향)에 대한 인식" }, weight: 1, active: false },
    { level: "Beginner", description: { en: "Ability to test and iterate on prompts to improve output quality.", ko: "출력 품질을 개선하기 위해 프롬프트를 테스트하고 반복하는 능력" }, weight: 1, active: false },
    { level: "Beginner", description: { en: "Basic understanding of system prompts and conversation context management.", ko: "시스템 프롬프트 및 대화 컨텍스트 관리에 대한 기본 이해" }, weight: 1, active: false },
    { level: "Intermediate", description: { en: "Experience integrating LLM APIs into applications with proper error handling and rate limiting.", ko: "적절한 오류 처리 및 속도 제한을 통해 LLM API를 애플리케이션에 통합하는 경험" }, weight: 2, active: false },
    { level: "Intermediate", description: { en: "Knowledge of prompt engineering techniques (few-shot learning, chain-of-thought, role prompting).", ko: "프롬프트 엔지니어링 기술(퓨샷 학습, 사고 사슬, 역할 프롬프팅)에 대한 지식" }, weight: 2, active: false },
    { level: "Intermediate", description: { en: "Understanding of embeddings and vector databases for semantic search and RAG (Retrieval-Augmented Generation).", ko: "의미론적 검색 및 RAG(검색 증강 생성)를 위한 임베딩 및 벡터 데이터베이스에 대한 이해" }, weight: 2, active: false },
    { level: "Intermediate", description: { en: "Ability to implement streaming responses and handle long-running LLM requests.", ko: "스트리밍 응답 구현 및 장기 실행 LLM 요청 처리 능력" }, weight: 2, active: false },
    { level: "Intermediate", description: { en: "Experience with function calling / tool use to extend LLM capabilities.", ko: "LLM 기능을 확장하기 위한 함수 호출/도구 사용 경험" }, weight: 2, active: false },
    { level: "Intermediate", description: { en: "Building chatbots or conversational AI interfaces using LLMs.", ko: "LLM을 사용하여 챗봇 또는 대화형 AI 인터페이스 구축" }, weight: 2, active: false },
    { level: "Intermediate", description: { en: "Implementing context management for multi-turn conversations.", ko: "다중 턴 대화를 위한 컨텍스트 관리 구현" }, weight: 2, active: false },
    { level: "Intermediate", description: { en: "Knowledge of prompt caching and optimization strategies to reduce costs.", ko: "비용 절감을 위한 프롬프트 캐싱 및 최적화 전략에 대한 지식" }, weight: 2, active: false },
    { level: "Intermediate", description: { en: "Understanding different embedding models and their use cases (text, code, multimodal).", ko: "다양한 임베딩 모델 및 사용 사례(텍스트, 코드, 멀티모달) 이해" }, weight: 2, active: false },
    { level: "Advanced", description: { en: "Proficient in building RAG systems with document chunking, embedding strategies, and retrieval optimization.", ko: "문서 청킹, 임베딩 전략 및 검색 최적화를 통한 RAG 시스템 구축에 능숙함" }, weight: 4, active: false },
    { level: "Advanced", description: { en: "Experience fine-tuning or customizing LLMs for specific domains or tasks.", ko: "특정 도메인 또는 작업에 대한 LLM 미세 조정 또는 사용자 정의 경험" }, weight: 4, active: false },
    { level: "Advanced", description: { en: "Knowledge of LLM evaluation metrics, benchmarking, and testing strategies.", ko: "LLM 평가 지표, 벤치마킹 및 테스트 전략에 대한 지식" }, weight: 4, active: false },
    { level: "Advanced", description: { en: "Implementing multi-agent systems or orchestrating multiple LLM calls for complex workflows.", ko: "복잡한 워크플로우를 위한 멀티 에이전트 시스템 구현 또는 여러 LLM 호출 오케스트레이션" }, weight: 4, active: false },
    { level: "Advanced", description: { en: "Understanding of LLM security concerns (prompt injection, data leakage, content filtering).", ko: "LLM 보안 문제(프롬프트 주입, 데이터 유출, 콘텐츠 필터링)에 대한 이해" }, weight: 4, active: false },
    { level: "Advanced", description: { en: "Designing and implementing hybrid systems combining LLMs with traditional ML models.", ko: "LLM과 기존 ML 모델을 결합한 하이브리드 시스템 설계 및 구현" }, weight: 4, active: false },
    { level: "Advanced", description: { en: "Building LLM-powered agents with memory, planning, and reasoning capabilities.", ko: "메모리, 계획 및 추론 기능을 갖춘 LLM 기반 에이전트 구축" }, weight: 4, active: false },
    { level: "Advanced", description: { en: "Implementing prompt optimization through automated testing and A/B testing.", ko: "자동화된 테스트 및 A/B 테스트를 통한 프롬프트 최적화 구현" }, weight: 4, active: false },
    { level: "Advanced", description: { en: "Experience with vector search optimization and hybrid search strategies.", ko: "벡터 검색 최적화 및 하이브리드 검색 전략에 대한 경험" }, weight: 4, active: false },
    { level: "Expert", description: { en: "Expertise in LLM architecture, attention mechanisms, and transformer models.", ko: "LLM 아키텍처, 어텐션 메커니즘 및 트랜스포머 모델에 대한 전문 지식" }, weight: 8, active: false },
    { level: "Expert", description: { en: "Experience with local LLM deployment, quantization, and optimization techniques.", ko: "로컬 LLM 배포, 양자화 및 최적화 기술에 대한 경험" }, weight: 8, active: false },
    { level: "Expert", description: { en: "Building production-grade LLM applications with monitoring, cost optimization, and scalability.", ko: "모니터링, 비용 최적화 및 확장성을 갖춘 프로덕션급 LLM 애플리케이션 구축" }, weight: 8, active: false },
    { level: "Expert", description: { en: "Contributing to open-source LLM frameworks or developing custom LLM solutions.", ko: "오픈소스 LLM 프레임워크에 기여하거나 맞춤형 LLM 솔루션 개발" }, weight: 8, active: false },
    { level: "Expert", description: { en: "Deep understanding of training techniques (supervised fine-tuning, RLHF, DPO).", ko: "학습 기술(지도 미세 조정, RLHF, DPO)에 대한 깊은 이해" }, weight: 8, active: false },
    { level: "Expert", description: { en: "Architecting enterprise LLM infrastructure with governance, compliance, and security.", ko: "거버넌스, 컴플라이언스 및 보안을 갖춘 엔터프라이즈 LLM 인프라 설계" }, weight: 8, active: false },
    { level: "Expert", description: { en: "Leading LLM research initiatives or developing novel LLM applications and techniques.", ko: "LLM 연구 이니셔티브를 주도하거나 새로운 LLM 애플리케이션 및 기술 개발" }, weight: 8, active: false },
    { level: "Expert", description: { en: "Expertise in distributed LLM inference and serving at scale.", ko: "분산 LLM 추론 및 대규모 서빙에 대한 전문 지식" }, weight: 8, active: false },
    { level: "Expert", description: { en: "Advanced knowledge of model compression, distillation, and efficiency optimization.", ko: "모델 압축, 증류 및 효율성 최적화에 대한 고급 지식" }, weight: 8, active: false },
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

  const toggleLanguage = () => {
    setLanguage(prevLang => prevLang === 'en' ? 'ko' : 'en');
  };

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  const translations = {
    en: {
      level: 'Level',
      description: 'Description',
      weight: 'Weight',
      active: 'Active',
      beginner: 'Beginner',
      intermediate: 'Intermediate',
      advanced: 'Advanced',
      expert: 'Expert',
      backend: 'Backend',
      frontend: 'Frontend',
      dataScience: 'Data Science',
      python: 'Python',
      sql: 'SQL',
      llm: 'LLM'
    },
    ko: {
      level: '레벨',
      description: '설명',
      weight: '가중치',
      active: '활성',
      beginner: '초급',
      intermediate: '중급',
      advanced: '고급',
      expert: '전문가',
      backend: '백엔드',
      frontend: '프론트엔드',
      dataScience: '데이터 사이언스',
      python: '파이썬',
      sql: 'SQL',
      llm: 'LLM'
    }
  };

  const getDescription = (skill) => {
    if (typeof skill.description === 'object') {
      return skill.description[language] || skill.description.en;
    }
    return skill.description;
  };

  const getTranslation = (key) => {
    return translations[language][key] || key;
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
      const categoryName = getTranslation(activeGroup);
      
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
            const lines = pdf.splitTextToSize(`${index + 1}. ${getDescription(skill)} (Weight: ${skill.weight})`, maxWidth);
            
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

  const exportToImage = async () => {
    try {
      const chartElement = document.querySelector('.flower-container svg');
      if (!chartElement) {
        alert('Chart not found. Please try again.');
        return;
      }

      // Get the SVG's viewBox dimensions
      const viewBox = chartElement.getAttribute('viewBox').split(' ');
      const svgWidth = parseFloat(viewBox[2]);
      const svgHeight = parseFloat(viewBox[3]);

      // Serialize SVG to string
      const svgData = new XMLSerializer().serializeToString(chartElement);

      // Create a high-resolution canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const scale = 2; // For higher resolution
      const padding = 80;
      const canvasSize = 1200 * scale;

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
          const drawSize = canvasSize - (padding * 2 * scale);
          const xOffset = padding * scale;
          const yOffset = padding * scale;

          ctx.drawImage(img, xOffset, yOffset, drawSize, drawSize);
          resolve();
        };
        img.onerror = reject;

        // Convert SVG to data URL
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        img.src = url;
      });

      // Add text overlay
      ctx.fillStyle = 'white';
      ctx.font = `bold ${48 * scale}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText('SkillChart', canvasSize / 2, 60 * scale);

      // Format category name
      const categoryName = getTranslation(activeGroup);

      ctx.font = `${32 * scale}px Arial`;
      ctx.fillText(categoryName, canvasSize / 2, 110 * scale);

      // Add score text
      ctx.font = `${28 * scale}px Arial`;
      ctx.fillText(`${totalScore} / ${maxScore} (${percentage}%)`, canvasSize / 2, canvasSize - 40 * scale);

      // Convert canvas to blob and download
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const timestamp = new Date().toLocaleDateString().replace(/\//g, '-');
        link.download = `SkillChart_${categoryName.replace(/\s+/g, '_')}_${timestamp}.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      }, 'image/png');

    } catch (error) {
      console.error('Error generating image:', error);
      console.error('Error details:', error.message, error.stack);
      alert(`Failed to generate image: ${error.message || 'Unknown error'}. Please check the console for details.`);
    }
  };

  return (
    <div className={`app-container ${darkMode ? 'dark-mode' : ''}`}>
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
                
                <div className="mobile-feature-buttons">
                  <button 
                    className="mobile-feature-btn" 
                    onClick={toggleLanguage}
                    title={language === 'en' ? 'Switch to Korean' : 'Switch to English'}
                  >
                    <span className="feature-icon lang-icon">{language === 'en' ? 'EN' : 'KO'}</span>
                  </button>
                  <button 
                    className="mobile-feature-btn" 
                    onClick={toggleDarkMode}
                    title={darkMode ? 'Light Mode' : 'Dark Mode'}
                  >
                    <span className="feature-icon">{darkMode ? '☀️' : '🌙'}</span>
                  </button>
                  <button className="mobile-feature-btn" onClick={exportToPDF} title="Export PDF">
                    <span className="feature-icon pdf-icon">PDF</span>
                  </button>
                  <button className="mobile-feature-btn" onClick={exportToImage} title="Export IMG">
                    <span className="feature-icon">🖼️</span>
                  </button>
                </div>

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
                    {getTranslation('backend')}
                  </button>
                  <button 
                    className={`tab-button ${activeGroup === "frontend" ? "active" : ""}`}
                    onClick={() => toggleGroup("frontend")}
                  >
                    {getTranslation('frontend')}
                  </button>
                  <button 
                    className={`tab-button ${activeGroup === "dataScience" ? "active" : ""}`}
                    onClick={() => toggleGroup("dataScience")}
                  >
                    {getTranslation('dataScience')}
                  </button>
                  <button 
                    className={`tab-button ${activeGroup === "python" ? "active" : ""}`}
                    onClick={() => toggleGroup("python")}
                  >
                    {getTranslation('python')}
                  </button>
                  <button 
                    className={`tab-button ${activeGroup === "sql" ? "active" : ""}`}
                    onClick={() => toggleGroup("sql")}
                  >
                    {getTranslation('sql')}
                  </button>
                  <button 
                    className={`tab-button ${activeGroup === "llm" ? "active" : ""}`}
                    onClick={() => toggleGroup("llm")}
                  >
                    {getTranslation('llm')}
                  </button>
                </nav>

                <div className="feature-buttons">
                  <button 
                    className="feature-btn" 
                    onClick={toggleLanguage}
                  >
                    <span className="feature-icon lang-icon">{language === 'en' ? 'EN' : 'KO'}</span>
                    한국어
                  </button>
                  <button 
                    className="feature-btn" 
                    onClick={toggleDarkMode}
                  >
                    <span className="feature-icon">{darkMode ? '☀️' : '🌙'}</span>
                    {darkMode ? 'Light Mode' : 'Dark Mode'}
                  </button>
                  <button className="feature-btn" onClick={exportToPDF}>
                    <span className="feature-icon pdf-icon-desktop">PDF</span>
                    Export PDF
                  </button>
                  <button className="feature-btn" onClick={exportToImage}>
                    <span className="feature-icon">🖼️</span>
                    Export IMG
                  </button>
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
                getDescription={getDescription}
              />
            </div>
          </div>
        </div>

        <div className="skills-table-container">
          <table className="skills-table">
            <thead>
              <tr>
                <th className="col-level">{getTranslation('level')}</th>
                <th className="col-description">{getTranslation('description')}</th>
                <th className="col-weight">{getTranslation('weight')}</th>
                <th className="col-toggle">{getTranslation('active')}</th>
              </tr>
            </thead>
            <tbody>
              {skills.map((skill, index) => (
                <tr key={index} className={`skill-row ${getLevelRowClass(skill.level)} ${skill.active ? "" : "inactive"}`}>
                  <td className="col-level">
                    <span className={`level-badge ${getLevelColor(skill.level)}`}>
                      {language === 'ko' ? getTranslation(skill.level.toLowerCase()) : skill.level}
                    </span>
                  </td>
                  <td className="col-description">{getDescription(skill)}</td>
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
