import React, { useState } from 'react';
import './App.css';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  backendSkills,
  frontendSkills,
  dataScienceSkills,
  pythonSkills,
  sqlSkills,
  llmSkills,
  devopsSkills,
} from './data';
import translations from './data/translations';
import { LEVELS, LEVEL_COLORS, LEVEL_CSS_CLASSES } from './data/constants';

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

  const colors = LEVEL_COLORS;

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

  const levels = LEVELS;

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
  const [shareModalOpen, setShareModalOpen] = React.useState(false);

  React.useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const shouldBeScrolled = currentScrollY > 50;
          
          // Only update state if it actually changed
          if (shouldBeScrolled !== scrolled) {
            setScrolled(shouldBeScrolled);
          }
          
          setLastScrollY(currentScrollY);
          ticking = false;
        });

        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled, lastScrollY]);

  const toggleNavbar = () => {
    setNavbarExpanded(!navbarExpanded);
  };



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
      case "devops":
        setSkills(devopsSkills);
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

  const getLevelColor = (level) => LEVEL_CSS_CLASSES[level]?.badge || '';

  const getLevelRowClass = (level) => LEVEL_CSS_CLASSES[level]?.row || '';

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
      const isKorean = language === 'ko';
      const categoryName = getTranslation(activeGroup);

      // --- Build PDF content as HTML so the browser renders all text (including Korean) ---
      const container = document.createElement('div');
      container.style.cssText =
        'position:fixed;left:-9999px;top:0;width:595px;background:#fff;' +
        'padding:40px 40px 20px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Malgun Gothic","맑은 고딕",sans-serif;color:#333;';
      document.body.appendChild(container);

      let html = '';

      // Header
      html += '<h1 style="color:#667eea;margin:0 0 4px;font-size:28px;">SkillChart</h1>';
      html += `<p style="color:#666;margin:0 0 8px;font-size:14px;">${isKorean ? '카테고리' : 'Category'}: ${categoryName}</p>`;
      html += `<p style="color:#333;margin:0 0 16px;font-size:16px;font-weight:600;">${isKorean ? '총점' : 'Total Score'}: ${totalScore} / ${maxScore} (${percentage}%)</p>`;

      // Capture chart as data-URL and embed in the HTML
      const chartElement = document.querySelector('.flower-container svg');
      if (chartElement) {
        try {
          const svgData = new XMLSerializer().serializeToString(chartElement);
          const chartCanvas = document.createElement('canvas');
          const ctx = chartCanvas.getContext('2d');
          const padding = 40;
          const canvasSize = 600;
          chartCanvas.width = canvasSize;
          chartCanvas.height = canvasSize;

          const gradient = ctx.createLinearGradient(0, 0, canvasSize, canvasSize);
          gradient.addColorStop(0, '#667eea');
          gradient.addColorStop(1, '#764ba2');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvasSize, canvasSize);

          const img = new Image();
          await new Promise((resolve, reject) => {
            img.onload = () => {
              const drawSize = canvasSize - padding * 2;
              ctx.drawImage(img, padding, padding, drawSize, drawSize);
              resolve();
            };
            img.onerror = reject;
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            img.src = URL.createObjectURL(svgBlob);
          });

          const chartDataUrl = chartCanvas.toDataURL('image/png');
          html += `<div style="text-align:center;margin:8px 0 16px;"><img src="${chartDataUrl}" style="width:240px;height:240px;" /></div>`;
        } catch (chartError) {
          console.warn('Could not capture chart, continuing without it:', chartError);
        }
      }

      // Active skills section
      html += `<h2 style="font-size:18px;margin:12px 0 8px;color:#333;">${isKorean ? '활성 스킬' : 'Active Skills'}</h2>`;

      const activeByLevel = { Beginner: [], Intermediate: [], Advanced: [], Expert: [] };
      skills.forEach(skill => {
        if (skill.active && activeByLevel[skill.level]) {
          activeByLevel[skill.level].push(skill);
        }
      });

      const levelTranslations = {
        Beginner: isKorean ? '초급' : 'Beginner',
        Intermediate: isKorean ? '중급' : 'Intermediate',
        Advanced: isKorean ? '고급' : 'Advanced',
        Expert: isKorean ? '전문가' : 'Expert',
      };
      const levelColorMap = {
        Beginner: '#86efac',
        Intermediate: '#93c5fd',
        Advanced: '#fcd34d',
        Expert: '#fca5a5',
      };
      const skillsWord = isKorean ? '개 스킬' : 'skills';
      const weightWord = isKorean ? '가중치' : 'Weight';

      ['Beginner', 'Intermediate', 'Advanced', 'Expert'].forEach(level => {
        const skillsInLevel = activeByLevel[level];
        if (skillsInLevel.length > 0) {
          html += `<h3 style="font-size:14px;color:${levelColorMap[level]};margin:10px 0 4px;">${levelTranslations[level]} (${skillsInLevel.length} ${skillsWord})</h3>`;
          skillsInLevel.forEach((skill, index) => {
            html += `<p style="font-size:11px;color:#3c3c3c;margin:2px 0 2px 8px;">${index + 1}. ${getDescription(skill)} (${weightWord}: ${skill.weight})</p>`;
          });
        }
      });

      // Footer
      const timestamp = new Date().toLocaleDateString(isKorean ? 'ko-KR' : undefined);
      html += `<p style="color:#999;font-size:9px;margin-top:20px;">${isKorean ? '생성일' : 'Generated on'}: ${timestamp}</p>`;

      container.innerHTML = html;

      // --- Render the HTML container to a canvas via html2canvas ---
      const rendered = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      document.body.removeChild(container);

      // --- Slice the canvas into A4 pages and add to jsPDF ---
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - 2 * margin;
      const scale = contentWidth / rendered.width; // mm per canvas-pixel
      const contentHeight = pageHeight - 2 * margin;
      const sliceHeight = Math.floor(contentHeight / scale); // canvas-pixels per page

      let yOffset = 0;
      let pageNum = 0;

      while (yOffset < rendered.height) {
        if (pageNum > 0) pdf.addPage();

        const remaining = rendered.height - yOffset;
        const currentSlice = Math.min(sliceHeight, remaining);

        // Create a canvas for this page slice
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = rendered.width;
        pageCanvas.height = currentSlice;
        const pctx = pageCanvas.getContext('2d');
        pctx.drawImage(rendered, 0, yOffset, rendered.width, currentSlice, 0, 0, rendered.width, currentSlice);

        const pageImgData = pageCanvas.toDataURL('image/png');
        pdf.addImage(pageImgData, 'PNG', margin, margin, contentWidth, currentSlice * scale);

        yOffset += sliceHeight;
        pageNum++;
      }

      // Save with a filename safe for any locale
      const safeCategory = categoryName.replace(/[^\w\s\u3131-\uD7AF-]/g, '').replace(/\s+/g, '_') || 'export';
      const safeTimestamp = timestamp.replace(/[\/\.]/g, '-');
      pdf.save(`SkillChart_${safeCategory}_${safeTimestamp}.pdf`);
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

  const generateShareImage = async () => {
    const chartElement = document.querySelector('.flower-container svg');
    if (!chartElement) return null;

    const svgData = new XMLSerializer().serializeToString(chartElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const scale = 2;

    // Social media optimized: 1200x630 (Twitter/LinkedIn/Facebook OG)
    canvas.width = 1200 * scale;
    canvas.height = 630 * scale;

    // Draw gradient background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Load and draw SVG on the left side
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = () => {
        const chartSize = 500 * scale;
        const xOffset = 40 * scale;
        const yOffset = (630 * scale - chartSize) / 2;
        ctx.drawImage(img, xOffset, yOffset, chartSize, chartSize);
        resolve();
      };
      img.onerror = reject;
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      img.src = URL.createObjectURL(svgBlob);
    });

    // Right side text content
    const textX = 600 * scale;
    ctx.fillStyle = 'white';
    ctx.textAlign = 'left';

    // Title
    ctx.font = `bold ${42 * scale}px Arial`;
    ctx.fillText('SkillChart', textX, 150 * scale);

    // Category
    const categoryName = getTranslation(activeGroup);
    ctx.font = `${28 * scale}px Arial`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillText(categoryName, textX, 210 * scale);

    // Score
    ctx.fillStyle = 'white';
    ctx.font = `bold ${64 * scale}px Arial`;
    ctx.fillText(`${percentage}%`, textX, 330 * scale);

    // Score detail
    ctx.font = `${22 * scale}px Arial`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText(`${totalScore} / ${maxScore} points`, textX, 380 * scale);

    // Active skills count
    const activeCount = skills.filter(s => s.active).length;
    ctx.font = `${20 * scale}px Arial`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillText(`${activeCount} / ${skills.length} skills activated`, textX, 430 * scale);

    // URL watermark
    ctx.font = `${16 * scale}px Arial`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.textAlign = 'right';
    ctx.fillText('skillchart.onrender.com', (1200 - 30) * scale, (630 - 25) * scale);

    return canvas;
  };

  const handleShare = async (platform) => {
    const shareUrl = 'https://skillchart.onrender.com';
    const categoryName = getTranslation(activeGroup);
    const shareText = language === 'ko'
      ? `SkillChart로 나의 ${categoryName} 역량을 평가했습니다: ${percentage}% (${totalScore}/${maxScore})`
      : `I scored ${percentage}% (${totalScore}/${maxScore}) on ${categoryName} skills using SkillChart`;

    if (platform === 'copy') {
      try {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        alert(language === 'ko' ? '클립보드에 복사되었습니다!' : 'Copied to clipboard!');
      } catch {
        alert('Failed to copy to clipboard');
      }
      return;
    }

    if (platform === 'download') {
      try {
        const canvas = await generateShareImage();
        if (!canvas) return;
        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          const timestamp = new Date().toLocaleDateString().replace(/\//g, '-');
          link.download = `SkillChart_${categoryName.replace(/\s+/g, '_')}_social_${timestamp}.png`;
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
        }, 'image/png');
      } catch (error) {
        console.error('Error generating share image:', error);
        alert('Failed to generate image');
      }
      return;
    }

    if (platform === 'native') {
      try {
        const canvas = await generateShareImage();
        if (!canvas) return;
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        const file = new File([blob], 'skillchart.png', { type: 'image/png' });
        await navigator.share({
          title: 'SkillChart',
          text: shareText,
          url: shareUrl,
          files: [file],
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Share failed:', error);
        }
      }
      setShareModalOpen(false);
      return;
    }

    const encodedText = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent(shareUrl);

    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
      reddit: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedText}`,
    };

    if (urls[platform]) {
      window.open(urls[platform], '_blank', 'width=600,height=500,noopener,noreferrer');
    }
    setShareModalOpen(false);
  };

  const ShareModal = () => {
    if (!shareModalOpen) return null;

    const canNativeShare = typeof navigator.share === 'function';

    return (
      <div className="share-modal-overlay" onClick={() => setShareModalOpen(false)}>
        <div className="share-modal" onClick={(e) => e.stopPropagation()}>
          <div className="share-modal-header">
            <h3>{language === 'ko' ? '소셜 미디어에 공유' : 'Share to Social Media'}</h3>
            <button className="share-modal-close" onClick={() => setShareModalOpen(false)}>&times;</button>
          </div>

          <div className="share-preview">
            <div className="share-preview-text">
              <span className="share-preview-category">{getTranslation(activeGroup)}</span>
              <span className="share-preview-score">{percentage}% ({totalScore}/{maxScore})</span>
            </div>
          </div>

          <div className="share-platforms">
            <button className="share-platform-btn twitter" onClick={() => handleShare('twitter')}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              <span>X (Twitter)</span>
            </button>
            <button className="share-platform-btn linkedin" onClick={() => handleShare('linkedin')}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              <span>LinkedIn</span>
            </button>
            <button className="share-platform-btn facebook" onClick={() => handleShare('facebook')}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              <span>Facebook</span>
            </button>
            <button className="share-platform-btn reddit" onClick={() => handleShare('reddit')}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>
              <span>Reddit</span>
            </button>
          </div>

          <div className="share-actions">
            <button className="share-action-btn" onClick={() => handleShare('download')}>
              <span>&#x1F4E5;</span>
              {language === 'ko' ? '소셜 이미지 다운로드' : 'Download Social Image'}
            </button>
            <button className="share-action-btn" onClick={() => handleShare('copy')}>
              <span>&#x1F4CB;</span>
              {language === 'ko' ? '링크 복사' : 'Copy Link & Text'}
            </button>
            {canNativeShare && (
              <button className="share-action-btn native-share" onClick={() => handleShare('native')}>
                <span>&#x1F4E4;</span>
                {language === 'ko' ? '기기에서 공유' : 'Share via Device'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
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
                  <button className="mobile-feature-btn share-btn" onClick={() => setShareModalOpen(true)} title="Share">
                    <span className="feature-icon">&#x1F310;</span>
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
                  <button
                    className={`tab-button ${activeGroup === "devops" ? "active" : ""}`}
                    onClick={() => toggleGroup("devops")}
                  >
                    {getTranslation('devops')}
                  </button>
                </nav>

                <div className="feature-buttons">
                  <button 
                    className="feature-btn" 
                    onClick={toggleLanguage}
                  >
                    <span className="feature-icon lang-icon">{language === 'en' ? 'EN' : 'KO'}</span>
                    {language === 'en' ? '한국어' : 'English'}
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
                  <button className="feature-btn" onClick={() => setShareModalOpen(true)}>
                    <span className="feature-icon">&#x1F310;</span>
                    Share
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
      <ShareModal />
    </div>
  );
};

export default App;
