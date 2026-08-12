<h1 align="center">JalDrishti (Chandigarh Edition)</h1>

<p align="center">
  <strong>An AI-powered urban flood risk management and citizen engagement dashboard for Chandigarh.</strong>
</p>

## 📖 Overview

JalDrishti is a comprehensive dashboard designed to monitor, predict, and manage urban drainage and flood risks across various sectors of Chandigarh. It serves as a dual-sided platform bridging the gap between **Citizens** and **City Authorities** (such as the Chandigarh Municipal Corporation, Housing Board, and Urban Planning), fostering proactive disaster management and real-time communication.

## ✨ Key Features

- **Real-Time Risk Assessment**: Calculates dynamic risk scores based on live rainfall data, drainage conditions, and historical incident records for each sector.
- **Role-Based Access**:
  - **Citizen Portal**: Allows residents to report waterlogging issues, view sector-wise risk levels, and receive crucial broadcasts.
  - **Authority Dashboard**: Empowers city officials to monitor city-wide analytics, review and resolve citizen reports, and issue public safety broadcasts.
- **Interactive Analytics**: Visualizes rainfall data, sector-wise preparedness, and incident trends using interactive charts.
- **AI Integration**: Leverages Google's Generative AI to provide smart insights and summaries based on live data.

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript
- **Build Tool**: Vite
- **UI Components & Icons**: Lucide React
- **Data Visualization**: Recharts
- **AI Integration**: `@google/genai`

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- A [Google Gemini API Key](https://aistudio.google.com/)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <YOUR_GITHUB_REPO_URL>
   cd "JalDrishti (Final_uptill_dashboard_features)"
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Create a `.env.local` file in the root directory and add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open the app:**
   Navigate to the local URL provided by Vite (typically `http://localhost:5173`) in your browser.

## 👥 Usage

### For Authorities
- Select **Authority** on the role selection screen.
- Log in using department credentials (e.g., `CHD-Dept-001`, `CUH-Dept-002`).
- Monitor the **City Overview**, manage **Citizen Reports**, and send **Broadcasts**.

### For Citizens
- Select **Citizen** on the role selection screen.
- View real-time risk scores and preparedness metrics for your sector.
- Submit reports for waterlogging or drainage issues with location and severity.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request or open an Issue to improve the project.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
