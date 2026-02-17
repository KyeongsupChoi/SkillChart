# SkillChart

A modern, interactive web application for evaluating and communicating developer skills across multiple technical domains. Built with React, SkillChart provides a visual rubric system that helps developers assess their proficiency levels and showcase their capabilities.

## Live Demo

[skillchart.onrender.com](https://skillchart.onrender.com/)

## Features

- **Multi-Domain Assessment**: Evaluate skills across Backend Development, Data Science, Python, SQL, and LLM/AI
- **Visual Proficiency Levels**: Color-coded badges and background shading for Beginner, Intermediate, Advanced, and Expert levels
- **Interactive Scoring**: Toggle skills on/off to calculate real-time proficiency scores with visual progress bars
- **Modern UI/UX**: Gradient design, smooth transitions, and intuitive tab navigation
- **Responsive Design**: Fully optimized for desktop, tablet, and mobile devices
- **Interview Ready**: Perfect for technical interviews and portfolio presentations

## Tech Stack

- **Frontend**: React 18
- **Styling**: Custom CSS with modern design patterns
- **Build Tool**: Create React App
- **Deployment**: Render

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/KyeongsupChoi/SkillChart.git
cd SkillChart
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Start the development server
```bash
npm start
# or
yarn start
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Build for Production

```bash
npm run build
# or
yarn build
```

## Project Structure

```
SkillChart/
├── public/
│   └── index.html
├── src/
│   ├── App.js          # Main application component with skill data
│   ├── App.css         # Styling and responsive design
│   ├── index.js        # Application entry point
│   └── index.css       # Global styles
├── package.json
└── README.md
```

## Usage

1. **Select a Domain**: Click on any of the skill category tabs (Backend, Data Science, Python, SQL, LLM)
2. **Review Skills**: Browse through skills organized by proficiency level with color-coded backgrounds
3. **Toggle Active Skills**: Use checkboxes to mark which skills you possess
4. **View Score**: Monitor your total score and completion percentage in real-time

## Skill Categories

- **Backend**: Server-side development, APIs, databases, microservices, DevOps
- **Data Science**: Statistics, machine learning, data wrangling, model deployment
- **Python**: Syntax, frameworks, optimization, best practices
- **SQL**: Query design, database schemas, optimization, procedures
- **LLM**: Prompt engineering, API integration, RAG systems, fine-tuning

## Design Highlights

- **Gradient Color Scheme**: Purple gradient theme with complementary accent colors
- **Level-Based Visual Grouping**: Subtle background colors differentiate skill sections
- **Progress Visualization**: Animated progress bar shows skill completion percentage
- **Custom UI Components**: Styled checkboxes, buttons, and badges for enhanced UX

## Contributing

This is a portfolio project, but suggestions and feedback are welcome. Feel free to open an issue or submit a pull request.

## License

This project is open source and available under the MIT License.

## Author

Kyeongsup Choi

## Acknowledgments

- Built with [Create React App](https://github.com/facebook/create-react-app)
- Deployed on [Render](https://render.com)
